import requests
import base64
import argparse
import xml.etree.ElementTree as ET
import os
import json
from groq import Groq

def parse_pdf_with_sarvam(pdf_path, page_number=None, sarvam_mode="small", prompt_caching="true", api_key=None):
    """
    Parse a PDF file using Sarvam AI's API and return the decoded XML content.
    
    Parameters:
    -----------
    pdf_path : str
        Path to the PDF file to parse
    page_number : str or int, optional
        Page number to parse (leave None for all pages)
    sarvam_mode : str
        Mode of parsing: "small" for economical and fast, "large" for high precision
    prompt_caching : str
        Whether to cache the prompt: "true" or "false"
    api_key : str
        Sarvam AI API subscription key
        
    Returns:
    --------
    str
        Decoded XML content from the parsed PDF
    """
    url = "https://api.sarvam.ai/parse/parsepdf"
    
    headers = {
        "api-subscription-key": api_key
    }
    
    # Prepare form data
    form_data = {
        "sarvam_mode": sarvam_mode,
        "prompt_caching": prompt_caching
    }
    
    # Add page number if specified
    if page_number:
        form_data["page_number"] = str(page_number)
    
    # Prepare file data
    files = {
        "pdf": (os.path.basename(pdf_path), open(pdf_path, "rb"), "application/pdf")
    }
    
    try:
        print(f"Parsing PDF: {os.path.basename(pdf_path)} with Sarvam AI...")
        response = requests.post(url, headers=headers, data=form_data, files=files)
        response.raise_for_status()
        
        # Parse the response
        response_data = response.json()
        base64_xml = response_data.get("output")
        
        if not base64_xml:
            raise ValueError("No output found in the API response")
        
        # Decode the base64 XML
        decoded_xml = base64.b64decode(base64_xml).decode('utf-8')
        
        return decoded_xml
    
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status code: {e.response.status_code}")
            print(f"Response text: {e.response.text}")
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        # Make sure to close the file
        files["pdf"][1].close()

def extract_text_from_xml(xml_string):
    """
    Extract meaningful text content from XML, filtering out non-text elements.
    
    Parameters:
    -----------
    xml_string : str
        XML content as a string
        
    Returns:
    --------
    str
        Extracted text content from the XML
    """
    try:
        # Parse the XML
        root = ET.fromstring(xml_string)
        
        # Function to recursively extract text from XML elements
        def extract_text_from_element(element):
            text = element.text or ""
            for child in element:
                # Skip SVG, image, video, and other non-text elements
                if child.tag.lower() in ['svg', 'image', 'img', 'video', 'audio', 'figure']:
                    continue
                child_text = extract_text_from_element(child)
                if child_text:
                    text += " " + child_text
            if element.tail:
                text += " " + element.tail
            return text.strip()
        
        # Extract text from the root element
        extracted_text = extract_text_from_element(root)
        
        # Clean up the text
        # Remove extra whitespaces
        cleaned_text = ' '.join(extracted_text.split())
        
        return cleaned_text
    
    except ET.ParseError as e:
        print(f"XML Parsing Error: {e}")
        # Return raw XML if parsing fails
        print("Returning raw XML content as fallback...")
        return xml_string
    except Exception as e:
        print(f"Error extracting text from XML: {e}")
        raise

def translate_text(text, source_language="en-IN", target_language="hi-IN", sarvam_api_key=None):
    """
    Translate text using Sarvam AI's Translation API.
    
    Parameters:
    -----------
    text : str
        Text to translate
    source_language : str
        Source language code (default: "en-IN")
    target_language : str
        Target language code
    sarvam_api_key : str
        Sarvam AI API subscription key
        
    Returns:
    --------
    str
        Translated text
    """
    url = "https://api.sarvam.ai/translate"
    
    headers = {
        "api-subscription-key": sarvam_api_key,
        "Content-Type": "application/json"
    }
    
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
        print(f"Translating text from {source_language} to {target_language}...")
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        response_data = response.json()
        translated_text = response_data.get("translated_text")
        
        if not translated_text:
            raise ValueError("No translation found in the API response")
        
        return translated_text
    
    except requests.exceptions.RequestException as e:
        print(f"Translation API Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status code: {e.response.status_code}")
            print(f"Response text: {e.response.text}")
        return text  # Return original text if translation fails
    except Exception as e:
        print(f"Translation Error: {e}")
        return text  # Return original text if translation fails

def ask_llm_about_pdf(extracted_text, question, groq_api_key):
    """
    Ask a question about the PDF content using Groq's llama3.2-90B-vision-preview model.
    
    Parameters:
    -----------
    extracted_text : str
        Text extracted from the PDF
    question : str
        Question to ask about the PDF content
    groq_api_key : str
        Groq API key
        
    Returns:
    --------
    str
        LLM's answer to the question
    """
    # Initialize Groq client
    client = Groq(api_key=groq_api_key)
    
    # Prepare prompt
    system_prompt = "You are an AI assistant that helps users understand documents. Answer questions based only on the provided document content. Be concise but thorough."
    
    user_prompt = f"""
The following is content extracted from a PDF document:

---
{extracted_text[:50000]}  # Limiting to 50,000 chars as a safety measure for token limits
---

Question about this document: {question}

Please answer the question based only on the information provided in the document. If the answer isn't contained in the document, state that you don't have enough information to answer.
"""
    
    try:
        print("Sending query to Groq LLM...")
        # Make the API call
        response = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,  # Lower temperature for more factual responses
            max_tokens=1024
        )
        
        # Extract and return the answer
        return response.choices[0].message.content
    
    except Exception as e:
        print(f"Groq API Error: {e}")
        raise

def get_language_selection():
    """
    Prompt the user to select a language for translation.
    
    Returns:
    --------
    tuple
        (language_code, language_name)
    """
    languages = {
        "en-IN": "English",
        "hi-IN": "Hindi",
        "bn-IN": "Bengali",
        "gu-IN": "Gujarati",
        "kn-IN": "Kannada",
        "ml-IN": "Malayalam",
        "mr-IN": "Marathi",
        "od-IN": "Odia",
        "pa-IN": "Punjabi",
        "ta-IN": "Tamil",
        "te-IN": "Telugu"
    }
    
    print("\n" + "="*50)
    print("Available languages for translation:")
    print("="*50)
    
    for i, (code, name) in enumerate(languages.items(), 1):
        print(f"{i}. {name} ({code})")
    
    while True:
        try:
            choice = input("\nSelect a language (1-11, default is 1 for English): ").strip()
            
            if not choice:
                return "en-IN", "English"
            
            choice = int(choice)
            if 1 <= choice <= 11:
                language_code = list(languages.keys())[choice - 1]
                language_name = languages[language_code]
                return language_code, language_name
            else:
                print("Invalid choice. Please enter a number between 1 and 11.")
        except ValueError:
            print("Invalid input. Please enter a number.")

def interactive_qa_session_with_translation(extracted_text, groq_api_key, sarvam_api_key):
    """
    Run an interactive Q&A session about the PDF content with translation capabilities.
    
    Parameters:
    -----------
    extracted_text : str
        Text extracted from the PDF
    groq_api_key : str
        Groq API key
    sarvam_api_key : str
        Sarvam AI API key
    """
    print("\n" + "="*50)
    print("PDF content loaded. You can now ask questions about it.")
    print("Type 'quit' or 'exit' to end the session.")
    print("Type 'change language' to select a different language.")
    print("="*50 + "\n")
    
    # Get initial language selection
    target_language, language_name = get_language_selection()
    
    print(f"\nSelected language: {language_name} ({target_language})")
    print("="*50 + "\n")
    
    while True:
        question = input("\nYour question: ")
        
        if question.lower() in ['quit', 'exit', 'q']:
            print("Ending Q&A session. Goodbye!")
            break
        
        if question.lower() == 'change language':
            target_language, language_name = get_language_selection()
            print(f"\nChanged language to: {language_name} ({target_language})")
            continue
        
        # Get answer from Groq LLM
        answer = ask_llm_about_pdf(extracted_text, question, groq_api_key)
        
        # Translate the answer if needed
        if target_language != "en-IN":
            translated_answer = translate_text(
                answer, 
                source_language="en-IN", 
                target_language=target_language,
                sarvam_api_key=sarvam_api_key
            )
            print("\nTranslated Answer:")
            print(translated_answer)
            print("\nOriginal Answer:")
            print(answer)
        else:
            print("\nAnswer:")
            print(answer)
        
        print("\n" + "-"*50)

def main():
    parser = argparse.ArgumentParser(description="Parse a PDF and answer questions using Groq LLM with translation capabilities")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--page", help="Specific page number to parse (optional)")
    parser.add_argument("--mode", choices=["small", "large"], default="small", help="Sarvam parsing mode (small or large)")
    parser.add_argument("--sarvam-key", required=True, help="Sarvam AI API key")
    parser.add_argument("--groq-key", required=True, help="Groq API key")
    parser.add_argument("--question", help="Single question to ask (optional; if not provided, interactive mode will be used)")
    parser.add_argument("--language", help="Target language code (e.g., 'hi-IN' for Hindi; if not provided, user will be prompted)")
    parser.add_argument("--save-xml", help="Path to save the decoded XML (optional)")
    parser.add_argument("--save-text", help="Path to save the extracted text (optional)")
    
    args = parser.parse_args()
    
    try:
        # Parse the PDF with Sarvam
        decoded_xml = parse_pdf_with_sarvam(
            args.pdf_path, 
            page_number=args.page, 
            sarvam_mode=args.mode, 
            api_key=args.sarvam_key
        )
        
        # Save XML if requested
        if args.save_xml:
            with open(args.save_xml, 'w', encoding='utf-8') as f:
                f.write(decoded_xml)
            print(f"Decoded XML saved to {args.save_xml}")
        
        # Extract text from XML
        extracted_text = extract_text_from_xml(decoded_xml)
        
        # Save text if requested
        if args.save_text:
            with open(args.save_text, 'w', encoding='utf-8') as f:
                f.write(extracted_text)
            print(f"Extracted text saved to {args.save_text}")
        
        # Process question or run interactive session
        if args.question:
            # Single question mode
            answer = ask_llm_about_pdf(extracted_text, args.question, args.groq_key)
            
            # Translate if language is specified
            if args.language and args.language != "en-IN":
                translated_answer = translate_text(
                    answer, 
                    source_language="en-IN", 
                    target_language=args.language,
                    sarvam_api_key=args.sarvam_key
                )
                print("\nTranslated Answer:")
                print(translated_answer)
                print("\nOriginal Answer:")
                print(answer)
            else:
                print("\nAnswer:")
                print(answer)
        else:
            # Interactive mode with translation
            interactive_qa_session_with_translation(extracted_text, args.groq_key, args.sarvam_key)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()