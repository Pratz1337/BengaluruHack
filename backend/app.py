from io import BytesIO, StringIO
import json
import os
import logging
import traceback
import tempfile
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from fpdf import FPDF
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader
import numpy as np
import pandas as pd
from document_processor import DocumentProcessor
from chat_model import ChatModel
# Import the summary blueprint
from summary import summary_bp

# Initialize Flask app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
app.secret_key = "your_unique_secret_key"

# Register the summary blueprint
app.register_blueprint(summary_bp)
processed_documents = {}
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize document processor
document_processor = DocumentProcessor("b7e1c4f0-4c19-4d34-8d2f-6aea1990bdbf")

# Dictionary to store temporary document paths for chat sessions
document_cache = {}

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'csv'}

def allowed_file(filename):
    """Check if the file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Extract text from a PDF file
def extract_text_from_pdf(file_storage) -> str:
    try:
        file_bytes = BytesIO(file_storage.read())
        reader = PdfReader(file_bytes)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return ""

# Extract text from a CSV file
def extract_text_from_csv(file_storage) -> str:
    try:
        file_stream = StringIO(file_storage.stream.read().decode("utf-8"))
        df = pd.read_csv(file_stream)
        return df.to_string(index=False)
    except Exception as e:
        logger.error(f"Error extracting text from CSV: {str(e)}")
        return ""

# Simplified document upload route (removed /api/ prefix)
@app.route('/upload-document', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    chat_id = request.form.get('chat_id', 'default')
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    try:
        # Save file to temp directory
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)
        
        # Store the file path for the chat session
        document_cache[chat_id] = temp_path
        
        # Process the document
        result = document_processor.process_document(temp_path)
        if result["success"]:
            key_info = document_processor.extract_key_information(result["content"])
            
            # Store processed document info for future chat messages
            processed_documents[chat_id] = {
                "content": result["content"],
                "file_name": result["file_name"],
                "pages_processed": result["pages_processed"],
                "total_pages": result["total_pages"],
                "extracted_info": key_info.get("extracted_info", {}),
                "document_summary": key_info.get("document_summary", "")
            }
            
            logger.info(f"Successfully processed document: {filename}, {result['pages_processed']} pages")
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.error(f"Error deleting temp file: {str(e)}")
            
            return jsonify({
                "success": True, 
                "filename": filename,
                "pages_processed": result["pages_processed"],
                "total_pages": result["total_pages"],
                "extracted_info": key_info.get("extracted_info", {}),
                "document_summary": key_info.get("document_summary", "")
            })    
    finally:
        # Ensure temp file is deleted even if errors occur
        if 'temp_path' in locals():
            try:
                os.remove(temp_path)
            except:
                pass

# In message handlers:
@socketio.on('send_message')
def handle_send_message(msg):
    try:
        chat_id = msg.get("id", "default_id")
        user_message = msg.get("msg", "")
        
        logger.info(f"Generating response for chat_id={chat_id}, msg='{user_message}'")
        
        # Check if there's a processed document for this session and build the context
        document_context = ""
        if chat_id in processed_documents:
            doc_info = processed_documents[chat_id]
            document_context = f"""
            --- DOCUMENT ANALYSIS ---
            Document: {doc_info['file_name']}
            Pages Processed: {doc_info['pages_processed']} of {doc_info['total_pages']}
            
            {doc_info['document_summary']}
            
            Extracted Information:
            {json.dumps(doc_info['extracted_info'], indent=2)}
            --- END DOCUMENT ANALYSIS ---
            """
            logger.info(f"Using cached document information for chat_id={chat_id}")
        
        # Pass the pre-processed document context (if any) to ChatModel
        result = ChatModel(user_message, document_context=document_context)
        
        logger.info(f"Sending response for chat_id={chat_id}")
        emit("response", result)
        
    except Exception as e:
        logger.error(f"Error in handle_send_message: {str(e)}")
        logger.error(traceback.format_exc())
        emit("response", {"res": {"msg": "I apologize, but I encountered an error while processing your request."}, 
                          "error": str(e)})

# Simple route for interest rates (removed /api/ prefix)
@app.route('/interest-rates', methods=['GET'])
def get_interest_rates():
    try:
        # Sample data - replace with your actual data source
        rates = [
            {"loan_type": "Home Loan", "min_rate": 6.5, "max_rate": 8.5},
            {"loan_type": "Personal Loan", "min_rate": 10.5, "max_rate": 18.0},
            {"loan_type": "Car Loan", "min_rate": 8.0, "max_rate": 12.0},
            {"loan_type": "Education Loan", "min_rate": 7.0, "max_rate": 15.0}
        ]
        return jsonify(rates)
    except Exception as e:
        logger.error(f"Error fetching interest rates: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Simple route for recent queries (removed /api/ prefix)
@app.route('/recent-queries', methods=['GET'])
def get_recent_queries():
    try:
        # Sample data - replace with your actual data source
        queries = [
            {"id": "1", "query": "How do I qualify for a home loan?", "loan_type": "Home Loan", "hours_ago": 2},
            {"id": "2", "query": "What are current personal loan rates?", "loan_type": "Personal Loan", "hours_ago": 4},
            {"id": "3", "query": "How much can I borrow for a car?", "loan_type": "Car Loan", "hours_ago": 6}
        ]
        return jsonify(queries)
    except Exception as e:
        logger.error(f"Error fetching recent queries: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Simple route for financial tips (removed /api/ prefix)
@app.route('/financial-tips', methods=['GET'])
def get_financial_tips():
    try:
        # Sample data - replace with your actual data source
        tips = [
            "Save at least 20% of your income for future goals.",
            "Pay off high-interest debt before investing.",
            "Maintain a good credit score by paying bills on time.",
            "Create an emergency fund with 3-6 months of expenses."
        ]
        return jsonify(tips)
    except Exception as e:
        logger.error(f"Error fetching financial tips: {str(e)}")
        return jsonify({"error": str(e)}), 500

# WebSocket event handler (unchanged as it's not an HTTP route)
@socketio.on('send_message')
def handle_send_message(msg):
    try:
        chat_id = msg.get("id", "default_id")
        user_message = msg.get("msg", "")
        
        logger.info(f"Generating response for chat_id={chat_id}, msg='{user_message}'")
        
        # Check if there's a processed document for this session and build the context
        document_context = ""
        if chat_id in processed_documents:
            doc_info = processed_documents[chat_id]
            document_context = f"""
            --- DOCUMENT ANALYSIS ---
            Document: {doc_info['file_name']}
            Pages Processed: {doc_info['pages_processed']} of {doc_info['total_pages']}
            
            {doc_info['document_summary']}
            
            Extracted Information:
            {json.dumps(doc_info['extracted_info'], indent=2)}
            --- END DOCUMENT ANALYSIS ---
            """
            logger.info(f"Using cached document information for chat_id={chat_id}")
        
        # Pass the pre-processed document context (if any) to ChatModel
        result = ChatModel(user_message, document_context=document_context)
        
        logger.info(f"Sending response for chat_id={chat_id}")
        emit("response", result)
        
    except Exception as e:
        logger.error(f"Error in handle_send_message: {str(e)}")
        logger.error(traceback.format_exc())
        emit("response", {"res": {"msg": "I apologize, but I encountered an error while processing your request."}, 
                          "error": str(e)})

# Added WebSocket event handler for checking voice support
@socketio.on('check_voice_support')
def check_voice_support():
    # Inform clients that voice support is not available
    emit("voice_support", False)

@socketio.on('chat_message')
def handle_chat_message(data):
    try:
        session_id = data.get('session_id', 'default')
        message = data.get('message', '')
        
        logger.info(f"Generating response for chat_id={session_id}, msg='{message}'")
        
        # Check if there's a processed document for this session and build the context
        document_context = ""
        if session_id in processed_documents:
            doc_info = processed_documents[session_id]
            document_context = f"""
            --- DOCUMENT ANALYSIS ---
            Document: {doc_info['file_name']}
            Pages Processed: {doc_info['pages_processed']} of {doc_info['total_pages']}
            
            {doc_info['document_summary']}
            
            Extracted Information:
            {json.dumps(doc_info['extracted_info'], indent=2)}
            --- END DOCUMENT ANALYSIS ---
            """
        
        # Pass the pre-processed document context (if any) to ChatModel
        response = ChatModel(message, document_context=document_context)
        
        logger.info(f"Sending response for chat_id={session_id}")
        emit("response", response)
        
    except Exception as e:
        logger.error(f"Error in handle_chat_message: {str(e)}")
        logger.error(traceback.format_exc())
        emit("response", {"res": {"msg": "I apologize, but I encountered an error while processing your request."}, 
                          "error": str(e)})

@app.route('/generate-summary', methods=['OPTIONS'])
def handle_generate_summary_options():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST')
    return response

@app.route('/download-summary', methods=['OPTIONS'])
def handle_download_summary_options():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST')
    return response

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

if __name__ == '__main__':
    socketio.run(app, use_reloader=False, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

