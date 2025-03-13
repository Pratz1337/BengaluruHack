"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Image, Link, Smile, PaperclipIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type NewThreadModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export default function NewThreadModal({ isOpen, onClose, onSubmit }: NewThreadModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim() || !category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({ title, content, category })

      // Reset form
      setTitle("")
      setContent("")
      setCategory("")

      toast({
        title: "Thread created",
        description: "Your thread has been posted successfully",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Input
              placeholder="Thread title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mb-2"
            />
          </div>

          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[150px]"
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Thread"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

