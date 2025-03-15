"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function CtaSection() {
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
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-indigo-600 to-purple-700 dark:from-cyan-900 dark:via-indigo-900 dark:to-purple-900"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path
            d="M0,30 Q50,10 100,30 L100,100 L0,100 Z"
            fill="url(#ctaGrad1)"
            animate={{
              d: [
                "M0,30 Q50,10 100,30 L100,100 L0,100 Z",
                "M0,40 Q50,0 100,40 L100,100 L0,100 Z",
                "M0,30 Q50,10 100,30 L100,100 L0,100 Z",
              ],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="ctaGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
            }}
            animate={{
              y: [0, -Math.random() * 100 - 50],
              opacity: [Math.random() * 0.3 + 0.1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            Ready to Transform Your{" "}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative inline-block"
            >
              <span className="relative z-10">Financial Journey?</span>
              <motion.span
                className="absolute -bottom-2 left-0 w-full h-1 bg-white rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </motion.span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-cyan-100 mb-8"
          >
            Get personalized loan guidance, financial tips, and support in your preferred language.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
        <Button
          onClick={handleGetStarted}
          size="lg"
              className="bg-white text-indigo-600 hover:bg-indigo-50 border-0 shadow-lg shadow-indigo-900/20 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Get Started Now
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
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white via-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              Schedule a Demo
        </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 text-indigo-100 text-sm"
          >
            <p>No credit card required. Start your financial journey today.</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

