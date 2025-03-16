from io import BytesIO, StringIO
import json
import os
import logging
import traceback
import tempfile
import base64
from datetime import datetime
from typing import Optional, Dict, List
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from fpdf import FPDF
from pypdf import PdfReader
import numpy as np
import pandas as pd
import requests
from dotenv import load_dotenv
from chat_history import chat_history_bp

# Load environment variables
load_dotenv()

def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value

try:
    SARVAM_API_KEY = get_required_env("SARVAM_API_KEY")
    PINECONE_API_KEY = get_required_env("PINECONE_API_KEY")
    GROQ_API_KEY = get_required_env("GROQ_API_KEY")
    SECRET_KEY = get_required_env("SECRET_KEY")
    MONGO_URI = get_required_env("MONGO_URI")
except ValueError as e:
    print(f"Configuration error: {str(e)}")
    raise

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Set up configurations from environment variables
app.config.update(
    SECRET_KEY=SECRET_KEY,
    MONGO_URI=MONGO_URI,
    DEBUG=os.getenv('DEBUG', 'False').lower() == 'true',
    PORT=int(os.getenv('PORT', 5000)),
    HOST=os.getenv('HOST', '0.0.0.0')
)

# Initialize extensions
socketio = SocketIO(app, cors_allowed_origins="*")
mongo = PyMongo()

def init_app(app):
    mongo.init_app(app)

from pdf_translate import translate_pdf69

# Import our modules
from document_processor import DocumentProcessor
from chat_model import ChatModel
from summary import summary_bp
from loan_tools import check_loan_eligibility, guide_loan_application, get_financial_tips, track_financial_goal

# Register the summary blueprint
app.register_blueprint(summary_bp)
processed_documents = {}

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize document processor
document_processor = DocumentProcessor(SARVAM_API_KEY)

# Dictionary to store temporary document paths for chat sessions
document_cache = {}

# Chat history storage
class ChatHistory:
    def __init__(self):
        self.history: Dict[str, List[Dict]] = {}  # session_id -> messages
        self.max_history_per_session = 50

    def add_message(self, session_id: str, text: str, is_user: bool, language: Optional[str] = None):
        if session_id not in self.history:
            self.history[session_id] = []
        
        message = {
            "text": text,
            "isUser": is_user,
            "timestamp": datetime.now().isoformat(),
            "language": language
        }
        
        self.history[session_id].append(message)
        
        # Maintain maximum history size
        if len(self.history[session_id]) > self.max_history_per_session:
            self.history[session_id] = self.history[session_id][-self.max_history_per_session:]

    def get_history(self, session_id: str) -> List[Dict]:
        return self.history.get(session_id, [])
    
    def get_history_as_text(self, session_id: str) -> str:
        """Return chat history as formatted text for LLM context"""
        messages = self.get_history(session_id)
        formatted = []
        for msg in messages:
            prefix = "User" if msg["isUser"] else "FinMate"
            formatted.append(f"{prefix}: {msg['text']}")
        return "\n".join(formatted)

chat_history = ChatHistory()

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

# Voice functionality helper functions
def speech_to_text(audio_base64: str, source_language: str) -> Optional[Dict]:
    """Convert speech to text using Sarvam AI"""
    url = "https://api.sarvam.ai/speech-to-text"
    
    headers = {
        "api-subscription-key": SARVAM_API_KEY
    }
    
    try:
        # Convert base64 back to audio file
        audio_data = base64.b64decode(audio_base64)
        
        # Prepare payload and files
        payload = {
            'model': 'saarika:v2',
            'with_timesteps': 'false'
        }
        
        files = [
            ('file', ('audio.wav', audio_data, 'audio/wav'))
        ]
        
        # Log request info
        logger.info(f"Sending STT request to {url}")
        
        # Use requests.request with multipart/form-data
        response = requests.request("POST", url, headers=headers, data=payload, files=files)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"STT Response: {result}")
        
        # Create a structured result with original transcript
        return {
            'transcript': result.get('transcript', ''),
            'language_code': result.get('language_code', source_language)
        }
        
    except Exception as e:
        logger.error(f"STT Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
            logger.error(f"Response status code: {e.response.status_code}")
        return None

def translate_text(text: str, source_language: str, target_language: str) -> str:
    """Translate text using Sarvam AI's translation API"""
    url = "https://api.sarvam.ai/translate"
    
    # If source and target are the same, no need to translate
    if source_language == target_language:
        return text
        
    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY
    }
    
    # Split text into chunks of 900 characters (leaving room for overhead)
    chunks = [text[i:i+900] for i in range(0, len(text), 900)]
    translated_chunks = []
    
    for chunk in chunks:
        payload = {
            "input": chunk,
            "source_language_code": source_language,
            "target_language_code": target_language,
            "mode": "formal",
            "enable_preprocessing": True
        }
        
        try:
            logger.info(f"Sending translation request: {source_language} to {target_language}")
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            logger.info(f"Translation Response: {result}")
            translated_chunks.append(result.get('translated_text', chunk))
        except Exception as e:
            logger.error(f"Translation Error for chunk: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            translated_chunks.append(chunk)  # Use original chunk if translation fails
    
    return ' '.join(translated_chunks)

def generate_audio(text: str, language: str) -> Optional[str]:
    """Generate audio using Sarvam AI's TTS service"""
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY
    }
    
    # Map language codes to appropriate speakers
    language_speaker_map = {
        'hi-IN': 'meera',  # Hindi
        'en-IN': 'meera',  # English
        'ta-IN': 'meera',  # Tamil
        'te-IN': 'meera',  # Telugu
        'kn-IN': 'meera',  # Kannada
        'ml-IN': 'meera',  # Malayalam
        'mr-IN': 'meera',  # Marathi
        'bn-IN': 'meera',  # Bengali
        'gu-IN': 'meera',  # Gujarati
    }
    
    speaker = language_speaker_map.get(language, 'meera')
    logger.info(f"Using speaker '{speaker}' for language '{language}'")
    
    # Split text into chunks of 450 characters (TTS limit is 500)
    chunks = [text[i:i+450] for i in range(0, len(text), 450)]
    audio_base64_chunks = []
    
    for chunk in chunks:
        payload = {
            "inputs": [chunk],
            "target_language_code": language,
            "speaker": speaker,
            "enable_preprocessing": True,
            "speech_sample_rate": 22050
        }
        
        try:
            logger.info(f"Sending TTS request for language: {language}")
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            audio_chunk = result.get("audios", [None])[0]
            if (audio_chunk):
                audio_base64_chunks.append(audio_chunk)
        except Exception as e:
            logger.error(f"TTS Error for chunk: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            return None
    
    if not audio_base64_chunks:
        return None
        
    # Combine audio chunks (this is a simplified approach)
    # In a production environment, you'd want to properly concatenate the audio files
    return audio_base64_chunks[0] if len(audio_base64_chunks) == 1 else audio_base64_chunks[0]

def detect_language(audio_base64: str) -> Optional[str]:
    """Detect language using Sarvam AI"""
    logger.info("Starting language detection...")
    
    url = "https://api.sarvam.ai/speech-to-text"
    
    headers = {
        "api-subscription-key": SARVAM_API_KEY
    }
    
    try:
        audio_data = base64.b64decode(audio_base64)
        
        payload = {
            'model': 'saarika:v2',
            'with_timesteps': 'false',
            'detect_language': 'true'
        }
        
        files = [
            ('file', ('audio.wav', audio_data, 'audio/wav'))
        ]
        
        response = requests.request("POST", url, headers=headers, data=payload, files=files)
        response.raise_for_status()
        
        result = response.json()
        # Get language code from STT response
        detected_language = result.get('language_code', 'en-IN')
        
        logger.info(f"Raw STT response: {result}")
        logger.info(f"Detected language code from STT: {detected_language}")
        
        return detected_language
        
    except Exception as e:
        logger.error(f"Language detection error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
        return None

# Route for checking status
@app.route('/status', methods=['GET'])
def check_status():
    """Endpoint to check if voice service is available"""
    return jsonify({
        "status": "online",
        "message": "Voice service is available",
        "timestamp": datetime.now().isoformat()
    })

# Simplified document upload route
@app.route('/upload-document', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    chat_id = request.form.get('chat_id', 'default')
    # Add target_language parameter with English as default
    target_language = request.form.get('target_language', 'en-IN')
    
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
            
            # Translate document content if target language is specified
            translation_result = {"success": True, "translated_content": None}
            if target_language != "en-IN":
                logger.info(f"Translating document to {target_language}")
                translation_result = document_processor.translate_document_content(
                    result["content"], 
                    target_language
                )
            
            # Store processed document info for future chat messages
            processed_documents[chat_id] = {
                "content": result["content"],
                "translated_content": translation_result.get("translated_content"),
                "file_name": result["file_name"],
                "pages_processed": result["pages_processed"],
                "total_pages": result["total_pages"],
                "extracted_info": key_info.get("extracted_info", {}),
                "document_summary": key_info.get("document_summary", ""),
                "language": target_language
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
                "document_summary": key_info.get("document_summary", ""),
                "has_translation": translation_result.get("translated_content") is not None,
                "language": target_language
            })
        
        return jsonify({"success": False, "error": result.get("error", "Failed to process document")}), 400
                
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        return jsonify({"success": False, "error": f"Error processing document: {str(e)}"}), 500
    finally:
        # Ensure temp file is deleted even if errors occur
        if 'temp_path' in locals():
            try:
                os.remove(temp_path)
            except:
                pass
app.register_blueprint(chat_history_bp)

@socketio.on('save_chat_history')
def handle_save_chat(data):
    try:
        # Save chat to MongoDB
        chat_entry = {
            'query': data['query'],
            'loan_type': data.get('loan_type', 'General'),
            'timestamp': datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else datetime.utcnow(),
            'user_id': data.get('user_id')
        }
        
        mongo.db.loan_queries.insert_one(chat_entry)
        
        # Broadcast update to all connected clients
        emit('chat_history_updated', broadcast=True)
        
    except Exception as e:
        print(f"Error saving chat history: {str(e)}")
# Text message handler (use existing code)
@socketio.on('send_message')
def handle_send_message(msg):
    try:
        chat_id = msg.get("id", "default_id")
        user_message = msg.get("msg", "")
        user_language = msg.get("language", "en-IN")
        
        logger.info(f"Generating response for chat_id={chat_id}, msg='{user_message}'")
        
        # Add message to chat history
        chat_history.add_message(chat_id, user_message, True, user_language)
        
        # Check if there's a processed document for this session and build the context
        document_context = ""
        if chat_id in processed_documents:
            doc_info = processed_documents[chat_id]
            
            # Use translated content if available and matches user language
            content_to_use = doc_info.get("content", "")
            if doc_info.get("translated_content") and doc_info.get("language") == user_language:
                content_to_use = doc_info.get("translated_content")
                logger.info(f"Using translated document content for language: {user_language}")
            
            document_context = f"""
            --- DOCUMENT ANALYSIS ---
            Document: {doc_info['file_name']}
            Pages Processed: {doc_info['pages_processed']} of {doc_info['total_pages']}
            
            {doc_info['document_summary']}
            
            Extracted Information:
            {json.dumps(doc_info['extracted_info'], indent=2)}
            
            Document Content:
            {content_to_use[:1000]}...
            --- END DOCUMENT ANALYSIS ---
            """
            logger.info(f"Using document information for chat_id={chat_id}")
        
        # Pass the pre-processed document context (if any) to ChatModel
        result = ChatModel(user_message, document_context=document_context)
        
        # Add bot response to chat history
        if "msg" in result.get("res", {}):
            chat_history.add_message(chat_id, result["res"]["msg"], False, user_language)
        
        logger.info(f"Sending response for chat_id={chat_id}")
        emit("response", result)
        
    except Exception as e:
        logger.error(f"Error in handle_send_message: {str(e)}")
        logger.error(traceback.format_exc())
        emit("response", {"res": {"msg": "I apologize, but I encountered an error while processing your request."}, 
                          "error": str(e)})

# Audio message handler (fixed to use correct event name)
@socketio.on('audio_message')
def handle_audio_message(data):
    try:
        session_id = request.sid
        logger.info("=" * 50)
        logger.info("NEW AUDIO MESSAGE RECEIVED")
        
        # Get initial language setting
        auto_detect = data.get('auto_detect', False)
        current_language = data.get('language', 'en-IN')
        
        # Get document context if provided
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
        
        logger.info(f"Auto-detect enabled: {auto_detect}")
        logger.info(f"Initial language setting: {current_language}")
        logger.info(f"Document context provided: {'Yes' if document_context else 'No'}")
        
        # Handle language detection
        if auto_detect:
            detected_lang = detect_language(data['audio'])
            if detected_lang:
                current_language = detected_lang
                logger.info(f"Auto-detected language: {detected_lang}")
                emit('detected_language', {'language': detected_lang})
        
        logger.info(f"Final language being used: {current_language}")
        
        # Convert speech to text
        stt_result = speech_to_text(data['audio'], current_language)
        if not stt_result:
            raise ValueError("Failed to convert audio to text")
        
        original_text = stt_result.get('transcript', '')
        logger.info(f"Original text ({current_language}): {original_text}")
        
        # Save user message to history
        chat_history.add_message(session_id, original_text, True, current_language)
        
        # Always translate if not English
        needs_translation = current_language != "en-IN"
        logger.info(f"Needs translation: {needs_translation}")
        
        if needs_translation:
            translated_text = translate_text(original_text, current_language, "en-IN")
            logger.info(f"Translated text (English): {translated_text}")
        else:
            translated_text = original_text
            logger.info("Text is in English, no translation needed")
        
        # Process with ChatModel
        response = ChatModel(translated_text, document_context=document_context)
        english_response = response.get("res", {}).get("msg", "I couldn't process your request.")
        confidence_score = response.get("res", {}).get("confidence", 50)
        logger.info(f"ChatModel Response (English): {english_response}")
        logger.info(f"Confidence Score: {confidence_score}")
        
        # Translate response back if needed
        if needs_translation:
            logger.info(f"Translating response from English to {current_language}")
            translated_response = translate_text(english_response, "en-IN", current_language)
            logger.info(f"Translation successful. Length: {len(translated_response)}")
        else:
            translated_response = english_response
        
        # Save bot response to history
        chat_history.add_message(session_id, translated_response, False, current_language)
        
        # Generate audio in detected language
        logger.info(f"Generating audio in language: {current_language}")
        audio_data = generate_audio(translated_response, current_language)
        
        if audio_data:
            logger.info(f"Successfully generated audio in {current_language}")
        else:
            logger.error("Failed to generate audio")
        print(confidence_score)
        # Send response with confidence score
        emit('audio_response', {
            'original_text': original_text,
            'english_text': translated_text if needs_translation else original_text,
            'english_response': english_response,
            'text': translated_response,
            'audio': audio_data,
            'timestamp': datetime.now().isoformat(),
            'language': current_language,
            'confidence': confidence_score
        })
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        emit('error', {'message': str(e)})

# WebSocket event handler for checking voice support
@socketio.on('check_voice_support')
def check_voice_support():
    # Inform clients that voice support is available
    emit("voice_support", True)

# Interest rates endpoint
@app.route('/interest-rates', methods=['GET'])
def get_interest_rates():
    try:
        # Initialize Pinecone with API key from environment
        pinecone_api_key = get_required_env("PINECONE_API_KEY")
        vector_search = PineconeRAGPipeline(
            pinecone_api_key=pinecone_api_key,
            assistant_name="finmate-assistant"
        )
        
        try:
            # Query Pinecone for current interest rates
            query_result = vector_search.query_assistant("current loan interest rates", verbose=False)
            
            # Check if we got valid results from Pinecone
            if query_result and isinstance(query_result, list) and len(query_result) > 0:
                logger.info("Successfully fetched interest rates from Pinecone")
                return jsonify(query_result)
            else:
                logger.warning("No valid data from Pinecone for interest rates, using fallback data")
        except Exception as e:
            logger.error(f"Error querying Pinecone for interest rates: {str(e)}")
        
        # If Pinecone query fails, check MongoDB
        if mongo.db:
            interest_rates = list(mongo.db.interest_rates.find({}, {'_id': 0}))
            if interest_rates:
                logger.info("Using interest rates from MongoDB")
                return jsonify(interest_rates)
        
        # Fallback to sample data if all else fails
        logger.info("Using fallback interest rate data")
        rates = [
            {"loan_type": "SBI Personal Loan", "min_rate": 9.60, "max_rate": 9.60, "max_loan_amount": 1500000,
             "eligibility": "Salaried and self-employed individuals with a good credit score"},
            {"loan_type": "HDFC Personal Loan", "min_rate": 10.25, "max_rate": 10.25, "max_loan_amount": 4000000,
             "eligibility": "Salaried individuals with a stable income and good credit history"},
            {"loan_type": "ICICI Personal Loan", "min_rate": 10.50, "max_rate": 10.50, "max_loan_amount": 2000000,
             "eligibility": "Salaried professionals and self-employed individuals with a proven track record"},
            {"loan_type": "Axis Personal Loan", "min_rate": 10.75, "max_rate": 10.75, "max_loan_amount": 2500000,
             "eligibility": "Employed individuals with a minimum monthly income and a satisfactory credit score"},
            {"loan_type": "Kotak Personal Loan", "min_rate": 10.99, "max_rate": 10.99, "max_loan_amount": 3000000,
             "eligibility": "Salaried and self-employed individuals with a steady income and a clean credit history"}
        ]
        return jsonify(rates)
        
    except Exception as e:
        logger.error(f"Error fetching interest rates: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Recent queries endpoint
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

# Financial tips endpoint
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

# CORS preflight handlers for summary endpoints
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

@app.route('/translate-document', methods=['POST'])
def translate_document():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    target_lang = request.form.get("target_lang", "hi-IN")
    page_number = request.form.get("page_number", None)

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    try:
        # Create a temporary file to save the uploaded content
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        # Call the translate_pdf69 function with the correct parameters
        result = translate_pdf69(
            input_pdf_path=temp_path,
            output_language=target_lang,
            page_number=page_number,
            input_language=request.form.get("input_lang", "en-IN"),
            api_key=SARVAM_API_KEY
        )
        
        # Read the translated PDF and encode it
        if os.path.exists(result):
            with open(result, "rb") as f:
                translated_pdf_content = base64.b64encode(f.read()).decode("utf-8")
            
            # Clean up temporary files
            os.remove(temp_path)
            os.remove(result)
            
            return jsonify({"success": True, "translated_pdf": translated_pdf_content})
        else:
            return jsonify({"success": False, "error": "Translation failed - no output file"}), 400

    except Exception as e:
        logger.error(f"Error translating document: {str(e)}")
        # Clean up temporary file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/save-chat', methods=['POST'])
def save_chat():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Log the received data for debugging
        logger.info(f"Received data: {data}")

        # Validate required fields
        required_fields = ["user_id", "message", "loan_type", "timestamp"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Save chat to MongoDB
        chat_entry = {
            'query': data['message'],
            'loan_type': data.get('loan_type', 'General'),
            'timestamp': datetime.fromisoformat(data['timestamp']) if data.get('timestamp') else datetime.utcnow(),
            'user_id': data.get('user_id')
        }

        mongo.db.loan_queries.insert_one(chat_entry)

        # Broadcast update to all connected clients
        socketio.emit('chat_history_updated', broadcast=True)

        return jsonify({"success": True, "message": "Chat saved successfully"}), 200

    except Exception as e:
        logger.error(f"Error saving chat: {str(e)}")
        return jsonify({"error": str(e)}), 500


# CORS headers for all responses
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

# Add these routes for financial dashboard sidebar data

from vector_search import PineconeRAGPipeline
import random

# Loan Categories Route
@app.route('/api/loan-categories', methods=['GET'])
def get_loan_categories():
    """Get available loan categories for the sidebar."""
    try:
        # Fetch categories from database if available
        if mongo.db:
            loan_categories = list(mongo.db.loan_categories.find({}, {'_id': 0}))
            if loan_categories:
                return jsonify(loan_categories)
        
        # Default categories if not found in database
        categories = [
            {"id": "home_loans", "name": "Home Loans", "icon": "home"},
            {"id": "personal_loans", "name": "Personal Loans", "icon": "person"},
            {"id": "business_loans", "name": "Business Loans", "icon": "business"},
            {"id": "education_loans", "name": "Education Loans", "icon": "school"},
            {"id": "car_loans", "name": "Car Loans", "icon": "directions_car"},
            {"id": "gold_loans", "name": "Gold Loans", "icon": "monetization_on"},
            {"id": "mortgage_loans", "name": "Mortgage Loans", "icon": "account_balance"},
            {"id": "credit_card_loans", "name": "Credit Card Loans", "icon": "credit_card"},
        ]
        return jsonify(categories)
    except Exception as e:
        logger.error(f"Error fetching loan categories: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Financial Tools Route
@app.route('/api/financial-tools', methods=['GET'])
def get_financial_tools():
    """Get available financial tools for the sidebar."""
    try:
        # Fetch tools from database if available
        if mongo.db:
            financial_tools = list(mongo.db.financial_tools.find({}, {'_id': 0}))
            if financial_tools:
                return jsonify(financial_tools)
        
        # Default tools if not found in database
        tools = [
            {"id": "emi_calculator", "name": "EMI Calculator", "icon": "calculate"},
            {"id": "eligibility_checker", "name": "Loan Eligibility Checker", "icon": "check_circle"},
            {"id": "interest_comparison", "name": "Interest Rate Comparison", "icon": "compare_arrows"},
            {"id": "credit_score", "name": "Credit Score Analysis", "icon": "analytics"},
            {"id": "debt_consolidation", "name": "Debt Consolidation Planner", "icon": "account_balance_wallet"}
        ]
        return jsonify(tools)
    except Exception as e:
        logger.error(f"Error fetching financial tools: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Updated Interest rates endpoint to use real data from Pinecone
@app.route('/api/interest-rates', methods=['GET'])
def get_api_interest_rates():
    try:
        # Initialize Pinecone with API key from environment
        pinecone_api_key = get_required_env("PINECONE_API_KEY")
        vector_search = PineconeRAGPipeline(
            pinecone_api_key=pinecone_api_key,
            assistant_name="finmate-assistant"
        )
        
        try:
            # Query Pinecone for current interest rates
            query_result = vector_search.query_assistant("current loan interest rates", verbose=False)
            
            # Check if we got valid results from Pinecone
            if query_result and isinstance(query_result, list) and len(query_result) > 0:
                logger.info("Successfully fetched interest rates from Pinecone")
                return jsonify(query_result)
            else:
                logger.warning("No valid data from Pinecone for interest rates, using fallback data")
        except Exception as e:
            logger.error(f"Error querying Pinecone for interest rates: {str(e)}")
        
        # If Pinecone query fails, check MongoDB
        if mongo.db:
            interest_rates = list(mongo.db.interest_rates.find({}, {'_id': 0}))
            if interest_rates:
                logger.info("Using interest rates from MongoDB")
                return jsonify(interest_rates)
        
        # Fallback to sample data if all else fails
        logger.info("Using fallback interest rate data")
        rates = [
            {"loan_type": "Home Loan", "min_rate": 6.7, "max_rate": 8.9},
            {"loan_type": "Personal Loan", "min_rate": 10.8, "max_rate": 18.5},
            {"loan_type": "Car Loan", "min_rate": 8.0, "max_rate": 12.0},
            {"loan_type": "Education Loan", "min_rate": 7.0, "max_rate": 15.0}
        ]
        return jsonify(rates)
    except Exception as e:
        logger.error(f"Error fetching interest rates: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    socketio.run(app, debug=debug_mode, host=host, port=port)

