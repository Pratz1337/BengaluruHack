import React from 'react'
import { Progress as NextUIProgress } from "@nextui-org/progress"

interface ProgressProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger"
  size?: "sm" | "md" | "lg"
  className?: string
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = "primary",
  size = "md",
  className = "",
}) => {
  const percentage = Math.round((value / max) * 100)

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{percentage}%</span>
          )}
        </div>
      )}
      <NextUIProgress
        value={percentage}
        color={color}
        size={size}
        aria-label={label || "Progress"}
      />
    </div>
  )
}

