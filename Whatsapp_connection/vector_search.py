import os
from typing import List, Dict, Any
from datetime import datetime
import json
import re
import time
import unicodedata
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
from pymongo import MongoClient

# Pinecone imports
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message


class PineconeRAGPipeline:
    def __init__(
        self,
        pinecone_api_key: str,
        mongodb_uri: str = None,
        mongodb_db: str = "FinMate_Dataset",
        mongodb_collection: str = "loan_information",
        assistant_name: str = "finmate-assistant",
        max_files: int = 10  # Set a reasonable limit based on your Pinecone plan
    ):
        """Initialize the Pinecone RAG Pipeline with MongoDB integration"""
        # Initialize Pinecone
        self.pc = Pinecone(api_key=pinecone_api_key)
        self.assistant_name = assistant_name
        self.max_files = max_files
        
        # Initialize MongoDB connection only if URI is provided
        if mongodb_uri:
            self.mongo_client = MongoClient(mongodb_uri)
            self.db = self.mongo_client[mongodb_db]
            self.collection = self.db[mongodb_collection]
            # Initialize embedding model only for vectorization
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
    
    # Get configuration from environment variables
    pinecone_api_key = os.getenv('PINECONE_API_KEY')
    mongodb_uri = os.getenv('MONGODB_URI')
    
    if not pinecone_api_key:
        raise ValueError("PINECONE_API_KEY environment variable is required")
    
    # Check if mongo-uri is provided when in vectorize mode
    if args.mode == 'vectorize' and not mongodb_uri:
        parser.error("MONGODB_URI environment variable is required when using vectorize mode")
    
    # Initialize the pipeline
    pipeline = PineconeRAGPipeline(
        pinecone_api_key=pinecone_api_key,
        mongodb_uri=mongodb_uri if args.mode == 'vectorize' or mongodb_uri else None,
        max_files=args.max_files
    )
    
    # Run the specified mode
    if args.mode == 'vectorize':
        print("Vectorize mode is not supported in this version.")
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