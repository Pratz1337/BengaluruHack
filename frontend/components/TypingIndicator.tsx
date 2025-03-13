"use client"

import type { FC } from "react"
import React from "react"

interface TypingIndicatorProps {
  isVisible?: boolean
}

export const TypingIndicator: FC<TypingIndicatorProps> = ({ isVisible = true }) => {
  if (!isVisible) return null

  return (
    <div className="flex items-center space-x-1 py-2">
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
    </div>
  )
}

