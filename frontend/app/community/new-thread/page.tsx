"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PostForm from "@/components/community/post-form"

export default function NewThreadPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)

    // In a real app, you would send this data to your API
    console.log("Submitting new thread:", data)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)

    // Redirect to the community page
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Community Platform</h1>
        <div className="text-gray-500">Menu would go here</div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Thread</h1>

        <PostForm onSubmit={handleSubmit} />

        {isSubmitting && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></div>
            <span>Submitting your thread...</span>
          </div>
        )}
      </div>
    </main>
  )
}

