import os
from typing import List, Dict, Any
from datetime import datetime
import json
import re
import time
import unicodedata
from pymongo import MongoClient
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value

try:
    PINECONE_API_KEY = get_required_env("PINECONE_API_KEY")
    MONGO_URI = get_required_env("MONGO_URI")
except ValueError as e:
    print(f"Configuration error: {str(e)}")
    raise

class PineconeRAGPipeline:
    def __init__(
        self,
        pinecone_api_key: str = None,
        mongodb_uri: str = None,
        mongodb_db: str = "FinMate_Dataset",
        mongodb_collection: str = "loan_information",
        assistant_name: str = "finmate-assistant",
        max_files: int = 10  # Set a reasonable limit based on your Pinecone plan
    ):
        """Initialize the Pinecone RAG Pipeline with MongoDB integration"""
        # Use environment variables if not provided
        self.pc = Pinecone(api_key=pinecone_api_key or PINECONE_API_KEY)
        self.assistant_name = assistant_name
        self.max_files = max_files
        
        # Initialize MongoDB connection
        if mongodb_uri or MONGO_URI:
            self.mongo_client = MongoClient(mongodb_uri or MONGO_URI)
            self.db = self.mongo_client[mongodb_db]
            self.collection = self.db[mongodb_collection]
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        else:
            self.mongo_client = None
            self.db = None
            self.collection = None
            self.embedding_model = None
        
        # Initialize assistant
        self._initialize_assistant()
    
    def _initialize_assistant(self):
        """Create or get the Pinecone assistant"""
        try:
            # Check if assistant exists
            assistants = self.pc.assistant.list_assistants()
            assistant_exists = False
            
            for assistant_info in assistants:
                if assistant_info.get('name') == self.assistant_name:
                    assistant_exists = True
                    break
            
            if not assistant_exists:
                print(f"Creating new assistant: {self.assistant_name}")
                self.assistant = self.pc.assistant.create_assistant(
                    assistant_name=self.assistant_name,
                    instructions="You are a financial assistant that helps users understand loan information. Use the provided context to answer questions accurately."
                )
            else:
                print(f"Using existing assistant: {self.assistant_name}")
                self.assistant = self.pc.assistant.Assistant(
                    assistant_name=self.assistant_name
                )
            
            print(f"Assistant ready: {self.assistant_name}")
            
        except Exception as e:
            print(f"Error initializing assistant: {str(e)}")
            raise
    
    def _clean_text(self, text):
        """Clean text to ensure UTF-8 compatibility and remove problematic characters"""
        if not text:
            return ""
        
        # Convert to string if not already
        if not isinstance(text, str):
            text = str(text)
        
        # Normalize Unicode characters
        text = unicodedata.normalize('NFKD', text)
        
        # Replace problematic characters (like the Rupee symbol)
        text = text.replace('\u20b9', 'Rs.')  # Replace Rupee symbol with 'Rs.'
        
        # Remove any other non-ASCII characters that might cause issues
        text = re.sub(r'[^\x00-\x7F]+', ' ', text)
        
        return text
    
    def _prepare_documents(self, mongodb_data: List[Dict]) -> List[Dict]:
        """
        Prepare documents from MongoDB data for Pinecone upload
        Each document should be a text chunk with metadata
        """
        prepared_docs = []
        
        for domain_data in mongodb_data:
            domain = domain_data.get('domain', 'unknown')
            url = domain_data.get('url', '')
            results = domain_data.get('results', [])
            
            for result in results:
                if not result:
                    continue
                
                analysis = result.get('analysis', {})
                
                # Skip if analysis is not a dictionary
                if not isinstance(analysis, dict):
                    continue
                
                # Create a consolidated document for each domain/URL
                domain_text = f"DOMAIN: {domain}\nURL: {url}\n\n"
                
                # Add sections to the document
                for section_name, section_data in analysis.items():
                    if not isinstance(section_data, dict):
                        continue
                    
                    # Get the details text
                    details = section_data.get('details', '')
                    if isinstance(details, list):
                        details = ' '.join([str(d) for d in details if d])
                    
                    # Clean the text
                    details = self._clean_text(details)
                    
                    # Get structured data
                    structured_data = section_data.get('structured_data', {})
                    
                    # Add section to the document
                    domain_text += f"SECTION: {section_name}\n"
                    domain_text += f"DETAILS: {details}\n"
                    
                    # Handle structured data with special care
                    if structured_data:
                        try:
                            if isinstance(structured_data, dict) or isinstance(structured_data, list):
                                # Convert to string but avoid JSON errors
                                structured_str = str(structured_data)
                                domain_text += f"STRUCTURED DATA: {structured_str}\n"
                        except Exception as e:
                            print(f"Error processing structured data: {str(e)}")
                    
                    domain_text += "\n---\n\n"
                
                # Create document with metadata
                doc = {
                    "text": domain_text,
                    "metadata": {
                        "domain": domain,
                        "url": url,
                        "timestamp": datetime.now().isoformat()
                    }
                }
                
                prepared_docs.append(doc)
        
        return prepared_docs
    
    def _check_quota_status(self):
        """Check current file count and quota status"""
        try:
            files = self.assistant.list_files()
            current_file_count = len(files)
            print(f"Current file count: {current_file_count}")
            return current_file_count, files
        except Exception as e:
            print(f"Error checking file quota: {str(e)}")
            return 0, []
    
    def _delete_existing_files(self):
        """Delete existing files in the assistant to avoid quota issues"""
        try:
            # Get current files
            _, files = self._check_quota_status()
            
            # Only proceed if there are files to delete
            if not files:
                print("No existing files to delete")
                return
                
            # Delete each file with proper error handling
            for file in files:
                file_id = file.get('id')
                if file_id:
                    try:
                        print(f"Deleting file: {file.get('name', 'Unknown')}")
                        self.assistant.delete_file(file_id=file_id)
                        time.sleep(1)  # Add a small delay to avoid rate limits
                    except Exception as e:
                        print(f"Error deleting file {file.get('name', 'Unknown')}: {str(e)}")
                        # Continue with other files even if one fails
            
            # Verify deletion
            remaining_count, _ = self._check_quota_status()
            print(f"File deletion complete. Remaining files: {remaining_count}")
            
        except Exception as e:
            print(f"Error in delete_existing_files: {str(e)}")
    
    def extract_and_vectorize_mongodb(self, temp_dir: str = "./temp_files"):
        """
        Extract data from MongoDB, create text files, and upload to Pinecone
        """
        # Check if MongoDB connection is available
        if not self.mongo_client:
            print("MongoDB connection not initialized. Cannot vectorize data.")
            return
            
        # Create temp directory if it doesn't exist
        os.makedirs(temp_dir, exist_ok=True)
        
        # Check quota before attempting any operations
        current_file_count, _ = self._check_quota_status()
        
        # Delete existing files if needed
        if current_file_count > 0:
            print("Deleting existing files to free up quota")
            self._delete_existing_files()
            # Verify deletion worked
            current_file_count, _ = self._check_quota_status()
            if current_file_count > 0:
                print(f"Warning: Could not delete all existing files. {current_file_count} files remain.")
        
        # Get all documents from MongoDB
        mongo_documents = list(self.collection.find({}))
        print(f"Retrieved {len(mongo_documents)} documents from MongoDB")
        
        # Prepare documents for Pinecone
        prepared_docs = self._prepare_documents(mongo_documents)
        print(f"Prepared {len(prepared_docs)} document chunks for Pinecone")
        
        # Limit the number of documents to upload based on remaining quota
        available_slots = self.max_files - current_file_count
        if available_slots <= 0:
            print("No available file slots. Please upgrade your plan or delete existing files.")
            return
        
        if len(prepared_docs) > available_slots:
            print(f"Limiting uploads to {available_slots} files due to plan restrictions")
            prepared_docs = prepared_docs[:available_slots]
        
        # Track successful uploads
        successful_uploads = 0
        
        # Create and upload text files to Pinecone
        for i, doc in enumerate(prepared_docs):
            # Create a temp file
            file_path = os.path.join(temp_dir, f"doc_{i}.txt")
            try:
                # Write with UTF-8 encoding to avoid encoding issues
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(doc["text"])
                
                # Upload to Pinecone Assistant
                print(f"Uploading document {i+1}/{len(prepared_docs)}")
                response = self.assistant.upload_file(
                    file_path=file_path,
                    timeout=None
                )
                
                print(f"Successfully uploaded document {i+1}")
                successful_uploads += 1
                
                # Add a small delay to avoid rate limits
                time.sleep(2)
            except Exception as e:
                print(f"Error uploading document {i+1}: {str(e)}")
                # If we get quota errors, break early to avoid unnecessary attempts
                if "quota exceeded" in str(e).lower():
                    print("File quota exceeded. Stopping upload process.")
                    break
        
        print(f"Uploaded {successful_uploads} out of {len(prepared_docs)} documents to Pinecone Assistant")
    
    def query_assistant(self, query: str, stream: bool = False, verbose: bool = True):
        """
        Query the Pinecone Assistant with RAG
        """
        # Create a message object as shown in documentation
        msg = Message(content=query)
        
        try:
            # Stream or get complete response
            if stream:
                response_stream = self.assistant.chat(messages=[msg], stream=True)
                return response_stream
            else:
                response = self.assistant.chat(messages=[msg])
                
                # Print the full context to CLI if available
                if verbose and response.get('citations'):
                    print("\n--- CONTEXT USED FOR ANSWER ---")
                    for citation in response['citations']:
                        refs = citation.get('references', [])
                        for ref in refs:
                            pages = ref.get('pages', [])
                            file_info = ref.get('file', {})
                            file_name = file_info.get('name', 'unknown')
                            print(f"\nSource: {file_name}, Pages: {pages}")
                            
                            # Try to extract the actual text that was used
                            if 'text' in citation:
                                print(f"\nExcerpt used: {citation['text']}")
                            
                            if file_info.get('metadata'):
                                print(f"Metadata: {json.dumps(file_info.get('metadata'), indent=2)}")
                    print("--- END CONTEXT ---\n")
                
                return response
        except Exception as e:
            print(f"Error querying assistant: {str(e)}")
            return {"error": str(e)}

# Command-line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Pinecone RAG Pipeline with MongoDB Integration")
    parser.add_argument('--mode', type=str, choices=['vectorize', 'query'], required=True, 
                        help='Mode: vectorize (extract and upload) or query (ask questions)')
    parser.add_argument('--query', type=str, help='Query for the assistant (required in query mode)')
    parser.add_argument('--max-files', type=int, default=10, help='Maximum number of files to upload (default: 10)')
    parser.add_argument('--verbose', action='store_true', help='Show detailed context information for queries')
    
    args = parser.parse_args()
    
    # Initialize the pipeline using environment variables
    pipeline = PineconeRAGPipeline(max_files=args.max_files)
    
    # Run the specified mode
    if args.mode == 'vectorize':
        pipeline.extract_and_vectorize_mongodb()
    elif args.mode == 'query':
        if not args.query:
            parser.error("--query is required when using query mode")
        
        response = pipeline.query_assistant(args.query, verbose=args.verbose)
        
        # Print the response
        print("\n--- ASSISTANT RESPONSE ---")
        if response.get('message') and response['message'].get('content'):
            print(response['message']['content'])
        else:
            print("No response content received")
        print("--- END RESPONSE ---\n")