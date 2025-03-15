import requests
import base64
import os
from pathlib import Path

def translate_pdf(input_pdf_path, output_language="hi-IN", page_number=None, 
                  input_language="en-IN", hard_translate_dict=None, 
                  api_key="your_api_key_here"):
    """
    Translate a PDF using Sarvam AI's API and save the translated PDF.
    
    Parameters:
    -----------
    input_pdf_path : str
        Path to the input PDF file
    output_language : str
        Language code for the output (e.g., "hi-IN" for Hindi)
        Available options: "hi-IN", "bn-IN", "gu-IN", "kn-IN", "ml-IN", 
                         "mr-IN", "od-IN", "pa-IN", "ta-IN", "te-IN"
    page_number : str or int, optional
        Specific page to translate (leave empty for entire document)
    input_language : str, optional
        Language code of the input PDF (default: "en-IN")
    hard_translate_dict : dict, optional
        Dictionary of words with custom translations
    api_key : str
        Your Sarvam AI API subscription key
    
    Returns:
    --------
    str
        Path to the saved translated PDF file
    """
    # API endpoint
    url = "https://api.sarvam.ai/parse/translatepdf"
    
    # Prepare the headers
    headers = {
        "api-subscription-key": api_key
    }
    
    # Prepare the form data
    form_data = {
        "output_lang": output_language,
        "input_lang": input_language
    }
    
    # Add optional parameters if provided
    if page_number is not None:
        form_data["page_number"] = str(page_number)
    
    if hard_translate_dict is not None:
        form_data["hard_translate_dict"] = str(hard_translate_dict)
    
    # Prepare the file
    files = {
        "pdf": (os.path.basename(input_pdf_path), open(input_pdf_path, "rb"), "application/pdf")
    }
    
    print(f"Translating PDF: {os.path.basename(input_pdf_path)} to {output_language}...")
    
    try:
        # Make the API request
        response = requests.post(url, headers=headers, data=form_data, files=files)
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Parse the response
        response_data = response.json()
        base64_pdf = response_data.get("translated_pdf")
        
        if not base64_pdf:
            raise ValueError("No translated PDF in the response")
        
        # Decode the base64 PDF
        decoded_pdf = base64.b64decode(base64_pdf)
        
        # Generate output filename
        input_filename = Path(input_pdf_path).stem
        output_filename = f"{input_filename}_translated_{output_language}.pdf"
        output_path = os.path.join(os.path.dirname(input_pdf_path), output_filename)
        
        # Save the decoded PDF
        with open(output_path, "wb") as f:
            f.write(decoded_pdf)
        
        print(f"Translation complete! Saved as: {output_path}")
        return output_path
    
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
        # Ensure the file is closed
        files["pdf"][1].close()

# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Translate a PDF using Sarvam AI")
    parser.add_argument("input_pdf", help="Path to the input PDF file")
    parser.add_argument("--output-lang", default="hi-IN", help="Output language code")
    parser.add_argument("--page", type=str, help="Specific page to translate (optional)")
    parser.add_argument("--input-lang", default="en-IN", help="Input language code")
    parser.add_argument("--api-key", required=True, help="Your Sarvam AI API subscription key")
    
    args = parser.parse_args()
    
    translate_pdf(
        args.input_pdf,
        output_language=args.output_lang,
        page_number=args.page,
        input_language=args.input_lang,
        api_key=args.api_key
    )