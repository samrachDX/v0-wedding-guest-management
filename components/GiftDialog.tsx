"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Banknote, Check, ImagePlus, Loader2, Package, QrCode, Search, X } from "lucide-react"
import { ProofImageDialog } from "@/components/ProofImageDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToast } from "@/hooks/use-toast"
import type { Currency, Gift, GiftType, PaymentMethod } from "@/lib/types"
import { cn } from "@/lib/utils"

interface GuestOption {
  guestId: number
  name: string
}

interface GiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  gift?: Gift | null
}

const emptyForm = {
  guestSearch: "",
  selectedGuest: null as GuestOption | null,
  type: "money" as GiftType,
  amount: "",
  currency: "USD" as Currency,
  paymentMethod: "Cash" as PaymentMethod,
  description: "",
  proofImage: "",
}

/** Adds thousands separators while the user types, keeping any decimal part. */
function formatWithCommas(raw: string) {
  const [whole, ...rest] = raw.split(".")
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return rest.length ? `${grouped}.${rest.join("")}` : grouped
}

/** Shrinks a photo to at most 1200px and re-encodes it as JPEG before upload. */
function compressImage(file: File, maxSize = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.onload = (event) => {
      const img = new Image()
      img.onerror = () => reject(new Error("Failed to load image"))
      img.onload = () => {
        const scale = Math.min(1, maxSize / img.width, maxSize / img.height)
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Failed to get canvas context"))
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Failed to compress image"))),
          "image/jpeg",
          quality,
        )
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

function ChoiceButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon?: typeof Banknote
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted",
      )}
    >
      {Icon && <Icon className="size-4" />}
      {children}
    </button>
  )
}

export default function GiftDialog({ open, onOpenChange, onSaved, gift }: GiftDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{gift ? t("gifts.editGift") : t("gifts.addGift")}</DialogTitle>
        </DialogHeader>
        {/* Keyed so the form starts fresh for each gift; Radix unmounts it when closed */}
        <GiftForm key={gift?._id ?? "new"} gift={gift} onCancel={() => onOpenChange(false)} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  )
}

function GiftForm({ gift, onCancel, onSaved }: { gift?: Gift | null; onCancel: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState(() =>
    gift
      ? {
          guestSearch: `${gift.guestId} - ${gift.guestName}`,
          selectedGuest: { guestId: gift.guestId, name: gift.guestName } as GuestOption | null,
          type: gift.type,
          amount: gift.amount?.toString() || "",
          currency: gift.currency || ("USD" as Currency),
          paymentMethod: gift.paymentMethod || ("Cash" as PaymentMethod),
          description: gift.description || "",
          proofImage: gift.proofImage || "",
        }
      : emptyForm,
  )
  const [searchResults, setSearchResults] = useState<GuestOption[]>([])
  const [searching, setSearching] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { t } = useLanguage()

  const isEditing = !!gift

  // Search guests as the user types
  useEffect(() => {
    // The results list is hidden while no search is active, so stale results need no clearing
    if (!formData.guestSearch.trim() || formData.selectedGuest) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await fetch(`/api/guests/search?q=${encodeURIComponent(formData.guestSearch)}`, {
          signal: controller.signal,
        })
        if (response.ok) setSearchResults(await response.json())
      } catch (error) {
        if (!controller.signal.aborted) console.error("Error searching guests:", error)
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [formData.guestSearch, formData.selectedGuest])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "")
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      setFormData((prev) => ({ ...prev, amount: raw }))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({ title: t("common.error"), description: t("gifts.imageOnly"), variant: "destructive" })
      return
    }

    setCompressing(true)
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      setCompressing(false)

      const upload = new FormData()
      upload.append("file", new File([compressed], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }))

      const response = await fetch("/api/upload", { method: "POST", body: upload })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || t("gifts.uploadFailed"))

      setFormData((prev) => ({ ...prev, proofImage: data.url }))
      toast({
        title: t("common.success"),
        description: t("gifts.imageUploaded", {
          from: (file.size / 1024).toFixed(0),
          to: (compressed.size / 1024).toFixed(0),
        }),
      })
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("gifts.uploadFailed"),
        variant: "destructive",
      })
    } finally {
      setCompressing(false)
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.selectedGuest) {
      toast({ title: t("common.error"), description: t("gifts.selectGuest"), variant: "destructive" })
      return
    }

    if (formData.type === "money" && (!Number(formData.amount) || !formData.paymentMethod)) {
      toast({ title: t("common.error"), description: t("gifts.amountRequired"), variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const isMoney = formData.type === "money"
      const payload = {
        guestId: formData.selectedGuest.guestId,
        type: formData.type,
        amount: isMoney ? Number.parseFloat(formData.amount) : undefined,
        currency: isMoney ? formData.currency : undefined,
        paymentMethod: isMoney ? formData.paymentMethod : undefined,
        description: formData.description,
        proofImage: formData.proofImage,
      }

      const response = await fetch(gift ? `/api/gifts/${gift._id}` : "/api/gifts", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || t("gifts.saveFailed"))
      }

      toast({ title: isEditing ? t("gifts.updated") : t("gifts.added") })
      onSaved()
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("gifts.saveFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const busyUploading = uploading || compressing

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Guest */}
        <div className="space-y-2">
          <Label htmlFor="guestSearch">
            {t("gifts.searchGuest")} <span className="text-destructive">*</span>
          </Label>
          {formData.selectedGuest ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                <span className="text-muted-foreground">#{formData.selectedGuest.guestId}</span>{" "}
                {formData.selectedGuest.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t("common.close")}
                onClick={() => setFormData({ ...formData, selectedGuest: null, guestSearch: "" })}
              >
                <X />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="guestSearch"
                value={formData.guestSearch}
                onChange={(e) => setFormData({ ...formData, guestSearch: e.target.value, selectedGuest: null })}
                placeholder={t("gifts.searchGuestPlaceholder")}
                className="pl-9"
                autoComplete="off"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          )}

          {!formData.selectedGuest && formData.guestSearch.trim() && (
            <div className="max-h-44 overflow-y-auto rounded-lg border bg-card">
              {searchResults.length > 0
                ? searchResults.map((guest) => (
                    <button
                      key={guest.guestId}
                      type="button"
                      className="flex w-full items-center gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          selectedGuest: guest,
                          guestSearch: `${guest.guestId} - ${guest.name}`,
                        })
                      }
                    >
                      <span className="w-10 shrink-0 tabular-nums text-muted-foreground">#{guest.guestId}</span>
                      <span className="truncate font-medium">{guest.name}</span>
                    </button>
                  ))
                : !searching && <p className="px-3 py-2.5 text-sm text-muted-foreground">{t("gifts.noGuestMatch")}</p>}
            </div>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>{t("gifts.type")}</Label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            <ChoiceButton
              active={formData.type === "money"}
              onClick={() => setFormData({ ...formData, type: "money" })}
              icon={Banknote}
            >
              {t("gifts.money")}
            </ChoiceButton>
            <ChoiceButton
              active={formData.type === "item"}
              onClick={() => setFormData({ ...formData, type: "item" })}
              icon={Package}
            >
              {t("gifts.item")}
            </ChoiceButton>
          </div>
        </div>

        {formData.type === "money" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="amount">
                {t("gifts.amount")} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                    {formData.currency === "USD" ? "$" : "៛"}
                  </span>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    value={formatWithCommas(formData.amount)}
                    onChange={handleAmountChange}
                    placeholder="0"
                    required
                    className="h-12 pl-8 text-right text-xl font-semibold tabular-nums md:text-xl"
                  />
                </div>
                <div
                  className="grid w-28 grid-cols-2 gap-1 rounded-lg border bg-muted/60 p-1"
                  role="radiogroup"
                  aria-label={t("gifts.currency")}
                >
                  {(["USD", "KHR"] as Currency[]).map((currency) => (
                    <button
                      key={currency}
                      type="button"
                      role="radio"
                      aria-checked={formData.currency === currency}
                      onClick={() => setFormData({ ...formData, currency })}
                      className={cn(
                        "rounded-md text-xs font-semibold transition-colors",
                        formData.currency === currency ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {t("gifts.paymentMethod")} <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                <ChoiceButton
                  active={formData.paymentMethod === "Cash"}
                  onClick={() => setFormData({ ...formData, paymentMethod: "Cash" })}
                  icon={Banknote}
                >
                  {t("gifts.cash")}
                </ChoiceButton>
                <ChoiceButton
                  active={formData.paymentMethod === "KHQR"}
                  onClick={() => setFormData({ ...formData, paymentMethod: "KHQR" })}
                  icon={QrCode}
                >
                  {t("gifts.khqr")}
                </ChoiceButton>
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">{t("gifts.description")}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
        </div>

        {/* Proof image */}
        <div className="space-y-2">
          <Label>{t("gifts.proofImage")}</Label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          {formData.proofImage ? (
            <div className="relative overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element -- proof images are inline data URLs */}
              <img
                src={formData.proofImage}
                alt={t("gifts.proofImage")}
                className="h-36 w-full cursor-zoom-in object-cover"
                onClick={() => setPreviewOpen(true)}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 size-8 bg-card/90 backdrop-blur"
                aria-label={t("common.delete")}
                onClick={() => setFormData({ ...formData, proofImage: "" })}
              >
                <X />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busyUploading}
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 disabled:opacity-60"
            >
              {busyUploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
              {compressing ? t("gifts.compressing") : uploading ? t("gifts.uploading") : t("gifts.uploadImage")}
            </button>
          )}
        </div>

        <DialogFooter className="pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" disabled={loading || busyUploading || !formData.selectedGuest}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? t("form.saving") : isEditing ? t("form.update") : t("form.save")}
          </Button>
        </DialogFooter>
      </form>
      <ProofImageDialog src={previewOpen ? formData.proofImage : null} onOpenChange={setPreviewOpen} />
    </>
  )
}
