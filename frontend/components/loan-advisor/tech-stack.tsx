"use client"

import { motion } from "framer-motion"

export default function TechStack() {
  const technologies = [
    { name: "Next.js", logo: "/placeholder.svg?height=40&width=40" },
    { name: "Python", logo: "/placeholder.svg?height=40&width=40" },
    { name: "Groq", logo: "/placeholder.svg?height=40&width=40" },
    { name: "Langchain", logo: "/placeholder.svg?height=40&width=40" },
    { name: "MongoDB", logo: "/placeholder.svg?height=40&width=40" },
    { name: "Sarvam AI", logo: "/placeholder.svg?height=40&width=40" },
    { name: "WebSocket", logo: "/placeholder.svg?height=40&width=40" },
    { name: "Flask", logo: "/placeholder.svg?height=40&width=40" },
  ]

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full text-indigo-600 dark:text-indigo-400" viewBox="0 0 696 316" fill="none">
          <path
            d="M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
            transform="rotate(180 348 158)"
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
            Powered by Advanced Technology
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Our solution leverages cutting-edge technologies to deliver a seamless experience
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 mb-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center shadow-sm">
                <img src={tech.logo || "/placeholder.svg"} alt={tech.name} className="w-8 h-8" />
              </div>
              <span className="text-gray-800 dark:text-gray-200 font-medium">{tech.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

