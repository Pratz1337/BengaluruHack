import os
import requests
import json
import argparse
import wave
import tempfile
import time
import sounddevice as sd
import numpy as np

def record_test_audio(filename, duration=5, samplerate=16000):
    """Record a short test audio file."""
    print(f"Recording test audio for {duration} seconds...")
    
    # Record audio
    recording = sd.rec(int(duration * samplerate), 
                      samplerate=samplerate, 
                      channels=1, 
                      dtype=np.float32)
    
    # Wait for recording to complete
    sd.wait()
    print("Recording complete.")
    
    # Save as WAV file
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.writeframes((recording * 32767).astype(np.int16).tobytes())
    
    print(f"Test audio saved to {filename}")
    return filename

def test_api_connection(api_key):
    """Simple test to check if the API key is valid."""
    url = "https://api.sarvam.ai/v1/account"  # This is a placeholder - replace with actual endpoint
    headers = {
        'api-subscription-key': api_key
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"API connection test status code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"API connection test error: {e}")
        return False

def test_api_with_sample_audio(api_key, audio_file=None, use_dummy=False):
    """Test the API with either a recorded sample or a dummy file."""
    url = "https://api.sarvam.ai/speech-to-text-translate"
    
    # If no audio file provided, record one
    if not audio_file and not use_dummy: 
        temp_dir = tempfile.mkdtemp()
        audio_file = os.path.join(temp_dir, "test_audio.wav")
        record_test_audio(audio_file)
    
    # If using dummy data, create a simple wav file
    if use_dummy:
        temp_dir = tempfile.mkdtemp()
        audio_file = os.path.join(temp_dir, "dummy_audio.wav")
        create_dummy_wav(audio_file)
    
    # Create multipart request
    files = {
        'file': (os.path.basename(audio_file), open(audio_file, 'rb'), 'audio/wav')
    }
    
    # Define different model options to test
    models = ["saaras:v1", "saaras:v2", "saaras:turbo", "saaras:flash"]
    
    # Test with each model
    for model in models:
        print(f"\nTesting with model: {model}")
        
        data = {
            'model': model,
            'with_diarization': 'false'
        }
        
        headers = {
            'api-subscription-key': api_key
        }
        
        try:
            # Print complete request details for debugging
            print(f"Request URL: {url}")
            print(f"Request headers: {headers}")
            print(f"Request data: {data}")
            print(f"Sending file: {os.path.basename(audio_file)}")
            
            # Send request and time it
            start_time = time.time()
            response = requests.post(url, files=files, data=data, headers=headers)
            elapsed_time = time.time() - start_time
            
            print(f"Response time: {elapsed_time:.2f} seconds")
            print(f"Response status code: {response.status_code}")
            
            # Try to parse response as JSON
            try:
                result = response.json()
                print("Response JSON:")
                print(json.dumps(result, indent=2))
                
                # Check if we got the default response
                if result.get('transcript') == "The police have arrested two people in connection with this incident.":
                    print("WARNING: Received the same default response message!")
            except:
                print(f"Raw response text: {response.text}")
                
        except Exception as e:
            print(f"Error testing API: {e}")
        
        print("-" * 50)
        
        # Reset file position for next test
        files['file'][1].seek(0)
    
    # Close the file when done
    files['file'][1].close()
    
    # Clean up temp file if we created one
    if not audio_file or use_dummy:
        try:
            os.remove(audio_file)
            os.rmdir(temp_dir)
        except:
            pass

def create_dummy_wav(filename, duration=1):
    """Create a simple sine wave WAV file for testing."""
    samplerate = 16000
    t = np.linspace(0, duration, int(samplerate * duration), False)
    tone = np.sin(2 * np.pi * 440 * t)  # 440 Hz sine wave
    
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(samplerate)
        wf.writeframes((tone * 32767).astype(np.int16).tobytes())
    
    print(f"Created dummy WAV file: {filename}")

def verify_api_key_format(api_key):
    """Do basic validation of API key format."""
    # Check if it looks like a UUID
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    
    if uuid_pattern.match(api_key):
        print("API key appears to be in valid UUID format.")
        return True
    else:
        print("WARNING: API key does not appear to be in standard UUID format.")
        return False

def check_available_audio_devices():
    """List available audio input devices."""
    print("\nChecking available audio devices:")
    devices = sd.query_devices()
    
    print("\nInput devices:")
    for i, device in enumerate(devices):
        if device['max_input_channels'] > 0:
            print(f"  {i}: {device['name']}")
    
    default_device = sd.query_devices(kind='input')
    print(f"\nDefault input device: {default_device['name']}")

def main():
    parser = argparse.ArgumentParser(description="Sarvam AI API Diagnostic Tool")
    
    parser.add_argument("--key", required=True, help="Your Sarvam AI API subscription key")
    parser.add_argument("--input", help="Optional input audio file for testing")
    parser.add_argument("--dummy", action="store_true", help="Use a dummy audio file instead of recording")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("SARVAM AI API DIAGNOSTIC TOOL")
    print("=" * 60)
    
    # Verify API key format
    verify_api_key_format(args.key)
    
    # Check audio devices
    check_available_audio_devices()
    
    # Test API connection
    print("\nTesting API connection...")
    # test_api_connection(args.key)  # Uncomment if there's a valid endpoint to test connection
    
    # Test with audio
    print("\nTesting speech-to-text API with audio...")
    test_api_with_sample_audio(args.key, args.input, args.dummy)
    
    print("\nDiagnostic completed.")

if __name__ == "__main__":
    main()