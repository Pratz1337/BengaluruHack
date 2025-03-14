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
import { translateText } from "@/lib/translation-service"
import { type SupportedLanguage, languageNames } from "@/lib/translation-types"

type TranslationDropdownProps = {
  text: string
  originalLanguage?: SupportedLanguage
  onTranslated?: (translatedText: string) => void
}

export default function TranslationDropdown({ text, originalLanguage = "en", onTranslated }: TranslationDropdownProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage | null>(null)
  const { toast } = useToast()

  const handleTranslate = async (targetLanguage: SupportedLanguage) => {
    if (isTranslating) return

    setIsTranslating(true)

    try {
      const result = await translateText(text, originalLanguage, targetLanguage)

      if (onTranslated) {
        onTranslated(result)
      }

      setCurrentLanguage(targetLanguage)

      toast({
        title: "Translation complete",
        description: `Translated to ${languageNames[targetLanguage]}`,
      })
    } catch (error) {
      console.error("Translation failed:", error)
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isTranslating}>
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
  )
}

