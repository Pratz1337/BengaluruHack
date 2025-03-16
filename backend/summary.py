import re
from io import BytesIO
from datetime import datetime
from flask import Blueprint, jsonify, request, send_file
from flask_cors import CORS
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value

try:
    GROQ_API_KEY = get_required_env("GROQ_API_KEY")
except ValueError as e:
    print(f"Configuration error: {str(e)}")
    raise

# Blueprint for summary-related routes
summary_bp = Blueprint('summary', __name__)
CORS(summary_bp)  # Apply CORS directly to the blueprint

# Initialize the Groq model to match chat_model.py
summary_llm = ChatGroq(model="llama-3.2-90b-vision-preview", temperature=0.4, api_key=GROQ_API_KEY)

def clean_summary(raw_summary):
    # Replace headings '##' with a formatted title
    clean_text = re.sub(r"##\s*(.+)", r"\1\n", raw_summary)

    # Replace bold '**' with normal text
    clean_text = re.sub(r"\*\*(.+?)\*\*", r"\1", clean_text)

    # Replace bullet points '*' with '-' (optional) or leave them out for cleaner text
    clean_text = re.sub(r"\*\s*", "- ", clean_text)

    return clean_text

def format_summary_for_chat(summary):
    summary = clean_summary(summary)
    lines = summary.split('\n')
    formatted_content = []
    
    for line in lines:
        stripped_line = line.strip()
        if not stripped_line:
            continue
        
        if stripped_line.endswith(':'):
            if len(stripped_line) > 30:  # Longer lines as main headings
                formatted_content.append(f"\n### {stripped_line}\n")
            else:
                formatted_content.append(f"\n#### {stripped_line}\n")
        elif stripped_line.startswith('•') or stripped_line.startswith('-'):
            formatted_content.append(f"- {stripped_line[1:].trip()}")  # Corrected typo: trip() to strip()
        else:
            formatted_content.append(stripped_line)

    return "\n".join(formatted_content)

@summary_bp.route('/generate-summary', methods=['POST', 'OPTIONS'])
def generate_summary():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    data = request.json
    conversation_history = data.get('conversation', [])
    
    if not conversation_history:
        return jsonify({"error": "No conversation history available for summarization."}), 400

    # Format conversation for the prompt
    formatted_conversation = ""
    for message in conversation_history:
        formatted_conversation += f"User: {message['user']}\nBot: {message['bot']}\n\n"

    prompt = f"""
As an AI specialized in providing financial and loan advice as "FinMate", create a structured summary of the following conversation in a professional style...
    
Conversation to summarize:
{formatted_conversation}
"""
    try:
        summary_response = summary_llm.invoke(prompt)
        if hasattr(summary_response, 'content'):
            summary_text = summary_response.content 
        else:
            summary_text = str(summary_response)
        return jsonify({
            "summary": summary_text,
            "status": "Summary generated successfully"
        })
    except Exception as e:
        return jsonify({"error": f"Failed to generate summary: {str(e)}"}), 500

def format_summary(summary):
    styles = getSampleStyleSheet()
    
    # Modify existing styles with financial theme colors (#00466E deep blue for finance)
    styles['Title'].fontName = "Helvetica-Bold"
    styles['Title'].fontSize = 24
    styles['Title'].spaceAfter = 30
    styles['Title'].alignment = 1  # Center alignment
    styles['Title'].textColor = HexColor("#00466E")
    
    styles['Heading1'].fontName = "Helvetica-Bold"
    styles['Heading1'].fontSize = 18
    styles['Heading1'].spaceBefore = 20
    styles['Heading1'].spaceAfter = 10
    styles['Heading1'].textColor = HexColor("#00466E")
    
    styles['Normal'].fontName = "Helvetica"
    styles['Normal'].fontSize = 12
    styles['Normal'].leading = 16
    styles['Normal'].spaceBefore = 6
    styles['Normal'].spaceAfter = 6
    
    # Add bullet style
    styles.add(ParagraphStyle(
        'BulletPoint',
        parent=styles['Normal'],
        leftIndent=20,
        bulletIndent=10,
        spaceBefore=3,
        spaceAfter=3
    ))

    def process_markdown(text):
        text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
        text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
        return text

    story = []
    story.append(Paragraph("FinMate Conversation Summary", styles['Title']))
    story.append(Spacer(1, 30))
    
    sections = summary.split('###')
    for section in sections:
        if not section.strip():
            continue
            
        lines = section.strip().split('\n')
        if lines:
            # Add section heading
            heading = lines[0].strip('* ')
            story.append(Paragraph(heading, styles['Heading1']))
            story.append(Spacer(1, 10))
            
            current_list_items = []
            
            for line in lines[1:]:
                line = line.strip()
                if not line:
                    continue
                    
                if line.startswith('-') or line.startswith('•'):
                    item_text = line[1:].strip()
                    item_text = process_markdown(item_text)
                    current_list_items.append(
                        ListItem(
                            Paragraph(item_text, styles['BulletPoint']),
                            bulletColor=HexColor("#00466E")
                        )
                    )
                else:
                    if current_list_items:
                        story.append(
                            ListFlowable(
                                current_list_items,
                                bulletType='bullet',
                                bulletFontSize=8,
                                bulletOffsetY=2
                            )
                        )
                        current_list_items = []
                    
                    text = process_markdown(line)
                    story.append(Paragraph(text, styles['Normal']))
            
            if current_list_items:
                story.append(
                    ListFlowable(
                        current_list_items,
                        bulletType='bullet',
                        bulletFontSize=8,
                        bulletOffsetY=2
                    )
                )
            
            story.append(Spacer(1, 15))
    
    return story

@summary_bp.route('/download-summary', methods=['POST', 'OPTIONS'])
def download_summary():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    data = request.json
    summary = data.get('summary', '')
    if not summary:
        return jsonify({"error": "No summary available for download."}), 400

    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=60,
            leftMargin=60,
            topMargin=48,
            bottomMargin=48
        )
        story = format_summary(summary)
        doc.build(story)
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'FinMate_Summary_{datetime.now().strftime("%Y%m%d_%H%M")}.pdf',
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return jsonify({"error": "Failed to generate PDF"}), 500
