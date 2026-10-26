"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { useServiceWorker } from "@/hooks/use-install-prompt"

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorker()
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
