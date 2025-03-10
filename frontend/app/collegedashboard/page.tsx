'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Moon, Activity, Scissors,Upload, Edit3, Home, Info, FilePlus, BookOpen, Users, Award, BadgeDollarSign, ChevronRight, Menu, GraduationCap, MapPin, DollarSign, Send, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@nextui-org/button"
import { Card, CardBody, CardHeader, CardFooter } from "@nextui-org/card"
import { Progress } from "@/components/ui/progress"
import MobileSideNav from '@/components/MobileSideNav'

// ===== Constants =====

export const MENU_ITEMS = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Upload, label: 'Cutoff', path: '/cutoffs' },
]

const STAT_CARDS = [
  { title: 'Students', icon: Users, count: 1500, increase: 5 },
  { title: 'Courses', icon: BookOpen, count: 50, increase: 2 },
  { title: 'Activities', icon: Activity, count: 30, increase: 3 },
]

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

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
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
            
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <AnimatePresence>
            {STAT_CARDS.map((item, index) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardHeader className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : ''}`}>
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
              <h2 className={`${theme === 'dark' ? 'text-white' : ''} font-black text-2xl sm:text-4xl text-center`}>Recent Updates</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : ''} text-sm mt-1 text-center`}>Latest updates from your college</p>
            </CardHeader>
            <CardBody className="pt-2">
              <p className={`${theme === 'dark' ? 'text-white' : ''} text-center`}>No recent updates</p>
            </CardBody>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
            <CardHeader className="p-4 pb-2">
              <h2 className={`${theme === 'dark' ? 'text-white' : ''} font-black text-2xl sm:text-4xl text-center`}>Quick Actions</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : ''} text-sm mt-1 text-center`}>Frequently used admin actions</p>
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

