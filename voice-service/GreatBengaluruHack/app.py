from flask import Flask, request
from flask_socketio import SocketIO, emit
import os
import logging
import requests
import base64
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, List, Dict
import json

from langchain_groq import ChatGroq
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import StructuredTool

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret!')
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

chat_history = ChatHistory()

# Tools
def dummy_tool(query: str) -> str:
    """Dummy tool function"""
    return "This is a dummy response."

dummy_tool_instance = StructuredTool.from_function(
    name="dummy_tool",
    description="A dummy tool for demonstration purposes",
    func=dummy_tool
)

tools = [dummy_tool_instance]

# Groq LLM setup
llm = ChatGroq(
    model_name="llama3-70b-8192",
    temperature=0.3,
    api_key=os.getenv("GROQ_API_KEY")
)

# Agent setup
system_prompt = """You are a multilingual financial assistant specializing in explaining complex financial concepts in simple terms.

You'll receive user queries about financial topics in English, regardless of the user's original language.
Provide helpful, accurate information about financial concepts, products, and advice.

Keep your responses clear, concise, and easy to understand, avoiding financial jargon where possible.
Always maintain a supportive and informative tone.

Always respond in English. Your response will be automatically translated back to the user's original language."""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "User's original language: {language}. User's question (translated to English): {input}"),
    ("placeholder", "{agent_scratchpad}")
])

agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# WebSocket handlers
@socketio.on('connect')
def handle_connect():
    logger.info("Client connected")
    emit('status', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

@socketio.on('get_chat_history')
def handle_get_history():
    session_id = request.sid
    history = chat_history.get_history(session_id)
    emit('chat_history', history)

@socketio.on('audio_message')
def handle_audio_message(data):
    try:
        session_id = request.sid
        logger.info(f"Received audio data length: {len(data.get('audio', ''))}")
        
        # Handle language detection if auto-detect is enabled
        auto_detect = data.get('auto_detect', False)
        current_language = data.get('language', 'en-IN')
        
        if auto_detect:
            detected_language = detect_language(data['audio'])
            if detected_language:
                current_language = detected_language
                emit('detected_language', {'language': detected_language})
        
        logger.info(f"Using language: {current_language}")
        
        # Convert speech to text
        stt_result = speech_to_text(data['audio'], current_language)
        if not stt_result:
            raise ValueError("Failed to convert audio to text")
        
        original_text = stt_result.get('transcript', '')
        
        # Log the detected text and language for debugging
        logger.info(f"Original text: {original_text}")
        
        # Translate to English if not already in English
        if current_language != "en-IN":
            translated_text = translate_text(original_text, current_language, "en-IN")
            logger.info(f"Translated text (English): {translated_text}")
        else:
            translated_text = original_text
            logger.info("No translation needed, original text is in English")
        
        # Add user message to history with language info
        chat_history.add_message(session_id, original_text, True, current_language)
        
        # Process message with LLM in English
        llm_result = agent_executor.invoke({
            "input": translated_text,
            "language": current_language
        })
        english_response = llm_result["output"]
        
        # Log the English response
        logger.info(f"LLM Response (English): {english_response}")
        
        # Translate LLM response back to original language if not English
        if current_language != "en-IN":
            translated_response = translate_text(english_response, "en-IN", current_language)
            logger.info(f"Translated Response: {translated_response}")
        else:
            translated_response = english_response
            logger.info("No translation needed, user language is English")
        
        # Add assistant response to history with language info
        chat_history.add_message(session_id, translated_response, False, current_language)
        
        # Generate audio response
        audio_data = generate_audio(translated_response, current_language)
        
        emit('response', {
            'original_text': original_text,
            'english_text': translated_text,
            'english_response': english_response,
            'text': translated_response,
            'audio': audio_data,
            'timestamp': datetime.now().isoformat(),
            'language': current_language
        })
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        emit('error', {'message': str(e)})

def speech_to_text(audio_base64: str, source_language: str) -> Optional[Dict]:
    """Convert speech to text using Sarvam AI"""
    url = "https://api.sarvam.ai/speech-to-text"
    
    # Get API key
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        logger.error("Missing SARVAM_API_KEY environment variable")
        return None
    
    headers = {
        "api-subscription-key": api_key
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
        "api-subscription-key": os.getenv("SARVAM_API_KEY")
    }
    
    payload = {
        "input": text,
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
        return result.get('translated_text', text)
    except Exception as e:
        logger.error(f"Translation Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
        return text  # Return original text if translation fails

def generate_audio(text: str, language: str) -> Optional[str]:
    """Generate audio using Sarvam AI's TTS service"""
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": os.getenv("SARVAM_API_KEY")
    }
    
    # Use appropriate voice based on language
    speaker = "meera"  # Default speaker
    
    payload = {
        "inputs": [text[:500]],  # Truncate to 500 chars (API limit)
        "target_language_code": language,
        "speaker": speaker,
        "enable_preprocessing": True,
        "speech_sample_rate": 22050
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        logger.info("TTS Response received")
        return result.get("audios", [None])[0]
    except Exception as e:
        logger.error(f"TTS Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
        return None

def detect_language(audio_base64: str) -> Optional[str]:
    """Detect language using Sarvam AI"""
    url = "https://api.sarvam.ai/speech-to-text"
    
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        logger.error("Missing SARVAM_API_KEY environment variable")
        return None
        
    headers = {
        "api-subscription-key": api_key
    }
    
    try:
        # Convert base64 back to audio file
        audio_data = base64.b64decode(audio_base64)
        
        # Prepare payload and files
        payload = {
            'model': 'saarika:v2',
            'with_timesteps': 'false',
            'detect_language': 'true'  # Enable language detection
        }
        
        files = [
            ('file', ('audio.wav', audio_data, 'audio/wav'))
        ]
        
        response = requests.request("POST", url, headers=headers, data=payload, files=files)
        response.raise_for_status()
        
        result = response.json()
        detected_language = result.get('detected_language', 'en-IN')  # Default to English if not detected
        logger.info(f"Detected language: {detected_language}")
        return detected_language
        
    except Exception as e:
        logger.error(f"Language detection error: {str(e)}")
        return None

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)