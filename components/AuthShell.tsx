"use client"

import type React from "react"
import { BrandMark } from "@/components/BrandMark"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useLanguage } from "@/contexts/LanguageContext"

interface AuthShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { t } = useLanguage()

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Decorative panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[oklch(0.45_0.14_10)] via-[oklch(0.55_0.15_15)] to-[oklch(0.72_0.12_60)] lg:block">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-[28rem] rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <BrandMark className="bg-none bg-white/15 shadow-none backdrop-blur" />
            <span className="font-semibold">{t("app.name")}</span>
          </div>
          <div className="max-w-md">
            <p className="text-4xl font-semibold leading-snug">{t("app.tagline")}</p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm text-white/85">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">{t("nav.guests")}</div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">{t("nav.gifts")}</div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">{t("nav.export")}</div>
            </div>
          </div>
          <span aria-hidden />
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-2.5 lg:invisible">
            <BrandMark className="size-8" />
            <span className="text-sm font-semibold">{t("app.name")}</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
