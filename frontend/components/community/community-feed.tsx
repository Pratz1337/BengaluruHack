"use client"

import { useState, useEffect } from "react"
import { Search, TrendingUp, Clock, Bookmark, Filter, PlusCircle, Share2, MessageSquare, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Image from "next/image"
import { cn } from "@/lib/utils"
import NewThreadModal from "@/components/community/new-thread-modal"
import TranslationDropdown from "@/components/community/translation-dropdown"
import { useToast } from "@/hooks/use-toast"
import { SupportedLanguage } from "@/lib/translation-types"
import { translateText } from "@/lib/translation-service"

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
  liked?: boolean
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
interface CommunityFeedProps {
  preferredLanguage: SupportedLanguage;
  shouldTranslate?: boolean;
}

export default function CommunityFeed({ preferredLanguage, shouldTranslate = false }: CommunityFeedProps) {
  const [activeTab, setActiveTab] = useState<Tab>("latest")
  const [activeCategory, setActiveCategory] = useState<Category>("All")
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>(THREADS)
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [translatedContent, setTranslatedContent] = useState<{
    title?: string;
    threads?: Record<string, { title: string; content: string }>;
  }>({});

  // Add effect to translate all content when shouldTranslate changes
  useEffect(() => {
    const translateAllContent = async () => {
      if (!shouldTranslate || preferredLanguage === "en") return;
      
      try {
        // Translate page title
        const titleResult = await translateText("Community", "en", preferredLanguage);
        
        // Translate all threads
        const threadsTranslations: Record<string, { title: string; content: string }> = {};
        
        for (const thread of filteredThreads) {
          const combinedText = `${thread.title}\n\n${thread.content}`;
          const translatedText = await translateText(combinedText, "en", preferredLanguage);
          const [translatedTitle, translatedContent] = translatedText.split('\n\n');
          
          threadsTranslations[thread.id] = {
            title: translatedTitle || thread.title,
            content: translatedContent || thread.content
          };
        }
        
        setTranslatedContent({
          title: titleResult,
          threads: threadsTranslations
        });
        
      } catch (error) {
        console.error("Error translating all content:", error);
      }
    };
    
    translateAllContent();
  }, [shouldTranslate, preferredLanguage, filteredThreads]);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      // If search is cleared, reset to filtered by category
      handleCategoryChange(activeCategory)
      return
    }

    // Filter threads by search query
    const searchResults = THREADS.filter(
      (thread) =>
        thread.title.toLowerCase().includes(query.toLowerCase()) ||
        thread.content.toLowerCase().includes(query.toLowerCase()) ||
        thread.author.name.toLowerCase().includes(query.toLowerCase()) ||
        thread.category.toLowerCase().includes(query.toLowerCase()),
    )

    // Apply category filter if not 'All'
    if (activeCategory !== "All") {
      setFilteredThreads(searchResults.filter((thread) => thread.category === activeCategory))
    } else {
      setFilteredThreads(searchResults)
    }
  }

  const handleNewThreadSubmit = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Create a new thread
    const newThread: Thread = {
      id: Date.now().toString(),
      title: data.title,
      content: data.content,
      category: data.category as Category,
      author: {
        name: "Alex Morgan",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      date: "Just now",
      likes: 0,
      comments: 0,
    }

    // Add to threads and update filtered threads
    THREADS.unshift(newThread)

    // Update filtered threads based on current category
    if (activeCategory === "All" || activeCategory === newThread.category) {
      setFilteredThreads([newThread, ...filteredThreads])
    }

    return true
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
          <h2 className="text-3xl font-bold">
            {shouldTranslate && translatedContent.title ? translatedContent.title : "Community"}
          </h2>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsNewThreadModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Thread
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search discussions..."
            className="pl-10 pr-10 py-2 w-full border-gray-300 rounded-md"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
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
            <ThreadList threads={filteredThreads} translatedContent={translatedContent} shouldTranslate={shouldTranslate} />
          </TabsContent>
          <TabsContent value="latest" className="space-y-6">
            <ThreadList threads={filteredThreads} translatedContent={undefined} shouldTranslate={false} />
          </TabsContent>
          <TabsContent value="popular" className="space-y-6">
            <ThreadList threads={filteredThreads} translatedContent={undefined} shouldTranslate={false} />
          </TabsContent>
          <TabsContent value="saved" className="space-y-6">
            <ThreadList threads={filteredThreads} translatedContent={undefined} shouldTranslate={false} />
          </TabsContent>
        </Tabs>
        <NewThreadModal
          isOpen={isNewThreadModalOpen}
          onClose={() => setIsNewThreadModalOpen(false)}
          onSubmit={handleNewThreadSubmit}
        />
      </div>
    </section>
  )
}

function ThreadList({ threads, translatedContent, shouldTranslate }: { threads: Thread[], translatedContent: any, shouldTranslate: boolean }) {
  const [likedThreads, setLikedThreads] = useState<Record<string, boolean>>({})
  const [threadLikes, setThreadLikes] = useState<Record<string, number>>({})
  const [translatedThreads, setTranslatedThreads] = useState<Record<string, string | null>>({})
  const { toast } = useToast()

  // Initialize likes from threads
  useEffect(() => {
    const likes: Record<string, number> = {}
    threads.forEach((thread) => {
      likes[thread.id] = thread.likes
    })
    setThreadLikes(likes)
  }, [threads])

  const handleLike = (threadId: string) => {
    setLikedThreads((prev) => {
      const newLiked = { ...prev }
      newLiked[threadId] = !prev[threadId]
      return newLiked
    })

    setThreadLikes((prev) => {
      const newLikes = { ...prev }
      newLikes[threadId] = prev[threadId] + (likedThreads[threadId] ? -1 : 1)
      return newLikes
    })
  }

  const handleComment = (threadId: string) => {
    // In a real app, this would open a comment form or navigate to the thread
    window.location.href = `/thread/${threadId}`
  }

  return (
    <div className="space-y-6">
      {threads.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No threads found</p>
        </div>
      ) : (
        threads.map((thread) => (
          <div key={thread.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <Image
                src={thread.author.avatar || "/placeholder.svg"}
                alt={thread.author.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <Badge
                    variant="outline"
                    className="mb-2 text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200"
                  >
                    {thread.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Translate</span>
                    <TranslationDropdown 
                      text={`${thread.title}\n\n${thread.content}`} 
                      onTranslated={(translatedText) => {
                        setTranslatedThreads(prev => ({
                          ...prev,
                          [thread.id]: translatedText
                        }))
                        toast({
                          title: "Post translated",
                          description: "This post has been translated to your preferred language"
                        })
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-1">
                  {translatedThreads[thread.id] ? 
                    translatedThreads[thread.id]?.split('\n\n')[0] : 
                    (shouldTranslate && translatedContent.threads?.[thread.id]?.title) || thread.title
                  }
                </h3>
                <p className="text-gray-700 mb-3">
                  {translatedThreads[thread.id] ? 
                    translatedThreads[thread.id]?.split('\n\n')[1] : 
                    (shouldTranslate && translatedContent.threads?.[thread.id]?.content) || thread.content
                  }
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">{thread.author.name}</span>
                  <span className="mx-2">•</span>
                  <span>{thread.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className={`text-gray-600 flex items-center gap-1 ${likedThreads[thread.id] ? "text-red-500" : ""}`}
                onClick={() => handleLike(thread.id)}
              >
                <Heart className="h-4 w-4" fill={likedThreads[thread.id] ? "currentColor" : "none"} />
                <span>{threadLikes[thread.id] || thread.likes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 flex items-center gap-1"
                onClick={() => handleComment(thread.id)}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{thread.comments}</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 flex items-center gap-1 ml-auto">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

