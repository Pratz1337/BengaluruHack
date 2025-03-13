"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Smile, PaperclipIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

type MessageModalProps = {
  isOpen: boolean
  onClose: () => void
  recipient: {
    name: string
    avatar: string
    username: string
  }
}

export default function MessageModal({ isOpen, onClose, recipient }: MessageModalProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Message sent",
        description: `Your message to ${recipient.name} has been sent`,
      })

      setMessage("")
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Message {recipient.name}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 my-4">
          <Image
            src={recipient.avatar || "/placeholder.svg"}
            alt={recipient.name}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <p className="font-medium">{recipient.name}</p>
            <p className="text-sm text-gray-500">@{recipient.username}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder={`Write a message to ${recipient.name}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[150px]"
          />

          <div className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="icon">
              <Smile className="h-5 w-5 text-gray-500" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <PaperclipIcon className="h-5 w-5 text-gray-500" />
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSending}>
              {isSending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

