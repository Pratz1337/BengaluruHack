import os
from dotenv import load_dotenv
import re
import requests
import base64
import json
from typing import Dict, Any, Optional
from parse import SarvamDocumentParser

# Load environment variables
load_dotenv()

def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value

try:
    SARVAM_API_KEY = get_required_env("SARVAM_API_KEY")
except ValueError as e:
    pass

class DocumentProcessor:
    def __init__(self, api_key: str = None):
        """
        Initialize the DocumentProcessor
        Args:
            api_key: Sarvam API key for document translation
        """
        self.supported_formats = ['.pdf', '.txt', '.docx']
        self.api_key = api_key or SARVAM_API_KEY
        self.document_cache = {}
        self.translate_url = "https://api.sarvam.ai/v1/translate"  # Add your actual endpoint
        try:
            self.parser = SarvamDocumentParser(self.api_key)
        except Exception as e:
            print(f"Warning: Could not initialize parser: {str(e)}")
            self.parser = None
    
    def process_document(self, file_path: str) -> Dict[str, Any]:
        """
        Process a document and extract relevant information
        Args:
            file_path: Path to the document
        Returns:
            Dict containing processed information
        """
        try:
            file_ext = os.path.splitext(file_path)[1].lower()
            if file_ext not in self.supported_formats:
                raise ValueError(f"Unsupported file format: {file_ext}")
            
            # Placeholder for document processing logic
            # Add specific processing logic based on file type
            processed_data = {
                "file_path": file_path,
                "status": "processed",
                "content": "Placeholder content"
            }
            
            return processed_data
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed",
                "file_path": file_path
            }
    
    def extract_text(self, file_path: str) -> str:
        """
        Extract text from a document
        Args:
            file_path: Path to the document
        Returns:
            Extracted text as string
        """
        # Implement text extraction logic here
        return "Placeholder text extraction"
    
    def validate_document(self, file_path: str) -> bool:
        """
        Validate if a document is processable
        Args:
            file_path: Path to the document
        Returns:
            Boolean indicating if document is valid
        """
        if not os.path.exists(file_path):
            return False
        
        file_ext = os.path.splitext(file_path)[1].lower()
        return file_ext in self.supported_formats

    def clean_xml_content(self, content: str) -> str:
        """
        Remove XML/HTML tags from content for better LLM processing.
        
        Args:
            content: Raw XML content from parser
            
        Returns:
            Cleaned plain text
        """
        # Remove XML/HTML tags
        clean_text = re.sub(r'<[^>]+>', ' ', content)
        
        # Fix spacing issues (multiple spaces, newlines, etc.)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        # Remove any XML declarations or DTDs
        clean_text = re.sub(r'<\?xml[^?]*\?>', '', clean_text)
        clean_text = re.sub(r'<!DOCTYPE[^>]*>', '', clean_text)
        
        # Convert common HTML entities
        entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&apos;': "'",
            '&#39;': "'",
            '&nbsp;': ' '
        }
        
        for entity, replacement in entities.items():
            clean_text = clean_text.replace(entity, replacement)
        
        return clean_text

    def translate_pdf(
        self,
        file_content: bytes,
        filename: str,
        target_lang: str,
        page_number: str = "1",
        hard_translate_dict: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Translate a PDF document using Sarvam AI's endpoint.
        
        Args:
            file_content: The content of the PDF file as bytes.
            filename: The name of the PDF file.
            target_lang: The target language code (e.g., 'hi-IN', 'ta-IN').
            page_number: The page number to translate (default is "1" for the entire document).
            hard_translate_dict: A dictionary of words for which you want to hardcode the translation.
        
        Returns:
            Dictionary with the translated PDF content or error message.
        """
        headers = {
            "api-subscription-key": self.api_key,
        }

        files = {
            "pdf": (filename, file_content, "application/pdf"),
        }

        data = {
            "page_number": page_number,
            "input_lang": "en-IN",  # Assuming the input is always in English
            "output_lang": target_lang,
        }

        if hard_translate_dict:
            data["hard_translate_dict"] = json.dumps(hard_translate_dict)

        try:
            response = requests.post(
                self.translate_url, headers=headers, files=files, data=data
            )
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)

            response_data = response.json()
            translated_pdf_base64 = response_data.get("translated_pdf")

            if translated_pdf_base64:
                # Decode the base64 PDF content
                translated_pdf = base64.b64decode(translated_pdf_base64)
                return {
                    "success": True,
                    "translated_pdf": translated_pdf,
                }
            else:
                return {
                    "success": False,
                    "error": "No translated PDF content received",
                }

        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Request error: {str(e)}",
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error translating PDF: {str(e)}",
            }
        
    def process_document(self, file_path: str, max_pages: int = 5) -> Dict[str, Any]:
        """
        Process a document and extract text from multiple pages.
        
        Args:
            file_path: Path to the document file
            max_pages: Maximum number of pages to process
        
        Returns:
            Dictionary with processing status and extracted content
        """
        # Check if file exists
        if not os.path.exists(file_path):
            return {"success": False, "error": f"File not found: {file_path}"}
        
        # Check if document is already in cache
        if file_path in self.document_cache:
            return self.document_cache[file_path]
        
        # Process using the multi-page parser
        result = self.parser.parse_pdf_multiple_pages(file_path, max_pages=max_pages)
        
        if not result["success"]:
            return {"success": False, "error": result.get("error", "Unknown error during parsing")}
        
        # Clean XML content before returning
        clean_content = self.clean_xml_content(result["raw_xml"])
        
        processed_result = {
            "success": True,
            "content": clean_content,
            "pages_processed": result["pages_parsed"],
            "total_pages": result["total_pages"],
            "file_name": result["file_name"]
        }
        
        # Store in cache
        self.document_cache[file_path] = processed_result
        
        return processed_result

    def extract_key_information(self, content: str) -> Dict[str, Any]:
        """
        Extract key loan-related information from document content.
        
        Args:
            content: Raw text content from document
            
        Returns:
            Dictionary with extracted loan information
        """
        # Clean any remaining XML tags if needed
        cleaned_content = self.clean_xml_content(content)
        
        # Extract potential loan information using patterns
        extracted = {}
        
        # Extract loan amounts
        loan_amount_pattern = r'(?:loan|amount|principal)[^\d]*([\d,]+(?:\.\d+)?)'
        loan_amount_match = re.search(loan_amount_pattern, cleaned_content, re.IGNORECASE)
        if loan_amount_match:
            extracted["loan_amount"] = loan_amount_match.group(1).replace(',', '')
        
        # Extract interest rates
        interest_pattern = r'(?:interest|rate)[^\d]*(\d+(?:\.\d+)?)\s*%'
        interest_match = re.search(interest_pattern, cleaned_content, re.IGNORECASE)
        if interest_match:
            extracted["interest_rate"] = interest_match.group(1) + '%'
        
        # Extract loan terms
        term_pattern = r'(?:term|period|duration)[^\d]*(\d+)\s*(?:year|yr|month|mo)'
        term_match = re.search(term_pattern, cleaned_content, re.IGNORECASE)
        if term_match:
            extracted["loan_term"] = term_match.group(1)
        
        # Extract brief document summary
        brief_summary = cleaned_content[:500] + ("..." if len(cleaned_content) > 500 else "")
        
        return {
            "extracted_info": extracted,
            "document_summary": brief_summary
        }