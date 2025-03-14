"use client"

import { useState, useEffect } from "react"
import CommunityFeed from "@/components/community/community-feed"
import ProfileSidebar from "@/components/community/profile-sidebar"
import { Button } from "@/components/ui/button"
import { Globe, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type SupportedLanguage, languageNames } from "@/lib/translation-types"
import { useToast } from "@/hooks/use-toast"
import { translateText } from "@/lib/translation-service"

export default function CommunityPage() {
  const [theme, setTheme] = useState("light")
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguage>("en")
  const [isTranslatingPage, setIsTranslatingPage] = useState(false)
  const [pageTranslated, setPageTranslated] = useState(false)
  const { toast } = useToast()

  // Check for system/saved theme preference
  useEffect(() => {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem("theme")
    // Check if user has a saved language preference
    const savedLanguage = localStorage.getItem("preferredLanguage") as SupportedLanguage

    // Check if system prefers dark mode
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (systemPrefersDark) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }

    if (savedLanguage && languageNames[savedLanguage]) {
      setPreferredLanguage(savedLanguage)
    }
  }, [])

  const handleLanguageChange = (language: SupportedLanguage) => {
    setPreferredLanguage(language)
    localStorage.setItem("preferredLanguage", language)
    
    toast({
      title: "Language preference updated",
      description: `Your preferred language is now set to ${languageNames[language]}`,
    })

    // Reset translation state when language changes
    setPageTranslated(false)
  }

  const handleTranslatePage = async () => {
    if (preferredLanguage === "en" || isTranslatingPage) return;
    
    setIsTranslatingPage(true);
    
    try {
      toast({
        title: "Translating page",
        description: `Translating content to ${languageNames[preferredLanguage]}...`,
      });
      
      setPageTranslated(true);
      
      toast({
        title: "Translation complete",
        description: `Page translated to ${languageNames[preferredLanguage]}`,
      });
    } catch (error) {
      console.error("Page translation error:", error);
      toast({
        title: "Translation failed",
        description: "Could not translate the page. Please try again.",
        variant: "destructive",
      });
      setPageTranslated(false);
    } finally {
      setIsTranslatingPage(false);
    }
  };

  return (
    <main className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      <header
        className={`border-b ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"} py-4 px-6 flex justify-between items-center`}
      >
        <h1 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Community Platform</h1>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleTranslatePage}
            disabled={isTranslatingPage || preferredLanguage === "en" || pageTranslated}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isTranslatingPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Translating...</span>
              </>
            ) : pageTranslated ? (
              <>
                <Globe className="h-4 w-4" />
                <span>Translated</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                <span>Translate Page</span>
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                <span>{languageNames[preferredLanguage]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select preferred language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(languageNames).map(([code, name]) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => handleLanguageChange(code as SupportedLanguage)}
                  className={preferredLanguage === code ? "bg-purple-50 text-purple-600 font-medium" : ""}
                >
                  {name}
                  {preferredLanguage === code && " (current)"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        <ProfileSidebar />
        <CommunityFeed preferredLanguage={preferredLanguage} shouldTranslate={pageTranslated} />
      </div>
    </main>
  )
}

