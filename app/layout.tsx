import type React from "react"
import type { Metadata, Viewport } from "next"
import { Kantumruy_Pro } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"

// Kantumruy Pro covers both Khmer and Latin, so both languages share one typeface
const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  variable: "--font-kantumruy",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Wedding Guest Management System",
  description: "Manage wedding guests, gifts, and attendance",
  applicationName: "Wedding Guest System",
  appleWebApp: { capable: true, title: "Wedding Guests", statusBarStyle: "default" },
  icons: { apple: "/apple-icon.png" },
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1416" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={kantumruy.variable}>
      <body className="min-h-dvh font-sans">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
