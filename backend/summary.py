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

# Blueprint for summary-related routes
summary_bp = Blueprint('summary', __name__)
CORS(summary_bp)  # Apply CORS directly to the blueprint

# Initialize the Groq model to match chat_model.py
GROQ_API_KEY = "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"
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
            formatted_content.append(f"- {stripped_line[1:].strip()}")
        else:
            formatted_content.append(stripped_line)

    return "\n".join(formatted_content)

@summary_bp.route('/generate-summary', methods=['POST'])
def generate_summary():
    data = request.json
    conversation_history = data.get('conversation', [])
    
    if not conversation_history:
        return jsonify({"error": "No conversation history available for summarization."}), 400

    # Format the entire conversation as a string for the prompt
    formatted_conversation = ""
    for message in conversation_history:
        formatted_conversation += f"User: {message['user']}\nBot: {message['bot']}\n\n"

    # Create the financial advisor summarization prompt
    prompt = f"""
As an AI specialized in providing financial and loan advice as "FinMate", create a structured summary of the following conversation in a professional style. Focus on the financial information, loan details, and advice provided.

Conversation to summarize:
{formatted_conversation}

Please structure the summary as follows:

### **Introduction**
- Briefly introduce the context of the conversation and the primary financial topics discussed.

### **Main Financial Topics Discussed**
- List the key financial subjects covered during the conversation.
- Use bullet points for clarity.

### **Loan Information**
- For each loan type discussed, provide:
  - Interest rates mentioned
  - Eligibility criteria
  - Repayment options
  - Documentation requirements
  - Include numerical data where mentioned (e.g., interest percentages, loan amounts, terms)

### **Financial Advice Provided**
- Summarize the financial recommendations and guidance given
- Include any credit score advice, saving tips, or investment guidance
- Highlight strategies suggested for financial management

### **Key Financial Takeaways**
- Summarize the most important financial points or conclusions from the discussion.

### **Next Steps (if applicable)**
- List any recommended financial actions or follow-up steps suggested during the conversation.

### **Conclusion**
- Provide a concise closing statement summarizing the overall financial discussion.

NOTE---->
- Structure the response using markdown syntax to ensure readability (e.g., headers, lists).
- Use clear, professional, and user-friendly language.
- Incorporate any numerical data, interest rates, or loan terms if mentioned in the conversation.
- Ensure financial information is accurate and contextually relevant.
- Use formatting elements such as **bold**, *italic*, or `code` for emphasis where appropriate.
- Present all financial data clearly and avoid any unrelated information.
"""

    # Call the Groq LLM to generate the summary
    try:
        summary_response = summary_llm.invoke(prompt)

        # Extract the content appropriately
        if hasattr(summary_response, 'content'):
            summary_text = summary_response.content 
        else:
            summary_text = str(summary_response)  # Fallback to string conversion
        
        # Add the summary to the response
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

@summary_bp.route('/download-summary', methods=['POST'])
def download_summary():
    data = request.json
    summary = data.get('summary', '')

    if not summary:
        return jsonify({"error": "No summary available for download."}), 400

    try:
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=60,
            leftMargin=60,
            topMargin=48,
            bottomMargin=48
        )
        
        # Format and build PDF
        story = format_summary(summary)
        doc.build(story)
        
        # Prepare response
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
