"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import TranslationDropdown from "./translation-dropdown"
import { useToast } from "@/hooks/use-toast"

interface PostTranslationProps {
  post: {
    id: string
    title: string
    content: string
    author: {
      name: string
      avatar: string
    }
    date: string
    category: string
  }
}

export default function PostTranslation({ post }: PostTranslationProps) {
  const [translatedPost, setTranslatedPost] = useState<string | null>(null)
  const { toast } = useToast()

  const handleTranslated = (translatedText: string) => {
    setTranslatedPost(translatedText)
    toast({
      title: "Post translated",
      description: "This post has been translated to your selected language",
    })
  }

  // Split the translated text into title and content if available
  const translatedTitle = translatedPost ? translatedPost.split("\n\n")[0] : post.title

  const translatedContent = translatedPost ? translatedPost.split("\n\n")[1] : post.content

  return (
    <Card className="p-5 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-semibold">{translatedTitle}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span className="font-medium">{post.author.name}</span>
            <span className="mx-2">•</span>
            <span>{post.date}</span>
            <span className="mx-2">•</span>
            <span>{post.category}</span>
          </div>
        </div>
        <TranslationDropdown text={`${post.title}\n\n${post.content}`} onTranslated={handleTranslated} />
      </div>
      <p className="text-gray-700">{translatedContent}</p>
    </Card>
  )
}

