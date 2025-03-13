"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Image, Link, Smile, PaperclipIcon } from "lucide-react"

export default function PostForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, content, category })
    // Reset form
    setTitle("")
    setContent("")
    setCategory("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <h3 className="text-xl font-semibold">Create New Thread</h3>

      <div>
        <Input
          placeholder="Thread title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-2"
          required
        />
      </div>

      <div>
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[150px]"
          required
        />
      </div>

      <div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Budgeting">Budgeting</SelectItem>
            <SelectItem value="Financial Goals">Financial Goals</SelectItem>
            <SelectItem value="Investments">Investments</SelectItem>
            <SelectItem value="Loan Eligibility">Loan Eligibility</SelectItem>
            <SelectItem value="Saving Tips">Saving Tips</SelectItem>
            <SelectItem value="Credit Score">Credit Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="icon">
            <Image className="h-5 w-5 text-gray-500" />
          </Button>
          <Button type="button" variant="ghost" size="icon">
            <Link className="h-5 w-5 text-gray-500" />
          </Button>
          <Button type="button" variant="ghost" size="icon">
            <Smile className="h-5 w-5 text-gray-500" />
          </Button>
          <Button type="button" variant="ghost" size="icon">
            <PaperclipIcon className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
          Post Thread
        </Button>
      </div>
    </form>
  )
}

