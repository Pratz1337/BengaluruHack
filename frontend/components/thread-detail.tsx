"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageSquare, Share2, Bookmark, MoreHorizontal } from "lucide-react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Comment = {
  id: string
  author: {
    name: string
    avatar: string
  }
  content: string
  date: string
  likes: number
}

type ThreadDetailProps = {
  id: string
  title: string
  content: string
  category: string
  author: {
    name: string
    avatar: string
  }
  date: string
  likes: number
  comments: Comment[]
}

export default function ThreadDetail({
  id,
  title,
  content,
  category,
  author,
  date,
  likes,
  comments: initialComments,
}: ThreadDetailProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(likes)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1)
    } else {
      setLikeCount(likeCount + 1)
    }
    setIsLiked(!isLiked)
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: "You",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      content: newComment,
      date: "Just now",
      likes: 0,
    }

    setComments([...comments, comment])
    setNewComment("")
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Image
              src={author.avatar || "/placeholder.svg"}
              alt={author.name}
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <h3 className="font-semibold">{author.name}</h3>
              <p className="text-sm text-gray-500">{date}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save Post</DropdownMenuItem>
              <DropdownMenuItem>Copy Link</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Badge className="mb-3 bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">{category}</Badge>

        <h1 className="text-2xl font-bold mb-3">{title}</h1>
        <p className="text-gray-700 mb-6">{content}</p>

        <div className="flex items-center gap-4 py-3 border-t border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1 ${isLiked ? "text-red-500" : "text-gray-600"}`}
            onClick={handleLike}
          >
            <Heart className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} />
            <span>{likeCount}</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
            <MessageSquare className="h-5 w-5" />
            <span>{comments.length}</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1 ml-auto">
            <Bookmark className="h-5 w-5" />
            <span>Save</span>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-4">Comments ({comments.length})</h3>

        <form onSubmit={handleAddComment} className="mb-6">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full mb-2"
          />
          <div className="flex justify-end">
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Post Comment
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-2">
                <Image
                  src={comment.author.avatar || "/placeholder.svg"}
                  alt={comment.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{comment.author.name}</h4>
                      <p className="text-sm text-gray-500">{comment.date}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-gray-700">{comment.content}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-12 mt-2">
                <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{comment.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>Reply</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

