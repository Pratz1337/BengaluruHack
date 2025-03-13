"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Notification = {
  id: string
  message: string
  time: string
  read: boolean
}

export default function NotificationBar() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      message: "Jessica Miller replied to your thread about retirement planning",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: "2",
      message: "Your post about budgeting apps received 10 likes",
      time: "1 hour ago",
      read: false,
    },
    {
      id: "3",
      message: 'New thread in Investments category: "Best ETFs for 2023"',
      time: "3 hours ago",
      read: true,
    },
  ])

  const [isVisible, setIsVisible] = useState(true)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true)
      } else {
        setIsSticky(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!isVisible) return null

  return (
    <div
      className={`
      bg-white border-b border-gray-200 p-2 transition-all duration-300
      ${isSticky ? "fixed top-0 left-0 right-0 z-50 shadow-md" : ""}
    `}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>You have {unreadCount} unread notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="ml-2 font-medium">Notifications</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                flex items-start justify-between p-2 rounded-lg
                ${notification.read ? "bg-gray-50" : "bg-blue-50"}
              `}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex-1">
                <p className={`text-sm ${notification.read ? "text-gray-600" : "text-gray-800 font-medium"}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500">{notification.time}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2"
                onClick={(e) => {
                  e.stopPropagation()
                  dismissNotification(notification.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

