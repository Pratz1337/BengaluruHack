"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, Languages, ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Environment variable with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

// Language options
const languages = [
  { code: "hi-IN", name: "हिंदी (Hindi)" },
  { code: "bn-IN", name: "বাংলা (Bengali)" },
  { code: "gu-IN", name: "ગુજરાતી (Gujarati)" },
  { code: "kn-IN", name: "ಕನ್ನಡ (Kannada)" },
  { code: "ml-IN", name: "മലയാളം (Malayalam)" },
  { code: "mr-IN", name: "मराठी (Marathi)" },
  { code: "od-IN", name: "ଓଡ଼ିଆ (Odia)" },
  { code: "pa-IN", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ta-IN", name: "தமிழ் (Tamil)" },
  { code: "te-IN", name: "తెలుగు (Telugu)" },
]

export default function PDFTranslator() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [targetLanguage, setTargetLanguage] = useState("hi-IN")
  const [pageNumber, setPageNumber] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [translatedPdfUrl, setTranslatedPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleTranslate = async () => {
    if (!file) {
      setError("Please select a PDF file")
      return
    }

    setIsTranslating(true)
    setProgress(10)
    setError(null)
    setSuccess(false)
    setTranslatedPdfUrl(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("target_lang", targetLanguage)

      if (pageNumber) {
        formData.append("page_number", pageNumber)
      }

      setProgress(30)

      const response = await fetch(`${API_URL}/translate-document`, {
        method: "POST",
        body: formData,
      })

      setProgress(70)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to translate PDF")
      }

      const data = await response.json()

      if (data.success) {
        setProgress(100)
        // Create a blob from the base64 PDF
        const pdfBlob = base64ToBlob(data.translated_pdf, "application/pdf")
        const url = URL.createObjectURL(pdfBlob)
        setTranslatedPdfUrl(url)
        setSuccess(true)
      } else {
        throw new Error(data.error || "Failed to translate PDF")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsTranslating(false)
    }
  }

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64)
    const byteArrays = []
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const slice = byteCharacters.slice(i, i + 512)
      const byteNumbers = new Array(slice.length)
      for (let j = 0; j < slice.length; j++) {
        byteNumbers[j] = slice.charCodeAt(j)
      }
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }
    return new Blob(byteArrays, { type: mimeType })
  }

  const downloadTranslatedPdf = () => {
    if (translatedPdfUrl) {
      const a = document.createElement("a")
      a.href = translatedPdfUrl
      a.download = `translated_${file?.name || "document"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const resetForm = () => {
    setFile(null)
    setTranslatedPdfUrl(null)
    setError(null)
    setSuccess(false)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">PDF Translator</h1>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Chatbot
          </Button>
        </div>

        <Tabs defaultValue="translate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="translate">Translate PDF</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="translate">
            <Card>
              <CardHeader>
                <CardTitle>Translate PDF Document</CardTitle>
                <CardDescription>Upload a PDF file and translate it to your preferred language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="pdf-file">Upload PDF</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="pdf-file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0">
                      <Upload className="h-4 w-4 mr-2" />
                      Browse
                    </Button>
                  </div>
                  {file && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {/* Language Selection */}
                <div className="space-y-2">
                  <Label htmlFor="target-language">Target Language</Label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger id="target-language" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Page Number (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="page-number">Page Number (Optional)</Label>
                  <Input
                    id="page-number"
                    type="number"
                    min="1"
                    placeholder="Leave empty for all pages"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Translating specific pages is faster. Leave empty to translate the entire document.
                  </p>
                </div>

                {/* Progress Bar */}
                {isTranslating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Translating...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Success Message */}
                {success && (
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
                    <AlertDescription>Your PDF has been successfully translated!</AlertDescription>
                  </Alert>
                )}

                {/* Preview */}
                {translatedPdfUrl && (
                  <div className="space-y-2">
                    <Label>Translated PDF Preview</Label>
                    <div className="border rounded-md overflow-hidden h-[400px]">
                      <iframe src={translatedPdfUrl} className="w-full h-full" title="Translated PDF" />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={resetForm} disabled={isTranslating}>
                  Reset
                </Button>
                <div className="flex gap-2">
                  {translatedPdfUrl && (
                    <Button variant="outline" onClick={downloadTranslatedPdf}>
                      Download
                    </Button>
                  )}
                  <Button onClick={handleTranslate} disabled={!file || isTranslating}>
                    {isTranslating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Languages className="mr-2 h-4 w-4" />
                        Translate PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About PDF Translator</CardTitle>
                <CardDescription>How our PDF translation service works</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Features</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Translate PDF documents to multiple Indian languages</li>
                    <li>Preserve original document formatting</li>
                    <li>Option to translate specific pages</li>
                    <li>Download translated documents</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Supported Languages</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {languages.map((lang) => (
                      <div key={lang.code} className="flex items-center">
                        <ArrowRight className="h-3 w-3 mr-2 text-muted-foreground" />
                        <span>{lang.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">How It Works</h3>
                  <p>
                    Our PDF translator uses advanced AI to analyze and translate your documents while preserving the
                    original layout. The service is powered by Sarvam AI's translation API, which specializes in Indian
                    languages.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

