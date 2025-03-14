"use server"

import type { SupportedLanguage } from "./translation-types"

export async function translateText(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
): Promise<string> {
  // If source and target are the same, no need to translate
  if (sourceLanguage === targetLanguage) {
    return text
  }

  const apiKey = 'b7e1c4f0-4c19-4d34-8d2f-6aea1990bdbf'

  if (!apiKey) {
    throw new Error("SARVAM_API_KEY is not defined")
  }

  const url = "https://api.sarvam.ai/translate"

  // Convert language codes to Sarvam API format
  const sourceLanguageCode = `${sourceLanguage}-IN`
  const targetLanguageCode = `${targetLanguage}-IN`

  // Split text into chunks of 900 characters (leaving room for overhead)
  const chunks = []
  for (let i = 0; i < text.length; i += 900) {
    chunks.push(text.substring(i, i + 900))
  }

  const translatedChunks = []

  for (const chunk of chunks) {
    const payload = {
      input: chunk,
      source_language_code: sourceLanguageCode,
      target_language_code: targetLanguageCode,
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

