"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { CheckCircle2, FileText, Languages, MessageSquare, Mic } from "lucide-react"

export default function FeatureSection() {
  const features = [
    {
      icon: <CheckCircle2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />,
      title: "Loan Eligibility Check",
      description:
        "Answer a few questions about your financial situation and get instant feedback on your eligibility for different types of loans.",
    },
    {
      icon: <FileText className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />,
      title: "Application Guidance",
      description:
        "Step-by-step guidance through the loan application process, including required documents and information.",
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />,
      title: "Financial Literacy Tips",
      description:
        "Receive simple, easy-to-understand financial tips, such as saving strategies or improving credit scores.",
    },
    {
      icon: <Languages className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />,
      title: "Multilingual Support",
      description:
        "Interact with our assistant in multiple languages based on your preference for a comfortable experience.",
    },
    {
      icon: <Mic className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />,
      title: "Voice & Text Interaction",
      description: "Choose between voice and text communication for a convenient and accessible experience.",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full text-indigo-600 dark:text-indigo-400" viewBox="0 0 696 316" fill="none">
          <path
            d="M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
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

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

