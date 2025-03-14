import os
import json
import argparse
from typing import List, Dict, Any
from datetime import datetime
from urllib.parse import urlparse

# Required imports for LangChain integration
from langchain_community.document_loaders import ScrapingAntLoader
from langchain_groq import ChatGroq
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import ChatPromptTemplate

# MongoDB connection
from pymongo import MongoClient

class LoanScraper:
    def __init__(self, api_key: str, groq_api_key: str, mongo_uri: str):
        """Initialize the loan scraper with API keys and MongoDB connection"""
        self.api_key = api_key
        self.groq_client = ChatGroq(
            api_key=groq_api_key,
            model_name="llama3-70b-8192"  # Using a high-capacity model for financial analysis
        )
        self.mongo_client = MongoClient(mongo_uri)
        self.db = self.mongo_client["loan_data"]
        self.collection = self.db["loan_information"]
        
        # Create text splitter for large documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000,
            chunk_overlap=200,
            length_function=len,
        )
        
        # Create analysis prompt
        self.analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert financial analyst specialized in loan products. 
            Extract and structure the following information from the text:
            
            1. Loan Interest Rates: Extract fixed and floating rates, APR, rate comparisons.
            2. Eligibility Criteria: Extract income requirements, credit score requirements, employment type, age limits.
            3. Loan Amounts: Extract minimum and maximum loan values offered.
            4. Processing Fees: Extract any additional fees associated with the loan.
            5. Repayment Terms: Extract EMI structures, tenure options, monthly breakdowns.
            6. Comparison Metrics: Extract loan offerings from different lenders side by side if available.
            7. EMI Calculations: Extract loan amount examples, interest breakdown, total repayment information.
            
            Return the information in a structured JSON format with these categories as keys.
            For each category, include a 'details' field with extracted text and a 'structured_data' field with parsed values.
            If any information is not found, include it with a value of null.
            """),
            ("human", "{text}")
        ])
    
    def get_domain(self, url: str) -> str:
        """Extract domain name from URL for data organization"""
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    
    def scrape_websites(self, urls: List[str]) -> Dict[str, Any]:
        """Scrape multiple websites using ScrapingAnt and LangChain"""
        results = {}
        
        for url in urls:
            try:
                print(f"Scraping {url}...")
                # Configure ScrapingAnt loader
                loader = ScrapingAntLoader(
                    [url],
                    api_key=self.api_key,
                    continue_on_failure=True,
                    scrape_config={
                        "browser": True,  # Enable browser rendering
                        "proxy_type": "datacenter",  # Use datacenter proxies
                        "proxy_country": "us",  # US-based proxies for consistent results
                    }
                )
                
                # Load documents
                documents = loader.load()
                
                if documents:
                    # Add to results
                    domain = self.get_domain(url)
                    results[domain] = {
                        "url": url,
                        "documents": documents,
                        "timestamp": datetime.now().isoformat()
                    }
                    print(f"Successfully scraped {url} - found {len(documents)} documents")
                else:
                    print(f"No content found for {url}")
            
            except Exception as e:
                print(f"Error scraping {url}: {str(e)}")
        
        return results
    
    def analyze_document(self, document: Document) -> Dict[str, Any]:
        """Analyze document content using Groq LLM"""
        # Split document if it's too large
        if len(document.page_content) > 5000:
            chunks = self.text_splitter.split_text(document.page_content)
            results = []
            
            for i, chunk in enumerate(chunks):
                print(f"Analyzing chunk {i+1}/{len(chunks)}...")
                chain = self.analysis_prompt | self.groq_client
                chunk_result = chain.invoke({"text": chunk})
                results.append(chunk_result.content)
            
            # Combine results
            combined_result = self.combine_chunk_results(results)
            return combined_result
        else:
            # Process document directly
            chain = self.analysis_prompt | self.groq_client
            result = chain.invoke({"text": document.page_content})
            
            # Parse JSON response
            try:
                return json.loads(result.content)
            except json.JSONDecodeError:
                # If JSON parsing fails, return as text
                return {"raw_analysis": result.content}
    
    def combine_chunk_results(self, results: List[str]) -> Dict[str, Any]:
        """Combine analysis results from multiple chunks"""
        # Parse JSON results
        parsed_results = []
        for result in results:
            try:
                parsed = json.loads(result)
                parsed_results.append(parsed)
            except json.JSONDecodeError:
                continue
        
        if not parsed_results:
            return {"error": "Failed to parse any analysis results"}
        
        # Combine into a single result
        combined = {
            "Loan Interest Rates": {"details": [], "structured_data": {}},
            "Eligibility Criteria": {"details": [], "structured_data": {}},
            "Loan Amounts": {"details": [], "structured_data": {}},
            "Processing Fees": {"details": [], "structured_data": {}},
            "Repayment Terms": {"details": [], "structured_data": {}},
            "Comparison Metrics": {"details": [], "structured_data": {}},
            "EMI Calculations": {"details": [], "structured_data": {}}
        }
        
        for result in parsed_results:
            for key in combined.keys():
                if key in result:
                    # Combine details
                    if "details" in result[key] and result[key]["details"]:
                        if isinstance(result[key]["details"], list):
                            combined[key]["details"].extend(result[key]["details"])
                        else:
                            combined[key]["details"].append(result[key]["details"])
                    
                    # Combine structured data
                    if "structured_data" in result[key] and result[key]["structured_data"]:
                        # Merge dictionaries, prioritizing non-null values
                        for k, v in result[key]["structured_data"].items():
                            if k not in combined[key]["structured_data"] or combined[key]["structured_data"][k] is None:
                                combined[key]["structured_data"][k] = v
        
        return combined
    
    def process_data(self, scraped_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process scraped data with Groq analysis"""
        processed_results = {}
        
        for domain, data in scraped_data.items():
            print(f"Processing data from {domain}...")
            domain_results = []
            
            for document in data["documents"]:
                print(f"Analyzing document from {domain}...")
                analysis = self.analyze_document(document)
                
                domain_results.append({
                    "url": data["url"],
                    "content_length": len(document.page_content),
                    "analysis": analysis,
                    "metadata": document.metadata
                })
            
            processed_results[domain] = {
                "url": data["url"],
                "results": domain_results,
                "timestamp": data["timestamp"]
            }
        
        return processed_results
    
    def save_to_mongodb(self, processed_data: Dict[str, Any]) -> None:
        """Save processed data to MongoDB"""
        for domain, data in processed_data.items():
            print(f"Saving data for {domain} to MongoDB...")
            
            # Create a new document for each domain
            self.collection.update_one(
                {"domain": domain},
                {"$set": {
                    "domain": domain,
                    "url": data["url"],
                    "results": data["results"],
                    "timestamp": data["timestamp"],
                    "last_updated": datetime.now().isoformat()
                }},
                upsert=True
            )
        
        print(f"Saved {len(processed_data)} domain results to MongoDB")
    
    def save_to_json(self, processed_data: Dict[str, Any], output_dir: str) -> None:
        """Save processed data to JSON files"""
        os.makedirs(output_dir, exist_ok=True)
        
        for domain, data in processed_data.items():
            output_file = os.path.join(output_dir, f"{domain}.json")
            
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            print(f"Saved data for {domain} to {output_file}")
    
    def run(self, urls: List[str], output_dir: str = "output") -> None:
        """Run the full scraping and analysis pipeline"""
        # Step 1: Scrape websites
        scraped_data = self.scrape_websites(urls)
        
        # Step 2: Process and analyze data
        processed_data = self.process_data(scraped_data)
        
        # Step 3: Save results to MongoDB
        self.save_to_mongodb(processed_data)
        
        # Step 4: Save results to JSON files
        self.save_to_json(processed_data, output_dir)
        
        print("Scraping and analysis completed!")

def main():
    parser = argparse.ArgumentParser(description='Loan Data Scraper with LangChain, ScrapingAnt, and Groq')
    parser.add_argument('--urls', type=str, required=True, help='Path to a text file with URLs to scrape, one per line')
    parser.add_argument('--output', type=str, default='output', help='Output directory for JSON files')
    parser.add_argument('--scrapingant-key', type=str, required=True, help='ScrapingAnt API key')
    parser.add_argument('--groq-key', type=str, required=True, help='Groq API key')
    parser.add_argument('--mongo-uri', type=str, required=True, help='MongoDB connection string')
    
    args = parser.parse_args()
    
    # Read URLs from file
    with open(args.urls, 'r') as f:
        urls = [line.strip() for line in f.readlines() if line.strip()]
    
    # Create and run scraper
    scraper = LoanScraper(
        api_key=args.scrapingant_key,
        groq_api_key=args.groq_key,
        mongo_uri=args.mongo_uri
    )
    
    scraper.run(urls, args.output)

if __name__ == "__main__":
    main()
