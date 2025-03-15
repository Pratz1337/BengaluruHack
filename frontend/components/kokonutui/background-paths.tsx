"use client"

import { motion } from "framer-motion"

interface BackgroundPathsProps {
  title: string
}

export default function BackgroundPaths({ title }: BackgroundPathsProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        className="absolute w-full h-full text-cyan-500/5 dark:text-cyan-400/5"
        width="100%"
        height="100%"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M 100 300 Q 150 50 200 300 Q 250 550 300 300 Q 350 50 400 300 Q 450 550 500 300 Q 550 50 600 300 Q 650 550 700 300"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        <motion.path
          d="M 100 400 Q 150 150 200 400 Q 250 650 300 400 Q 350 150 400 400 Q 450 650 500 400 Q 550 150 600 400 Q 650 650 700 400"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, delay: 0.2, ease: "easeInOut" }}
        />
        <motion.path
          d="M 100 500 Q 150 250 200 500 Q 250 750 300 500 Q 350 250 400 500 Q 450 750 500 500 Q 550 250 600 500 Q 650 750 700 500"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, delay: 0.4, ease: "easeInOut" }}
        />
      </svg>

      <svg
        className="absolute w-full h-full text-indigo-500/5 dark:text-indigo-400/5"
        width="100%"
        height="100%"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.circle
          cx="400"
          cy="400"
          r="200"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.circle
          cx="400"
          cy="400"
          r="300"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
        />
        <motion.circle
          cx="400"
          cy="400"
          r="400"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.6, ease: "easeInOut" }}
        />
      </svg>
    </div>
  )
}

