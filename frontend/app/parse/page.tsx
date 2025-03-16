"use client"

import React, { useState, useRef } from "react"
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
  { code: "en-IN", name: "English" },
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

export default function PDFParseTranslate() {
  const [file, setFile] = useState<File | null>(null)
  const [targetLanguage, setTargetLanguage] = useState("en-IN") 
  const [pageNumber, setPageNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processedData, setProcessedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [question, setQuestion] = useState("")

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
      setProcessedData(null)
    }
  }

  const handleProcess = async () => {
    if (!file) {
      setError("Please select a PDF file")
      return
    }

    setIsProcessing(true)
    setProgress(10)
    setError(null)
    setSuccess(false)
    setProcessedData(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("target_lang", targetLanguage)
      if (pageNumber) {
        formData.append("page_number", pageNumber)
      }
      if (question) {
        formData.append("question", question)
      }

      setProgress(30)
      
      console.log("Sending request to:", `${API_URL}/parse-and-analyze-pdf`)
      console.log("FormData keys:", Array.from(formData.keys()))
      
      const response = await fetch(`${API_URL}/parse-and-analyze-pdf`, {
        method: "POST",
        body: formData,
      })

      setProgress(70)

      if (!response.ok) {
        let errorText = "Failed to process PDF";
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (e) {
          // If response isn't JSON, use the status text
          errorText = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorText);
      }

      const data = await response.json()
      setProcessedData(data)
      setProgress(100)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      console.error("PDF processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setProcessedData(null)
    setError(null)
    setSuccess(false)
    setProgress(0)
    setQuestion("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">PDF Parser & Translator</h1>

        <Tabs defaultValue="parse" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parse">Parse & Analyze PDF</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="parse">
            <Card>
              <CardHeader>
                <CardTitle>Process PDF Document</CardTitle>
                <CardDescription>Upload a PDF file and extract text, analyze, and translate it.</CardDescription>
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
                    Processing specific pages is faster. Leave empty to process the entire document.
                  </p>
                </div>

                {/* Question (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="question">Question (Optional)</Label>
                  <Input
                    id="question"
                    type="text"
                    placeholder="Ask a question about the document"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask a question to analyze the document content.
                  </p>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
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
                    <AlertDescription>Your PDF has been successfully processed!</AlertDescription>
                  </Alert>
                )}

                {/* Results */}
                {processedData && (
                  <div className="space-y-2">
                    <Label>Extracted Text Preview</Label>
                    <div className="border rounded-md overflow-auto h-[200px] p-2 whitespace-pre-line">
                      {processedData.extracted_text}
                    </div>
                    {processedData.translated_text && (
                      <>
                        <Label>Translated Text Preview</Label>
                        <div className="border rounded-md overflow-auto h-[200px] p-2 whitespace-pre-line">
                          {processedData.translated_text}
                        </div>
                      </>
                    )}
                    {processedData.answer && (
                      <>
                        <Label>Answer to Question</Label>
                        <div className="border rounded-md overflow-auto h-[100px] p-2 whitespace-pre-line">
                          {processedData.answer}
                        </div>
                      </>
                    )}
                    {processedData.translated_answer && (
                      <>
                        <Label>Translated Answer</Label>
                        <div className="border rounded-md overflow-auto h-[100px] p-2 whitespace-pre-line">
                          {processedData.translated_answer}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={resetForm} disabled={isProcessing}>
                  Reset
                </Button>
                <Button onClick={handleProcess} disabled={!file || isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Languages className="mr-2 h-4 w-4" />
                      Process PDF
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About PDF Parser & Translator</CardTitle>
                <CardDescription>How our PDF processing service works</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Features</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Extract text from PDF documents</li>
                    <li>Translate extracted text to multiple Indian languages</li>
                    <li>Analyze document content with questions</li>
                    <li>Option to process specific pages</li>
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
                    Our PDF processing service uses advanced AI to extract text, analyze content, and translate your
                    documents. The service is powered by Sarvam AI's parsing and translation APIs, along with Groq's
                    LLM for question answering.
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