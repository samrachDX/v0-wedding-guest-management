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
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import GuestDialog from "@/components/GuestDialog"

interface Guest {
  _id: string
  guestId: number
  name: string
  phone?: string
  guestType: "Groom Side" | "Bride Side"
  notes?: string
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    fetchGuests()
  }, [search, statusFilter])

  const fetchGuests = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("guestType", statusFilter)

      const response = await fetch(`/api/guests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGuests(data)
      }
    } catch (error) {
      console.error("Error fetching guests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGuest = () => {
    setEditingGuest(null)
    setDialogOpen(true)
  }

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest)
    setDialogOpen(true)
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("Are you sure you want to delete this guest?")) return

    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Guest deleted successfully",
        })
        fetchGuests()
      } else {
        throw new Error("Failed to delete guest")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive",
      })
    }
  }

  const handleGuestSaved = () => {
    setDialogOpen(false)
    fetchGuests()
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Not Attending":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
          <h1 className="text-3xl font-bold text-gray-900">{t("guests.title")}</h1>
          <Button onClick={handleAddGuest} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>{t("guests.addGuest")}</span>
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t("guests.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Groom Side">Groom Side</SelectItem>
                  <SelectItem value="Bride Side">Bride Side</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Guests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Guests ({guests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">{t("guests.name")}</th>
                    <th className="text-left py-3 px-4">{t("guests.phone")}</th>
                    <th className="text-left py-3 px-4">Guest Type</th>
                    <th className="text-left py-3 px-4">Notes</th>
                    <th className="text-left py-3 px-4">{t("guests.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{guest.guestId}</td>
                      <td className="py-3 px-4">{guest.name}</td>
                      <td className="py-3 px-4">{guest.phone || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            guest.guestType === "Groom Side" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                          }
                        >
                          {guest.guestType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{guest.notes || "-"}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditGuest(guest)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGuest(guest._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {guests.length === 0 && <div className="text-center py-8 text-gray-500">No guests found</div>}
            </div>
          </CardContent>
        </Card>

        <GuestDialog open={dialogOpen} onOpenChange={setDialogOpen} guest={editingGuest} onSaved={handleGuestSaved} />
      </div>
    </Layout>
  )
}
