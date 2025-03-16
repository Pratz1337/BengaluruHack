"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState } from "react"

interface FloatingQRProps {
    altText?: string
    size?: number
}

export function FloatingQR({
    altText = "Scan QR code",
    size = 80,
}: FloatingQRProps) {
    const [isHovered, setIsHovered] = useState(false)
    
    return (
        <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="relative cursor-pointer"
                whileHover={{ scale: 2. }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <div className="rounded-lg overflow-hidden shadow-lg border-2 border-indigo-500/30 bg-white/80 backdrop-blur-sm p-2">
                    <Image
                        src="/qr.jpg"
                        alt={altText}
                        width={size}
                        height={size}
                        className="rounded"
                    />
                    
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap"
                        >
                            Scan to download app
                        </motion.div>
                    )}
                </div>
                
                {/* Decorative glowing effect */}
                <motion.div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-400 to-indigo-600 rounded-lg blur-xl"
                    initial={{ opacity: 0.2, scale: 0.8 }}
                    animate={{ 
                        opacity: isHovered ? 0.6 : 0.2,
                        scale: isHovered ? 1.1 : 0.8
                    }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>
        </motion.div>
    )
}
