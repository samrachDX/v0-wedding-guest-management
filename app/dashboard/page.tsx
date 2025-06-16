"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/LanguageContext"
import { Users, Gift, DollarSign } from "lucide-react"

interface DashboardStats {
  guests: {
    total: number
    recent: any[]
  }
  gifts: {
    total: number
    totalUSD: number
    totalKHR: number
    recent: any[]
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
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
        <h1 className="text-3xl font-bold text-gray-900">{t("dashboard.title")}</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalGuests")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.guests.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalGifts")}</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.gifts.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalMoneyUSD")}</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats?.gifts.totalUSD || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.totalMoneyKHR")}</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">៛{stats?.gifts.totalKHR || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.recentGuests")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.guests.recent.map((guest) => (
                  <div key={guest._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-gray-500">ID: {guest.guestId}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        guest.guestType === "Groom Side" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                      }`}
                    >
                      {guest.guestType}
                    </span>
                  </div>
                ))}
                {(!stats?.guests.recent || stats.guests.recent.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No recent guests</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.recentGifts")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.gifts.recent.map((gift) => (
                  <div key={gift._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{gift.guestName}</p>
                      <p className="text-sm text-gray-500">
                        {gift.type === "money" ? `$${gift.amount}` : gift.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        gift.type === "money" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {gift.type}
                    </span>
                  </div>
                ))}
                {(!stats?.gifts.recent || stats.gifts.recent.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No recent gifts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
