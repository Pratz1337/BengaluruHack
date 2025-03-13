"use server"

export type SupportedLanguage =
  | "en" // English
  | "hi" // Hindi
  | "ta" // Tamil
  | "te" // Telugu
  | "bn" // Bengali
  | "mr" // Marathi
  | "kn" // Kannada
  | "ml" // Malayalam
  | "gu" // Gujarati

export const languageNames: Record<SupportedLanguage, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
  kn: "Kannada",
  ml: "Malayalam",
  gu: "Gujarati",
}

export async function translateText(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
): Promise<string> {
  // If source and target are the same, no need to translate
  if (sourceLanguage === targetLanguage) {
    return text
  }

  const apiKey = process.env.SARVAM_API_KEY

  if (!apiKey) {
    throw new Error("SARVAM_API_KEY is not defined")
  }

  const url = "https://api.sarvam.ai/translate"

  // Split text into chunks of 900 characters (leaving room for overhead)
  const chunks = []
  for (let i = 0; i < text.length; i += 900) {
    chunks.push(text.substring(i, i + 900))
  }

  const translatedChunks = []

  for (const chunk of chunks) {
    const payload = {
      input: chunk,
      source_language_code: sourceLanguage,
      target_language_code: targetLanguage,
      mode: "formal",
      enable_preprocessing: true,
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      translatedChunks.push(result.translated_text || chunk)
    } catch (error) {
      console.error("Translation error:", error)
      translatedChunks.push(chunk) // Use original chunk if translation fails
    }
  }

  return translatedChunks.join(" ")
}

