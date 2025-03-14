import HeroSection from "@/components/loan-advisor/hero-section"
import FeatureSection from "@/components/loan-advisor/feature-section"
import UspSection from "@/components/loan-advisor/usp-section"
import TechStack from "@/components/loan-advisor/tech-stack"
import CtaSection from "@/components/loan-advisor/cta-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection />
      <FeatureSection />
      <UspSection />
      <TechStack />
      <CtaSection />
    </div>
  )
}

