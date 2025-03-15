"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useChat } from "ai/react"
import { BeatLoader } from "react-spinners"
import { useTranslation } from "next-i18next"
import { useTheme } from "next-themes"
import { useRouter } from "next/router"
import { usePlausible } from "next-plausible"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

import { languages } from "@/config/site"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { DataTable } from "@/components/data-table"
import { columns } from "@/components/columns"
import { loan_products } from "@/data/data"
import { LoanInfoProvider, useLoanInfo } from "@/hooks/use-loan-info"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  language?: string
  original_text?: string
  english_text?: string
  toolCall?: any
  options?: string[]
  dropdown_items?: string[]
  link?: string
  source?: string
  similarity?: number | null
}

interface LoanInfo {
  loan_type: string
  interest_rate: string
  eligibility: string
  repayment_options: string
  additional_info: string
  result?: string
}

export default function ChatbotInterface() {
  const { locale } = useRouter()
  const plausible = usePlausible()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const router = useRouter()

  // Auth hook
  const { user, signOut } = useAuth()
  const { updateLoanInfo } = useLoanInfo()

  // Chatbot hooks
  const [isConfigured, setIsConfigured] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [apiUrl, setApiUrl] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [temperature, setTemperature] = useState(0.0)
  const [topP, setTopP] = useState(1.0)
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.0)
  const [presencePenalty, setPresencePenalty] = useState(0.0)
  const [model, setModel] = useState("mistralai/Mistral-7B-Instruct-v0.2")
  const [stream, setStream] = useState(true)
  const [translate, setTranslate] = useState(false)
  const [language, setLanguage] = useState(locale || "en")
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Ref for the audio player
  const audioRef = useRef<HTMLAudioElement>(null)

  // Initialize the chat hook
  const { append, isLoading, setInput, input } = useChat({
    api: "/api/chat",
    body: {
      apiKey: apiKey,
      apiUrl: apiUrl,
      stream: stream,
      translate: translate,
      language: language,
      model: model,
      temperature: temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
    },
    onResponse: () => {
      setIsBotTyping(false)
    },
    onFinish: (message) => {
      setIsBotTyping(false)
      console.log("Chat finished", message)
    },
  })

  // Load settings from local storage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem("apiKey")
    const storedApiUrl = localStorage.getItem("apiUrl")
    const storedIsAudioEnabled = localStorage.getItem("isAudioEnabled") === "true"
    const storedTemperature = localStorage.getItem("temperature")
    const storedTopP = localStorage.getItem("topP")
    const storedFrequencyPenalty = localStorage.getItem("frequencyPenalty")
    const storedPresencePenalty = localStorage.getItem("presencePenalty")
    const storedModel = localStorage.getItem("model")
    const storedStream = localStorage.getItem("stream") === "true"
    const storedTranslate = localStorage.getItem("translate") === "true"
    const storedLanguage = localStorage.getItem("language")

    if (storedApiKey) setApiKey(storedApiKey)
    if (storedApiUrl) setApiUrl(storedApiUrl)
    setIsAudioEnabled(storedIsAudioEnabled)
    if (storedTemperature) setTemperature(Number.parseFloat(storedTemperature))
    if (storedTopP) setTopP(Number.parseFloat(storedTopP))
    if (storedFrequencyPenalty) setFrequencyPenalty(Number.parseFloat(storedFrequencyPenalty))
    if (storedPresencePenalty) setPresencePenalty(Number.parseFloat(storedPresencePenalty))
    if (storedModel) setModel(storedModel)
    setStream(storedStream)
    setTranslate(storedTranslate)
    if (storedLanguage) setLanguage(storedLanguage)

    // Check if API Key and URL are set
    if (storedApiKey && storedApiUrl) {
      setIsConfigured(true)
    }
  }, [])

  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("apiKey", apiKey)
    localStorage.setItem("apiUrl", apiUrl)
    localStorage.setItem("isAudioEnabled", isAudioEnabled.toString())
    localStorage.setItem("temperature", temperature.toString())
    localStorage.setItem("topP", topP.toString())
    localStorage.setItem("frequencyPenalty", frequencyPenalty.toString())
    localStorage.setItem("presencePenalty", presencePenalty.toString())
    localStorage.setItem("model", model)
    localStorage.setItem("stream", stream.toString())
    localStorage.setItem("translate", translate.toString())
    localStorage.setItem("language", language)
  }, [
    apiKey,
    apiUrl,
    isAudioEnabled,
    temperature,
    topP,
    frequencyPenalty,
    presencePenalty,
    model,
    stream,
    translate,
    language,
  ])

  // Function to handle sending messages
  const handleSend = async () => {
    if (!input.trim()) return

    // Add the user's message to the chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Set the bot to typing
    setIsBotTyping(true)

    // Send the message to the chat API
    plausible("Chatbot Message Sent", {
      props: {
        language: language,
        translate: translate,
        model: model,
      },
    })
    await append({
      content: input,
      role: "user",
    })
  }

  // Function to handle socket responses
  const handleSocketResponse = (data: any) => {
    console.log("Received response:", data)
    setIsBotTyping(false)

    // Add the assistant's message to the chat
    if (data.text || (data.res && data.res.msg)) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.text || (data.res && data.res.msg) || "I couldn't process that request",
          timestamp: new Date(data.timestamp || Date.now()),
          language: data.language,
          original_text: data.original_text,
          english_text: data.english_text,
          toolCall: data.res?.toolCall,
          options: data.info?.options || [],
          dropdown_items: data.info?.dropdown_items || [],
          link: data.info?.link || "",
          source: data.res?.source || "",
          similarity: data.res?.similarity || null,
        },
      ])
    }

    // Play the audio response if available
    if (data.audio && audioRef.current) {
      const audio = audioRef.current
      audio.src = `data:audio/wav;base64,${data.audio}`
      audio.play()
      setIsPlaying(true)
    }

    // Update loan information if available
    if (data.info) {
      const newLoanInfo = {
        loan_type: data.info.loan_type || "",
        interest_rate: data.info.interest_rate || "",
        eligibility: data.info.eligibility || "",
        repayment_options: data.info.repayment_options || "",
        additional_info: data.info.additional_info || "",
        result: data.info.result || "",
      }
      updateLoanInfo(newLoanInfo)
    }
  }

  // Function to handle tool calls
  const handleToolCall = async (action: string, id: string) => {
    if (action === "confirm") {
      // Find the message with the tool call
      const message = messages.find((message) => message.id === id)
      if (!message) return

      // Get the selected option
      const selectedOption = message.options?.[0]
      if (!selectedOption) return

      // Add the user's message to the chat
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: selectedOption,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Set the bot to typing
      setIsBotTyping(true)

      // Send the message to the chat API
      plausible("Chatbot Message Sent", {
        props: {
          language: language,
          translate: translate,
          model: model,
        },
      })
      await append({
        content: selectedOption,
        role: "user",
      })
    }
  }

  // Function to handle dropdown selections
  const handleDropdownSelect = async (value: string, id: string) => {
    // Find the message with the tool call
    const message = messages.find((message) => message.id === id)
    if (!message) return

    // Add the user's message to the chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: value,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Set the bot to typing
    setIsBotTyping(true)

    // Send the message to the chat API
    plausible("Chatbot Message Sent", {
      props: {
        language: language,
        translate: translate,
        model: model,
      },
    })
    await append({
      content: value,
      role: "user",
    })
  }

  // Function to handle link clicks
  const handleLinkClick = (link: string) => {
    plausible("Chatbot Link Clicked", {
      props: {
        link: link,
      },
    })
  }

  // Function to handle source clicks
  const handleSourceClick = (source: string) => {
    plausible("Chatbot Source Clicked", {
      props: {
        source: source,
      },
    })
  }

  return (
    <LoanInfoProvider>
      <div className="container relative min-h-screen flex-col items-center">
        <header className="flex w-full shrink-0 items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <Link href="/" className="hidden font-bold sm:inline-block">
              {t("site.name")}
            </Link>
            {!isConfigured && (
              <Badge variant="destructive" className="ml-2">
                {t("chatbot.configuration_required")}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Icons.globe className="mr-2 h-4 w-4" />
                  {languages[locale]?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("select_language")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(languages).map((key) => (
                  <DropdownMenuItem key={key} onClick={() => router.push("/", `/${key}`)}>
                    {languages[key]?.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  {user ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.imageUrl} alt={user.firstName || "Avatar"} />
                      <AvatarFallback>{user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Icons.user className="mr-2 h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.firstName || user?.username || t("guest")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem onClick={() => signOut()}>
                    {t("sign_out")}
                    <Icons.logout className="ml-auto h-4 w-4" />
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => router.push("/sign-in")}>
                    {t("sign_in")}
                    <Icons.login className="ml-auto h-4 w-4" />
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex w-full flex-col items-center space-y-4 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("chatbot.title")}</CardTitle>
              <CardDescription>{t("chatbot.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    {t("chatbot.no_messages")}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="mb-4">
                      <div className="flex items-start space-x-2">
                        {message.role === "user" ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.imageUrl || "/icons/user.svg"} alt={user?.firstName || "Avatar"} />
                            <AvatarFallback>
                              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/icons/logo.svg" alt="Bot Avatar" />
                            <AvatarFallback>B</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div className="text-sm font-bold">{message.role === "user" ? t("you") : t("bot")}</div>
                          <div className="prose max-w-none break-words">
                            {message.content}
                            {message.toolCall && message.options && message.options.length > 0 && (
                              <div className="mt-2">
                                {message.options.map((option, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    className="mr-2"
                                    onClick={() => handleToolCall("confirm", message.id)}
                                  >
                                    {option}
                                  </Button>
                                ))}
                              </div>
                            )}
                            {message.toolCall && message.dropdown_items && message.dropdown_items.length > 0 && (
                              <div className="mt-2">
                                <Select onValueChange={(value) => handleDropdownSelect(value, message.id)}>
                                  <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {message.dropdown_items.map((item, index) => (
                                      <SelectItem key={index} value={item}>
                                        {item}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {message.link && (
                              <div className="mt-2">
                                <Link
                                  href={message.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                  onClick={() => handleLinkClick(message.link || "")}
                                >
                                  {t("chatbot.learn_more")}
                                </Link>
                              </div>
                            )}
                            {message.source && (
                              <div className="mt-2">
                                <Link
                                  href={message.source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                  onClick={() => handleSourceClick(message.source || "")}
                                >
                                  {t("chatbot.source")}
                                </Link>
                              </div>
                            )}
                            {message.similarity !== null && (
                              <div className="mt-2">
                                <Badge variant="secondary">
                                  {t("chatbot.similarity")}: {message.similarity.toFixed(2)}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {message.language && message.language !== "en" && message.english_text && (
                            <div className="mt-2 text-sm text-muted-foreground italic">{message.english_text}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isBotTyping && (
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/icons/logo.svg" alt="Bot Avatar" />
                      <AvatarFallback>B</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold">{t("bot")}</div>
                      <BeatLoader color={theme === "dark" ? "#fff" : "#000"} size={8} />
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex items-center space-x-2">
              <div className="flex-1">
                <form onSubmit={(e) => e.preventDefault()} className="w-full">
                  <Textarea
                    placeholder={t("chatbot.placeholder")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    className="resize-none border-none outline-none shadow-none focus-visible:ring-0"
                    disabled={isLoading || !isConfigured}
                  />
                </form>
              </div>
              <Button type="submit" onClick={handleSend} disabled={isLoading || !isConfigured}>
                {t("send")}
              </Button>
            </CardFooter>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("loan_products")}</CardTitle>
                <CardDescription>{t("loan_products_description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns(t)} data={loan_products} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("calendar")}</CardTitle>
                <CardDescription>{t("calendar_description")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <Icons.calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>{t("pick_date")}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="flex w-full shrink-0 items-center justify-center py-2 text-muted-foreground">
          {t("footer")}
        </footer>
        <audio ref={audioRef} style={{ display: "none" }} controls={false} />
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("settings.title")}</DialogTitle>
              <DialogDescription>{t("settings.description")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="api_key" className="text-right">
                  {t("settings.api_key")}
                </Label>
                <Input id="api_key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="api_url" className="text-right">
                  {t("settings.api_url")}
                </Label>
                <Input id="api_url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  {t("settings.model")}
                </Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mistralai/Mistral-7B-Instruct-v0.2">Mistral-7B-Instruct-v0.2</SelectItem>
                    <SelectItem value="google/gemma-7b-it">Gemma-7b-it</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="temperature" className="text-right">
                  {t("settings.temperature")}
                </Label>
                <Slider
                  id="temperature"
                  defaultValue={[temperature]}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => setTemperature(value[0])}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="top_p" className="text-right">
                  {t("settings.top_p")}
                </Label>
                <Slider
                  id="top_p"
                  defaultValue={[topP]}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => setTopP(value[0])}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency_penalty" className="text-right">
                  {t("settings.frequency_penalty")}
                </Label>
                <Slider
                  id="frequency_penalty"
                  defaultValue={[frequencyPenalty]}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setFrequencyPenalty(value[0])}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="presence_penalty" className="text-right">
                  {t("settings.presence_penalty")}
                </Label>
                <Slider
                  id="presence_penalty"
                  defaultValue={[presencePenalty]}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setPresencePenalty(value[0])}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stream" className="text-right">
                  {t("settings.stream")}
                </Label>
                <Switch
                  id="stream"
                  checked={stream}
                  onCheckedChange={(checked) => setStream(checked)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="translate" className="text-right">
                  {t("settings.translate")}
                </Label>
                <Switch
                  id="translate"
                  checked={translate}
                  onCheckedChange={(checked) => setTranslate(checked)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="language" className="text-right">
                  {t("settings.language")}
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(languages).map((key) => (
                      <SelectItem key={key} value={key}>
                        {languages[key]?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_audio_enabled" className="text-right">
                  {t("settings.audio")}
                </Label>
                <Switch
                  id="is_audio_enabled"
                  checked={isAudioEnabled}
                  onCheckedChange={(checked) => setIsAudioEnabled(checked)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setIsConfigured(apiKey !== "" && apiUrl !== "")}>
                {t("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <CommandDialog />
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Icons.settings className="h-4 w-4" />
          <span>{t("settings.title")}</span>
        </Button>
      </div>
    </LoanInfoProvider>
  )
}

import Link from "next/link"
import { format } from "date-fns"
import { CommandDialog } from "@/components/command-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

