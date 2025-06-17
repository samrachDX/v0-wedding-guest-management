"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import GiftDialog from "@/components/GiftDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"
import { Plus, Search, Edit, Trash2, Eye, RefreshCw } from "lucide-react"

interface Gift {
  _id: string
  guestId: number
  guestName: string
  type: "money" | "item"
  amount?: number
  currency?: string
  paymentMethod?: string
  description?: string
  proofImage?: string
  createdAt: string
}

export default function GiftsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [filteredGifts, setFilteredGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currencyFilter, setCurrencyFilter] = useState("all")
  const { toast } = useToast()
  const { t, language } = useLanguage()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchGifts()
    }
  }, [status])

  useEffect(() => {
    filterGifts()
  }, [gifts, searchTerm, typeFilter, currencyFilter])

  const fetchGifts = async () => {
    try {
      const response = await fetch("/api/gifts")
      if (response.ok) {
        const data = await response.json()
        console.log("=== FRONTEND RECEIVED GIFTS ===")
        data.forEach((gift: Gift, index: number) => {
          console.log(`Frontend Gift ${index + 1}:`, {
            id: gift._id,
            guestName: gift.guestName,
            type: gift.type,
            amount: gift.amount,
            currency: gift.currency,
            paymentMethod: gift.paymentMethod,
            hasPaymentMethod: !!gift.paymentMethod,
            paymentMethodType: typeof gift.paymentMethod,
          })
        })
        console.log("=== END FRONTEND DEBUG ===")
        setGifts(data)
      } else {
        throw new Error("Failed to fetch gifts")
      }
    } catch (error) {
      console.error("Fetch gifts error:", error)
      toast({
        title: t("common.error"),
        description: "Failed to load gifts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchGifts()
  }

  const filterGifts = () => {
    let filtered = gifts

    if (searchTerm) {
      filtered = filtered.filter(
        (gift) =>
          gift.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gift.guestId.toString().includes(searchTerm) ||
          gift.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((gift) => gift.type === typeFilter)
    }

    if (currencyFilter !== "all") {
      filtered = filtered.filter((gift) => gift.currency === currencyFilter)
    }

    setFilteredGifts(filtered)
  }

  const handleAddGift = () => {
    setEditingGift(null)
    setDialogOpen(true)
  }

  const handleEditGift = (gift: Gift) => {
    console.log("Editing gift:", gift)
    setEditingGift(gift)
    setDialogOpen(true)
  }

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm(t("common.confirm"))) {
      return
    }

    try {
      const response = await fetch(`/api/gifts/${giftId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: "Gift deleted successfully",
        })
        fetchGifts() // Refresh data instead of full page reload
      } else {
        throw new Error("Failed to delete gift")
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Failed to delete gift",
        variant: "destructive",
      })
    }
  }

  const handleDialogSaved = () => {
    setDialogOpen(false)
    setEditingGift(null)
    fetchGifts() // Refresh data instead of full page reload
  }

  const handleViewProof = (proofImage: string) => {
    if (proofImage) {
      const newWindow = window.open("", "_blank")
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Proof Image</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh; 
                  background: #f0f0f0; 
                }
                img { 
                  max-width: 100%; 
                  max-height: 100vh; 
                  object-fit: contain; 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                  border-radius: 8px;
                }
              </style>
            </head>
            <body>
              <img src="${proofImage}" alt="Proof Image" />
            </body>
          </html>
        `)
        newWindow.document.close()
      }
    }
  }

  const formatAmount = (amount: number | undefined, currency: string | undefined) => {
    if (!amount) return ""
    if (currency === "KHR") {
      return `៛${amount.toLocaleString()}`
    }
    return `$${amount.toLocaleString()}`
  }

  const getLocalizedType = (type: string) => {
    if (language === "km") {
      return type === "money" ? "ប្រាក់" : "របស់"
    }
    return type
  }

  const getLocalizedPaymentMethod = (method: string | undefined) => {
    if (!method) return "-"

    if (language === "km") {
      return method === "Cash" ? "សាច់ប្រាក់" : "KHQR"
    }
    return method
  }

  const renderPaymentMethod = (gift: Gift) => {
    console.log(`=== RENDERING PAYMENT METHOD ===`)
    console.log(`Gift ID: ${gift._id}`)
    console.log(`Guest: ${gift.guestName}`)
    console.log(`Type: ${gift.type}`)
    console.log(`Payment Method: "${gift.paymentMethod}"`)
    console.log(`Has Payment Method: ${!!gift.paymentMethod}`)
    console.log(`Payment Method Type: ${typeof gift.paymentMethod}`)
    console.log(`=== END RENDER DEBUG ===`)

    if (gift.type !== "money") {
      return <span className="text-gray-400">-</span>
    }

    if (!gift.paymentMethod || gift.paymentMethod === "") {
      return <span className="text-red-500">Missing</span>
    }

    return (
      <Badge variant={gift.paymentMethod === "Cash" ? "outline" : "default"}>
        {getLocalizedPaymentMethod(gift.paymentMethod)}
      </Badge>
    )
  }

  if (status === "loading" || loading) {
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
          <div className="flex space-x-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? t("common.loading") : "Refresh"}</span>
            </Button>
            <Button onClick={handleAddGift} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>{t("gifts.addGift")}</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t("gifts.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t("gifts.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("gifts.filterByType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("gifts.allTypes")}</SelectItem>
                  <SelectItem value="money">{t("gifts.money")}</SelectItem>
                  <SelectItem value="item">{t("gifts.item")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("gifts.filterByCurrency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("gifts.allCurrencies")}</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="KHR">KHR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Gifts Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("gifts.title")} ({filteredGifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">{t("gifts.guestId")}</th>
                    <th className="text-left p-2">{t("gifts.guestName")}</th>
                    <th className="text-left p-2">{t("gifts.type")}</th>
                    <th className="text-left p-2">{t("gifts.amount")}</th>
                    <th className="text-left p-2">{t("gifts.paymentMethod")}</th>
                    <th className="text-left p-2">{t("gifts.description")}</th>
                    <th className="text-left p-2">{t("gifts.proof")}</th>
                    <th className="text-left p-2">{t("gifts.date")}</th>
                    <th className="text-left p-2">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGifts.map((gift) => (
                    <tr key={gift._id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{gift.guestId}</td>
                      <td className="p-2">{gift.guestName}</td>
                      <td className="p-2">
                        <Badge variant={gift.type === "money" ? "default" : "secondary"}>
                          {getLocalizedType(gift.type)}
                        </Badge>
                      </td>
                      <td className="p-2 font-medium">
                        {gift.type === "money" ? formatAmount(gift.amount, gift.currency) : "-"}
                      </td>
                      <td className="p-2">{renderPaymentMethod(gift)}</td>
                      <td className="p-2 max-w-xs truncate">{gift.description || "-"}</td>
                      <td className="p-2">
                        {gift.proofImage ? (
                          <Button variant="ghost" size="sm" onClick={() => handleViewProof(gift.proofImage!)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 text-sm text-gray-500">{new Date(gift.createdAt).toLocaleDateString()}</td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditGift(gift)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGift(gift._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGifts.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        {t("common.noData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <GiftDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={handleDialogSaved} gift={editingGift} />
      </div>
    </Layout>
  )
}
