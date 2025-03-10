'use client'

import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { Send, X, Trash2, ChevronRight, ChevronLeft, FileText } from 'lucide-react'
import { Button } from "@nextui-org/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip } from "@nextui-org/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

export default function ChatbotEmbed() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      content: "Hello! I'm Edumitra, your educational assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [ws, setWs] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socket = io(process.env.API_URL || "http://localhost:5000", { 
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      rejectUnauthorized: false // Add this line to bypass SSL verification
    })

    socket.on("connect", () => {
      console.log("Connected to server")
      setWs(socket)
      setIsConnected(true)
      setChatId(Date.now().toString())
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from server")
      setIsConnected(false)
    })

    socket.on("response", (data) => {
      console.log("Received response:", data)
      setIsTyping(false)
      if (data && data.res && data.res.msg) {
        setMessages(prev => [...prev, { 
          sender: "bot", 
          content: data.res.msg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
      }
    })

    socket.on("connect_error", (error) => {
      console.log("Connection error:", error)
      setIsConnected(false)
    })

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (input.trim() && ws && isConnected) {
      const messageData = {
        id: chatId,
        msg: input,
        messages: messages.map(m => ({
          sender: m.sender,
          content: m.content
        }))
      }
      console.log("Sending message:", messageData)
      ws.emit("send_message", messageData)
      setMessages(prev => [...prev, { 
        sender: "user", 
        content: input,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setInput('')
      setIsTyping(true)
    }
  }

  const handleClose = () => {
    if (window.parent) {
      window.parent.postMessage('close-chat', '*');
    }
  }

  const handleClearChat = () => {
    setMessages([{
      sender: "bot",
      content: "Chat cleared. How can I assist you?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
  }

  const handleGenerateSummary = async () => {
    if (messages.length < 2) {
        alert("Not enough conversation to generate a summary.");
        return;
    }
    setIsGeneratingSummary(true);
    try {
        console.log("Sending request to generate summary");
        const response = await fetch(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/generate-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                conversation: messages.map(msg => ({
                    user: msg.sender === 'user' ? msg.content : '',
                    bot: msg.sender === 'bot' ? msg.content : ''
                }))
            }),
            mode: 'cors', // Explicitly specify CORS mode
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to generate summary: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        console.log("Summary generated:", data);

        const downloadResponse = await fetch(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/download-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ summary: data.summary }),
            mode: 'cors',
        });

        if (!downloadResponse.ok) {
            const errorText = await downloadResponse.text();
            throw new Error(`Failed to download summary: ${downloadResponse.status} ${errorText}`);
        }
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "chat_summary.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('Error generating summary:', error);
        alert('Failed to generate summary. Please try again.');
    } finally {
        setIsGeneratingSummary(false);
    }
};


  return (
    <Card className="w-full z-[100000px] h-full max-w-md mx-auto flex flex-col rounded-t-3xl  bg-white dark:bg-gray-800">
      <CardHeader className="border-b relative rounded-t-3xl bg-rose-500  text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">            
          <Link href='/chatbot' target='_blank' className=" hover:underline">
            EduMitra Chatbot
          </Link>
          </CardTitle>
          
        </div>
          <Button
            variant="light"
            isIconOnly
          className="absolute top-2 right-2 text-white"
            onClick={handleClose}
          >
          <X className="  rounded-full h-[20px] w-[20px]" />
          </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4 space-y-4">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-400 text-white'
                    : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                }`}
              >
                {msg.sender === 'bot' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
                <span className="text-xs opacity-75">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <div className="border-t p-4 bg-white dark:bg-gray-800">
        <div className="flex space-x-2 mb-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1"
            disabled={!isConnected}
          />
          <Tooltip content="Send message">
            <Button
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
              size="md"
              className=" rounded-full text-black"
            >
              <Send className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Clear chat">
            <Button
              onClick={handleClearChat}
              variant="light"
              className="text-black rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Generate Summary">
            <Button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              variant="light"
              className="text-black rounded-full"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip content={showInfo ? "Hide info" : "Show info"}>
            <Button
              onClick={() => setShowInfo(!showInfo)}
              variant="light"
              className="text-black rounded-full"
            >
              {showInfo ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </Tooltip>
        </div>
        {!isConnected && (
          <p className="text-red-500 text-sm mt-2">
            Disconnected from server. Attempting to reconnect...
          </p>
        )}
      </div>
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-100 dark:bg-gray-700 p-4 border-t"
          >
            <h3 className="font-bold mb-2">About EduMitra</h3>
            <Link href='/chatbot' target='_blank' className="text-blue-500 hover:underline">
              EduMitra
            </Link>
            &nbsp;is your AI-powered educational assistant, designed to help you navigate your academic journey with ease. Ask about courses, colleges, scholarships, and more!
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

