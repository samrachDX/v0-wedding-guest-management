"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Banknote, Gift as GiftIcon, HandCoins, RefreshCw, Users } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import Layout from "@/components/Layout"
import { PageHeader } from "@/components/PageHeader"
import { PageLoader } from "@/components/PageLoader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/LanguageContext"
import { formatMoney, formatNumber, initials } from "@/lib/format"
import { giftTypeLabel, guestSideLabel } from "@/lib/i18n"
import type { Gift, Guest } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DashboardStats {
  guests: {
    total: number
    groomSide: number
    brideSide: number
    withGifts: number
    recent: Guest[]
  }
  gifts: {
    total: number
    totalUSD: number
    totalKHR: number
    recent: Gift[]
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: typeof Users
  tone: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5 sm:p-6 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
          </div>
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}>
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { t, language } = useLanguage()

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) setStats(await response.json())
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    fetchStats()
  }, [fetchStats])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  const totalGuests = stats?.guests.total ?? 0
  const withGifts = stats?.guests.withGifts ?? 0
  const groomShare = totalGuests ? ((stats?.guests.groomSide ?? 0) / totalGuests) * 100 : 50
  const giftShare = totalGuests ? Math.min(100, (withGifts / totalGuests) * 100) : 0

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title={t("dashboard.title")}
          description={t("dashboard.subtitle")}
          actions={
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn(refreshing && "animate-spin")} />
              {t("common.refresh")}
            </Button>
          }
        />

        {loading ? (
          <PageLoader label={t("common.loading")} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard
                label={t("dashboard.totalGuests")}
                value={formatNumber(totalGuests)}
                icon={Users}
                tone="bg-accent text-primary"
              />
              <StatCard
                label={t("dashboard.totalGifts")}
                value={formatNumber(stats?.gifts.total ?? 0)}
                icon={GiftIcon}
                tone="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              />
              <StatCard
                label={t("dashboard.totalMoneyUSD")}
                value={formatMoney(stats?.gifts.totalUSD ?? 0, "USD")}
                icon={HandCoins}
                tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              />
              <StatCard
                label={t("dashboard.totalMoneyKHR")}
                value={formatMoney(stats?.gifts.totalKHR ?? 0, "KHR")}
                icon={Banknote}
                tone="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("dashboard.guestSplit")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                    <div className="bg-sky-400 transition-all" style={{ width: `${groomShare}%` }} />
                    <div className="flex-1 bg-rose-400" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-sky-400" />
                      {t("side.groom")} <strong className="font-semibold">{stats?.guests.groomSide ?? 0}</strong>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-rose-400" />
                      {t("side.bride")} <strong className="font-semibold">{stats?.guests.brideSide ?? 0}</strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("dashboard.giftProgress")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${giftShare}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.giftProgressDetail", { count: withGifts, total: totalGuests })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{t("dashboard.recentGuests")}</CardTitle>
                  <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                    <Link href="/guests">
                      {t("dashboard.viewAll")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {stats?.guests.recent.length ? (
                    <ul className="divide-y">
                      {stats.guests.recent.map((guest) => (
                        <li key={guest._id} className="flex items-center gap-3 py-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                            {initials(guest.name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{guest.name}</p>
                            <p className="text-xs text-muted-foreground">#{guest.guestId}</p>
                          </div>
                          <Badge variant={guest.guestType === "Groom Side" ? "groom" : "bride"}>
                            {guestSideLabel(language, guest.guestType)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={Users} title={t("dashboard.noRecentGuests")} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{t("dashboard.recentGifts")}</CardTitle>
                  <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                    <Link href="/gifts">
                      {t("dashboard.viewAll")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {stats?.gifts.recent.length ? (
                    <ul className="divide-y">
                      {stats.gifts.recent.map((gift) => (
                        <li key={gift._id} className="flex items-center gap-3 py-3">
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full",
                              gift.type === "money"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                            )}
                          >
                            <GiftIcon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{gift.guestName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {gift.type === "money"
                                ? giftTypeLabel(language, gift.type)
                                : gift.description || giftTypeLabel(language, gift.type)}
                            </p>
                          </div>
                          {gift.type === "money" && (
                            <span className="shrink-0 font-semibold tabular-nums">
                              {formatMoney(gift.amount, gift.currency)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState icon={GiftIcon} title={t("dashboard.noRecentGifts")} />
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
