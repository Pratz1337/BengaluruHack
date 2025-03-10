'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Moon, Activity, Scissors, Edit3, Home, Info, FilePlus, BookOpen, Users, Award, BadgeDollarSign, ChevronRight, Menu, GraduationCap, MapPin, DollarSign, Send, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@nextui-org/button"
import { Card, CardBody, CardHeader, CardFooter } from "@nextui-org/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import MobileSideNav from '@/components/MobileSideNav'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// ===== Constants =====

export const MENU_ITEMS = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Info, label: 'Information', path: './admin/view' },
]

const STAT_CARDS = [
  { title: 'Students', icon: Users, count: 1500, increase: 5 },
  { title: 'Courses', icon: BookOpen, count: 50, increase: 2 },
  { title: 'Activities', icon: Activity, count: 30, increase: 3 },
  { title: 'Scholarships', icon: Award, count: 20, increase: 1 },
  { title: 'Admissions', icon: FilePlus, count: 500, increase: 10 },
]

interface RecentQuestion {
  question: string;
  time: number;
}

const QUICK_ACTIONS = [
  { label: 'Add New Course', icon: FilePlus, path: '/courses' },
  { label: 'Update College Info', icon: Edit3, path: '/generalinformation' },
  { label: 'Manage Scholarships', icon: Award, path: '/scholarships' },
]

const CollegeAdminPortal: React.FC = () => {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([])
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    fees: '',
    courses: '',
    scholarships: '',
    activities: '',
  })
  const [chatbotRequests, setChatbotRequests] = useState([
    { name: 'Day 1', requests: 0 },
    { name: 'Day 2', requests: 0 },
    { name: 'Day 3', requests: 0 },
    { name: 'Day 4', requests: 0 },
    { name: 'Day 5', requests: 0 },
    { name: 'Day 6', requests: 0 },
    { name: 'Day 7', requests: 0 },
  ])
  const [totalChatbotRequests, setTotalChatbotRequests] = useState(0)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    const fetchRecentQuestions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/recent-questions')
        if (!response.ok) {
          throw new Error('Failed to fetch recent questions')
        }
        const data = await response.json()
        setRecentQuestions(data)
      } catch (error) {
        console.error('Error fetching recent questions:', error)
      }
    }

    fetchRecentQuestions()
    const interval = setInterval(fetchRecentQuestions, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchChatbotRequests = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/chatbot-requests')
        if (!response.ok) {
          throw new Error('Failed to fetch chatbot requests')
        }
        const data = await response.json()
        
        const total = data.reduce((sum: any, day: { requests: any }) => sum + day.requests, 0)
        setTotalChatbotRequests(total)
        
        setChatbotRequests(data)
      } catch (error) {
        console.error('Error fetching chatbot requests:', error)
      }
    }

    fetchChatbotRequests()
    const interval = setInterval(fetchChatbotRequests, 5000)

    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:5000/api/chatbot-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        alert('Form submitted successfully!')
        setFormData({
          name: '',
          address: '',
          fees: '',
          courses: '',
          scholarships: '',
          activities: '',
        })
      } else {
        alert('Submission failed.')
      }
    } catch (error) {
      console.error(error)
      alert('An error occurred.')
    }
  }

  return (
    <div className={`w-full min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <nav className="bg-gradient-to-r from-purple-600 to-pink-600 bg-opacity-10 opacity-95 backdrop-filter backdrop-blur-3xl p-4 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <NavbarBrand router={router} />
          {isMobile ? (
            <Button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-white hover:bg-white/20 p-2 rounded-full"
            >
              <Menu size={24} />
            </Button>
          ) : (
            <NavbarMenu router={router} toggleTheme={toggleTheme} theme={theme} />
          )}
        </div>
      </nav>

      {isMobile && (
        <MobileSideNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          router={router}
          toggleTheme={toggleTheme}
          theme={theme}
        />
      )}

      <main className="flex-grow p-6 mt-16">
        <motion.h1 
          className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Welcome to the EduMitra Director Admin Portal
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg `}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardHeader className={`text-sm lg:text-black lg:font-black lg:text-5xl self-center justify-center font-medium ${theme === 'dark' ? 'text-white' : ''}`}>
                Chatbot Requests
              </CardHeader>
              <Send className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardBody>
              <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : ''}`}>
                {totalChatbotRequests}
              </div>
              <p className={`text-1xl ${theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'}`}>
                Total requests in the last 7 days
              </p>
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chatbotRequests}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="requests" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </motion.div>
            
        <div className="grid grid-cols-3 sm:grid-cols-2 mt-[20px] lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {STAT_CARDS.slice(0, 3).map((item, index) => (
              <motion.div 
                className='lg:text-black lg:font-black lg:text-5xl self-center justify-center '
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} lg:text-black lg:font-black lg:text-5xl self-center justify-center  rounded-lg`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardHeader className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : ''}lg:text-black lg:font-black lg:text-2xl self-center justify-center `}>
                      {item.title}
                    </CardHeader>
                    <item.icon className={`h-4 w-4 ${theme === 'dark' ? 'text-white' : 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardBody>
                    <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : ''}`}>{item.count}</div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'}`}>
                      +{item.increase}% from last month
                    </p>
                    <Progress value={(item.count / 2000) * 100} className="mt-2" />
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
            <CardHeader className="p-4 pb-2">
              <h2 className={`${theme === 'dark' ? 'text-white' : ''} font-black text-2xl sm:text-4xl text-center`}>Recent Questions</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : ''} text-sm mt-1 ml-[220px]`}>Latest updates from your college</p>
            </CardHeader>
            <CardBody className="pt-2">
              <ul className="space-y-4">
                {recentQuestions.map((question, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-center space-x-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="bg-purple-500 p-2 rounded-full">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm font-medium leading-none ${theme === 'dark' ? 'text-white' : ''}`}>
                        {question.question.length > 50 
                          ? question.question.substring(0, 50) + '...' 
                          : question.question}
                      </p>
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'}`}>
                      {question.time < 1 
                        ? 'Just now' 
                        : `${Math.round(question.time)} hours ago`}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </CardBody>
            <CardFooter>
              <Button className="w-full rounded-lg">View All Questions</Button>
            </CardFooter>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
            <CardHeader className="p-4 pb-2">
              <h2 className={`${theme === 'dark' ? 'text-white' : ''} font-black text-2xl sm:text-4xl text-center`}>Quick Actions</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : ''} text-sm mt-1 ml-[270px]`}>Frequently used admin actions</p>
            </CardHeader>
            <CardBody className="pt-2 grid gap-2">
              {QUICK_ACTIONS.map((action, index) => (
                <motion.div
                  key={action.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    variant="bordered" 
                    className={`w-full justify-start rounded-lg ${theme === 'dark' ? 'text-white bg-gray-700 hover:bg-gray-600' : ''}`}
                    onClick={() => router.push(action.path)}
                  >
                    <action.icon className={`mr-2 h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
                    {action.label}
                    <ChevronRight className={`ml-auto h-4 w-4 ${theme === 'dark' ? 'text-white' : ''}`} />
                  </Button>
                </motion.div>
              ))}
            </CardBody>
          </Card>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white text-center">
        &copy; {new Date().getFullYear()} EduMitra Admin Portal. All rights reserved.
      </footer>
    </div>
  )
}

const NavbarBrand: React.FC<{ router: ReturnType<typeof useRouter> }> = ({ router }) => (
  <motion.h2 
    className="text-2xl font-bold text-white cursor-pointer"
    onClick={() => router.push('/')}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    EduMitra Admin Portal
  </motion.h2>
)

const NavbarMenu: React.FC<{ router: ReturnType<typeof useRouter>, toggleTheme: () => void, theme: 'light' | 'dark' }> = ({ router, toggleTheme, theme }) => (
  <div className="flex items-center gap-4">
    {MENU_ITEMS.map((item) => (
      <motion.button
        key={item.label}
        onClick={() => router.push(item.path)}
        className="text-white hover:bg-white/20 p-2 rounded-full"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <item.icon size={20} />
      </motion.button>
    ))}
    <motion.button
      onClick={toggleTheme}
      className="text-white hover:bg-white/20 p-2 rounded-full"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </motion.button>
  </div>
)

export default CollegeAdminPortal
