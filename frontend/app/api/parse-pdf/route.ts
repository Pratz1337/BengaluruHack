import { type NextRequest, NextResponse } from "next/server"

// Get API key from environment variable
const SARVAM_API_KEY = process.env.SARVAM_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData()
    const file = formData.get("file") as File
    const targetLang = formData.get("target_lang") as string
    const pageNumber = formData.get("page_number") as string | null
    const question = formData.get("question") as string | null

    // Validate input
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!SARVAM_API_KEY) {
      return NextResponse.json({ success: false, error: "API configuration missing" }, { status: 500 })
    }

    // Prepare form data for the Sarvam API
    const pdfFormData = new FormData()
    pdfFormData.append("pdf", file)
    pdfFormData.append("sarvam_mode", "small")
    pdfFormData.append("prompt_caching", "true")

    if (pageNumber) {
      pdfFormData.append("page_number", pageNumber)
    }

    // Make API request to parse PDF
    const parseResponse = await fetch("https://api.sarvam.ai/parse/parsepdf", {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: pdfFormData,
    })

    if (!parseResponse.ok) {
      const errorData = await parseResponse.json()
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `Failed to parse PDF: ${parseResponse.status} ${parseResponse.statusText}`,
        },
        { status: parseResponse.status },
      )
    }

    // Process the response from Sarvam AI
    const parseData = await parseResponse.json()

    // Decode the base64 XML content
    const base64Xml = parseData.output
    if (!base64Xml) {
      return NextResponse.json({ success: false, error: "No output found in the API response" }, { status: 500 })
    }

    const decodedXml = Buffer.from(base64Xml, "base64").toString("utf-8")

    // Extract text from the XML using a simplified method
    const extractedText = extractTextFromXml(decodedXml)

    // Initialize the result object
    const result: any = {
      success: true,
      extracted_text: extractedText,
    }

    // Handle question answering if provided
    if (question && extractedText && GROQ_API_KEY) {
      const answer = await askLlmAboutPdf(extractedText, question, GROQ_API_KEY)
      result.answer = answer

      // Translate the answer if target language is not English
      if (targetLang !== "en-IN" && answer) {
        const translatedAnswer = await translateText(answer, "en-IN", targetLang, SARVAM_API_KEY)
        result.translated_answer = translatedAnswer
      }
    }

    // Translate the extracted text if target language is not English
    if (targetLang !== "en-IN" && extractedText) {
      // Limit text to translate to avoid long processing times
      const textToTranslate = extractedText.length > 3000 ? extractedText.substring(0, 3000) + "..." : extractedText

      const translatedText = await translateText(textToTranslate, "en-IN", targetLang, SARVAM_API_KEY)
      result.translated_text = translatedText
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("PDF processing error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

// Helper function to extract text from XML
function extractTextFromXml(xmlString: string): string {
  try {
    // Simple regex approach to extract text (for more complex XML, use a proper XML parser)
    // Remove all XML tags, keeping only text content
    const textContent = xmlString
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    return textContent
  } catch (error) {
    console.error("XML parsing error:", error)
    return xmlString // Return raw XML as fallback
  }
}

// Function to ask LLM about the PDF content
async function askLlmAboutPdf(extractedText: string, question: string, apiKey: string): Promise<string> {
  try {
    // Truncate text to fit within token limits (approximately 50,000 chars)
    const truncatedText = extractedText.substring(0, 50000)

    // Prepare the prompt for the LLM
    const systemPrompt =
      "You are an AI assistant that helps users understand documents. Answer questions based only on the provided document content. Be concise but thorough."

    const userPrompt = `
The following is content extracted from a PDF document:

---
${truncatedText}
---

Question about this document: ${question}

Please answer the question based only on the information provided in the document. If the answer isn't contained in the document, state that you don't have enough information to answer.
`

    // Make API request to Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("LLM query error:", error)
    return "Sorry, I couldn't analyze the document at this time."
  }
}

// Function to translate text (with chunking for longer texts)
async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string,
  chunkSize = 950,
): Promise<string> {
  // If source and target are the same, no need to translate
  if (sourceLanguage === targetLanguage) {
    return text
  }

  try {
    // Split text into chunks to stay within API limits
    const chunks = []
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize))
    }

    // Translate each chunk
    const translatedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const response = await fetch("https://api.sarvam.ai/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": apiKey,
          },
          body: JSON.stringify({
            input: chunk,
            source_language_code: sourceLanguage,
            target_language_code: targetLanguage,
            mode: "formal",
            enable_preprocessing: true,
          }),
        })

        if (!response.ok) {
          throw new Error(`Translation error: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        return result.translated_text || chunk
      }),
    )

    // Join all translated chunks
    return translatedChunks.join(" ")
  } catch (error) {
    console.error("Translation error:", error)
    return text // Return original text if translation fails
  }
}

