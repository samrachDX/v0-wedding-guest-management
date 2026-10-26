"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Phone, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import GuestDialog from "@/components/GuestDialog"
import Layout from "@/components/Layout"
import { PageHeader } from "@/components/PageHeader"
import { PageLoader } from "@/components/PageLoader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/LanguageContext"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useToast } from "@/hooks/use-toast"
import { initials } from "@/lib/format"
import { guestSideLabel } from "@/lib/i18n"
import type { Guest } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [guestsWithGifts, setGuestsWithGifts] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [giftFilter, setGiftFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null)
  const { toast } = useToast()
  const { t, language } = useLanguage()
  const debouncedSearch = useDebouncedValue(search)

  const fetchGuests = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append("search", debouncedSearch)
      if (typeFilter !== "all") params.append("guestType", typeFilter)
      if (giftFilter !== "all") params.append("giftFilter", giftFilter)

      const [guestsResponse, giftsResponse] = await Promise.all([
        fetch(`/api/guests?${params}`),
        fetch("/api/guests/with-gifts"),
      ])
      if (guestsResponse.ok) setGuests(await guestsResponse.json())
      if (giftsResponse.ok) setGuestsWithGifts(new Set((await giftsResponse.json()).guestIds))
    } catch (error) {
      console.error("Error fetching guests:", error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, typeFilter, giftFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    fetchGuests()
  }, [fetchGuests])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchGuests()
    setRefreshing(false)
  }

  const openAdd = () => {
    setEditingGuest(null)
    setDialogOpen(true)
  }

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingGuest) return
    const response = await fetch(`/api/guests/${deletingGuest._id}`, { method: "DELETE" })
    if (response.ok) {
      toast({ title: t("guests.deleted") })
      await fetchGuests()
    } else {
      toast({ title: t("common.error"), description: t("guests.deleteFailed"), variant: "destructive" })
    }
  }

  const handleSaved = async () => {
    setDialogOpen(false)
    await fetchGuests()
  }

  const giftBadge = (guest: Guest) =>
    guestsWithGifts.has(guest.guestId) ? (
      <Badge variant="success">{t("guests.hasGift")}</Badge>
    ) : (
      <Badge variant="muted">{t("guests.noGift")}</Badge>
    )

  const rowActions = (guest: Guest) => (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={() => openEdit(guest)} aria-label={t("common.edit")}>
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeletingGuest(guest)}
        aria-label={t("common.delete")}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  )

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title={t("guests.title")}
          description={t("guests.subtitle")}
          actions={
            <>
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={cn(refreshing && "animate-spin")} />
                <span className="hidden sm:inline">{t("common.refresh")}</span>
              </Button>
              <Button onClick={openAdd}>
                <Plus />
                {t("guests.addGuest")}
              </Button>
            </>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("guests.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("guests.allTypes")}</SelectItem>
                <SelectItem value="Groom Side">{t("side.groom")}</SelectItem>
                <SelectItem value="Bride Side">{t("side.bride")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={giftFilter} onValueChange={setGiftFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("guests.allGuests")}</SelectItem>
                <SelectItem value="with-gifts">{t("guests.withGifts")}</SelectItem>
                <SelectItem value="without-gifts">{t("guests.withoutGifts")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <PageLoader label={t("common.loading")} />
        ) : (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <p className="text-sm font-medium">{t("guests.count", { count: guests.length })}</p>
            </div>

            {guests.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("guests.empty")}
                description={t("guests.emptyHint")}
                action={
                  <Button onClick={openAdd}>
                    <Plus />
                    {t("guests.addGuest")}
                  </Button>
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 font-medium">{t("guests.id")}</th>
                        <th className="px-5 py-3 font-medium">{t("guests.name")}</th>
                        <th className="px-5 py-3 font-medium">{t("guests.phone")}</th>
                        <th className="px-5 py-3 font-medium">{t("guests.guestType")}</th>
                        <th className="px-5 py-3 font-medium">{t("guests.giftStatus")}</th>
                        <th className="px-5 py-3 font-medium">{t("guests.notes")}</th>
                        <th className="px-5 py-3 text-right font-medium">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {guests.map((guest) => (
                        <tr key={guest._id} className="transition-colors hover:bg-muted/40">
                          <td className="px-5 py-3 font-medium tabular-nums text-muted-foreground">#{guest.guestId}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                                {initials(guest.name)}
                              </span>
                              <span className="font-medium">{guest.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 tabular-nums">{guest.phone || "-"}</td>
                          <td className="px-5 py-3">
                            <Badge variant={guest.guestType === "Groom Side" ? "groom" : "bride"}>
                              {guestSideLabel(language, guest.guestType)}
                            </Badge>
                          </td>
                          <td className="px-5 py-3">{giftBadge(guest)}</td>
                          <td className="max-w-[16rem] truncate px-5 py-3 text-muted-foreground">
                            {guest.notes || "-"}
                          </td>
                          <td className="px-5 py-2">{rowActions(guest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <ul className="divide-y md:hidden">
                  {guests.map((guest) => (
                    <li key={guest._id} className="flex items-start gap-3 px-4 py-3.5">
                      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                        {initials(guest.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="truncate font-medium">{guest.name}</p>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">#{guest.guestId}</span>
                        </div>
                        {guest.phone && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3" />
                            {guest.phone}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant={guest.guestType === "Groom Side" ? "groom" : "bride"}>
                            {guestSideLabel(language, guest.guestType)}
                          </Badge>
                          {giftBadge(guest)}
                        </div>
                        {guest.notes && <p className="mt-1.5 text-xs text-muted-foreground">{guest.notes}</p>}
                      </div>
                      {rowActions(guest)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        )}

        <GuestDialog open={dialogOpen} onOpenChange={setDialogOpen} guest={editingGuest} onSaved={handleSaved} />
        <ConfirmDialog
          open={!!deletingGuest}
          onOpenChange={(open) => !open && setDeletingGuest(null)}
          title={t("guests.deleteTitle")}
          description={
            deletingGuest ? `${deletingGuest.name} (#${deletingGuest.guestId}). ${t("common.cannotUndo")}` : undefined
          }
          onConfirm={handleDelete}
        />
      </div>
    </Layout>
  )
}
