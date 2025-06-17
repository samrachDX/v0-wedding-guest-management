"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { Upload, Download, Bug, Database, FileSpreadsheet, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const { toast } = useToast()
  const { t, language } = useLanguage()

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "guests" | "gifts") => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/upload/excel/${type}`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Upload Complete",
          description: `Successfully imported ${result.success} ${type}. ${result.errors.length} errors.`,
        })

        if (result.errors.length > 0) {
          console.log("Upload errors:", result.errors)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const downloadSample = async (type: "guests" | "gifts") => {
    try {
      const response = await fetch(`/api/download/sample?type=${type}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sample-${type}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download sample file",
        variant: "destructive",
      })
    }
  }

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch("/api/debug/gifts")
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
        setShowDebug(true)
      }
    } catch (error) {
      console.error("Failed to fetch debug info:", error)
    }
  }

  const runMigration = async () => {
    if (!confirm("This will update all existing money gifts to have 'Cash' as the default payment method. Continue?")) {
      return
    }

    try {
      const response = await fetch("/api/migrate-gifts", {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Migration Complete",
          description: `Updated ${result.updatedCount} gifts successfully`,
        })
      } else {
        throw new Error("Migration failed")
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "Migration failed",
        variant: "destructive",
      })
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            {language === "km" ? "គ្រប់គ្រងការកំណត់ និងឧបករណ៍ប្រើប្រាស់" : "Manage settings and tools"}
          </p>
        </div>

        {/* Excel Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Guests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>{language === "km" ? "នាំចូលភ្ញៀវពី Excel" : "Import Guests from Excel"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="guests-file">
                  {language === "km" ? "ជ្រើសរើសឯកសារ Excel ឬ CSV" : "Select Excel or CSV file"}
                </Label>
                <Input
                  id="guests-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => handleFileUpload(e, "guests")}
                  disabled={uploading}
                  className="mt-2"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => downloadSample("guests")}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === "km" ? "ទាញយកគំរូ" : "Download Sample"}</span>
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                <p>{language === "km" ? "ទម្រង់ដែលត្រូវការ:" : "Required format:"}</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Name (required)</li>
                  <li>Phone (optional)</li>
                  <li>Guest Type: "Groom Side" or "Bride Side"</li>
                  <li>Notes (optional)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Upload Gifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>{language === "km" ? "នាំចូលអំណោយពី Excel" : "Import Gifts from Excel"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gifts-file">
                  {language === "km" ? "ជ្រើសរើសឯកសារ Excel ឬ CSV" : "Select Excel or CSV file"}
                </Label>
                <Input
                  id="gifts-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => handleFileUpload(e, "gifts")}
                  disabled={uploading}
                  className="mt-2"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => downloadSample("gifts")}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === "km" ? "ទាញយកគំរូ" : "Download Sample"}</span>
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                <p>{language === "km" ? "ទម្រង់ដែលត្រូវការ:" : "Required format:"}</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Guest ID (required)</li>
                  <li>Type: "money" or "item"</li>
                  <li>Amount (for money gifts)</li>
                  <li>Currency: "USD" or "KHR"</li>
                  <li>Payment Method: "Cash" or "KHQR"</li>
                  <li>Description (optional)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug and Maintenance Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="w-5 h-5" />
              <span>{language === "km" ? "ឧបករណ៍បច្ចេកទេស" : "Developer Tools"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={fetchDebugInfo} variant="outline" className="flex items-center space-x-2">
                <Bug className="w-4 h-4" />
                <span>Debug Gifts</span>
              </Button>
              <Button
                onClick={runMigration}
                variant="outline"
                className="flex items-center space-x-2 bg-yellow-50 hover:bg-yellow-100"
              >
                <Database className="w-4 h-4" />
                <span>Fix Payment Methods</span>
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Page</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info Panel */}
        {showDebug && debugInfo && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Debug Information
                <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Total Gifts:</strong> {debugInfo.totalGifts}
                </p>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-1">Guest</th>
                        <th className="text-left p-1">Type</th>
                        <th className="text-left p-1">Payment Method</th>
                        <th className="text-left p-1">Has PM</th>
                        <th className="text-left p-1">PM Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugInfo.gifts.map((gift: any) => (
                        <tr key={gift._id} className="border-b">
                          <td className="p-1">{gift.guestName}</td>
                          <td className="p-1">{gift.type}</td>
                          <td className="p-1 font-mono">"{gift.paymentMethod}"</td>
                          <td className="p-1">{gift.hasPaymentMethod ? "✅" : "❌"}</td>
                          <td className="p-1">{gift.paymentMethodType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Status */}
        {uploading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{language === "km" ? "កំពុងនាំចូល..." : "Uploading..."}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5" />
              <span>{language === "km" ? "សេចក្តីណែនាំ" : "Instructions"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {language === "km" ? "ការនាំចូលភ្ញៀវ:" : "Importing Guests:"}
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    {language === "km"
                      ? "ទាញយកឯកសារគំរូដើម្បីមើលទម្រង់ត្រឹមត្រូវ"
                      : "Download the sample file to see the correct format"}
                  </li>
                  <li>
                    {language === "km" ? "ឈ្មោះភ្ញៀវត្រូវតែមាន និងមិនអាចទទេ" : "Guest names are required and cannot be empty"}
                  </li>
                  <li>
                    {language === "km"
                      ? "ប្រភេទភ្ញៀវត្រូវតែជា 'Groom Side' ឬ 'Bride Side'"
                      : "Guest type must be exactly 'Groom Side' or 'Bride Side'"}
                  </li>
                  <li>
                    {language === "km"
                      ? "ភ្ញៀវដែលមានឈ្មោះដូចគ្នានឹងត្រូវបានរំលង"
                      : "Guests with duplicate names will be skipped"}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {language === "km" ? "ការនាំចូលអំណោយ:" : "Importing Gifts:"}
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    {language === "km" ? "លេខសម្គាល់ភ្ញៀវត្រូវតែមានស្រាប់ក្នុងប្រព័ន្ធ" : "Guest ID must exist in the system"}
                  </li>
                  <li>
                    {language === "km"
                      ? "សម្រាប់អំណោយប្រាក់ ចំនួន និងវិធីបង់ប្រាក់ត្រូវតែមាន"
                      : "For money gifts, amount and payment method are required"}
                  </li>
                  <li>{language === "km" ? "រូបិយប័ណ្ណត្រូវតែជា 'USD' ឬ 'KHR'" : "Currency must be 'USD' or 'KHR'"}</li>
                  <li>
                    {language === "km" ? "វិធីបង់ប្រាក់ត្រូវតែជា 'Cash' ឬ 'KHQR'" : "Payment method must be 'Cash' or 'KHQR'"}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
