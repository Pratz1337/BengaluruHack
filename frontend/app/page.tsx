'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useAnimation } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { GraduationCap, Book, Users, MessageCircle, Menu, X, Clock, Database, Mic, Sun, Moon, Crown, Globe, Shield, Zap } from 'lucide-react'
import { Button } from "@nextui-org/button"
import Image from 'next/image'
export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showChatButton, setShowChatButton] = useState(false)
  const controls = useAnimation()
  const [ref, inView] = useInView()

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  useEffect(() => {
    const handleScroll = () => {
      setShowChatButton(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  const dropAnimation = {
    hidden: { y: -50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div className={`min-h-screen flex flex-col w-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-800 bg-opacity-10 opacity-95 backdrop-filter backdrop-blur-3xl p-4 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center text-white">
            <motion.div
              animate={pulseAnimation}
              className="flex items-center"
            >
              <GraduationCap className="mr-2" />
              EduMitra
            </motion.div>
          </Link>
          
          <Button
            onClick={toggleTheme}
            className="ml-4 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200 text-white"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={25} /> : <Moon size={25} />}
          </Button>
        </div>
      </nav>
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5 }}
          >
            EduMitra - Your 24/7 AI-Based Student Assistance Chatbot
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-xl md:text-2xl mb-12"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Empowering students with cutting-edge AI technology for seamless academic support and guidance.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  <Link
    href="#"
    onClick={() => {
      // Generate a session ID
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the session ID in local storage
      localStorage.setItem("sessionId", sessionId);
      
      // Redirect to the chatbot page
      window.location.href = "/chatbot";
    }}
    className="bg-purple-600 text-white hover:bg-purple-700 font-bold py-3 px-8 rounded-full transition-colors duration-200 flex items-center justify-center"
  >
    <MessageCircle className="mr-2" />
    Chat with EduMitra now!
  </Link>
</motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/ip1" className="bg-purple-600 text-white hover:bg-purple-700 font-bold py-3 px-8 rounded-full transition-colors duration-200 flex items-center justify-center">
                <Crown className="mr-2" />
                Admin Portal
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <section className="w-full px-4 py-16" ref={ref}>
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            initial="hidden"
            animate={controls}
            variants={fadeIn}
          >
            Why Choose EduMitra?
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            animate={controls}
            variants={staggerChildren}
          >
            {[
              { icon: <Globe className="w-16 h-16 mb-4" />, title: "Multilingual Support", description: "Break language barriers with support for multiple languages including English, Hindi, and more." },
              { icon: <Mic className="w-16 h-16 mb-4" />, title: "Voice and Text Interaction", description: "Interact via text or voice, catering to your preferences and accessibility needs." },
              { icon: <Zap className="w-16 h-16 mb-4" />, title: "Cutting-Edge Technology", description: "Powered by Gemini, LangChain, and RAG for accurate and contextual responses." },
              { icon: <Shield className="w-16 h-16 mb-4" />, title: "Advanced Security", description: "Your data is protected with MongoDB, Fernet encryption, and OAuth authentication." },
              { icon: <Users className="w-16 h-16 mb-4" />, title: "Personalized Guidance", description: "Receive tailored recommendations and assistance for your academic journey." },
              { icon: <Clock className="w-16 h-16 mb-4" />, title: "24/7 Availability", description: "Access support anytime, anywhere, for all your academic needs." },
            ].map((feature, index) => (
              <motion.div 
                key={feature.title}
                className={`p-6 rounded-lg text-center flex flex-col items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                variants={fadeIn}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <motion.div
                  animate={pulseAnimation}
                  className="text-purple-600"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <section className="w-full px-4 py-16 bg-gradient-to-r from-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            Experience the Future of Education
          </motion.h2>
          <motion.p
            className="text-xl mb-12"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            Join thousands of students benefiting from AI-powered assistance
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.4 }}
          >
            <Button variant="faded" size="lg">
              <Link href="/signup">Get Started Now</Link>
            </Button>
          </motion.div>
        </div>
      </section>
      <section className="w-full px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            initial="hidden"
            animate={controls}
            variants={fadeIn}
          >
            How EduMitra Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial="hidden"
              animate={controls}
              variants={fadeIn}
            >
              <Image
                src="/EduMitra-Public.png"
                alt="EduMitra in action"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </motion.div>
            <motion.div
              initial="hidden"
              animate={controls}
              variants={staggerChildren}
              className="space-y-6"
            >
              {[
                { title: "Ask a Question", description: "Type or speak your query in your preferred language." },
                { title: "Get Instant Answers", description: "Receive accurate and personalized responses in real-time." },
                { title: "Explore Options", description: "Compare colleges, courses, and career paths with ease." },
                { title: "Make Informed Decisions", description: "Use data-driven insights to choose the best path for you." },
              ].map((step, index) => (
                <motion.div key={step.title} variants={fadeIn} className="flex items-start">
                  <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      <footer className={`py-8 w-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 EduMitra. All rights reserved.</p>
          <p className="mt-2">Empowering Education, Simplifying Student Assistance!</p>
        </div>
      </footer>
      <motion.div
        className="fixed bottom-4 right-4 z-20"
        initial="hidden"
        animate={showChatButton ? "visible" : "hidden"}
        variants={dropAnimation}
      >
        <Link href="/chatbot">
          <Button
            className="bg-purple-600 text-white hover:bg-purple-700 font-bold p-4 rounded-full shadow-lg"
            aria-label="Open Chat"
          >
            <MessageCircle size={24} />
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}