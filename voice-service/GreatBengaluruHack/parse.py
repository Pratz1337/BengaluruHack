import base64
import os
import requests
import time
import PyPDF2  # For PDF validation
from typing import Dict, Any, Optional, List

class SarvamDocumentParser:
    """Simple document parser using Sarvam AI's Parse API."""
    
    def __init__(self, api_key: str):
        """
        Initialize the parser with API key.
        
        Args:
            api_key: Sarvam API subscription key
        """
        self.api_key = api_key
        self.parse_url = "https://api.sarvam.ai/parse/parsepdf"
    
    def validate_pdf(self, file_path: str) -> bool:
        """
        Check if the file is a valid PDF document.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Boolean indicating if file is valid
        """
        try:
            # Attempt to open with PyPDF2
            with open(file_path, 'rb') as file:
                PyPDF2.PdfReader(file)
            return True
        except Exception as e:
            print(f"PDF validation error: {str(e)}")
            return False
    
    def get_pdf_page_count(self, file_path: str) -> int:
        """Get the number of pages in a PDF file."""
        try:
            with open(file_path, 'rb') as file:
                pdf = PyPDF2.PdfReader(file)
                return len(pdf.pages)
        except Exception:
            return 0
    
    def parse_pdf(self, file_path: str, page_number: int = 1, mode: str = "small", max_retries: int = 2) -> Dict[str, Any]:
        """
        Parse a single PDF page and return its content.
        
        Args:
            file_path: Path to the PDF file
            page_number: Page number to parse (default: 1)
            mode: Parsing mode ('small' or 'large')
            max_retries: Maximum number of retry attempts
            
        Returns:
            Dictionary with parsed content or error message
        """
        # Check if file exists
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}
        
        # Validate PDF before sending
        if not self.validate_pdf(file_path):
            return {"success": False, "error": "Invalid or corrupted PDF file"}
        
        # Check if specified page exists
        page_count = self.get_pdf_page_count(file_path)
        if page_number > page_count:
            return {"success": False, "error": f"Page {page_number} does not exist. Document has {page_count} pages."}
        
        # Prepare the API request
        headers = {
            "api-subscription-key": self.api_key
        }
        
        # Try both parsing modes if needed
        modes_to_try = [mode]
        if mode == "large":
            modes_to_try.append("small")  # Fallback to small if large fails
        
        last_error = None
        
        for current_mode in modes_to_try:
            retry_count = 0
            
            while retry_count <= max_retries:
                try:
                    # Open the PDF file
                    with open(file_path, "rb") as pdf_file:
                        print(f"Trying with mode: {current_mode}, attempt {retry_count+1} for page {page_number}")
                        
                        files = {
                            "pdf": (os.path.basename(file_path), pdf_file, "application/pdf")
                        }
                        
                        data = {
                            "page_number": str(page_number),
                            "sarvam_mode": current_mode,
                            "prompt_caching": "false"
                        }
                        
                        # Send request to Sarvam API
                        response = requests.post(self.parse_url, headers=headers, files=files, data=data)
                        
                        if response.status_code == 200:
                            # Process the response
                            response_data = response.json()
                            if not response_data.get("output"):
                                last_error = f"No output received from parser for page {page_number}"
                                break
                            
                            # Decode the base64 XML string
                            xml_content = base64.b64decode(response_data["output"]).decode("utf-8")
                            
                            return {
                                "success": True,
                                "raw_xml": xml_content,
                                "file_name": os.path.basename(file_path),
                                "page": page_number,
                                "mode": current_mode
                            }
                        elif response.status_code == 429:  # Rate limiting
                            print("Rate limited. Waiting before retry...")
                            time.sleep(2 ** retry_count)  # Exponential backoff
                        else:
                            last_error = f"API error for page {page_number}: {response.status_code} - {response.text}"
                            print(last_error)
                            if response.status_code != 500:  # Don't retry client errors
                                break
                    
                    retry_count += 1
                    if retry_count <= max_retries:
                        print(f"Retrying... Attempt {retry_count+1}")
                        time.sleep(1)  # Wait before retrying
                        
                except Exception as e:
                    last_error = f"Error parsing page {page_number}: {str(e)}"
                    print(last_error)
                    break
        
        return {"success": False, "error": last_error or f"Failed to parse page {page_number} after all attempts"}
    
    def parse_pdf_multiple_pages(self, file_path: str, max_pages: int = 5, mode: str = "small") -> Dict[str, Any]:
        """
        Parse multiple pages of a PDF document and combine the results.
        
        Args:
            file_path: Path to the PDF file
            max_pages: Maximum number of pages to parse
            mode: Parsing mode ('small' or 'large')
            
        Returns:
            Dictionary with combined parsed content from multiple pages
        """
        # Check if file exists
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}
        
        # Validate PDF before sending
        if not self.validate_pdf(file_path):
            return {"success": False, "error": "Invalid or corrupted PDF file"}
        
        # Get total number of pages
        page_count = self.get_pdf_page_count(file_path)
        if page_count == 0:
            return {"success": False, "error": "Could not determine page count or empty document"}
        
        # Parse each page
        successful_pages = []
        total_parsed = 0
        all_content = []
        failed_pages = []
        
        # Determine how many pages to parse
        pages_to_parse = min(page_count, max_pages)
        
        print(f"Parsing {pages_to_parse} pages out of {page_count} total pages")
        
        for page_num in range(1, pages_to_parse + 1):
            result = self.parse_pdf(file_path, page_number=page_num, mode=mode)
            
            if result["success"]:
                all_content.append(f"--- PAGE {page_num} ---\n{result['raw_xml']}")
                successful_pages.append(page_num)
                total_parsed += 1
                print(f"✅ Successfully parsed page {page_num}")
            else:
                failed_pages.append(page_num)
                print(f"❌ Failed to parse page {page_num}: {result.get('error', 'Unknown error')}")
            
            # Add a small delay between pages to avoid rate limiting
            if page_num < pages_to_parse:
                time.sleep(0.5)
        
        # Combine all content
        combined_content = "\n\n".join(all_content)
        
        if total_parsed > 0:
            return {
                "success": True,
                "raw_xml": combined_content,
                "file_name": os.path.basename(file_path),
                "pages_parsed": total_parsed,
                "successful_pages": successful_pages,
                "failed_pages": failed_pages,
                "total_pages": page_count
            }
        else:
            return {
                "success": False,
                "error": f"Failed to parse any pages from the document",
                "failed_pages": failed_pages,
                "total_pages": page_count
            }

# Langchain tool wrapper function for single page
def parse_document_page(file_path: str, api_key: str, page: int = 1) -> Dict[str, Any]:
    """
    Parse a specific page of a document using Sarvam AI (for use with Langchain tools).
    
    Args:
        file_path: Path to the PDF file
        api_key: Sarvam API subscription key
        page: Page number to parse
        
    Returns:
        Dictionary with parsed content
    """
    parser = SarvamDocumentParser(api_key)
    return parser.parse_pdf(file_path, page_number=page)

# Langchain tool wrapper function for multiple pages
def parse_document(file_path: str, api_key: str, max_pages: int = 5) -> Dict[str, Any]:
    """
    Parse multiple pages of a document using Sarvam AI (for use with Langchain tools).
    
    Args:
        file_path: Path to the PDF file
        api_key: Sarvam API subscription key
        max_pages: Maximum number of pages to parse
        
    Returns:
        Dictionary with combined parsed content
    """
    parser = SarvamDocumentParser(api_key)
    return parser.parse_pdf_multiple_pages(file_path, max_pages=max_pages)

# Example usage
if __name__ == "__main__":
    # Install requirements first
    # pip install PyPDF2 requests
    
    file_path = r"C:\Users\sayal\Downloads\Prathmesh Sayal-1.pdf"
    api_key = 'b7e1c4f0-4c19-4d34-8d2f-6aea1990bdbf'
    
    parser = SarvamDocumentParser(api_key)
    
    print("=== Multi-page parsing test ===")
    result = parser.parse_pdf_multiple_pages(file_path, max_pages=3)  # Parse up to 3 pages
    
    if result["success"]:
        print(f"\n✅ Successfully parsed {result['pages_parsed']} pages from {result['file_name']}")
        print(f"Successful pages: {result['successful_pages']}")
        print(f"Failed pages: {result['failed_pages']}")
        print(f"Content length: {len(result['raw_xml'])} characters")
        print("\nFirst 300 characters of content:")
        print(result['raw_xml'][:] + "...")
    else:
        print(f"\n❌ All parsing attempts failed. Error: {result['error']}")
        print("\nTroubleshooting tips:")
        print("1. Check if the PDF is password protected")
        print("2. Try with a simpler PDF document to test the API")
        print("3. Verify your API key is correct")
        print("4. Sarvam API may be experiencing issues - try again later")