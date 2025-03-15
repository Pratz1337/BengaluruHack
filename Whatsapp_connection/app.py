from flask import Flask, request, jsonify
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

from langchain_groq import ChatGroq
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import StructuredTool

# Import PineconeRAGPipeline from vector_search.py
from vector_search import PineconeRAGPipeline

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

# Initialize PineconeRAGPipeline
pinecone_api_key = os.getenv("PINECONE_API_KEY")
if not pinecone_api_key:
    logger.error("Missing PINECONE_API_KEY environment variable")
    raise ValueError("PINECONE_API_KEY is required")

pipeline = PineconeRAGPipeline(pinecone_api_key=pinecone_api_key)

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

# Agent setup with modified system prompt
system_prompt = """You are a Loan Advisor AI named "FinMate". Your job is to assist users with loan-related queries.

**Guidelines:**
- Answer *only* questions related to *loans, interest rates, eligibility, repayment plans, and financial advice*.
- Do *NOT* discuss non-loan-related topics.
- Always provide *concise, structured, and accurate* financial guidance.
- If the question is *not about loans*, respond with: "I specialize in loan advisory. How can I assist with your loan needs?"
- Use the relevant context provided from our financial database to ensure the accuracy and relevance of your responses. Your answers should be primarily based on this context when available.

## **Introduction**
Welcome to "FinMate," a specialized AI-based loan advisor built to provide detailed financial advice related to loan eligibility, interest rates, repayment plans, and loan application processes. Your purpose is to assist users efficiently and professionally by delivering structured responses in a clear and concise manner.

You are expected to:
- Provide factually correct, up-to-date financial advice.
- Respond in the language the user chooses at the beginning of the conversation.
- Offer consistent and professional communication at all times.
- If you cannot answer a question directly, attempt to gather additional information through follow-up questions.

---
## **1. Scope of Responses**
You are strictly programmed to answer queries related to financial and loan-related topics. The following areas are within your scope:
- **Loan Types**:
    - Home loans
    - Personal loans
    - Education loans
    - Business loans
    - Car loans
    - Gold loans
    - Mortgage loans
    - Debt consolidation loans
    - Credit card loans
- **Interest Rates**:
    - Fixed vs. floating interest rates
    - Annual percentage rates (APR)
    - Impact of credit score on interest rates
    - Central bank rate influence on loans
- **Loan Eligibility**:
    - Minimum income requirements
    - Age and employment criteria
    - Credit score thresholds
    - Co-applicant and guarantor guidelines
- **Repayment Options**:
    - Monthly EMIs
    - Step-up repayment plans
    - Bullet payments
    - Loan restructuring options
- **Financial Literacy**:
    - Credit score improvement tips
    - Budgeting strategies
    - Debt management
    - Financial planning

---

### **1.1. Out-of-Scope Queries**
If a user asks a question outside the defined scope, respond with:

> "I specialize in loan advisory. How can I assist with your loan needs?"

**Example:**
- **User:** "What is the best stock to buy right now?"
- **Response:**  
    "I specialize in loan advisory. How can I assist with your loan needs?"

---

## **2. Language Support**
- FinMate must understand and respond in **multiple languages**, including:  
    - English  
    - Hindi  
    - Tamil  
    - Telugu  
    - Bengali  
    - Marathi  
    - Kannada  
    - Malayalam  
    - Gujarati  

- If the user starts the conversation in one language, maintain consistency in that language unless the user explicitly switches languages.

**Example:**  
- **User:** "मुझे होम लोन के लिए ब्याज दर के बारे में बताएं।"  
- **Response:** "होम लोन के लिए ब्याज दरें आमतौर पर 6.5% से 8.5% तक होती हैं।"  

---

## **3. Data Source and Retrieval**
1. FinMate has access to a central financial database via the context provided.
2. Use the "FETCH DATABASE" tool to retrieve additional data if needed on:  
   - Current loan offerings  
   - Interest rate structures  
   - Eligibility requirements  
   - Repayment options  
3. If data retrieval fails or context is insufficient, state:  
   "I am unable to retrieve the latest information at the moment. Please check with your bank for more details."

---

## **4. Structured and Concise Responses**
### **4.1. Formatting Guidelines**
- Keep responses **under 500 words** unless detailed clarification is required.
- Present information using:
    - **Markdown** for clarity
    - **Numbering** for steps and instructions
    - **Bullet points** for lists
    - **Bold text** for important information

### **4.2. Example Formatting:**
**User:** "What are the eligibility criteria for a home loan?"  
**Response:**  
**Eligibility Criteria for Home Loans:**  
1. **Minimum Income:** ₹30,000 per month  
2. **Age Requirement:** 21 to 65 years  
3. **Credit Score:** Minimum 700  
4. **Employment:** Must have stable income for the past two years  

---

## **5. Complex Queries Handling**
### **5.1. Asking Follow-Up Questions**
If the query is unclear or involves multiple data points, ask follow-up questions to narrow down the response:

**Example:**  
**User:** "Tell me about car loans."  
**Follow-Up:**  
*"Do you want to know about car loan eligibility, interest rates, or repayment options?"*

### **5.2. Handling Conflicting Information**
- If the data source provides conflicting information:
    - Present the information with a disclaimer:
      > "Data may vary across financial institutions. Please confirm with your bank for accuracy."

---

## **6. Data Privacy and Security**
1. Do NOT request or store sensitive information like:
    - Bank account numbers  
    - Credit card details  
    - Aadhaar or PAN numbers  
2. Ensure that all conversations are encrypted and secure.
3. If the user shares personal information, respond with:
    "For your security, please avoid sharing sensitive information."

---

## **7. User Experience and Tone**
- Maintain a **professional, friendly, and polite** tone.
- Avoid financial jargon; explain in simple terms.  
- If the user becomes aggressive or rude, remain calm and professional.  

**Example:**  
- **User:** "Why is the interest rate so high?"  
- **Response:**  
*"Interest rates are influenced by several factors, including your credit score and market conditions. Let me help you explore lower-interest options."*  

---

## **8. Continuous Availability**
- Remind users that FinMate is available **24/7**.  
- If the user returns after a long period, acknowledge the gap and continue smoothly.

---

*User Query:* {input}

PLEASE USE MARKDOWN WHERE NECESSARY TO MAKE THE TEXT LOOK AS FORMATTED AND STRUCTURED AS POSSIBLE. Try breaking up larger paragraphs into smaller ones or points
TRY TO KEEP YOUR REPLIES SHORT AND TO THE POINT AS POSSIBLE
"""

# Modified prompt template to include context
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "User's original language: {language}.\n\nRelevant context from our financial database:\n{context}\n\nUser's question (translated to English): {input}"),
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
        logger.info("=" * 50)
        logger.info("NEW AUDIO MESSAGE RECEIVED")
        
        # Get initial language setting
        auto_detect = data.get('auto_detect', False)
        current_language = data.get('language', 'en-IN')
        
        logger.info(f"Auto-detect enabled: {auto_detect}")
        logger.info(f"Initial language setting: {current_language}")
        
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
        
        # Always translate if not English
        needs_translation = current_language != "en-IN"
        logger.info(f"Needs translation: {needs_translation}")
        
        if needs_translation:
            translated_text = translate_text(original_text, current_language, "en-IN")
            logger.info(f"Translated text (English): {translated_text}")
        else:
            translated_text = original_text
            logger.info("Text is in English, no translation needed")
        
        # Get relevant context from vector search
        context = pipeline.query_assistant(translated_text, stream=False, verbose=False)
        context_text = ""
        if isinstance(context, dict) and context.get('citations'):
            context_text = "\n\n".join(citation['text'] for citation in context['citations'] if 'text' in citation)
        logger.info(f"Retrieved context: {context_text[:100]}..." if context_text else "No context retrieved")
        
        # Process with LLM using context
        llm_result = agent_executor.invoke({
            "input": translated_text,
            "language": current_language,
            "context": context_text
        })
        english_response = llm_result["output"]
        logger.info(f"LLM Response (English): {english_response}")
        
        # Translate response back if needed
        if needs_translation:
            logger.info(f"Translating response from English to {current_language}")
            translated_response = translate_text(english_response, "en-IN", current_language)
            logger.info(f"Translation successful. Length: {len(translated_response)}")
        else:
            translated_response = english_response
        
        # Generate audio in detected language
        logger.info(f"Generating audio in language: {current_language}")
        audio_data = generate_audio(translated_response, current_language)
        
        if audio_data:
            logger.info(f"Successfully generated audio in {current_language}")
        else:
            logger.error("Failed to generate audio")
        
        # Send response
        emit('response', {
            'original_text': original_text,
            'english_text': translated_text if needs_translation else original_text,
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
        "api-subscription-key": os.getenv("SARVAM_API_KEY")
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
            if audio_chunk:
                audio_base64_chunks.append(audio_chunk)
        except Exception as e:
            logger.error(f"TTS Error for chunk: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            return None
    
    if not audio_base64_chunks:
        return None
        
    # Combine audio chunks (simplified approach)
    return audio_base64_chunks[0] if len(audio_base64_chunks) == 1 else audio_base64_chunks[0]

def detect_language(audio_base64: str) -> Optional[str]:
    """Detect language using Sarvam AI"""
    logger.info("Starting language detection...")
    
    url = "https://api.sarvam.ai/speech-to-text"
    
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        logger.error("Missing SARVAM_API_KEY environment variable")
        return None
        
    headers = {
        "api-subscription-key": api_key
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
        detected_language = result.get('language_code', 'en-IN')
        
        logger.info(f"Raw STT response: {result}")
        logger.info(f"Detected language code from STT: {detected_language}")
        
        return detected_language
        
    except Exception as e:
        logger.error(f"Language detection error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
        return None

@app.route('/whatsapp', methods=['POST'])
def whatsapp_webhook():
    """Handle incoming WhatsApp messages from Twilio"""
    try:
        logger.info("Received a request from Twilio")
        incoming_msg = request.values.get('Body', '').strip()
        from_number = request.values.get('From', '')
        session_id = from_number

        logger.info(f"Incoming WhatsApp message from {from_number}: {incoming_msg}")

        if not incoming_msg:
            logger.warning("Received empty message")
            return send_whatsapp_response("I didn't receive a message. Please try again.")

        # Process message and handle empty responses
        response_text = process_message(incoming_msg, session_id)
        if not response_text or not response_text.strip():
            logger.warning("Empty response from AI")
            response_text = "I apologize, but I couldn't generate a response. Please try rephrasing your question."

        # Send chunked response
        logger.info(f"Sending response of length {len(response_text)}")
        return send_whatsapp_response(response_text)
    
    except Exception as e:
        logger.error(f"Error in webhook: {str(e)}", exc_info=True)
        return send_whatsapp_response("I encountered an error. Please try again later.")

def process_message(message: str, session_id: str) -> str:
    """Process the incoming message with the Groq model and return the response"""
    try:
        logger.info(f"Processing message for session {session_id}: {message}")

        # Add user message to chat history
        chat_history.add_message(session_id, message, is_user=True)

        # If the message is short (like "Hi"), don't use tools
        if len(message.split()) <= 2:
            return "Hello! How can I assist with your loan-related queries?"

        # Get relevant context from vector search
        context = pipeline.query_assistant(message, stream=False, verbose=False)
        context_text = ""
        if isinstance(context, dict) and context.get('citations'):
            context_text = "\n\n".join(citation['text'] for citation in context['citations'] if 'text' in citation)
        logger.info(f"Retrieved context: {context_text[:100]}..." if context_text else "No context retrieved")

        # Process with LLM using context
        llm_result = agent_executor.invoke({
            "input": message,
            "language": "en-IN",
            "context": context_text
        })

        # Ensure Groq returns valid output
        response_text = llm_result.get("output", "").strip()

        if not response_text:
            logger.warning("LLM response was empty, using fallback response.")
            response_text = "I couldn't process your request. Please try again."

        logger.info(f"LLM response for session {session_id}: {response_text}")

        # Add AI response to chat history
        chat_history.add_message(session_id, response_text, is_user=False)

        return response_text

    except Exception as e:
        logger.error(f"Error processing message for session {session_id}: {str(e)}")
        return "An error occurred while processing your message."

def format_whatsapp_text(text: str) -> str:
    """Format text for WhatsApp display with proper styling"""
    lines = []
    current_section = []
    
    # Split text into lines and process each line
    for line in text.split('\n'):
        line = line.strip()
        
        # Skip empty lines and decorative lines
        if not line or line.startswith('===') or line.startswith('---'):
            if current_section:
                lines.append('\n'.join(current_section))
                current_section = []
            continue
            
        # Format headings
        if line.startswith('#'):
            if current_section:
                lines.append('\n'.join(current_section))
                current_section = []
            line = line.lstrip('#').strip()
            lines.append(f"\n*{line}*\n")
            continue
            
        # Format bullet points
        if line.startswith('*') or line.startswith('-'):
            line = f"• {line.lstrip('*-').strip()}"
            
        # Format bold text
        line = line.replace('**', '*')
        
        current_section.append(line)
    
    if current_section:
        lines.append('\n'.join(current_section))
    
    # Join sections with proper spacing
    formatted_text = '\n\n'.join(line for line in lines if line.strip())
    return formatted_text

def send_whatsapp_response(message: str):
    """Send a formatted response back to WhatsApp with improved readability."""
    MAX_CHUNK_SIZE = 1600  # WhatsApp character limit per message
    
    # Format the message for WhatsApp
    formatted_message = format_whatsapp_text(message)
    
    # Split into chunks while preserving formatting
    chunks = []
    current_chunk = []
    current_length = 0
    
    for paragraph in formatted_message.split('\n\n'):
        # If paragraph is too long, split it further
        if len(paragraph) > MAX_CHUNK_SIZE:
            words = paragraph.split()
            for word in words:
                if current_length + len(word) + 1 > MAX_CHUNK_SIZE:
                    chunks.append('\n\n'.join(current_chunk))
                    current_chunk = [word]
                    current_length = len(word)
                else:
                    current_chunk.append(word)
                    current_length += len(word) + 1
        else:
            if current_length + len(paragraph) + 2 > MAX_CHUNK_SIZE:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = [paragraph]
                current_length = len(paragraph)
            else:
                current_chunk.append(paragraph)
                current_length += len(paragraph) + 2
    
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))
    
    # Add message numbering if multiple chunks
    if len(chunks) > 1:
        chunks = [f"({i+1}/{len(chunks)})\n\n{chunk.strip()}" for i, chunk in enumerate(chunks)]
    
    # Create and send response
    resp = MessagingResponse()
    for chunk in chunks:
        resp.message(chunk)
    
    return str(resp)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)