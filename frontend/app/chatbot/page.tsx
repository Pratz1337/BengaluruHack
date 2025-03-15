import { AuthGuard } from "@/components/auth/auth-guard"
import ChatbotInterface from "./chatbot-interface"

export default function ChatbotPage() {
  return (
    <AuthGuard requireAuth={true}>
      <ChatbotInterface />
    </AuthGuard>
  )
}

