"use client"

import { CheckCircle2, Download, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLanguage } from "@/contexts/LanguageContext"
import { useInstallPrompt } from "@/hooks/use-install-prompt"

export function InstallAppCard() {
  const { state, install } = useInstallPrompt()
  const { t } = useLanguage()

  if (!state) return null

  return (
    <Card className="flex flex-wrap items-center gap-4 p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
        <Smartphone className="size-5" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-semibold">{t("install.title")}</p>
        <p className="text-sm text-muted-foreground">
          {state === "installed"
            ? t("install.installed")
            : state === "ios"
              ? t("install.ios")
              : state === "manual"
                ? t("install.manual")
                : t("install.hint")}
        </p>
      </div>
      {state === "prompt" && (
        <Button onClick={install} className="shrink-0">
          <Download />
          {t("install.button")}
        </Button>
      )}
      {state === "installed" && <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />}
    </Card>
  )
}
