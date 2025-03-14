"use client"

import { useState, useEffect } from "react"
import CommunityFeed from "@/components/community/community-feed"
import ProfileSidebar from "@/components/community/profile-sidebar"

export default function CommunityPage() {
  const [theme, setTheme] = useState("light")

  // Check for system/saved theme preference
  useEffect(() => {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem("theme")

    // Check if system prefers dark mode
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (systemPrefersDark) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  return (
    <main className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      <header
        className={`border-b ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"} py-4 px-6 flex justify-between items-center`}
      >
        <h1 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Community Platform</h1>
        <div className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Menu would go here</div>
      </header>

      <div className="flex flex-col md:flex-row">
        <ProfileSidebar />
        <CommunityFeed />
      </div>
    </main>
  )
}

