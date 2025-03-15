"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"

type AuthGuardProps = {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to landing page if authentication is required but user is not logged in
        router.push("/")
      } else if (!requireAuth && user) {
        // Redirect to chatbot if user is already logged in and tries to access a non-auth page
        router.push("/chatbot")
      }
    }
  }, [loading, requireAuth, router, user])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // If requireAuth is true and user is not logged in, or requireAuth is false and user is logged in,
  // the useEffect will handle the redirect, so we don't need to render anything here
  if ((requireAuth && !user) || (!requireAuth && user)) {
    return null
  }

  // Otherwise, render the children
  return <>{children}</>
}

