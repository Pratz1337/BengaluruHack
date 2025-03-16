"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Home, Languages } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Home",
      icon: <Home className="h-4 w-4 mr-2" />,
      active: pathname === "/",
    },
    {
      href: "/translate",
      label: "Translate PDF",
      icon: <Languages className="h-4 w-4 mr-2" />,
      active: pathname === "/translate",
    },
    {
      href: "/parse",
      label: "Parse PDF",
      icon: <FileText className="h-4 w-4 mr-2" />,
      active: pathname === "/parse",
    },
  ]

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {route.icon}
          {route.label}
        </Link>
      ))}
    </nav>
  )
}

