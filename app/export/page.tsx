"use client"

import { useState } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { Download, FileSpreadsheet, FileText } from "lucide-react"

export default function ExportPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleExport = async (type: "guests" | "gifts", format: "csv" | "xlsx", status?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type,
        format,
        ...(status && status !== "all" && { status }),
      })

      if (format === "csv") {
        const response = await fetch(`/api/export?${params}`)
        if (response.ok) {
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
      } else {
        // For Excel export, we'll use a client-side library
        const response = await fetch(`/api/export?${params}`)
        if (response.ok) {
          const data = await response.json()
          await exportToExcel(data.headers, data.data, `${type}-export.xlsx`)
        }
      }

      toast({
        title: "Success",
        description: "Data exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = async (headers: string[], data: any[][], filename: string) => {
    // This is a simplified Excel export - in a real app you'd use a library like xlsx
    const csvContent = [headers.join(","), ...data.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.replace(".xlsx", ".csv") // Fallback to CSV for now
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Guests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Guests</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Status</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Guests</SelectItem>
                    <SelectItem value="Confirmed">Confirmed Only</SelectItem>
                    <SelectItem value="Pending">Pending Only</SelectItem>
                    <SelectItem value="Not Attending">Not Attending Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleExport("guests", "csv")}
                  disabled={loading}
                  className="flex-1"
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button onClick={() => handleExport("guests", "xlsx")} disabled={loading} className="flex-1">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Gifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Gifts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Type</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gifts</SelectItem>
                    <SelectItem value="money">Money Only</SelectItem>
                    <SelectItem value="item">Items Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleExport("gifts", "csv")}
                  disabled={loading}
                  className="flex-1"
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button onClick={() => handleExport("gifts", "xlsx")} disabled={loading} className="flex-1">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900">Guest Export includes:</h4>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Guest ID, Name, Phone, Email</li>
                  <li>Attendance Status</li>
                  <li>Table Number and Notes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Gift Export includes:</h4>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Guest ID and Name</li>
                  <li>Gift Type (Money/Item)</li>
                  <li>Amount and Description</li>
                  <li>Date Added</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
