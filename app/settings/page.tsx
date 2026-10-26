"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import {
  ArrowRight,
  Bug,
  Database,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Loader2,
  Monitor,
  Moon,
  Sun,
  Upload,
  Wrench,
} from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import Layout from "@/components/Layout"
import { PageHeader } from "@/components/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToast } from "@/hooks/use-toast"
import { downloadFile } from "@/lib/download"
import type { TranslationKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type ImportType = "guests" | "gifts"

interface ImportResult {
  success: number
  total: number
  errors: string[]
}

interface DebugGift {
  _id: string
  guestName: string
  type: string
  paymentMethod?: string
  hasPaymentMethod: boolean
}

const IMPORTS: { type: ImportType; title: TranslationKey; columns: string[]; rules: TranslationKey[] }[] = [
  {
    type: "guests",
    title: "settings.importGuests",
    columns: ["Name", "Phone", "Guest Type", "Notes"],
    rules: ["settings.guestRules1", "settings.guestRules2", "settings.guestRules3"],
  },
  {
    type: "gifts",
    title: "settings.importGifts",
    columns: ["Guest ID", "Type", "Amount", "Currency", "Payment Method", "Description"],
    rules: ["settings.giftRules1", "settings.giftRules2", "settings.giftRules3"],
  },
]

export default function SettingsPage() {
  const [uploading, setUploading] = useState<ImportType | null>(null)
  const [results, setResults] = useState<Partial<Record<ImportType, ImportResult>>>({})
  const [debugGifts, setDebugGifts] = useState<DebugGift[] | null>(null)
  const [confirmFix, setConfirmFix] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: ImportType) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setUploading(type)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/upload/excel/${type}`, { method: "POST", body: formData })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || t("settings.importFailed"))

      setResults((prev) => ({ ...prev, [type]: result }))
      toast({
        title: t("settings.importDone", { success: result.success, total: result.total }),
        description: result.errors.length ? t("settings.importErrors", { count: result.errors.length }) : undefined,
      })
    } catch (error) {
      toast({
        title: t("settings.importFailed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  const downloadSample = async (type: ImportType) => {
    try {
      await downloadFile(`/api/download/sample?type=${type}`, `sample-${type}.csv`)
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  const fetchDebugInfo = async () => {
    const response = await fetch("/api/debug/gifts")
    if (response.ok) setDebugGifts((await response.json()).gifts)
  }

  const runMigration = async () => {
    const response = await fetch("/api/migrate-gifts", { method: "POST" })
    if (response.ok) {
      const result = await response.json()
      toast({ title: t("settings.fixPaymentsDone", { count: result.updatedCount }) })
    } else {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  const themes = [
    { value: "light", label: t("settings.themeLight"), icon: Sun },
    { value: "dark", label: t("settings.themeDark"), icon: Moon },
    { value: "system", label: t("settings.themeSystem"), icon: Monitor },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader title={t("settings.title")} description={t("settings.subtitle")} />

        {session?.user?.role === "admin" && (
          <Link href="/users" className="block">
            <Card className="flex items-center gap-4 p-5 transition-colors hover:bg-accent/40">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <ShieldCheck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t("users.title")}</p>
                <p className="text-sm text-muted-foreground">{t("users.subtitle")}</p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground" />
            </Card>
          </Link>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("settings.appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("settings.language")}</p>
              <LanguageSwitcher className="text-sm" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("settings.theme")}</p>
              <div className="inline-flex rounded-lg border bg-muted/60 p-0.5">
                {themes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors",
                      theme === value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {IMPORTS.map(({ type, title, columns, rules }) => {
            const result = results[type]
            return (
              <Card key={type} className="flex flex-col">
                <CardHeader>
                  <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <FileSpreadsheet className="size-5" />
                  </span>
                  <CardTitle>{t(title)}</CardTitle>
                  <CardDescription>{t("settings.chooseFile")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("settings.requiredFormat")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {columns.map((column) => (
                        <Badge key={column} variant="outline" className="font-mono text-[11px]">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {rules.map((rule) => (
                      <li key={rule}>{t(rule)}</li>
                    ))}
                  </ul>

                  {result && (
                    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                      <p className="font-medium">
                        {t("settings.importDone", { success: result.success, total: result.total })}
                      </p>
                      {result.errors.length > 0 && (
                        <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto text-xs text-destructive">
                          {result.errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button asChild>
                      <label className={cn(uploading && "pointer-events-none opacity-60")}>
                        {uploading === type ? <Loader2 className="animate-spin" /> : <Upload />}
                        {uploading === type ? t("settings.importing") : t(title)}
                        <input
                          type="file"
                          accept=".csv,.xlsx"
                          className="sr-only"
                          disabled={!!uploading}
                          onChange={(e) => handleFileUpload(e, type)}
                        />
                      </label>
                    </Button>
                    <Button variant="outline" onClick={() => downloadSample(type)}>
                      <Download />
                      {t("settings.downloadSample")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="size-4 text-muted-foreground" />
              {t("settings.tools")}
            </CardTitle>
            <CardDescription>{t("settings.toolsHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={fetchDebugInfo}>
                <Bug />
                {t("settings.debugGifts")}
              </Button>
              <Button variant="outline" onClick={() => setConfirmFix(true)}>
                <Database />
                {t("settings.fixPayments")}
              </Button>
            </div>

            {debugGifts && (
              <div className="rounded-xl border">
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                  <p className="text-sm font-medium">
                    {t("settings.debugTitle")} ({debugGifts.length})
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setDebugGifts(null)}>
                    {t("settings.hide")}
                  </Button>
                </div>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">{t("gifts.guestName")}</th>
                        <th className="px-4 py-2 font-medium">{t("gifts.type")}</th>
                        <th className="px-4 py-2 font-medium">{t("gifts.paymentMethod")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {debugGifts.map((gift) => (
                        <tr key={gift._id}>
                          <td className="px-4 py-2">{gift.guestName}</td>
                          <td className="px-4 py-2">{gift.type}</td>
                          <td className="px-4 py-2 font-mono">
                            {gift.hasPaymentMethod ? (
                              gift.paymentMethod
                            ) : gift.type === "money" ? (
                              <span className="text-destructive">{t("gifts.missing")}</span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={confirmFix}
          onOpenChange={setConfirmFix}
          title={t("settings.fixPayments")}
          description={t("settings.fixPaymentsConfirm")}
          confirmLabel={t("common.continue")}
          destructive={false}
          onConfirm={runMigration}
        />
      </div>
    </Layout>
  )
}
