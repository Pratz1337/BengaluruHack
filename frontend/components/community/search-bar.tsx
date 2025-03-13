"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type SearchResult = {
  id: string
  type: "thread" | "user" | "comment"
  title: string
  preview: string
}

export default function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Debounce search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(() => {
      setIsSearching(true)

      // Mock API call - in a real app, this would be a fetch to your API
      setTimeout(() => {
        const mockResults: SearchResult[] = [
          {
            id: "1",
            type: "thread",
            title: "Budgeting apps for beginners",
            preview: "Looking for recommendations on easy-to-use budgeting apps...",
          },
          {
            id: "2",
            type: "user",
            title: "Alex Morgan",
            preview: "Finance enthusiast and budget planner",
          },
          {
            id: "3",
            type: "comment",
            title: "Re: Investment strategies",
            preview: "I would recommend starting with index funds before...",
          },
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.preview.toLowerCase().includes(query.toLowerCase()),
        )

        setResults(mockResults)
        setIsSearching(false)
        setShowResults(true)
      }, 500)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search discussions, users, or topics..."
          className="pl-10 pr-4 py-2 w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2">{results.length} results found</div>

            {results.map((result) => (
              <div key={result.id} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 mr-2">
                    {result.type === "thread" && <span>📝</span>}
                    {result.type === "user" && <span>👤</span>}
                    {result.type === "comment" && <span>💬</span>}
                  </div>
                  <div>
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-gray-600 truncate">{result.preview}</div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="ghost"
              className="w-full mt-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              View all results
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

