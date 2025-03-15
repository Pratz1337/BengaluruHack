"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { MessageSquare, Mic, ArrowRight } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

export default function HeroSection() {
  const { signInWithGoogle, user } = useAuth()
  const router = useRouter()

  const handleGetStarted = async () => {
    if (user) {
      // If user is already logged in, redirect to chatbot
      router.push("/chatbot")
    } else {
      // Otherwise, trigger Google sign-in
      await signInWithGoogle()
      // The auth state change will be detected by the AuthProvider
      // and the user will be redirected to the chatbot page
    }
  }

  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
      {/* Modern mesh gradient background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-indigo-600 to-purple-800 opacity-10 dark:opacity-20"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-full h-full">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-cyan-300 to-indigo-500 opacity-20 dark:opacity-30"
              style={{
                width: Math.random() * 200 + 50,
                height: Math.random() * 200 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 40 - 20],
                y: [0, Math.random() * 40 - 20],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center md:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-4 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 dark:from-cyan-500/10 dark:to-indigo-500/10 backdrop-blur-sm border border-cyan-500/30"
            >
              <span className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-indigo-600 bg-clip-text text-transparent">
                AI-Powered Financial Guidance
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 dark:from-cyan-300 dark:via-indigo-400 dark:to-purple-500"
              >
                FinMate
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-block"
              >
                Multilingual
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="inline-block relative"
              >
                <span>Loan Advisor AI</span>
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full"></span>
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed"
            >
              Your personal AI assistant for loan guidance, financial literacy, and smart money decisions in any
              language you prefer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="relative overflow-hidden group bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-600 hover:via-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
              >
                <span className="relative z-10 flex items-center">
                  Get Started
                  <motion.span
                    initial={{ x: 0 }}
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "loop",
                      ease: "easeInOut",
                    }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.span>
                </span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Button>
              <a href="/community">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all duration-300"
                >
                  Community
                </Button>
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative mx-auto max-w-sm md:max-w-none">
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: "easeInOut" }}
                className="aspect-[4/3] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mx-auto font-medium text-sm text-gray-500 dark:text-gray-400">FinMate Chat</div>
                </div>
                <div className="p-4 h-64 overflow-y-auto bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  <div className="flex flex-col space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                      className="flex items-end"
                    >
                      <div className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-lg rounded-bl-none p-3 max-w-xs shadow-lg">
                        Hello! I'd like to know if I'm eligible for a home loan.
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1.2 }}
                      className="flex items-end justify-end"
                    >
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 rounded-lg rounded-br-none p-3 max-w-xs shadow-md">
                        I'd be happy to help you check your home loan eligibility! I'll need to ask you a few questions
                        about your financial situation. First, what's your approximate annual income?
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1.6 }}
                      className="flex items-center justify-end"
                    >
                      <div className="text-xs text-gray-500 mr-2">Supports 30+ languages</div>
                      <div className="flex -space-x-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-indigo-100 text-xs font-medium text-indigo-600">
                          EN
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-indigo-100 text-xs font-medium text-indigo-600">
                          ES
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-indigo-100 text-xs font-medium text-indigo-600">
                          FR
                        </span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-xs font-medium text-purple-600">
                          +
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 border-0 bg-transparent focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-400"
                  />
                  <div className="flex space-x-2">
                    <button className="text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 p-2 rounded-full transition-colors duration-300">
                      <Mic className="h-5 w-5" />
                    </button>
                    <button className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-full transition-colors duration-300">
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.8 }}
                className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <motion.span
                  animate={{
                    textShadow: [
                      "0 0 5px rgba(255,255,255,0.5)",
                      "0 0 20px rgba(255,255,255,0.8)",
                      "0 0 5px rgba(255,255,255,0.5)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="text-white font-bold text-lg"
                >
                  AI
                </motion.span>
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-gradient-to-br from-cyan-300/20 to-indigo-400/20 backdrop-blur-md"></div>
              <div className="absolute top-1/2 -right-12 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-500/20 backdrop-blur-md"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

