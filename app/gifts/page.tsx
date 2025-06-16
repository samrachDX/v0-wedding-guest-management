"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { Plus, Search, Eye } from "lucide-react"
import GiftDialog from "@/components/GiftDialog"

interface Gift {
  _id: string
  guestId: number
  guestName: string
  type: "money" | "item"
  amount?: number
  description?: string
  proofImage?: string
  createdAt: string
  currency?: string
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    fetchGifts()
  }, [search, typeFilter])

  const fetchGifts = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (typeFilter !== "all") params.append("type", typeFilter)

      const response = await fetch(`/api/gifts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGifts(data)
      }
    } catch (error) {
      console.error("Error fetching gifts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGift = () => {
    setDialogOpen(true)
  }

  const handleGiftSaved = () => {
    setDialogOpen(false)
    fetchGifts()
  }

  const getTypeBadgeColor = (type: string) => {
    return type === "money" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
  }

  if (loading) {
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{t("gifts.title")}</h1>
          <Button onClick={handleAddGift} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>{t("gifts.addGift")}</span>
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by guest ID or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="money">{t("gifts.money")}</SelectItem>
                  <SelectItem value="item">{t("gifts.item")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Gifts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gifts ({gifts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">{t("gifts.guestId")}</th>
                    <th className="text-left py-3 px-4">{t("gifts.guestName")}</th>
                    <th className="text-left py-3 px-4">{t("gifts.type")}</th>
                    <th className="text-left py-3 px-4">{t("gifts.amount")}</th>
                    <th className="text-left py-3 px-4">{t("gifts.description")}</th>
                    <th className="text-left py-3 px-4">{t("gifts.proof")}</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {gifts.map((gift) => (
                    <tr key={gift._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{gift.guestId}</td>
                      <td className="py-3 px-4">{gift.guestName}</td>
                      <td className="py-3 px-4">
                        <Badge className={getTypeBadgeColor(gift.type)}>{gift.type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {gift.type === "money" ? `${gift.currency === "KHR" ? "៛" : "$"}${gift.amount}` : "-"}
                      </td>
                      <td className="py-3 px-4">{gift.description || "-"}</td>
                      <td className="py-3 px-4">
                        {gift.proofImage ? (
                          <Button variant="ghost" size="sm" onClick={() => window.open(gift.proofImage, "_blank")}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4">{new Date(gift.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gifts.length === 0 && <div className="text-center py-8 text-gray-500">No gifts found</div>}
            </div>
          </CardContent>
        </Card>

        <GiftDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={handleGiftSaved} />
      </div>
    </Layout>
  )
}
