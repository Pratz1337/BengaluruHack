// pages/index.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Head from 'next/head';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
  language?: string;
  original_text?: string;
  english_text?: string;
}

// List of supported languages for the dropdown
const LANGUAGES = [
  { code: 'en-IN', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' }
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState('en-IN');
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [autoDetect, setAutoDetect] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug logger
  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`]);
    console.log(message);
  };

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to the Socket.io server
  useEffect(() => {
    // For GitHub Codespaces: Use the hostname from window.location
    const hostname = window.location.hostname;
    const serverUrl = `https://${hostname.replace('3000', '8000')}`;
    addLog(`Connecting to server at: ${serverUrl}`);
    
    const newSocket = io(serverUrl, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    newSocket.on('connect', () => {
      addLog('Connected to server!');
      setIsConnected(true);
      newSocket.emit('get_chat_history');
    });

    newSocket.on('disconnect', () => {
      addLog('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      addLog(`Connection error: ${error.message}`);
      setIsConnected(false);
    });

    newSocket.on('chat_history', (history: Message[]) => {
      addLog(`Received chat history: ${history.length} messages`);
      setMessages(history);
    });

    newSocket.on('detected_language', (data: { language: string }) => {
      addLog(`Detected language: ${data.language}`);
      setDetectedLanguage(data.language);
    });

    newSocket.on('response', (data) => {
      addLog(`Received response in language: ${data.language}`);
      
      // Add the assistant's message to the chat
      setMessages(prev => [
        ...prev, 
        { 
          text: data.text, 
          isUser: false, 
          timestamp: data.timestamp,
          language: data.language,
          original_text: data.original_text,
          english_text: data.english_text
        }
      ]);
      
      // Play the audio response
      if (data.audio && audioRef.current) {
        const audio = audioRef.current;
        audio.src = `data:audio/wav;base64,${data.audio}`;
        audio.play();
        setIsPlaying(true);
      }
    });

    newSocket.on('error', (data) => {
      addLog(`Server error: ${data.message}`);
      alert(`Error: ${data.message}`);
    });

    newSocket.on('status', (data) => {
      addLog(`Status update: ${JSON.stringify(data)}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle audio playback state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, []);

  // Update messages when user sends a message
  const addUserMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        text,
        isUser: true,
        timestamp: new Date().toISOString(),
        language: autoDetect ? detectedLanguage : selectedLanguage
      }
    ]);
  };

  // Start recording function
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        addLog('Recording stopped, processing audio...');
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        addUserMessage("Recording completed. Processing...");
        await sendAudioMessage(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      addLog('Recording started');
    } catch (error) {
      addLog(`Error accessing microphone: ${error}`);
      alert('Could not access the microphone. Please check your permissions.');
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      addLog('Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks from the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Send audio message to server
  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!socket || !socket.connected) {
      addLog('Socket not connected');
      alert('Not connected to server. Please refresh and try again.');
      return;
    }
    
    addLog('Converting audio blob to base64...');
    
    try {
      const reader = new FileReader();
      
      // Create a promise to handle the FileReader async operation
      const readerPromise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64data = reader.result as string;
            // Remove the data URL prefix
            const base64Audio = base64data.split(',')[1];
            resolve(base64Audio);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await readerPromise;
      addLog(`Audio converted to base64, length: ${base64Audio.length}`);
      
      // Update UI to show we're sending
      setMessages(prev => {
        const newMessages = [...prev];
        // Replace the "processing" message with "sending to server"
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].isUser) {
          newMessages[newMessages.length - 1].text = "Sending your message to server...";
        }
        return newMessages;
      });
      
      // Add debug log before sending
      addLog(`Sending audio with language setting: ${autoDetect ? 'auto-detect' : selectedLanguage}`);
      
      // Send the audio data to the server
      socket.emit('audio_message', {
        audio: base64Audio,
        auto_detect: autoDetect,
        language: autoDetect ? 'auto' : selectedLanguage
      });
      
      addLog('Audio sent to server');
    } catch (error) {
      addLog(`Error processing audio: ${error}`);
      alert('Error processing audio. Please try again.');
    }
  };

  // Toggle auto language detection
  const toggleAutoDetect = () => {
    setAutoDetect(!autoDetect);
  };

  // Handle language selection change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>Multilingual Financial Assistant</title>
        <meta name="description" content="Voice-based financial assistant that can understand and speak multiple languages" />
      </Head>

      <main className="flex-grow container mx-auto p-4 flex flex-col max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-4">Multilingual Financial Assistant</h1>
        
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected to server ✓' : 'Disconnected from server ✗'}
            </p>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoDetect"
                checked={autoDetect}
                onChange={toggleAutoDetect}
                className="mr-2"
              />
              <label htmlFor="autoDetect" className="text-sm">Auto-detect language</label>
            </div>
          </div>
          
          {autoDetect ? (
            <div className="text-sm bg-blue-50 p-2 rounded">
              <p>Auto detection active</p>
              {detectedLanguage && (
                <p className="font-semibold">Detected: {LANGUAGES.find(l => l.code === detectedLanguage)?.name || detectedLanguage}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <label htmlFor="language" className="mr-2 text-sm">Language:</label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="border rounded p-1 text-sm"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="flex-grow bg-white rounded-lg shadow-md p-4 mb-4 overflow-y-auto h-96 flex flex-col">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center">
              Start by asking a question about finance in any language
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    message.isUser 
                      ? 'bg-blue-100 ml-auto max-w-[80%]' 
                      : 'bg-gray-100 mr-auto max-w-[80%]'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.language && (
                    <p className="text-xs text-gray-500 mt-1">
                      Language: {LANGUAGES.find(l => l.code === message.language)?.name || message.language}
                    </p>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 flex justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isPlaying || !isConnected}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isRecording 
                ? 'bg-red-500 text-white' 
                : isPlaying 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : !isConnected
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white'
            }`}
          >
            {isRecording ? (
              <span className="w-4 h-4 bg-white rounded-sm"></span> // Stop icon
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          <audio ref={audioRef} className="hidden" />
        </div>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          {!isConnected
            ? "Not connected to server. Please refresh the page."
            : isRecording 
              ? "Recording... Click the button to stop." 
              : isPlaying 
                ? "Playing response..." 
                : "Click the microphone button to start speaking"}
        </p>
        
        {/* Debug section - Toggle with button */}
        <div className="mt-4">
          <button 
            onClick={() => {
              const debugElement = document.getElementById('debugSection');
              if (debugElement) {
                debugElement.classList.toggle('hidden');
              }
            }}
            className="text-xs text-gray-500 underline"
          >
            Toggle Debug Info
          </button>
          <div id="debugSection" className="hidden mt-2 bg-gray-100 p-2 rounded text-xs text-gray-600 max-h-40 overflow-y-auto">
            <h3 className="font-bold">Debug Logs:</h3>
            {debugLogs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">{log}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}