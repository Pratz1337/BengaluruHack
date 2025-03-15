import os
from typing import List, Dict, Any
from datetime import datetime
import json
import re
import time
import unicodedata

# MongoDB connection
from pymongo import MongoClient

# Pinecone imports
from pinecone import Pinecone
from pinecone_plugins.assistant.models.chat import Message

# Embedding model
from sentence_transformers import SentenceTransformer

class PineconeRAGPipeline:
    def __init__(
        self,
        pinecone_api_key: str,
        mongodb_uri: str = None,
        mongodb_db: str = "FinMate_Dataset",
        mongodb_collection: str = "loan_information",
        assistant_name: str = "finmate-assistant",
        max_files: int = 10
    ):
        self.pc = Pinecone(api_key=pinecone_api_key)
        self.assistant_name = assistant_name
        self.max_files = max_files
        
        if mongodb_uri:
            self.mongo_client = MongoClient(mongodb_uri)
            self.db = self.mongo_client[mongodb_db]
            self.collection = self.db[mongodb_collection]
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        else:
            self.mongo_client = None
            self.db = None
            self.collection = None
            self.embedding_model = None
        
        self._initialize_assistant()

    def _initialize_assistant(self):
        """Create or get the Pinecone assistant with updated instructions"""
        try:
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
                    instructions="""You are a financial assistant that helps users understand loan information. 
                    When answering questions, please consider information from multiple relevant documents if available, 
                    and provide a comprehensive response that incorporates various perspectives or details from different sources.
                    Use the provided context to answer questions accurately."""
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

def query_assistant(self, query: str, stream: bool = False, verbose: bool = True):
    """
    Query the Pinecone Assistant with RAG and provide detailed source information if verbose is True.
    Note: Relevance scores are not available through the Assistant API.
    """
    msg = Message(content=query)
    
    try:
        if stream:
            response_stream = self.assistant.chat(messages=[msg], stream=True)
            return response_stream
        else:
            response = self.assistant.chat(messages=[msg])
            
            # Print the assistant's response
            answer = response.get('message', {}).get('content', 'No response content received')
            print("\n--- ASSISTANT RESPONSE ---")
            print(answer)
            print("--- END RESPONSE ---\n")
            
            # If verbose, print sources with a note about unavailable relevance scores
            if verbose and response.get('citations'):
                print("\n--- SOURCES ---")
                for idx, citation in enumerate(response['citations'], 1):
                    print(f"\nSource {idx}:")
                    refs = citation.get('references', [])
                    for ref in refs:
                        file_info = ref.get('file', {})
                        file_name = file_info.get('name', 'unknown')
                        pages = ref.get('pages', [])
                        print(f"File: {file_name}")
                        print(f"Pages: {pages}")
                        print("Relevance Score: Not available through Assistant API")
                    if 'text' in citation:
                        print(f"Excerpt: {citation['text']}")
                print("--- END SOURCES ---\n")
            
            return response
    except Exception as e:
        print(f"Error querying assistant: {str(e)}")
        return {"error": str(e)}
# Command-line interface remains unchanged, included for completeness
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Pinecone RAG Pipeline with MongoDB Integration")
    parser.add_argument('--pinecone-key', type=str, required=True, help='Pinecone API key')
    parser.add_argument('--mongo-uri', type=str, help='MongoDB connection string (required for vectorize mode)')
    parser.add_argument('--mode', type=str, choices=['vectorize', 'query'], required=True, 
                        help='Mode: vectorize (extract and upload) or query (ask questions)')
    parser.add_argument('--query', type=str, help='Query for the assistant (required in query mode)')
    parser.add_argument('--max-files', type=int, default=10, help='Maximum number of files to upload (default: 10)')
    parser.add_argument('--verbose', action='store_true', help='Show detailed context information for queries')
    
    args = parser.parse_args()
    
    if args.mode == 'vectorize' and not args.mongo_uri:
        parser.error("--mongo-uri is required when using vectorize mode")
    
    pipeline = PineconeRAGPipeline(
        pinecone_api_key=args.pinecone_key,
        mongodb_uri=args.mongo_uri if args.mode == 'vectorize' or args.mongo_uri else None,
        max_files=args.max_files
    )
    
    if args.mode == 'vectorize':
        pipeline.extract_and_vectorize_mongodb()
    elif args.mode == 'query':
        if not args.query:
            parser.error("--query is required when using query mode")
        response = pipeline.query_assistant(args.query, verbose=args.verbose)
