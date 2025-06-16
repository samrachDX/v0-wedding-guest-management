"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { Download, FileText, Users, Gift } from "lucide-react"

export default function ExportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [guestFilter, setGuestFilter] = useState("all")
  const { toast } = useToast()
  const { t, language } = useLanguage()

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const handleExport = async (type: "guests" | "gifts", format: "csv" = "csv") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type,
        format,
        language, // Pass current language to API
      })

      if (type === "guests" && guestFilter !== "all") {
        params.append("status", guestFilter)
      }

      const response = await fetch(`/api/export?${params}`)

      if (response.ok) {
        if (format === "csv") {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${type}-export.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }

        toast({
          title: t("common.success"),
          description: `${type} exported successfully`,
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t("common.loading")}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("export.title")}</h1>
          <p className="text-gray-600 mt-2">
            {language === "km" ? "នាំចេញទិន្នន័យភ្ញៀវ និងអំណោយទៅជាឯកសារ CSV" : "Export guest and gift data to CSV files"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Guests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>{t("export.guests")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === "km" ? "តម្រងតាមប្រភេទភ្ញៀវ" : "Filter by guest type"}
                </label>
                <Select value={guestFilter} onValueChange={setGuestFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "km" ? "ភ្ញៀវទាំងអស់" : "All Guests"}</SelectItem>
                    <SelectItem value="Groom Side">{language === "km" ? "ភាគីកូនប្រុស" : "Groom Side"}</SelectItem>
                    <SelectItem value="Bride Side">{language === "km" ? "ភាគីកូនស្រី" : "Bride Side"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleExport("guests", "csv")}
                disabled={loading}
                className="w-full flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? t("common.loading") : `${t("export.csv")} ${t("export.guests")}`}</span>
              </Button>
            </CardContent>
          </Card>

          {/* Export Gifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="w-5 h-5" />
                <span>{t("export.gifts")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  {language === "km" ? "នាំចេញអំណោយទាំងអស់រួមទាំងប្រាក់ និងរបស់" : "Export all gifts including money and items"}
                </p>
              </div>
              <Button
                onClick={() => handleExport("gifts", "csv")}
                disabled={loading}
                className="w-full flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? t("common.loading") : `${t("export.csv")} ${t("export.gifts")}`}</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Export Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>{language === "km" ? "ព័ត៌មានអំពីការនាំចេញ" : "Export Information"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                {language === "km"
                  ? "• ឯកសារ CSV អាចបើកបានក្នុង Microsoft Excel, Google Sheets, និងកម្មវិធីផ្សេងទៀត"
                  : "• CSV files can be opened in Microsoft Excel, Google Sheets, and other applications"}
              </p>
              <p>
                {language === "km"
                  ? "• ទិន្នន័យនឹងត្រូវបានកូដជា UTF-8 ដើម្បីគាំទ្រអក្សរខ្មែរ"
                  : "• Data is encoded in UTF-8 to support Unicode characters including Khmer"}
              </p>
              <p>
                {language === "km"
                  ? "• ការនាំចេញនឹងរួមបញ្ចូលទិន្នន័យទាំងអស់ដែលអ្នកមានសិទ្ធិចូលប្រើ"
                  : "• Exports include all data you have access to"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
