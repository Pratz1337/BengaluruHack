from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import uuid
import requests
import base64
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
from groq import Groq

app = Flask(__name__)
CORS(app)  # Enable CORS to allow React frontend to communicate with Flask

# Load environment variables
load_dotenv()
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not SARVAM_API_KEY or not GROQ_API_KEY:
    raise ValueError("Missing API keys in environment variables")

# In-memory storage for extracted texts
extracted_texts = {}

# Helper Functions from the Original Script
def parse_pdf_with_sarvam(pdf_path, page_number=None, sarvam_mode="small", prompt_caching="true", api_key=SARVAM_API_KEY):
    url = "https://api.sarvam.ai/parse/parsepdf"
    headers = {"api-subscription-key": api_key}
    form_data = {"sarvam_mode": sarvam_mode, "prompt_caching": prompt_caching}
    if page_number:
        form_data["page_number"] = str(page_number)
    files = {"pdf": (os.path.basename(pdf_path), open(pdf_path, "rb"), "application/pdf")}
    try:
        response = requests.post(url, headers=headers, data=form_data, files=files)
        response.raise_for_status()
        base64_xml = response.json().get("output")
        if not base64_xml:
            raise ValueError("No output found in the API response")
        return base64.b64decode(base64_xml).decode('utf-8')
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        raise
    finally:
        files["pdf"][1].close()

def extract_text_from_xml(xml_string):
    try:
        root = ET.fromstring(xml_string)
        def extract_text_from_element(element):
            text = element.text or ""
            for child in element:
                if child.tag.lower() in ['svg', 'image', 'img', 'video', 'audio', 'figure']:
                    continue
                child_text = extract_text_from_element(child)
                if child_text:
                    text += " " + child_text
            if element.tail:
                text += " " + element.tail
            return text.strip()
        extracted_text = extract_text_from_element(root)
        return ' '.join(extracted_text.split())
    except Exception as e:
        print(f"Error extracting text: {e}")
        return xml_string

def translate_text_chunked(text, source_language="en-IN", target_language="hi-IN", sarvam_api_key=SARVAM_API_KEY, chunk_size=950):
    if len(text) <= chunk_size:
        return translate_text(text, source_language, target_language, sarvam_api_key)
    chunks = []
    current_chunk = ""
    sentences = []
    current_sentence = ""
    for char in text:
        current_sentence += char
        if char in ['.', '!', '?', '।', '॥'] and current_sentence.strip():
            sentences.append(current_sentence)
            current_sentence = ""
    if current_sentence.strip():
        sentences.append(current_sentence)
    for sentence in sentences:
        if len(current_chunk) + len(sentence) > chunk_size:
            chunks.append(current_chunk)
            current_chunk = sentence
        else:
            current_chunk += sentence
    if current_chunk:
        chunks.append(current_chunk)
    translated_chunks = [translate_text(chunk, source_language, target_language, sarvam_api_key) for chunk in chunks]
    return ''.join(translated_chunks)

def translate_text(text, source_language="en-IN", target_language="hi-IN", sarvam_api_key=SARVAM_API_KEY):
    url = "https://api.sarvam.ai/translate"
    headers = {"api-subscription-key": sarvam_api_key, "Content-Type": "application/json"}
    payload = {
        "enable_preprocessing": True,
        "input": text,
        "source_language_code": source_language,
        "target_language_code": target_language,
        "speaker_gender": "Male",
        "mode": "formal",
        "numerals_format": "international"
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get("translated_text", text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text

def ask_llm_about_pdf(extracted_text, question, groq_api_key=GROQ_API_KEY):
    client = Groq(api_key=groq_api_key)
    system_prompt = "You are an AI assistant that helps users understand documents. Answer questions based only on the provided document content. Be concise but thorough."
    user_prompt = f"The following is content extracted from a PDF document:\n\n---\n{extracted_text[:50000]}\n---\n\nQuestion about this document: {question}\n\nPlease answer based only on the provided information."
    try:
        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=1024
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq API error: {e}")
        raise

# Flask Routes
@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400
    pdf_file = request.files['pdf']
    page_number = request.form.get('page')
    mode = request.form.get('mode', 'small')
    temp_pdf_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.pdf")
    pdf_file.save(temp_pdf_path)
    try:
        decoded_xml = parse_pdf_with_sarvam(temp_pdf_path, page_number, mode)
        extracted_text = extract_text_from_xml(decoded_xml)
        text_id = str(uuid.uuid4())
        extracted_texts[text_id] = extracted_text
        return jsonify({'text_id': text_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        os.remove(temp_pdf_path)

@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    text_id = data.get('text_id')
    question = data.get('question')
    language = data.get('language', 'en-IN')
    if not text_id or not question:
        return jsonify({'error': 'Missing text_id or question'}), 400
    extracted_text = extracted_texts.get(text_id)
    if not extracted_text:
        return jsonify({'error': 'Invalid text_id'}), 404
    try:
        english_question = question
        if language != 'en-IN':
            english_question = translate_text_chunked(question, source_language=language, target_language='en-IN')
        answer = ask_llm_about_pdf(extracted_text, english_question)
        if language != 'en-IN':
            translated_answer = translate_text_chunked(answer, source_language='en-IN', target_language=language)
            return jsonify({'answer': translated_answer, 'original_answer': answer}), 200
        return jsonify({'answer': answer}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)