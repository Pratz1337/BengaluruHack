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
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client

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
system_prompt = """You are a multilingual financial assistant specializing in providing responses in multiple Indian languages.

CRITICAL LANGUAGE RULES:
1. You MUST RESPOND ONLY in the language specified by the user's input language code:
   - kn-IN: ಕನ್ನಡ (Kannada)
   - hi-IN: हिंदी (Hindi)
   - ta-IN: தமிழ் (Tamil)
   - te-IN: తెలుగు (Telugu)
   - bn-IN: বাংলা (Bengali)
   - en-IN: English

2. Language Matching Examples:
   - When language is "kn-IN": Respond in Kannada (ಕನ್ನಡ) only
   Example: "ನಿಮ್ಮ ಹಣಕಾಸು ಪ್ರಶ್ನೆಗಳಿಗೆ ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ"
   
   - When language is "hi-IN": Respond in Hindi (हिंदी) only
   Example: "मैं आपके वित्तीय प्रश्नों में मदद करूंगा"

3. STRICT RULES:
   - NEVER mix languages
   - NEVER use English when another language is specified
   - NEVER transliterate - use proper script for each language
   - If language code is kn-IN, response MUST be in Kannada script (ಕನ್ನಡ) only

4. Format all numbers and financial terms in the appropriate script for the language specified.

Remember: You are a financial expert who MUST maintain the user's language throughout the entire response."""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "Current language code: {language}. User's question: {input}"),
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
        if auto_detect:
            detected_language = detect_language(data['audio'])
            if detected_language:
                data['language'] = detected_language
                emit('detected_language', {'language': detected_language})
        
        current_language = data.get('language', 'kn-IN')  # Default to Kannada instead of Telugu
        logger.info(f"Language: {current_language}")
        
        # Convert audio to text
        text = stt_gladia(data['audio'], current_language)
        if not text:
            raise ValueError("Failed to convert audio to text")
        
        # Log the detected text and language for debugging
        logger.info(f"Detected text: {text}")
        logger.info(f"Using language: {current_language}")
        
        # Add user message to history with language info
        chat_history.add_message(session_id, text, True, current_language)
        
        # Process message with explicit language context
        result = agent_executor.invoke({
            "input": text,
            "language": current_language
        })
        response_text = result["output"]
        
        # Log the response for debugging
        logger.info(f"LLM Response: {response_text}")
        
        # Add assistant response to history with language info
        chat_history.add_message(session_id, response_text, False, current_language)
        
        # Generate audio response
        audio_data = generate_audio(response_text, current_language)
        
        emit('response', {
            'text': response_text,
            'audio': audio_data,
            'timestamp': datetime.now().isoformat(),
            'language': current_language
        })
        
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        emit('error', {'message': str(e)})

def stt_gladia(audio_base64: str, language: str) -> Optional[str]:
    """Convert speech to text using Sarvam AI"""
    url = "https://api.sarvam.ai/speech-to-text"
    
    # Get API key and handle missing key scenario
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
            'model': 'saarika:v2',  # Using default model from example
            'language_code': language,  # Use the input language instead of hardcoding
            'with_timesteps': 'false'
        }
        
        files = [
            ('file', ('audio.wav', audio_data, 'audio/wav'))
        ]
        
        # Log request info
        logger.info(f"Sending request to {url}")
        
        # Use requests.request with multipart/form-data
        response = requests.request("POST", url, headers=headers, data=payload, files=files)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"STT Response: {result}")
        print(f"\n\n\n\n\n\n{result.get('transcript')}\n\n\n\n\n\n")
        return result.get('transcript')
        
    except Exception as e:
        logger.error(f"STT Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
            logger.error(f"Response status code: {e.response.status_code}")
        return None

def generate_audio(text: str,language:str) -> Optional[str]:
    """Generate audio using Sarvam AI"""
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": os.getenv("SARVAM_API_KEY")
    }
    
    payload = {
        "inputs": [text[:500]],  # Truncate to 500 chars
        "target_language_code": language,  # Use the input language instead of hardcoding
        "speaker": "meera"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get("audios", [None])[0]
    except Exception as e:
        logger.error(f"TTS Error: {str(e)}")
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

@app.route('/whatsapp', methods=['POST'])
def whatsapp():
    incoming_msg = request.values.get('Body', '').strip()
    from_number = request.values.get('From', '')
    
    # Process the incoming message and generate a response
    response_text = process_message(incoming_msg)
    
    # Create a Twilio response
    resp = MessagingResponse()
    resp.message(response_text)
    
    return str(resp)

def process_message(message):
    # Implement your message processing logic here
    return "This is a response from your application."

# Access Twilio credentials
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')

# Initialize Twilio client
client = Client(account_sid, auth_token)

# Example: Send a message
message = client.messages.create(
    body="Hello from your application!",
    from_='whatsapp:+14155238886',  # Twilio sandbox number
    to='whatsapp:+918762064431'  # Replace with a valid, verified number
)
print(message.sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)