"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Globe, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type SupportedLanguage, languageNames, translateText } from "@/lib/translation-service"

type TranslationDropdownProps = {
  text: string
  originalLanguage?: SupportedLanguage
}

export default function TranslationDropdown({ text, originalLanguage = "en" }: TranslationDropdownProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(originalLanguage)
  const { toast } = useToast()

  const handleTranslate = async (targetLanguage: SupportedLanguage) => {
    if (currentLanguage === targetLanguage) {
      // If already in this language, do nothing
      return
    }

    setIsTranslating(true)

    try {
      // If we're going back to original, just reset
      if (targetLanguage === originalLanguage) {
        setTranslatedText(null)
        setCurrentLanguage(originalLanguage)
        return
      }

      const result = await translateText(text, originalLanguage, targetLanguage)
      setTranslatedText(result)
      setCurrentLanguage(targetLanguage)

      toast({
        title: "Translation complete",
        description: `Translated to ${languageNames[targetLanguage]}`,
      })
    } catch (error) {
      console.error("Translation error:", error)
      toast({
        title: "Translation failed",
        description: "Could not translate the text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Translate to</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(languageNames).map(([code, name]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleTranslate(code as SupportedLanguage)}
              className={currentLanguage === code ? "bg-purple-50 text-purple-600 font-medium" : ""}
            >
              {name}
              {currentLanguage === code && " (current)"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {translatedText && (
        <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Translated to {languageNames[currentLanguage]}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                setTranslatedText(null)
                setCurrentLanguage(originalLanguage)
              }}
            >
              Show original
            </Button>
          </div>
          <p>{translatedText}</p>
        </div>
      )}
    </div>
  )
}

