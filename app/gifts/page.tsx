"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Clock, Eye, Gift as GiftIcon, List, Monitor, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import GiftDialog from "@/components/GiftDialog"
import Layout from "@/components/Layout"
import { PageHeader } from "@/components/PageHeader"
import { PageLoader } from "@/components/PageLoader"
import { ProofImageDialog } from "@/components/ProofImageDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToast } from "@/hooks/use-toast"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import { giftTypeLabel, paymentMethodLabel } from "@/lib/i18n"
import type { Gift } from "@/lib/types"
import { cn } from "@/lib/utils"

type TabType = "all" | "recent"

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)
  const [deletingGift, setDeletingGift] = useState<Gift | null>(null)
  const [proofImage, setProofImage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currencyFilter, setCurrencyFilter] = useState("all")
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [newGiftCount, setNewGiftCount] = useState(0)
  const { toast } = useToast()
  const { t, language } = useLanguage()

  const fetchGifts = useCallback(async () => {
    try {
      const response = await fetch("/api/gifts")
      if (!response.ok) throw new Error("Failed to fetch gifts")
      setGifts(await response.json())
    } catch (error) {
      console.error("Fetch gifts error:", error)
      toast({ title: t("common.error"), description: t("gifts.loadFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    fetchGifts()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; language changes must not refetch
  }, [])

  const filteredGifts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return gifts.filter(
      (gift) =>
        (!term ||
          gift.guestName.toLowerCase().includes(term) ||
          gift.guestId.toString().includes(term) ||
          gift.description?.toLowerCase().includes(term)) &&
        (typeFilter === "all" || gift.type === typeFilter) &&
        (currencyFilter === "all" || gift.currency === currencyFilter),
    )
  }, [gifts, searchTerm, typeFilter, currencyFilter])

  // The API already returns gifts newest first
  const recentGifts = useMemo(() => gifts.slice(0, 10), [gifts])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchGifts()
    setRefreshing(false)
  }

  const openAdd = () => {
    setEditingGift(null)
    setDialogOpen(true)
  }

  const openEdit = (gift: Gift) => {
    setEditingGift(gift)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingGift) return
    const response = await fetch(`/api/gifts/${deletingGift._id}`, { method: "DELETE" })
    if (response.ok) {
      toast({ title: t("gifts.deleted") })
      await fetchGifts()
    } else {
      toast({ title: t("common.error"), description: t("gifts.deleteFailed"), variant: "destructive" })
    }
  }

  const handleSaved = async () => {
    const wasAdding = !editingGift
    setDialogOpen(false)
    setEditingGift(null)
    await fetchGifts()

    if (wasAdding) {
      setActiveTab("recent")
      setNewGiftCount((count) => count + 1)
    }
  }

  const typeBadge = (gift: Gift) => (
    <Badge variant={gift.type === "money" ? "success" : "gold"}>{giftTypeLabel(language, gift.type)}</Badge>
  )

  const paymentBadge = (gift: Gift) => {
    if (gift.type !== "money") return <span className="text-muted-foreground">-</span>
    if (!gift.paymentMethod) return <Badge variant="destructive">{t("gifts.missing")}</Badge>
    return (
      <Badge variant={gift.paymentMethod === "Cash" ? "outline" : "secondary"}>
        {paymentMethodLabel(language, gift.paymentMethod)}
      </Badge>
    )
  }

  const rowActions = (gift: Gift) => (
    <div className="flex shrink-0 justify-end gap-1">
      {gift.proofImage && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setProofImage(gift.proofImage!)}
          aria-label={t("gifts.viewProof")}
          title={t("gifts.viewProof")}
        >
          <Eye />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={() => openEdit(gift)} aria-label={t("common.edit")}>
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeletingGift(gift)}
        aria-label={t("common.delete")}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  )

  const tabs: { value: TabType; label: string; icon: typeof List }[] = [
    { value: "all", label: t("gifts.allGifts"), icon: List },
    { value: "recent", label: t("gifts.recentlyAdded"), icon: Clock },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title={t("gifts.title")}
          description={t("gifts.subtitle")}
          actions={
            <>
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={cn(refreshing && "animate-spin")} />
                <span className="hidden sm:inline">{t("common.refresh")}</span>
              </Button>
              <Button variant="outline" onClick={() => window.open("/gifts/display", "_blank", "width=900,height=700")}>
                <Monitor />
                <span className="hidden sm:inline">{t("gifts.openDisplay")}</span>
              </Button>
              <Button onClick={openAdd}>
                <Plus />
                {t("gifts.addGift")}
              </Button>
            </>
          }
        />

        <div className="inline-flex rounded-xl border bg-muted/60 p-1">
          {tabs.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setActiveTab(value)
                if (value === "recent") setNewGiftCount(0)
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                activeTab === value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
              {value === "recent" && newGiftCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                  {newGiftCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <PageLoader label={t("common.loading")} />
        ) : activeTab === "recent" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("gifts.showingLatest", { count: recentGifts.length })}</p>
            {recentGifts.length > 0 ? (
              recentGifts.map((gift, index) => (
                <Card
                  key={gift._id}
                  className={cn(
                    "flex items-start gap-4 p-4 transition-shadow hover:shadow-md",
                    index === 0 && "border-primary/40 bg-accent/40 ring-1 ring-primary/15",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      gift.type === "money"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                    )}
                  >
                    <GiftIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{gift.guestName}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">#{gift.guestId}</span>
                      {index === 0 && <Badge>{t("gifts.new")}</Badge>}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {typeBadge(gift)}
                      {gift.type === "money" ? (
                        <>
                          <span className="text-lg font-semibold tabular-nums">
                            {formatMoney(gift.amount, gift.currency)}
                          </span>
                          {gift.paymentMethod && paymentBadge(gift)}
                        </>
                      ) : (
                        gift.description && (
                          <span className="truncate text-sm text-muted-foreground">{gift.description}</span>
                        )
                      )}
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {formatDateTime(gift.createdAt, language)}
                    </p>
                  </div>
                  {rowActions(gift)}
                </Card>
              ))
            ) : (
              <Card>
                <EmptyState
                  icon={GiftIcon}
                  title={t("gifts.noRecentGift")}
                  description={t("gifts.addGiftPrompt")}
                  action={
                    <Button onClick={openAdd}>
                      <Plus />
                      {t("gifts.addGift")}
                    </Button>
                  }
                />
              </Card>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("gifts.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("gifts.allTypes")}</SelectItem>
                    <SelectItem value="money">{t("gifts.money")}</SelectItem>
                    <SelectItem value="item">{t("gifts.item")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                  <SelectTrigger className="sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("gifts.allCurrencies")}</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="KHR">KHR (៛)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="border-b px-5 py-3.5">
                <p className="text-sm font-medium">{t("gifts.count", { count: filteredGifts.length })}</p>
              </div>
              {filteredGifts.length === 0 ? (
                <EmptyState icon={GiftIcon} title={t("gifts.empty")} />
              ) : (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3 font-medium">{t("gifts.guestId")}</th>
                          <th className="px-5 py-3 font-medium">{t("gifts.guestName")}</th>
                          <th className="px-5 py-3 font-medium">{t("gifts.type")}</th>
                          <th className="px-5 py-3 text-right font-medium">{t("gifts.amount")}</th>
                          <th className="px-5 py-3 font-medium">{t("gifts.paymentMethod")}</th>
                          <th className="px-5 py-3 font-medium">{t("gifts.description")}</th>
                          <th className="px-5 py-3 font-medium">{t("gifts.date")}</th>
                          <th className="px-5 py-3 text-right font-medium">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredGifts.map((gift) => (
                          <tr key={gift._id} className="transition-colors hover:bg-muted/40">
                            <td className="px-5 py-3 tabular-nums text-muted-foreground">#{gift.guestId}</td>
                            <td className="px-5 py-3 font-medium">{gift.guestName}</td>
                            <td className="px-5 py-3">{typeBadge(gift)}</td>
                            <td className="px-5 py-3 text-right font-semibold tabular-nums">
                              {gift.type === "money" ? formatMoney(gift.amount, gift.currency) : "-"}
                            </td>
                            <td className="px-5 py-3">{paymentBadge(gift)}</td>
                            <td className="max-w-[14rem] truncate px-5 py-3 text-muted-foreground">
                              {gift.description || "-"}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                              {formatDate(gift.createdAt, language)}
                            </td>
                            <td className="px-5 py-2">{rowActions(gift)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <ul className="divide-y lg:hidden">
                    {filteredGifts.map((gift) => (
                      <li key={gift._id} className="flex items-start gap-3 px-4 py-3.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <p className="truncate font-medium">{gift.guestName}</p>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">#{gift.guestId}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {typeBadge(gift)}
                            {gift.type === "money" && (
                              <>
                                <span className="font-semibold tabular-nums">
                                  {formatMoney(gift.amount, gift.currency)}
                                </span>
                                {paymentBadge(gift)}
                              </>
                            )}
                          </div>
                          {gift.description && (
                            <p className="mt-1 truncate text-xs text-muted-foreground">{gift.description}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(gift.createdAt, language)}</p>
                        </div>
                        {rowActions(gift)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          </>
        )}

        <GiftDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={handleSaved} gift={editingGift} />
        <ProofImageDialog src={proofImage} onOpenChange={(open) => !open && setProofImage(null)} />
        <ConfirmDialog
          open={!!deletingGift}
          onOpenChange={(open) => !open && setDeletingGift(null)}
          title={t("gifts.deleteTitle")}
          onConfirm={handleDelete}
        />
      </div>
    </Layout>
  )
}
