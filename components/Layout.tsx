"use client"

import type React from "react"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Download, Gift, LayoutDashboard, LogOut, Settings, ShieldCheck, Users } from "lucide-react"
import { BrandMark } from "@/components/BrandMark"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { PageLoader } from "@/components/PageLoader"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/LanguageContext"
import type { TranslationKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const NAV_ITEMS: { href: string; label: TranslationKey; icon: typeof Users }[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/guests", label: "nav.guests", icon: Users },
  { href: "/gifts", label: "nav.gifts", icon: Gift },
  { href: "/export", label: "nav.export", icon: Download },
  { href: "/settings", label: "nav.settings", icon: Settings },
]

// Admin-only; on mobile it is reached from the Settings page to keep the bottom bar at five items
const ADMIN_NAV_ITEM = { href: "/users", label: "nav.users" as TranslationKey, icon: ShieldCheck }

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.disabled) {
      signOut({ callbackUrl: "/login?error=disabled" })
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageLoader label={t("common.loading")} />
      </div>
    )
  }

  if (!session || session.user.disabled) {
    return null
  }

  const sidebarItems = session.user.role === "admin" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)
  const handleSignOut = () => signOut({ callbackUrl: "/login" })
  const userName = session.user?.name || session.user?.email || ""

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card/70 backdrop-blur lg:flex">
        <div className="flex h-16 items-center gap-3 px-5">
          <BrandMark />
          <span className="text-sm font-semibold leading-tight">{t("app.name")}</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-[18px]" />
              {t(label)}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t p-4">
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session.user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{session.user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              aria-label={t("nav.logout")}
              title={t("nav.logout")}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="size-8" />
          <span className="truncate text-sm font-semibold">{t("app.name")}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label={t("nav.logout")}>
            <LogOut />
          </Button>
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                isActive(href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  isActive(href) && "bg-accent",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="max-w-full truncate px-1">{t(label)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
