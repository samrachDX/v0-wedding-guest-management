"use client"

import { useState } from "react"
import { Download, FileText, Gift, Loader2, Users } from "lucide-react"
import Layout from "@/components/Layout"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToast } from "@/hooks/use-toast"
import { downloadFile } from "@/lib/download"

export default function ExportPage() {
  const [exporting, setExporting] = useState<"guests" | "gifts" | null>(null)
  const [guestFilter, setGuestFilter] = useState("all")
  const { toast } = useToast()
  const { t, language } = useLanguage()

  const handleExport = async (type: "guests" | "gifts") => {
    setExporting(type)
    try {
      const params = new URLSearchParams({ type, format: "csv", language })
      if (type === "guests" && guestFilter !== "all") params.append("status", guestFilter)

      await downloadFile(`/api/export?${params}`, `${type}-export.csv`)
      toast({ title: t("export.success") })
    } catch {
      toast({ title: t("common.error"), description: t("export.failed"), variant: "destructive" })
    } finally {
      setExporting(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader title={t("export.title")} description={t("export.subtitle")} />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <Users className="size-5" />
              </span>
              <CardTitle>{t("export.guests")}</CardTitle>
              <CardDescription>{t("export.guestsHint")}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              <Select value={guestFilter} onValueChange={setGuestFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("guests.allGuests")}</SelectItem>
                  <SelectItem value="Groom Side">{t("side.groom")}</SelectItem>
                  <SelectItem value="Bride Side">{t("side.bride")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => handleExport("guests")} disabled={!!exporting} className="w-full">
                {exporting === "guests" ? <Loader2 className="animate-spin" /> : <Download />}
                {t("export.download")}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Gift className="size-5" />
              </span>
              <CardTitle>{t("export.gifts")}</CardTitle>
              <CardDescription>{t("export.giftsHint")}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button onClick={() => handleExport("gifts")} disabled={!!exporting} className="w-full">
                {exporting === "gifts" ? <Loader2 className="animate-spin" /> : <Download />}
                {t("export.download")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-muted-foreground" />
              {t("export.infoTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>{t("export.info1")}</li>
              <li>{t("export.info2")}</li>
              <li>{t("export.info3")}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
