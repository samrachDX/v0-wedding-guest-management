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
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currencyFilter, setCurrencyFilter] = useState("all")
  const { toast } = useToast()
  const { t } = useLanguage()

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
        setGifts(data)
      } else {
        throw new Error("Failed to fetch gifts")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load gifts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
    setEditingGift(gift)
    setDialogOpen(true)
  }

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm("Are you sure you want to delete this gift?")) {
      return
    }

    try {
      const response = await fetch(`/api/gifts/${giftId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Gift deleted successfully",
        })
        fetchGifts()
      } else {
        throw new Error("Failed to delete gift")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gift",
        variant: "destructive",
      })
    }
  }

  const handleDialogSaved = () => {
    setDialogOpen(false)
    setEditingGift(null)
    fetchGifts()
  }

  const formatAmount = (amount: number | undefined, currency: string | undefined) => {
    if (!amount) return ""
    if (currency === "KHR") {
      return `៛${amount.toLocaleString()}`
    }
    return `$${amount.toLocaleString()}`
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
          <Button onClick={handleAddGift} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>{t("gifts.addGift")}</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by guest name, ID, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="money">Money</SelectItem>
                  <SelectItem value="item">Item</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
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
            <CardTitle>Gifts ({filteredGifts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Guest ID</th>
                    <th className="text-left p-2">Guest Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Payment Method</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Proof</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGifts.map((gift) => (
                    <tr key={gift._id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{gift.guestId}</td>
                      <td className="p-2">{gift.guestName}</td>
                      <td className="p-2">
                        <Badge variant={gift.type === "money" ? "default" : "secondary"}>{gift.type}</Badge>
                      </td>
                      <td className="p-2 font-medium">
                        {gift.type === "money" ? formatAmount(gift.amount, gift.currency) : "-"}
                      </td>
                      <td className="p-2">
                        {gift.type === "money" && gift.paymentMethod ? (
                          <Badge variant={gift.paymentMethod === "Cash" ? "outline" : "default"}>
                            {gift.paymentMethod}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 max-w-xs truncate">{gift.description || "-"}</td>
                      <td className="p-2">
                        {gift.proofImage ? (
                          <Button variant="ghost" size="sm" onClick={() => window.open(gift.proofImage, "_blank")}>
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
                        No gifts found
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
