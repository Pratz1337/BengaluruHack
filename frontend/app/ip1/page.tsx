'use client'

import { useState } from "react"
import { Button } from "@nextui-org/button"
import axios from "axios"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sun, Moon, GraduationCap } from 'lucide-react'
import Link from "next/link"

export default function LoginPage() {
  const [ministryPassword, setMinistryPassword] = useState("")
  const [collegeUsername, setCollegeUsername] = useState("")
  const [collegePassword, setCollegePassword] = useState("")
  const [collegeKey, setCollegeKey] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()

  const handleMinistryLogin = async () => {
    if (ministryPassword === "ministry@123") {
      window.location.href = "/admin"
    } else {
      alert("Incorrect password")
    }
  }

  const handleCollegeLogin = async () => {
    try {
      const response = await axios.post("/api/college-login", {
        username: collegeUsername,
        password: collegePassword,
        key: collegeKey,
      })
      if (response.data.success) {
        router.push(`/collegedashboard?collegen=${response.data.collegen}`)
      } else {
        alert("Invalid credentials")
      }
    } catch (error) {
      console.error("Error during college login:", error)
      alert("An error occurred. Please try again.")
    }
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-800 bg-opacity-10 opacity-95 backdrop-filter backdrop-blur-3xl p-4 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold flex items-center text-white">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
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

      <motion.div 
        className={`bg-white p-8 rounded-lg shadow-2xl space-y-6 max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <motion.h1 
          className={`text-4xl font-bold text-center mb-8 ${isDarkMode ? 'text-black' : 'text-black'}`}
          variants={fadeIn}
        >
          Welcome to EduMitra
        </motion.h1>
        <motion.div className="space-y-4" variants={fadeIn}>
          <div className="w-full block">
            <input
              type="password"
              placeholder="Enter Ministry Password"
              value={ministryPassword}
              onChange={(e) => setMinistryPassword(e.target.value)}
              className={`w-full p-3 mb-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
            />
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
              onClick={handleMinistryLogin}
            >
              Ministry Login
            </Button>
          </div>
          <div className="w-full block">
            <input
              type="text"
              placeholder="Enter College Username"
              value={collegeUsername}
              onChange={(e) => setCollegeUsername(e.target.value)}
              className={`w-full p-3 mb-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
            />
            <input
              type="password"
              placeholder="Enter College Password"
              value={collegePassword}
              onChange={(e) => setCollegePassword(e.target.value)}
              className={`w-full p-3 mb-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
            />
            <input
              type="text"
              placeholder="Enter College Key"
              value={collegeKey}
              onChange={(e) => setCollegeKey(e.target.value)}
              className={`w-full p-3 mb-4 border rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
            />
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
              onClick={handleCollegeLogin}
            >
              College Login
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
