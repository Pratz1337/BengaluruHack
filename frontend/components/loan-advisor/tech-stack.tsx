"use client"

import { motion } from "framer-motion"

export default function TechStack() {
  const technologies = [
    { name: "Next.js", logo: "/placeholder.svg?height=40&width=40", delay: 0.1 },
    { name: "Python", logo: "/placeholder.svg?height=40&width=40", delay: 0.15 },
    { name: "Groq", logo: "/placeholder.svg?height=40&width=40", delay: 0.2 },
    { name: "Langchain", logo: "/placeholder.svg?height=40&width=40", delay: 0.25 },
    { name: "MongoDB", logo: "/placeholder.svg?height=40&width=40", delay: 0.3 },
    { name: "Sarvam AI", logo: "/placeholder.svg?height=40&width=40", delay: 0.35 },
    { name: "WebSocket", logo: "/placeholder.svg?height=40&width=40", delay: 0.4 },
    { name: "Flask", logo: "/placeholder.svg?height=40&width=40", delay: 0.45 },
  ]

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-full">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-cyan-300/5 to-indigo-500/5 dark:from-cyan-300/2 dark:to-indigo-500/2"
              style={{
                width: Math.random() * 600 + 200,
                height: Math.random() * 600 + 200,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: "blur(80px)",
              }}
              animate={{
                x: [0, Math.random() * 60 - 30],
                y: [0, Math.random() * 60 - 30],
              }}
              transition={{
                duration: Math.random() * 15 + 15,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
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
              Tech Stack
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 dark:from-cyan-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: tech.delay }}
              whileHover={{
                y: -10,
                transition: { duration: 0.2 },
              }}
              className="flex flex-col items-center"
            >
              <motion.div
                className="w-20 h-20 mb-4 relative group"
                whileHover={{ rotate: 360, transition: { duration: 1, ease: "easeInOut" } }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/80 via-indigo-500/80 to-purple-600/80 blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-cyan-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-800">
                  <motion.img
                    src={tech.logo || "/placeholder.svg"}
                    alt={tech.name}
                    className="w-10 h-10"
                    initial={{ y: 0 }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.2 }}
                  />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-cyan-400/50 group-hover:scale-110 transition-all duration-300"></div>
              </motion.div>
              <motion.span
                className="text-gray-800 dark:text-gray-200 font-medium bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text group-hover:text-transparent transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                {tech.name}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

