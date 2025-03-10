"use client";
import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
import { Send, GraduationCap, CircleDollarSign, Scissors, Sparkles, Sun, Moon, MicOff, Mic, Heart, Info } from 'lucide-react';
import { Button } from "@nextui-org/button";
import { Socket, io } from "socket.io-client";
import Markdown from "react-markdown";
import Typewriter from "typewriter-effect";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PipecatWebSocketClient from "../voice/PipecatWebSocketClient";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
import { useRouter } from "next/navigation"; // Import useRouter for redirection
//@ts-ignore
import "react-toastify/dist/ReactToastify.css";
import "react-dropdown/style.css";
//@ts-ignore
import { JsonToTable } from "react-json-to-table";
import CollegeComparison from "./CollegeComparison";
import CourseComparison from "./CourseComparison";
import CourseSelectionQuiz from "./CourseSelectionQuiz";
import { TypingIndicator } from '@/components/TypingIndicator';
import { MobileNav } from '@/components/mobile-nav'

function randomIntFromInterval(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function ChatbotPage() {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{
    sender: string;
    content: string;
    toolCall: { type: string; events: any[] };
    options: string[];
    dropdown_items: any[];
    link: string;
    cutoff: Record<string, any>;
    similarity: number | null;
    source: string;
  }>>([
    {
      sender: "bot",
      content: "Hello welcome to EduMitra, Say hello 👋 to get started ",
      toolCall: { type: "none", events: [] },
      options: ["hello", "engineering", "polytechnic"],
      dropdown_items: [],
      link: "",
      cutoff: {},
      similarity: null,
      source: ""
    },
  ]);
  const [input, setInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentID, setCurrentID] = useState(0);
  const [isVoiceBotActive, setIsVoiceBotActive] = useState(false);
  const messagesEndRef = useRef(null);
  const [ws, setWs] = useState<Socket | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const [collegeInfo, setCollegeInfo] = useState({
    name: "",
    course: "",
    fees: "",
    cutoff: "",
    scholarships: "",
    details: "",
  });
  const collegeInfoRef = useRef(collegeInfo);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false); // New state variable
  const router = useRouter(); 

  useEffect(() => {
    // Generate a new session ID each time the page loads
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("sessionId", sessionId);
  
    // Proceed to connect WebSocket
    collegeInfoRef.current = collegeInfo;
    const socket = connectWebSocket();
  
    return () => {
      // Clean up WebSocket connection when component is unmounted
      if (socket) {
        socket.disconnect();
      }
    };
  }, [collegeInfo, isConnected, router]);

  const connectWebSocket = () => {
    const socket = io(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}`, { transports: ["websocket"] });

    socket.on("connect", () => {
      console.log("Connected to server");
      setWs(socket);
      setIsConnecting(false);
      if (!isConnected) {
        toast.success("Connected to server");
        setIsConnected(true); // Set the state to true after showing the message
      }
    });

    socket.on("response", (data) => {
      console.log("Received response:", data);
      setIsBotTyping(false); // Stop the typing indicator
      let newInfo = data.info;
      let oldInfo = collegeInfoRef.current;
      newInfo.name =
        newInfo?.name !== "" &&
        oldInfo?.name !== newInfo?.name &&
        typeof newInfo?.name === "string"
          ? newInfo?.name
          : oldInfo?.name;
      newInfo.course =
        newInfo?.course !== "" &&
        oldInfo?.course !== newInfo?.course &&
        typeof newInfo?.course === "string"
          ? newInfo?.course
          : oldInfo?.course;
      newInfo.fees =
        newInfo?.fees !== "" &&
        oldInfo?.fees !== newInfo?.fees &&
        typeof newInfo?.fees !== undefined
          ? newInfo?.fees
          : oldInfo?.fees;
      newInfo.scholarships =
        newInfo?.scholarships !== "" &&
        oldInfo?.scholarships !== newInfo?.scholarships &&
        typeof newInfo?.scholarships !== undefined
          ? newInfo?.scholarships
          : oldInfo?.scholarships;
      newInfo.cutoff =
        newInfo?.cutoff !== "" &&
        oldInfo?.cutoff !== newInfo?.cutoff &&
        typeof newInfo?.cutoff !== undefined
          ? newInfo?.cutoff
          : oldInfo?.cutoff;
      newInfo.details =
        newInfo?.details !== "" &&
        oldInfo?.details !== newInfo?.details &&
        typeof newInfo?.details === "string"
          ? newInfo?.details
          : oldInfo?.details;

      setCollegeInfo(newInfo);

      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "bot",
          content: data.res.msg,
          toolCall: data.res.toolCall,
          options: newInfo?.options,
          dropdown_items: newInfo?.dropdown_items,
          link: newInfo?.link,
          cutoff: newInfo?.cutoff ? newInfo?.cutoff : {},
          similarity: data.res.similarity,
          source: data.res.source
        },
      ]);
    });

    socket.on("voice_response", (data) => {
      console.log("Received response:", data);
      let newInfo = data.info;
      let oldInfo = collegeInfoRef.current;
      newInfo.name =
        newInfo.name !== "" &&
        oldInfo.name !== newInfo.name &&
        typeof newInfo.name === "string"
          ? newInfo.name
          : oldInfo.name;
      newInfo.course =
        newInfo.course !== "" &&
        oldInfo.course !== newInfo.course &&
        typeof newInfo.course === "string"
          ? newInfo.course
          : oldInfo.course;
      newInfo.fees =
        newInfo.fees !== "" &&
        oldInfo.fees !== newInfo.fees &&
        typeof newInfo.fees !== undefined
          ? newInfo.fees
          : oldInfo.fees;
      newInfo.scholarships =
        newInfo.scholarships !== "" &&
        oldInfo.scholarships !== newInfo.scholarships &&
        typeof newInfo.scholarships !== undefined
          ? newInfo.scholarships
          : oldInfo.scholarships;
      newInfo.cutoff =
        newInfo.cutoff !== "" &&
        oldInfo.cutoff !== newInfo.cutoff &&
        typeof newInfo.cutoff !== undefined
          ? newInfo.cutoff
          : oldInfo.cutoff;
      newInfo.details =
        newInfo.details !== "" &&
        oldInfo.details !== newInfo.details &&
        typeof newInfo.details === "string"
          ? newInfo.details
          : oldInfo.details;

      setCollegeInfo(newInfo);
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "bot",
          content: data.res.msg[0],
          toolCall: data.res.toolCall,
          options: [],
          dropdown_items: [],
          link: "",
          cutoff: {}
        },
        {
          sender: "user",
          content: data.res.msg[1],
          toolCall: data.res.toolCall,
          options: [],
          dropdown_items: [],
          link: "",
          cutoff: {}
        },
      ]);

      // Update maxTickets if available in the response
      if (data.res.toolCall && data.res.toolCall.available_tickets) {
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnecting(false);
      toast.error("Failed to connect. Retrying in 5 seconds...");
      setTimeout(connectWebSocket, 5000);
    });

    return socket;
  };

  useEffect(() => {
    const socket = connectWebSocket();

    return () => {
      socket.off("connect");
      socket.off("response");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    //@ts-ignore
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scrollToBottom = () => {
    //@ts-ignore
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);
  const handleSend = () => {
    if (input.trim()) {
      if (ws && ws.connected) {
        sendMsg(input);
      } else {
        toast.error("Not connected to server. Please wait...");
        connectWebSocket();
      }
    }
  };
  const loadScript = (src: any) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");

      script.src = src;

      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };
  const sendMsg = (ms: string) => {
    if (ws && ws.connected) {
      setIsBotTyping(true); // Start the typing indicator
      console.log(messages)
      if (currentID == 0) setCurrentID(randomIntFromInterval(1, 1000))
      ws.emit("send_message", { msg: ms, id: currentID, messages });
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "user",
          content: ms,
          toolCall: { type: "none", events: [] },
          options: [],
          dropdown_items: [],
          link: "",
          cutoff: {}
        },
      ]);
      setInput("");
    } else {
      console.error("WebSocket is not connected");
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "bot",
          content: "Sorry, I'm having trouble connecting. Please try again in a moment.",
          toolCall: { type: "none", events: [] },
          options: [],
          dropdown_items: [],
          link: "",
          cutoff: {}
        },
      ]);
    }
  };
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const handleOpenComparison = () => {
    setIsComparisonOpen(true);
  };

  const handleCloseComparison = () => {
    setIsComparisonOpen(false);
  }
  const [isCollegeComparisonOpen, setIsCollegeComparisonOpen] = useState(false);
  

  const handleOpenCollegeComparison = () => {
    setIsCollegeComparisonOpen(true);
  };

  const handleCloseCollegeComparison = () => {
    setIsCollegeComparisonOpen(false);
  };
  const handleOpenQuiz = () => setIsQuizOpen(true);
  const handleCloseQuiz = () => setIsQuizOpen(false);
  const downloadSummary = async () => {
    try {
      // Format messages for summary generation
      const formattedMessages = messages.map(message => ({
        user: message.sender === 'user' ? message.content : '',
        bot: message.sender === 'bot' ? message.content : ''
      })).filter(msg => msg.user || msg.bot);
  
      const response = await fetch(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation: formattedMessages
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      // Download the summary as PDF
      const downloadResponse = await fetch(`${process.env.API_URL ? process.env.API_URL : "http://localhost:5000"}/download-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: data.summary
        }),
      });
  
      if (!downloadResponse.ok) {
        throw new Error(`HTTP error! status: ${downloadResponse.status}`);
      }
  
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "edumitra_conversation_summary.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
  
      toast.success("Summary downloaded successfully!");
    } catch (error) {
      console.error("Error downloading summary:", error);
      toast.error("Failed to download summary.");
    }
  };
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleVoiceBot = () => {
    setIsVoiceBotActive(!isVoiceBotActive);
  };

  const options = ["one", "two", "three"];

  const RankTable = ({ data }: { data: any }) => {
    return (
      <table border={1} >
        <thead>
          <tr>
            <th className={`${isDarkMode?'bg-inherit':'text-black'}`}>Department</th>
            <th className={`${isDarkMode?'bg-inherit':'text-black'}`}>Year</th>
            <th className={`${isDarkMode?'bg-inherit':'text-black'}`}>Category</th>
            <th className={`${isDarkMode?'bg-inherit':'text-black'}`}>Opening Rank</th>
            <th className={`${isDarkMode?'bg-inherit':'text-black'}`}>Closing Rank</th>
          </tr>
        </thead>
        <tbody>
          {Object?.keys(data)?.map((department) =>
            Object?.keys(data[department])?.map((year) =>
              Object?.keys(data[department][year])?.map((category) => (
                <tr key={`${department}-${year}-${category}`}>
                  <td>{department}</td>
                  <td>{year}</td>
                  <td>{category}</td>
                  <td>{data[department][year][category][0]}</td>
                  <td>{data[department][year][category][1]}</td>
                </tr>
              ))
            )
          )}
        </tbody>
      </table>
    );
  };

  return (
    <div
      className={`flex h-screen w-full ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } transition-colors duration-500`}
    >
      <div className="flex flex-col w-full max-w-screen-2xl mx-auto p-4 lg:p-6 h-full">
        <div
          className={`flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-xl`}
        >
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold text-lg sm:text-xl mr-2 sm:mr-3">
              EM
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">EduMitra</h2>
              <p className="text-xs sm:text-sm text-white opacity-75 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                {ws && ws.connected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              onClick={toggleVoiceBot}
              className="p-1 sm:p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200 text-white"
              aria-label={
                isVoiceBotActive ? "Deactivate voice bot" : "Activate voice bot"
              }
            >
              {isVoiceBotActive ? <Mic size={16} /> : <MicOff size={16} />}
            </Button>
            <Button
              onClick={toggleTheme}
              className="p-1 sm:p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200 text-white"
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>
        <div
          className={`flex flex-1 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-b-xl overflow-hidden transition-colors duration-500`}
        >
          <div className="flex flex-col w-full lg:w-2/3 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-8rem)]">
            {isVoiceBotActive ? (
              <div className="flex-1 overflow-auto p-4">
                <PipecatWebSocketClient
                  setCall={() => setIsVoiceBotActive(false)}
                  isDarkMode={isDarkMode}
                />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-4 space-y-4 mb-14 lg:mb-0">
                  {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg p-3 relative ${
                          message.sender === "user"
                            ? "bg-purple-600 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        {message.sender === "bot" && (
                          <div className="absolute top-2 right-2">
                            <div className="group relative">
                              <Info size={16} className="text-gray-400 cursor-pointer" />
                              <div className="absolute right-0 w-48 p-2 mt-2 text-sm bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300">
                                <p>Similarity: {typeof message.similarity === 'number' ? message.similarity.toFixed(2) : 'N/A'}</p>
                                <p>Source: {message.source || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {message?.cutoff && Object.keys(message?.cutoff).length !== 0 ? (
                          <div>
                            <h2>Engineering Admission Ranks</h2>
                            <RankTable data={message?.cutoff} />
                          </div>
                        ) : null}
                        {message.dropdown_items &&
                        message.dropdown_items.length != 0 ? (
                          <div>
                            <Markdown>{message.content}</Markdown>
                            <div className="mt-2">
                              <Dropdown
                                options={message.dropdown_items.map(
                                  (option: any) => option
                                )}
                                onChange={(e) => sendMsg(e.value)}
                                value={
                                  message.dropdown_items.map(
                                    (option: any) => option
                                  )[0]
                                }
                                placeholder="Select a college"
                              />
                            </div>
                          </div>
                        ) : <Markdown>{message.content}</Markdown>}
                        <div>
                          {message.toolCall.type !== "college_list"
                            ? message?.options?.map((option) => (
                              <Button
                                key={option}
                                onClick={() => sendMsg(option)}
                                className={`${styles["custom-button"]} inline-flex items-center px-4 py-3 text-sm font-medium text-left whitespace-normal break-words mr-2 mb-2 w-full md:w-auto h-`}
                              >
                                {option}
                              </Button>
                            ))
                            : null}
                        </div>
                        {message?.link && message?.link !== "" ? (
                          <Button
                            key={message?.link}
                            onClick={() => window.open(message?.link, "_blank", "noopener,noreferrer")}
                            className={`${styles["custom-button"]} inline-flex items-center px-4 py-3 text-sm font-medium text-left whitespace-normal break-words mr-2 mb-2 w-full md:w-auto h-`}
                            style={{ backgroundColor: "#333", color: "#fff", display: "flex" }}
                          >
                            Link to official Website
                            <span className="ml-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                            </span>
                          </Button>
                        ) : null}

                      </div>
                    </div>
                  ))}
                  {isBotTyping && (
                    <div className="flex justify-start">
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg p-3 ${
                        isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-900"
                      }`}>
                        <TypingIndicator isVisible={true} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="fixed lg:relative bottom-14 lg:bottom-0 left-0 right-0 lg:left-auto lg:right-auto p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const g = handleSend();
                        }
                      }}
                      placeholder={
                        isConnecting ? "Connecting..." : "Type a message..."
                      }
                      className={`flex-grow p-3 bg-transparent focus:outline-none ${
                        isDarkMode
                          ? "text-black placeholder-gray-400"
                          : "text-gray-900 placeholder-gray-500"
                      }`}
                      disabled={isConnecting}
                    />
                    <Button
                      onClick={handleSend}
                      className={`p-3 ${
                        isConnecting
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                      }`}
                      disabled={isConnecting}
                    >
                      <Send size={20} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Desktop Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block lg:w-1/3 p-4 overflow-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Sparkles className="mr-2 text-yellow-500" /> Information
            </h3>
            <div className="space-y-4">
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div className="flex items-center mb-2">
                  <img
                    src="/placeholder.svg?height=40&width=40"
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <span className="font-semibold">
                    {collegeInfo.name ? (
                      <Typewriter
                        options={{
                          strings: collegeInfo.name,
                          autoStart: true,
                          loop: false,
                        }}
                      />
                    ) : (
                      "College Name"
                    )}
                  </span>
                </div>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <h4 className="font-semibold mb-2 flex items-center">
                  <GraduationCap size={25} className="mr-2 text-green-500" />{" "}
                  Course
                </h4>
                <p>
                  {collegeInfo.course ? (
                    <Typewriter
                      options={{
                        strings: collegeInfo.course,
                        autoStart: true,
                        loop: false,
                      }}
                    />
                  ) : (
                    "Not selected"
                  )}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <h4 className="font-semibold mb-2 flex items-center">
                  <CircleDollarSign
                    size={25}
                    className="mr-2 text-yellow-500"
                  />{" "}
                  Fees
                </h4>
                <p>
                  {collegeInfo.fees && collegeInfo.fees != "0" ? (
                    <Typewriter
                      options={{
                        strings: collegeInfo.fees.toString(),
                        autoStart: true,
                        loop: false,
                      }}
                    />
                  ) : (
                    "Not selected"
                  )}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`p-0 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Scissors size={25} className="mr-2 text-red-500" /> Cutoff
                  </h4>

                  {collegeInfo.cutoff &&
                  typeof collegeInfo.cutoff === "object" &&
                  Object.keys(collegeInfo.cutoff).length > 0 ? (
                    <div>
                      {Object.entries(collegeInfo.cutoff).map(
                        ([department, years]) => (
                          <div key={department}>
                            {Object.entries(years as Record<string, any>).map(([year, categories]) => (
                              <div key={year}>
                                {categories.General && (
                                  <div>
                                    <p>{`${department}: ${categories.General[1]}`}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  ) : collegeInfo.cutoff ? (
                    <p>
                      <Typewriter
                        options={{
                          strings: collegeInfo.cutoff.toString(),
                          autoStart: false,
                          loop: false,
                        }}
                      />
                    </p>
                  ) : (
                    <p>No cutoff information available</p>
                  )}
                </div>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <h4 className="font-semibold mb-2 flex items-center">
                  <Heart size={25} className="mr-2 text-pink-500" /> Scholarship
                </h4>
                <p>
                  {collegeInfo.scholarships &&
                  collegeInfo.scholarships != "0" ? (
                    <Typewriter
                      options={{
                        strings: collegeInfo.scholarships.toString(),
                        autoStart: true,
                        loop: false,
                      }}
                    />
                  ) : (
                    "Not selected"
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-4 mt-6">
              <Button
                onClick={downloadSummary}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-bold"
              >
                Download Summary
              </Button>
              <Button
                onClick={handleOpenCollegeComparison}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-bold"
              >
                College Comparison
              </Button>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleOpenQuiz}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-bold"
                >
                  Take Course Selection Quiz
                </Button>
                <Button
                  onClick={handleOpenComparison}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-bold"
                >
                  Course Vs Course
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        collegeInfo={collegeInfo}
        onOpenCollegeComparison={handleOpenCollegeComparison}
        onOpenCourseComparison={handleOpenComparison}
        onOpenQuiz={handleOpenQuiz}
        onDownloadSummary={downloadSummary}
        isDarkMode={isDarkMode}
      />

      <ToastContainer />
      
      {isCollegeComparisonOpen && (
        <CollegeComparison onClose={handleCloseCollegeComparison} />
      )}
      {isComparisonOpen && (
        <CourseComparison onClose={handleCloseComparison} />
      )}
      {isQuizOpen && <CourseSelectionQuiz onClose={handleCloseQuiz} />}
    </div>
  );
}
export default ChatbotPage;

function setIsQuizOpen(arg0: boolean) {
  throw new Error("Function not implemented.");
}
function setIsLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}

function setSummary(summary: any) {
  throw new Error("Function not implemented.");
}

function saveAs(blob: Blob, arg1: string) {
  throw new Error("Function not implemented.");
}

