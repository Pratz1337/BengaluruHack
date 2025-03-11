from flask import Flask, request
from flask_socketio import SocketIO, emit
import os
import logging
import requests
import base64
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional

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
system_prompt = """You are a multilingual financial assistant. Support languages: 
English (en-IN), Hindi (hi-IN), Tamil (ta-IN), Telugu (te-IN), Bengali (bn-IN). 
Use tools when needed and respond in the user's language."""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
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

@socketio.on('audio_message')
def handle_audio_message(data):
    try:
        # Log received data (just the length to avoid huge logs)
        logger.info(f"Received audio data length: {len(data.get('audio', ''))}")
        logger.info(f"Language: {data.get('language', 'te-IN')}")
        
        # Convert audio to text
        text = stt_gladia(data['audio'], data.get('language', 'te-IN'))
        if not text:
            raise ValueError("Failed to convert audio to text")
        
        # Process message
        result = agent_executor.invoke({"input": text})
        response_text = result["output"]
        
        # Generate audio response
        audio_data = generate_audio(response_text, data.get('language', 'hi-IN'))
        
        emit('response', {
            'text': response_text,
            'audio': audio_data,
            'timestamp': datetime.now().isoformat()
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
            'language_code': 'te-IN',
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
        "target_language_code": 'te-IN',
        "speaker": "meera"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get("audios", [None])[0]
    except Exception as e:
        logger.error(f"TTS Error: {str(e)}")
        return None

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
