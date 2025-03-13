"use client"

import { useState } from "react"
import { Search, TrendingUp, Clock, Bookmark, Filter, PlusCircle, Share2, MessageSquare, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Image from "next/image"
import { cn } from "@/lib/utils"

// Types for our data
type Category =
  | "All"
  | "Loan Eligibility"
  | "Financial Goals"
  | "Investments"
  | "Budgeting"
  | "Saving Tips"
  | "Credit Score"
type Tab = "trending" | "latest" | "popular" | "saved"
type Thread = {
  id: string
  title: string
  content: string
  category: Category
  author: {
    name: string
    avatar: string
  }
  date: string
  likes: number
  comments: number
}

// Sample data
const THREADS: Thread[] = [
  {
    id: "1",
    title: "Budgeting apps that actually work?",
    content:
      "I've tried several budgeting apps but always end up abandoning them after a few weeks. Which ones have you found actually help you stick to a budget long-term?",
    category: "Budgeting",
    author: {
      name: "David Williams",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    date: "Nov 15, 4:45 PM",
    likes: 45,
    comments: 28,
  },
  {
    id: "2",
    title: "How are you planning for retirement in your 30s?",
    content:
      "I just turned 30 and realized I haven't been planning enough for retirement. What strategies are others in their 30s using? 401k? Roth IRA? Real estate?",
    category: "Financial Goals",
    author: {
      name: "Jessica Miller",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    date: "Nov 13, 10:07 PM",
    likes: 32,
    comments: 22,
  },
  {
    id: "3",
    title: "Best investment options for beginners in 2023",
    content:
      "I have about $5,000 that I'd like to invest for long-term growth. I'm new to investing and looking for relatively safe options. Any recommendations?",
    category: "Investments",
    author: {
      name: "Michael Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    date: "Nov 10, 2:30 PM",
    likes: 67,
    comments: 41,
  },
]

export default function CommunityFeed() {
  const [activeTab, setActiveTab] = useState<Tab>("latest")
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>(THREADS)

  // Filter threads based on active category
  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category)
    if (category === "All") {
      setFilteredThreads(THREADS)
    } else {
      setFilteredThreads(THREADS.filter((thread) => thread.category === category))
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as Tab)

    // In a real app, you would fetch different data based on the tab
    // For this demo, we'll just simulate different sorting
    let sortedThreads = [...THREADS]

    switch (value) {
      case "trending":
        sortedThreads.sort((a, b) => b.likes - a.likes)
        break
      case "latest":
        sortedThreads.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
      case "popular":
        sortedThreads.sort((a, b) => b.comments - a.comments)
        break
      case "saved":
        // In a real app, you would fetch saved threads
        sortedThreads = sortedThreads.slice(0, 1)
        break
    }

    // Apply category filter if not 'All'
    if (activeCategory !== "All") {
      sortedThreads = sortedThreads.filter((thread) => thread.category === activeCategory)
    }

    setFilteredThreads(sortedThreads)
  }

  const categories: Category[] = [
    "All",
    "Loan Eligibility",
    "Financial Goals",
    "Investments",
    "Budgeting",
    "Saving Tips",
    "Credit Score",
  ]

  return (
    <section className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Community</h2>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Thread
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search discussions..." className="pl-10 pr-10 py-2 w-full border-gray-300 rounded-md" />
          <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="latest" className="mb-6" onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger
              value="trending"
              className={cn(
                "flex items-center justify-center gap-2",
                activeTab === "trending" ? "text-purple-600" : "",
              )}
            >
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="latest"
              className={cn("flex items-center justify-center gap-2", activeTab === "latest" ? "text-purple-600" : "")}
            >
              <Clock className="h-4 w-4" />
              Latest
            </TabsTrigger>
            <TabsTrigger
              value="popular"
              className={cn("flex items-center justify-center gap-2", activeTab === "popular" ? "text-purple-600" : "")}
            >
              <span className="h-4 w-4 flex items-center justify-center font-bold">🔥</span>
              Popular
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className={cn("flex items-center justify-center gap-2", activeTab === "saved" ? "text-purple-600" : "")}
            >
              <Bookmark className="h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-4 py-2 rounded-full",
                  activeCategory === category ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-gray-100",
                )}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          <TabsContent value="trending" className="space-y-6">
            <ThreadList threads={filteredThreads} />
          </TabsContent>
          <TabsContent value="latest" className="space-y-6">
            <ThreadList threads={filteredThreads} />
          </TabsContent>
          <TabsContent value="popular" className="space-y-6">
            <ThreadList threads={filteredThreads} />
          </TabsContent>
          <TabsContent value="saved" className="space-y-6">
            <ThreadList threads={filteredThreads} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function ThreadList({ threads }: { threads: Thread[] }) {
  return (
    <div className="space-y-6">
      {threads.map((thread) => (
        <div key={thread.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3 mb-3">
            <Image
              src={thread.author.avatar || "/placeholder.svg"}
              alt={thread.author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <Badge
                variant="outline"
                className="mb-2 text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200"
              >
                {thread.category}
              </Badge>
              <h3 className="text-xl font-semibold mb-1">{thread.title}</h3>
              <p className="text-gray-700 mb-3">{thread.content}</p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">{thread.author.name}</span>
                <span className="mx-2">•</span>
                <span>{thread.date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{thread.likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{thread.comments}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1 ml-auto">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

