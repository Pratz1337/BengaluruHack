import { AuthGuard } from "@/components/auth/auth-guard"
import LandingPage from "./landing-page"

export default function Home() {
  return (
    <AuthGuard requireAuth={false}>
      <LandingPage />
    </AuthGuard>
  )
}

