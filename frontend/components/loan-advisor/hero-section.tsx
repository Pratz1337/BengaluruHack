"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { MessageSquare, Mic, ArrowRight } from "lucide-react"
import BackgroundPaths from "@/components/kokonutui/background-paths"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 dark:from-indigo-950 dark:to-purple-950"></div>

      <div className="absolute inset-0 -z-10">
        <BackgroundPaths title="" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                FinMate
              </span>{" "}
              Multilingual Loan Advisor AI
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
              Your personal AI assistant for loan guidance, financial literacy, and smart money decisions in any
              language you prefer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a href="/chatbot"><Button
            
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0" 
              >
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button></a>
              <a href="/community"><Button
                size="lg"
                variant="outline"
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
              >
                Community
              </Button></a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-sm md:max-w-none">
              <div className="aspect-[4/3] bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mx-auto font-medium text-sm text-gray-500 dark:text-gray-400">FinMate Chat</div>
                </div>
                <div className="p-4 h-64 overflow-y-auto">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-end">
                      <div className="bg-indigo-600 text-white rounded-lg rounded-bl-none p-3 max-w-xs">
                        Hello! I'd like to know if I'm eligible for a home loan.
                      </div>
                    </div>
                    <div className="flex items-end justify-end">
                      <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg rounded-br-none p-3 max-w-xs">
                        I'd be happy to help you check your home loan eligibility! I'll need to ask you a few questions
                        about your financial situation. First, what's your approximate annual income?
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="text-xs text-gray-500 mr-2">Supports 30+ languages</div>
                      <div className="flex -space-x-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                          EN
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                          ES
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                          FR
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 border-0 bg-transparent focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-400"
                  />
                  <div className="flex space-x-2">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full">
                      <Mic className="h-5 w-5" />
                    </button>
                    <button className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full">
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

