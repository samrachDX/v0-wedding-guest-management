"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import type { Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const OPTIONS: { value: Language; label: string }[] = [
  { value: "km", label: "ខ្មែរ" },
  { value: "en", label: "EN" },
]

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div
      role="radiogroup"
      aria-label={t("common.language")}
      className={cn("inline-flex items-center rounded-lg border bg-muted/60 p-0.5 text-xs font-medium", className)}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={language === option.value}
          onClick={() => setLanguage(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            language === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
