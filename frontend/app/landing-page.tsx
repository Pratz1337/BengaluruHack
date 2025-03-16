"use client"

import { FloatingQR } from "@/components/ui/floating-qr"
import HeroSection from "@/components/loan-advisor/hero-section"
import FeatureSection from "@/components/loan-advisor/feature-section"
import UspSection from "@/components/loan-advisor/usp-section"
import TechStack from "@/components/loan-advisor/tech-stack"
import CtaSection from "@/components/loan-advisor/cta-section"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <HeroSection />
      <FeatureSection />
      <UspSection />
      <TechStack />
      <CtaSection />
      
      {/* Add the QR code component */}
      <FloatingQR 
        qrImagePath="/public/qr.png" 
        altText="Scan to download FinMate app"
        link="https://finmate-app.com/download"
      />
    </main>
  )
}

