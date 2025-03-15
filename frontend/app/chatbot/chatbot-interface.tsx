"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { type Socket, io } from "socket.io-client"
import { AnimatePresence, motion } from "framer-motion"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import {
  ArrowUpCircle,
  FileText,
  Download,
  Lightbulb,
  Mic,
  MicOff,
  MessageSquareText,
  ChevronRight,
  CircleDollarSign,
  Calculator,
  Upload,
  Languages,
  Sun,
  Moon,
  Menu,
  Sparkles,
  LayoutDashboard,
  Clock,
  RefreshCw,
  LogOut,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { TypingIndicator } from "@/components/typing-indicator"
import { useAuth } from "@/components/auth/auth-provider"

// Environment variable with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

// Message interface
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
  toolCall?: {
    type: string
    events: any[]
  }
  options?: string[]
  dropdown_items?: string[]
  link?: string
  source?: string
  similarity?: number
  language?: string
  original_text?: string
  english_text?: string
}

// Language options
const languages = [
  { code: "en", name: "English", voice_code: "en-IN" },
  { code: "hi", name: "हिंदी", voice_code: "hi-IN" },
  { code: "ta", name: "தமிழ்", voice_code: "ta-IN" },
  { code: "te", name: "తెలుగు", voice_code: "te-IN" },
  { code: "bn", name: "বাংলা", voice_code: "bn-IN" },
  { code: "mr", name: "मराठी", voice_code: "mr-IN" },
  { code: "kn", name: "ಕನ್ನಡ", voice_code: "kn-IN" },
  { code: "ml", name: "മലയാളം", voice_code: "ml-IN" },
  { code: "gu", name: "ગુજરાતી", voice_code: "gu-IN" },
]

// Loan info interface
interface LoanInfo {
  loan_type: string
  interest_rate: string
  eligibility: string
  repayment_options: string
  additional_info: string
  result?: string
}

export default function ChatbotInterface() {
  // Auth hook
  const { user, signOut } = useAuth()

  // State hooks
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello${user?.displayName ? ` ${user.displayName}` : ""}! I'm FinMate, your multilingual loan advisor. How can I help you today with loans, financial advice, or eligibility checks?`,
      timestamp: new Date(),
      options: ["Check loan eligibility", "Personal loan information", "Financial tips"],
    },
  ])
  const [input, setInput] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [language, setLanguage] = useState("en")
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentInfo, setDocumentInfo] = useState<any>(null)
  const [sessionId, setSessionId] = useState("")
  const [loanInfo, setLoanInfo] = useState<LoanInfo>({
    loan_type: "",
    interest_rate: "",
    eligibility: "",
    repayment_options: "",
    additional_info: "",
  })
  const [interestRates, setInterestRates] = useState<any[]>([])
  const [recentQueries, setRecentQueries] = useState<
    { id: string; query: string; loan_type: string; hours_ago: number }[]
  >([])
  const [financialTips, setFinancialTips] = useState<string[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [isInConversation, setIsInConversation] = useState(false)
  const [isVoiceServerAvailable, setIsVoiceServerAvailable] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const silenceDetectorRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const lastAudioLevelRef = useRef<number>(0)
  const isSpeakingRef = useRef<boolean>(false)

  // Use theme hook
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === "dark"

  // Debug logger
  const addLog = (message: string) => {
    setDebugLogs((prev) => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`])
    console.log(message)
  }

  // Connect to websocket on component mount
  useEffect(() => {
    // Generate a session ID
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    setSessionId(newSessionId)

    // Connect to WebSocket
    console.log(`Connecting to server at: ${API_URL}`)

    try {
      const socket = io(API_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
      })

      socket.on("connect", () => {
        console.log("Connected to server")
        setIsConnected(true)
        socketRef.current = socket
        toast.success("Connected to FinMate advisor")

        // Check if voice API is supported
        socket.emit("check_voice_support")
      })

      // Add this line to listen for audio responses
      socket.on("audio_response", handleSocketResponse)

      // You already have this line for text responses
      socket.on("response", handleSocketResponse)

      socket.on("voice_support", (supported) => {
        setIsVoiceServerAvailable(!!supported)
        console.log(`Voice support: ${supported ? "Available" : "Unavailable"}`)
      })

      socket.on("disconnect", () => {
        console.log("Disconnected from server")
        setIsConnected(false)
        toast.error("Disconnected from server. Trying to reconnect...")
      })

      socket.on("connect_error", (error) => {
        console.error("Connection error:", error)
        setIsConnected(false)
        toast.error("Connection error. Trying to reconnect...")
      })

      socketRef.current = socket
    } catch (error) {
      console.error("Error connecting to WebSocket:", error)
      toast.error("Failed to connect to server")
    }

    // Fetch sidebar data
    fetchSidebarData()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onplay = () => {
        setIsPlaying(true)
        // Stop recording while the AI is speaking
        if (isRecording) {
          stopVoiceChat()
        }
      }

      audioRef.current.onended = () => {
        setIsPlaying(false)

        // Auto-restart voice chat if we're in conversation mode
        if (isInConversation && isVoiceMode) {
          addLog("AI finished speaking, auto-reactivating microphone")
          setTimeout(() => {
            startVoiceChat()
          }, 500)
        }
      }
    }

    return () => {
      stopVoiceChat()
    }
  }, [isInConversation, isVoiceMode])

  // Handle Socket.io response
  const handleSocketResponse = (data: any) => {
    console.log("Received response:", data)
    setIsBotTyping(false)

    // Add the assistant's message to the chat
    if (data.text || (data.res && data.res.msg)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.text || (data.res && data.res.msg) || "I couldn't process that request",
          timestamp: new Date(data.timestamp || Date.now()),
          language: data.language,
          original_text: data.original_text,
          english_text: data.english_text,
          toolCall: data.res?.toolCall,
          options: data.info?.options || [],
          dropdown_items: data.info?.dropdown_items || [],
          link: data.info?.link || "",
          source: data.res?.source || "",
          similarity: data.res?.similarity || null,
        },
      ])
    }

    // Play the audio response if available
    if (data.audio && audioRef.current) {
      const audio = audioRef.current
      audio.src = `data:audio/wav;base64,${data.audio}`
      audio.play()
      setIsPlaying(true)
    }

    // Update loan information if available
    if (data.info) {
      const newLoanInfo = {
        loan_type: data.info.loan_type || loanInfo.loan_type,
        interest_rate: data.info.interest_rate || loanInfo.interest_rate,
        eligibility: data.info.eligibility || loanInfo.eligibility,
        repayment_options: data.info.repayment_options || loanInfo.repayment_options,
        additional_info: data.info.additional_info || loanInfo.additional_info,
        result: data.info.result || loanInfo.result,
      }
      setLoanInfo(newLoanInfo)
    }
  }

  // Fetch sidebar data
  const fetchSidebarData = async () => {
    setIsFetchingData(true)
    try {
      // Fetch interest rates
      const ratesResponse = await fetch(`${API_URL}/interest-rates`)
      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json()
        setInterestRates(ratesData)
      }

      // Fetch recent queries
      const queriesResponse = await fetch(`${API_URL}/recent-queries`)
      if (queriesResponse.ok) {
        const queriesData = await queriesResponse.json()
        setRecentQueries(queriesData)
      }

      // Fetch financial tips
      const tipsResponse = await fetch(`${API_URL}/financial-tips`)
      if (tipsResponse.ok) {
        const tipsData = await tipsResponse.json()
        setFinancialTips(tipsData)
      }
    } catch (error) {
      console.error("Error fetching sidebar data:", error)
    } finally {
      setIsFetchingData(false)
    }
  }

  // Scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Send message to server
  const sendMessage = (message: string) => {
    if (!message.trim()) return

    if (!socketRef.current || !isConnected) {
      toast.error("Not connected to server. Please wait...")
      return
    }

    // Add user message to state
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
      language: language,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsBotTyping(true)

    // Send message to server
    socketRef.current.emit("send_message", {
      msg: message,
      id: sessionId,
      language: autoDetectLanguage ? "auto" : language,
      auto_detect: autoDetectLanguage,
      user_id: user?.uid || null,
      user_name: user?.displayName || null,
    })
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDocumentFile(file)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("chat_id", sessionId)

    try {
      setIsFetchingData(true)
      const response = await fetch(`${API_URL}/upload-document`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setDocumentInfo(data)
        toast.success(`Document processed: ${file.name}`)

        // Add a message about the document
        const content = `I've analyzed your document: ${file.name}. ${data.document_summary || ""}`

        setMessages((prev) => [
          ...prev,
          {
            id: `doc-${Date.now()}`,
            role: "assistant",
            content,
            timestamp: new Date(),
          },
        ])
      } else {
        toast.error(`Failed to process document: ${data.error}`)
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      toast.error("Error uploading document")
    } finally {
      setIsFetchingData(false)
    }
  }

  // Download conversation summary
  const downloadSummary = async () => {
    if (messages.length < 2) {
      toast.error("Not enough conversation to generate a summary")
      return
    }

    try {
      setIsFetchingData(true)

      // Format messages for summary generation
      const formattedMessages = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((message) => ({
          user: message.role === "user" ? message.content : "",
          bot: message.role === "assistant" ? message.content : "",
        }))
        .filter((msg) => msg.user || msg.bot)

      // Add timestamp to prevent CORS caching issues
      const timestamp = Date.now()

      // Generate summary
      const response = await fetch(`${API_URL}/generate-summary?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ conversation: formattedMessages }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Download summary as PDF
      const downloadResponse = await fetch(`${API_URL}/download-summary?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
        body: JSON.stringify({ summary: data.summary }),
      })

      if (!downloadResponse.ok) {
        throw new Error(`HTTP error! status: ${downloadResponse.status}`)
      }

      // Rest of the function remains the same
      const blob = await downloadResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `FinMate_Summary_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()

      toast.success("Summary downloaded successfully")
    } catch (error) {
      console.error("Error downloading summary:", error)
      toast.error(`Error downloading summary: ${error}`)
    } finally {
      setIsFetchingData(false)
    }
  }

  // Toggle voice mode
  const handleToggleVoiceMode = () => {
    if (isVoiceMode) {
      stopVoiceChat()
      setIsInConversation(false)
    } else {
      // Try to start voice chat, but handle failure gracefully
      try {
        startVoiceChat()
        setIsInConversation(true)
        toast.success("Voice mode activated")
      } catch (err) {
        console.error("Failed to start voice mode:", err)
        toast.error("Voice mode unavailable - please try again later")
        setIsVoiceMode(false)
        return
      }
    }
    setIsVoiceMode(!isVoiceMode)
  }

  // Start voice chat
  const startVoiceChat = async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support voice recording")
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio context for analyzing audio levels
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Start the media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      // Reset audio chunks
      audioChunksRef.current = []

      // Set up media recorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Start recorder
      mediaRecorder.start(100) // Collect data in 100ms chunks
      setIsRecording(true)
      addLog("Started voice recording")

      // Start silence detection
      startSilenceDetection(analyser, dataArray)
    } catch (error) {
      addLog(`Error starting voice chat: ${error}`)
      toast.error(`Could not access microphone: ${error}`)
      throw error // Rethrow to allow caller to handle it
    }
  }

  // Start silence detection
  const startSilenceDetection = (analyser: AnalyserNode, dataArray: Uint8Array) => {
    // Clear any existing detector
    if (silenceDetectorRef.current) {
      clearInterval(silenceDetectorRef.current)
    }

    // Initialize silence timer
    silenceStartRef.current = null

    // Start detecting silence
    silenceDetectorRef.current = setInterval(() => {
      // Get current audio data
      analyser.getByteFrequencyData(dataArray)

      // Calculate average volume
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const averageVolume = sum / dataArray.length
      lastAudioLevelRef.current = averageVolume

      // Detect if user is speaking (adjust threshold as needed)
      const isSpeaking = averageVolume > 15 // Adjust threshold based on testing

      // Display speaking state on UI for debugging
      if (isSpeaking !== isSpeakingRef.current) {
        isSpeakingRef.current = isSpeaking
        setIsSpeaking(isSpeaking)
        addLog(`User ${isSpeaking ? "started" : "stopped"} speaking. Audio level: ${averageVolume.toFixed(2)}`)
      }

      // If not speaking, check for extended silence
      if (!isSpeaking) {
        if (silenceStartRef.current === null) {
          silenceStartRef.current = Date.now()
        } else {
          const silenceDuration = Date.now() - silenceStartRef.current

          // If silent for 3 seconds, process the audio
          if (silenceDuration >= 3000 && audioChunksRef.current.length > 0) {
            addLog(`3 seconds of silence detected - processing audio`)
            processRecordedAudio()
          }
        }
      } else {
        // Reset silence timer if user is speaking
        silenceStartRef.current = null
      }
    }, 200) // Check every 200ms
  }

  // Process recorded audio
  const processRecordedAudio = async () => {
    if (!mediaRecorderRef.current || audioChunksRef.current.length === 0) return

    // Stop the recorder
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
    }

    // Stop silence detection
    if (silenceDetectorRef.current) {
      clearInterval(silenceDetectorRef.current)
    }

    // Create blob from audio chunks
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })

    // Add a processing message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: "Processing your voice message...",
        timestamp: new Date(),
      },
    ])

    // Convert to base64
    const reader = new FileReader()
    reader.onload = async (event) => {
      if (event.target && event.target.result) {
        // Get base64 audio
        const base64Audio = (event.target.result as string).split(",")[1]

        // Send to server
        if (socketRef.current && socketRef.current.connected) {
          addLog(`Sending audio to server - length: ${base64Audio.length}`)

          // Update the processing message
          setMessages((prev) => {
            const newMessages = [...prev]
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "user") {
              newMessages[newMessages.length - 1].content = "Sending your voice message..."
            }
            return newMessages
          })

          socketRef.current.emit("audio_message", {
            audio: base64Audio,
            language: autoDetectLanguage ? "auto" : language,
            auto_detect: autoDetectLanguage,
            id: sessionId,
            user_id: user?.uid || null,
            user_name: user?.displayName || null,
          })

          // Reset for next recording
          audioChunksRef.current = []
          setIsRecording(false)
        }
      }
    }
    reader.readAsDataURL(audioBlob)
  }

  // Stop voice chat
  const stopVoiceChat = () => {
    // Stop media recorder
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }

      // Stop all tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      }
    }

    // Stop silence detection
    if (silenceDetectorRef.current) {
      clearInterval(silenceDetectorRef.current)
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setIsRecording(false)
    addLog("Voice chat stopped")
  }

  // Handle option click
  const handleOptionClick = (option: string) => {
    sendMessage(option)
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Handle keyboard submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
      // Auth guard will redirect to landing page
    } catch (error) {
      toast.error("Error signing out")
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md p-3 md:p-4">
        <div className="container max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white bg-opacity-20">
              <CircleDollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">FinMate</h1>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"} mr-2`}></div>
                <p className="text-xs text-white">{isConnected ? "Connected" : "Disconnecting..."}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* User info */}
            {user && (
              <div className="hidden md:flex items-center mr-2">
                <div className="bg-white bg-opacity-20 rounded-full p-1 mr-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL || "/placeholder.svg"}
                      alt={user.displayName || "User"}
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-800 flex items-center justify-center text-white text-sm">
                      {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <span className="text-white text-sm hidden lg:inline-block">
                  {user.displayName || user.email || "User"}
                </span>
              </div>
            )}

            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white hover:bg-opacity-10">
                  <Languages className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setAutoDetectLanguage(true)}
                  className={autoDetectLanguage ? "bg-muted" : ""}
                >
                  Auto-detect language
                  {autoDetectLanguage && <ChevronRight className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setAutoDetectLanguage(false)
                    }}
                    className={language === lang.code && !autoDetectLanguage ? "bg-muted" : ""}
                  >
                    {lang.name}
                    {language === lang.code && !autoDetectLanguage && <ChevronRight className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-white hover:bg-white hover:bg-opacity-10"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Voice mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleVoiceMode}
              disabled={!isVoiceServerAvailable}
              title={isVoiceServerAvailable ? "Toggle voice mode" : "Voice mode unavailable"}
              className="text-white hover:bg-white hover:bg-opacity-10"
            >
              {isVoiceMode ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            {/* Sign out button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-white hover:bg-white hover:bg-opacity-10"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            {/* Mobile drawer trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white hover:bg-opacity-10 md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw]">
                <div className="flex flex-col">
                  {/* User info in mobile menu */}
                  {user && (
                    <div className="flex items-center mb-4 pb-4 border-b">
                      <div className="bg-muted rounded-full p-1 mr-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL || "/placeholder.svg"}
                            alt={user.displayName || "User"}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                            {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.displayName || "User"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  )}

                  <h2 className="text-lg font-semibold py-4">Financial Information</h2>

                  <Tabs defaultValue="info" className="flex-1">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="info">Loan Info</TabsTrigger>
                      <TabsTrigger value="rates">Rates</TabsTrigger>
                      <TabsTrigger value="tips">Tips</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4 overflow-auto">
                      {loanInfo.loan_type ? (
                        <div className="space-y-4">
                          <Card>
                            <CardHeader className="py-2">
                              <CardTitle>Loan Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{loanInfo.loan_type}</p>
                            </CardContent>
                          </Card>

                          {loanInfo.interest_rate && (
                            <Card>
                              <CardHeader className="py-2">
                                <CardTitle>Interest Rate</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p>{loanInfo.interest_rate}</p>
                              </CardContent>
                            </Card>
                          )}

                          {loanInfo.eligibility && (
                            <Card>
                              <CardHeader className="py-2">
                                <CardTitle>Eligibility</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ReactMarkdown>{loanInfo.eligibility}</ReactMarkdown>
                              </CardContent>
                            </Card>
                          )}

                          {loanInfo.repayment_options && (
                            <Card>
                              <CardHeader className="py-2">
                                <CardTitle>Repayment Options</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ReactMarkdown>{loanInfo.repayment_options}</ReactMarkdown>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquareText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                          <p>No loan information available yet</p>
                          <p className="text-sm">Ask about specific loans to see details here</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="rates" className="overflow-auto">
                      <div className="space-y-4">
                        {interestRates.length > 0 ? (
                          interestRates.map((rate, index) => (
                            <Card key={index}>
                              <CardHeader className="py-2">
                                <CardTitle className="capitalize">{rate.loan_type.replace("_", " ")}</CardTitle>
                              </CardHeader>
                              <CardContent className="pb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span>Min</span>
                                  <span>Max</span>
                                </div>
                                <div className="relative h-7 w-full bg-muted rounded-lg">
                                  <div
                                    className="absolute h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg opacity-80"
                                    style={{ width: "100%" }}
                                  ></div>
                                  <div className="absolute inset-0 flex justify-between items-center px-2">
                                    <Badge variant="secondary">{rate.min_rate}%</Badge>
                                    <Badge variant="secondary">{rate.max_rate}%</Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            {isFetchingData ? (
                              <div className="flex flex-col items-center">
                                <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-30" />
                                <p>Fetching interest rates...</p>
                              </div>
                            ) : (
                              <>
                                <Calculator className="mx-auto h-12 w-12 opacity-20 mb-2" />
                                <p>Interest rate data unavailable</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="tips" className="overflow-auto">
                      <div className="space-y-4">
                        {financialTips.length > 0 ? (
                          financialTips.map((tip, index) => (
                            <Card key={index}>
                              <CardContent className="pt-6">
                                <div className="flex">
                                  <div className="mr-4 mt-0.5">
                                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                                  </div>
                                  <p>{tip}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            {isFetchingData ? (
                              <div className="flex flex-col items-center">
                                <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-30" />
                                <p>Loading financial tips...</p>
                              </div>
                            ) : (
                              <>
                                <Lightbulb className="mx-auto h-12 w-12 opacity-20 mb-2" />
                                <p>No financial tips available</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="mt-6 space-y-3">
                    <Button
                      onClick={() => {
                        fileInputRef.current?.click()
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      <Upload className="mr-2 h-4 w-4" /> Upload Document
                    </Button>

                    <Button onClick={downloadSummary} className="w-full" variant="outline">
                      <Download className="mr-2 h-4 w-4" /> Download Summary
                    </Button>

                    <Button onClick={handleSignOut} className="w-full" variant="outline">
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.csv"
                      className="hidden"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat messages area */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative max-w-[85%] md:max-w-[70%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-indigo-600 text-white" : "bg-muted/70"
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="px-1">
                        <ReactMarkdown className="prose dark:prose-invert prose-sm max-w-none break-words">
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {message.options && message.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.options.map((option) => (
                            <Button
                              key={option}
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOptionClick(option)}
                              className="text-xs"
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      )}

                      {message.link && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs w-fit"
                          onClick={() => window.open(message.link, "_blank", "noopener,noreferrer")}
                        >
                          <FileText className="mr-2 h-3 w-3" />
                          View Official Document
                        </Button>
                      )}

                      <div className="text-xs opacity-60 mt-1 text-right">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isBotTyping && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="max-w-[85%] md:max-w-[70%] rounded-lg p-4 bg-muted/70">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2 max-w-4xl mx-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fileInputRef.current?.click()
                }}
                title="Upload document"
              >
                <Upload className="h-4 w-4" />
              </Button>

              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isConnected ? "Type your message..." : "Connecting..."}
                  disabled={!isConnected}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  disabled={!isConnected || !input.trim()}
                  onClick={() => sendMessage(input)}
                >
                  <ArrowUpCircle className="h-5 w-5" />
                </Button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.csv"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-80 lg:w-96 border-l overflow-y-auto">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-indigo-600" />
                Financial Dashboard
              </h2>
            </div>

            <Tabs defaultValue="info" className="flex-1">
              <TabsList className="grid grid-cols-3 ">
                <TabsTrigger value="info">Loan Info</TabsTrigger>
                <TabsTrigger value="rates">Rates</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="p-4 space-y-4 overflow-auto">
                {loanInfo.loan_type ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle>Loan Type</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{loanInfo.loan_type}</p>
                      </CardContent>
                    </Card>

                    {loanInfo.interest_rate && (
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle>Interest Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{loanInfo.interest_rate}</p>
                        </CardContent>
                      </Card>
                    )}

                    {loanInfo.eligibility && (
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle>Eligibility</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ReactMarkdown>{loanInfo.eligibility}</ReactMarkdown>
                        </CardContent>
                      </Card>
                    )}

                    {loanInfo.repayment_options && (
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle>Repayment Options</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ReactMarkdown>{loanInfo.repayment_options}</ReactMarkdown>
                        </CardContent>
                      </Card>
                    )}

                    {loanInfo.additional_info && (
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ReactMarkdown>{loanInfo.additional_info}</ReactMarkdown>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <LayoutDashboard className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>No loan information available yet</p>
                    <p className="text-sm">Ask about specific loans to see details here</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rates" className="p-4 overflow-auto">
                <div className="space-y-4">
                  {interestRates.length > 0 ? (
                    interestRates.map((rate, index) => (
                      <Card key={index}>
                        <CardHeader className="py-3">
                          <CardTitle className="capitalize">{rate.loan_type.replace("_", " ")}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span>Min</span>
                            <span>Max</span>
                          </div>
                          <div className="relative h-9 w-full bg-muted rounded-lg">
                            <div
                              className="absolute h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg opacity-80"
                              style={{ width: "100%" }}
                            ></div>
                            <div className="absolute inset-0 flex justify-between items-center px-3">
                              <Badge variant="secondary">{rate.min_rate}%</Badge>
                              <Badge variant="secondary">{rate.max_rate}%</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {isFetchingData ? (
                        <div className="flex flex-col items-center">
                          <RefreshCw className="h-10 w-10 animate-spin mb-4 opacity-30" />
                          <p>Fetching interest rates...</p>
                        </div>
                      ) : (
                        <>
                          <Calculator className="mx-auto h-12 w-12 opacity-20 mb-2" />
                          <p>Interest rate data unavailable</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="p-4 overflow-auto">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Recent Queries
                      </CardTitle>
                      <CardDescription>Recently asked loan questions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentQueries.length > 0 ? (
                        <div className="space-y-3">
                          {recentQueries.map((query) => (
                            <div key={query.id} className="flex items-start space-x-2 pb-3 border-b last:border-0">
                              <MessageSquareText className="h-4 w-4 mt-1 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="text-sm">{query.query}</p>
                                <div className="flex items-center mt-1">
                                  <Badge variant="outline" className="text-xs mr-2">
                                    {query.loan_type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {query.hours_ago < 1 ? "Just now" : `${Math.floor(query.hours_ago)}h ago`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          {isFetchingData ? (
                            <div className="flex justify-center">
                              <RefreshCw className="h-5 w-5 animate-spin opacity-30" />
                            </div>
                          ) : (
                            <p className="text-sm">No recent queries</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center">
                        <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                        Financial Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {financialTips.length > 0 ? (
                        <div className="space-y-3">
                          {financialTips.map((tip, index) => (
                            <div key={index} className="flex">
                              <div className="mr-3 mt-0.5">
                                <span className="flex h-2 w-2 bg-indigo-600 rounded-full"></span>
                              </div>
                              <p className="text-sm">{tip}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          {isFetchingData ? (
                            <div className="flex justify-center">
                              <RefreshCw className="h-5 w-5 animate-spin opacity-30" />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm">No tips available</p>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="p-4 border-t space-y-3 mt-auto">
              <Button
                onClick={() => {
                  fileInputRef.current?.click()
                }}
                className="w-full"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Document
              </Button>

              <Button onClick={downloadSummary} className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" /> Download Summary
              </Button>

              <Button onClick={handleSignOut} className="w-full" variant="outline">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice mode content */}
      {isVoiceMode && (
        <Drawer open={true} onOpenChange={setIsVoiceMode}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Voice Mode</DrawerTitle>
              <DrawerDescription>Speak to your financial advisor</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 text-center">
              <div
                className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                  isRecording
                    ? "bg-red-100 dark:bg-red-900 animate-pulse"
                    : isPlaying
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "bg-indigo-100 dark:bg-indigo-950"
                }`}
              >
                {isRecording ? (
                  <Mic className="h-10 w-10 text-red-600 dark:text-red-400" />
                ) : isPlaying ? (
                  <MessageSquareText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Mic className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>

              <div className="flex items-center justify-center mb-4">
                <div className={`w-3 h-3 rounded-full mr-2 ${isSpeaking ? "bg-green-500" : "bg-gray-300"}`}></div>
                <span className="text-sm">
                  {isRecording
                    ? isSpeaking
                      ? "I can hear you speaking"
                      : "Listening for your voice..."
                    : isPlaying
                      ? "AI is speaking"
                      : "Ready to listen"}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoDetectLanguage"
                    checked={autoDetectLanguage}
                    onChange={() => setAutoDetectLanguage(!autoDetectLanguage)}
                    className="mr-1"
                  />
                  <label htmlFor="autoDetectLanguage" className="text-sm">
                    Auto-detect language
                  </label>
                </div>

                {!autoDetectLanguage && (
                  <div className="flex justify-center">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="border rounded p-1 text-sm"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-center space-x-3">
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopVoiceChat : startVoiceChat}
                    disabled={isPlaying}
                    className="flex items-center"
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" /> Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" /> Start Recording
                      </>
                    )}
                  </Button>

                  <Button variant="outline" onClick={() => setIsVoiceMode(false)}>
                    Switch to Text Mode
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-xs text-muted-foreground"
                >
                  Show Debug Info
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Debug section - Toggle with button */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Debug Information</DrawerTitle>
            <DrawerDescription>Technical details about the voice processing</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isSpeaking ? "bg-green-500" : "bg-gray-300"}`}></div>
                <span className="text-sm">{isSpeaking ? "Speaking detected" : "Silence detected"}</span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isPlaying ? "bg-blue-500" : "bg-gray-300"}`}></div>
                <span className="text-sm">{isPlaying ? "AI is speaking" : "AI is silent"}</span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? "bg-red-500" : "bg-gray-300"}`}></div>
                <span className="text-sm">{isRecording ? "Recording active" : "Recording inactive"}</span>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Debug Logs:</h3>
                <div className="bg-muted p-2 rounded text-xs space-y-1 max-h-60 overflow-y-auto">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

