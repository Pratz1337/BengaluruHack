"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { CheckCircle2, FileText, Languages, MessageSquare, Mic } from "lucide-react"

export default function FeatureSection() {
  const features = [
    {
      icon: <CheckCircle2 className="h-10 w-10 text-cyan-500 dark:text-cyan-400" />,
      title: "Loan Eligibility Check",
      description:
        "Answer a few questions about your financial situation and get instant feedback on your eligibility for different types of loans.",
      gradient: "from-cyan-500 to-teal-500",
      delay: 0.1,
    },
    {
      icon: <FileText className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />,
      title: "Application Guidance",
      description:
        "Step-by-step guidance through the loan application process, including required documents and information.",
      gradient: "from-indigo-500 to-blue-500",
      delay: 0.2,
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-purple-500 dark:text-purple-400" />,
      title: "Financial Literacy Tips",
      description:
        "Receive simple, easy-to-understand financial tips, such as saving strategies or improving credit scores.",
      gradient: "from-purple-500 to-pink-500",
      delay: 0.3,
    },
    {
      icon: <Languages className="h-10 w-10 text-blue-500 dark:text-blue-400" />,
      title: "Multilingual Support",
      description:
        "Interact with our assistant in multiple languages based on your preference for a comfortable experience.",
      gradient: "from-blue-500 to-cyan-500",
      delay: 0.4,
    },
    {
      icon: <Mic className="h-10 w-10 text-pink-500 dark:text-pink-400" />,
      title: "Voice & Text Interaction",
      description: "Choose between voice and text communication for a convenient and accessible experience.",
      gradient: "from-pink-500 to-purple-500",
      delay: 0.5,
    },
  ]

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute w-full h-full opacity-10 dark:opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,0 C30,20 70,20 100,0 L100,100 L0,100 Z"
            fill="url(#grad1)"
            animate={{
              d: [
                "M0,0 C30,20 70,20 100,0 L100,100 L0,100 Z",
                "M0,0 C20,40 80,40 100,0 L100,100 L0,100 Z",
                "M0,0 C30,20 70,20 100,0 L100,100 L0,100 Z",
              ],
            }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 dark:from-cyan-500/10 dark:to-indigo-500/10 backdrop-blur-sm border border-cyan-500/30"
          >
            <span className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-indigo-600 bg-clip-text text-transparent">
              Smart Features
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 dark:from-cyan-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
          >
            Powerful Features
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Our AI assistant provides comprehensive support for all your loan and financial needs
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="h-full border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className={`h-2 w-full bg-gradient-to-r ${feature.gradient}`}></div>
                <CardHeader>
                  <motion.div
                    className="mb-4 relative"
                    whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-xl transform scale-0 group-hover:scale-150 transition-all duration-700"></div>
                    {feature.icon}
                  </motion.div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

