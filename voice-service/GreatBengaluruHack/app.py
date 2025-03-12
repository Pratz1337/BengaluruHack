from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import os
import logging
import requests
import base64
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, List, Dict
import json
import tempfile
from werkzeug.utils import secure_filename

from langchain_groq import ChatGroq
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain.output_parsers import StructuredOutputParser, ResponseSchema

# Import tools from our loan_tools file
import sys
sys.path.append('../../backend')  # Add path to backend directory
from loan_tools import check_loan_eligibility, guide_loan_application, get_financial_tips, track_financial_goal
from document_processor import DocumentProcessor

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret!')
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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") 
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "b7e1c4f0-4c19-4d34-8d2f-6aea1990bdbf")

# Initialize document processor
document_processor = DocumentProcessor(SARVAM_API_KEY)

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

# Define Response Schema for FinMate Output
response_schemas = [
    ResponseSchema(name="result", description="Final response to the user's loan-related query"),
    ResponseSchema(name="loan_type", description="Type of loan discussed"),
    ResponseSchema(name="interest_rate", description="Applicable interest rate"),
    ResponseSchema(name="eligibility", description="Eligibility criteria for the loan"),
    ResponseSchema(name="repayment_options", description="Available repayment options"),
    ResponseSchema(name="additional_info", description="Any extra information relevant to the loan"),
    ResponseSchema(name="tool_call", description="Whether a tool call is needed and which tool to use"),
    ResponseSchema(name="tool_parameters", description="Parameters to pass to the tool if needed"),
]

# Structured Output Parser for main output
output_parser = StructuredOutputParser.from_response_schemas(response_schemas)

# Set up tools for LangChain
tools = [
    check_loan_eligibility,
    guide_loan_application,
    get_financial_tips,
    track_financial_goal
]

# Groq LLM setup
llm = ChatGroq(
    model="llama3-70b-8192",
    temperature=0.3,
    api_key=GROQ_API_KEY
)

# Updated system prompt from chat_model.py, fixed by changing {msg} to {input}
# and adding {format_instructions}
system_prompt = """You are a Loan Advisor AI named "FinMate". Your job is to assist users with loan-related queries.
  
    *Guidelines:*
    - Answer *only* questions related to *loans, interest rates, eligibility, repayment plans, and financial advice*.
    - Do *NOT* discuss non-loan-related topics.
    - Always provide *concise, structured, and accurate* financial guidance.
    - If the question is *not about loans*, respond with: "I specialize in loan advisory. How can I assist with your loan needs?"

*Chat History:*  
{chat_history}

*Document Context:*
{document_context}

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

Example:
- **User:** "What is the best stock to buy right now?"
- **Response:**  
    `"I specialize in loan advisory. How can I assist with your loan needs?"`

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
1. FinMate has access to a central financial database.
2. Use the "FETCH DATABASE" tool to retrieve the latest data on:  
   - Current loan offerings  
   - Interest rate structures  
   - Eligibility requirements  
   - Repayment options  
3. If data retrieval fails, state the following:  
   `"I am unable to retrieve the latest information at the moment. Please check with your bank for more details."`

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
    `"For your security, please avoid sharing sensitive information."`

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

## **9. Available Tools**
You have access to several specialized tools that can help provide better responses:

1. **Loan Eligibility Check**: Use this when users ask about their eligibility for specific loans based on their financial details.
2. **Loan Application Guidance**: Use this when users need help applying for a loan, want to know required documents, or application steps.
3. **Financial Literacy Tips**: Use this when users ask for advice on financial management, saving strategies, or improving credit scores.
4. **Financial Goal Tracking**: Use this when users want to track progress toward financial goals or need planning advice.

To use a tool, specify in your response that a tool call is needed:
- For "tool_call" field: Indicate which tool to use (e.g., "Loan Eligibility Check")
- For "tool_parameters" field: Provide the necessary parameters as a JSON-like structure

---

## **10. Fallback for Missing Data**
- Before stating that you lack information:
    - Try fetching data again.
    - Analyze available data to construct a reasonable response.
- If you still cannot find the information:
    `"I'm unable to retrieve the latest data. Please consult your bank for more details."`


*User Query:* {input}

    KEY POINTS:
    1. Language: You can understand queries in English and many other Indic Languages, but always respond in the language chosen by the user at the start of the conversation.
    2. Scope: You only provide information about loans, interest rates, eligibility, repayment plans, and financial advice.
    3. User Experience: Be polite, patient, and thorough in your responses. Use markdown, numbering, and bolding where appropriate to present information clearly.
    4. Complex Queries: If a query is too complex or outside your knowledge base, politely suggest contacting the specific bank or financial institution for more information.
    5. Data Privacy: Do not share or ask for personal information.
    6. Continuous Availability: Remind users that you're available 24/7 for their queries
    7. When a lot of data is available for the same question then ask follow up questions from the user based on the information you have from tools to pin point the exact information the user is asking for
    8. For complex queries before saying you don't have the information try going back and looking at your data available and try making an answer using that 
    9. TOOL USAGE: Determine if any of your specialized tools can provide a better response. If so, include the tool name in "tool_call" field and required parameters in "tool_parameters".
    10. GREETING MESSAGES: For simple greetings, introduction, or non-specific questions, do not use tools - just provide a friendly response.
    
    PLEASE USE MARKDOWN WHERE NECESSARY TO MAKE THE TEXT LOOK AS FORMATTED AND STRUCTURED AS POSSIBLE. Try breaking up larger paragraphs into smaller ones or points
    TRY TO KEEP YOUR REPLIES SHORT AND TO THE POINT AS POSSIBLE

*Response Format:*
{format_instructions}
"""

# Create the prompt with format_instructions
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "User's language: {language}. Chat history: {chat_history}. Document context: {document_context}. User's question: {input}"),
    ("placeholder", "{agent_scratchpad}")
])

# Set up agent and executor
agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Function to execute tool calls from chat_model.py
def execute_tool_call(tool_name, tool_params):
    """
    Execute the appropriate tool based on the LLM's decision.
    
    Args:
        tool_name: Name of the tool to call
        tool_params: Parameters to pass to the tool
    
    Returns:
        Tool execution results
    """
    try:
        if tool_name == "Loan Eligibility Check":
            return check_loan_eligibility(tool_params.get("user_info", ""))
        
        elif tool_name == "Loan Application Guidance":
            return guide_loan_application(tool_params.get("loan_type", ""))
        
        elif tool_name == "Financial Literacy Tips":
            return get_financial_tips(tool_params.get("topic", ""))
        
        elif tool_name == "Financial Goal Tracking":
            return track_financial_goal(
                tool_params.get("goal", ""), 
                tool_params.get("status", "")
            )
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {str(e)}")
        return {"error": str(e)}

# Format the response function from chat_model.py
def format_response(extracted_info):
    """
    Format the extracted information into a structured response.
    """
    formatted_response = ""
    
    # Add the main result/title if available
    if extracted_info.get("result"):
        formatted_response += f"{extracted_info['result']}\n\n"
    
    # Add loan type info
    if extracted_info.get("loan_type"):
        formatted_response += f"**Loan Type:** {extracted_info['loan_type']}\n\n"
    
    # Add interest rate info
    if extracted_info.get("interest_rate"):
        formatted_response += f"**Interest Rate:** {extracted_info['interest_rate']}\n\n"
    
    # Add eligibility info
    if extracted_info.get("eligibility"):
        formatted_response += f"**Eligibility:** {extracted_info['eligibility']}\n\n"
    
    # Add repayment options
    if extracted_info.get("repayment_options"):
        formatted_response += f"**Repayment Options:** {extracted_info['repayment_options']}\n\n"
    
    # Add additional info
    if extracted_info.get("additional_info"):
        formatted_response += f"**Additional Information:**\n{extracted_info['additional_info']}"
    
    # If formatted response is still empty, use just the result field
    if not formatted_response.strip():
        formatted_response = extracted_info.get("result") or "I couldn't process your request."

    return formatted_response

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

# Document upload endpoint
@app.route('/api/upload-document', methods=['POST'])
def upload_document():
    """Handle document upload and processing"""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part in the request"}), 400
        
    file = request.files['file']
    session_id = request.form.get('session_id')
    
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        try:
            # Create a temporary file to store the upload
            temp_dir = tempfile.gettempdir()
            filename = secure_filename(file.filename)
            file_path = os.path.join(temp_dir, filename)
            
            # Save the file temporarily
            file.save(file_path)
            
            # Process the document
            logger.info(f"Processing document: {filename}")
            result = document_processor.process_document(file_path, max_pages=5)
            
            # Extract key information if processing succeeded
            if result["success"]:
                key_info = document_processor.extract_key_information(result["content"])
                
                # Clean up the temporary file
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.warning(f"Could not remove temporary file: {str(e)}")
                
                # Return success response with extracted information
                return jsonify({
                    "success": True, 
                    "filename": filename,
                    "pages_processed": result["pages_processed"],
                    "total_pages": result["total_pages"],
                    "extracted_info": key_info.get("extracted_info", {}),
                    "document_summary": key_info.get("document_summary", "")
                })
            else:
                # Clean up the temporary file
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.warning(f"Could not remove temporary file: {str(e)}")
                    
                return jsonify({
                    "success": False, 
                    "error": result.get("error", "Failed to process document")
                }), 400
                
        except Exception as e:
            return jsonify({"success": False, "error": f"Error processing document: {str(e)}"}), 500
            
    return jsonify({"success": False, "error": "File type not allowed. Only PDF, DOC, and DOCX are supported."}), 400

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
        document_context = data.get('document_context', "")
        
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
        
        # Add format instructions to the input
        format_instructions = output_parser.get_format_instructions()
        
        # Process with LLM
        llm_result = agent_executor.invoke({
            "input": translated_text,
            "language": current_language,
            "chat_history": chat_history.get_history_as_text(session_id),
            "document_context": document_context,
            "format_instructions": format_instructions
        })
        english_response = llm_result["output"]
        logger.info(f"LLM Response (English): {english_response}")
        
        # Try to parse structured output
        try:
            extracted_info = output_parser.parse(english_response)
            # Ensure all expected keys are present by filling missing ones with an empty string.
            required_keys = ["result", "loan_type", "interest_rate", "eligibility", "repayment_options", "additional_info"]
            for key in required_keys:
                if key not in extracted_info:
                    extracted_info[key] = ""
            
            english_response = format_response(extracted_info)
        except Exception as e:
            logger.error(f"Error parsing structured output: {str(e)}")
            # Fall back to the original response if structured parsing fails.
        
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

# Helper functions
def allowed_file(filename):
    """Check if uploaded file has an allowed extension"""
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
        
    # Combine audio chunks (this is a simplified approach)
    # In a production environment, you'd want to properly concatenate the audio files
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

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)