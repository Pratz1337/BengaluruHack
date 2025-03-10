import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
  isVisible: boolean
  startColor?: string
  endColor?: string
  size?: number
  animationDuration?: number
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  startColor = '#9333ea',
  endColor = '#4f46e5',
  size = 8,
  animationDuration = 1.7,
}) => {
  const dotVariants = {
    initial: { y: 0, opacity: 0 },
    animate: { y: [0, -8, 0], opacity: 1 },
    exit: { opacity: 0 },
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="flex items-center space-x-1 p-2 rounded-full bg-transparent "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `linear-gradient(to right, ${startColor}, ${endColor})`,
              }}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: animationDuration,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}