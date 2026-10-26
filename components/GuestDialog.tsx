"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToast } from "@/hooks/use-toast"
import type { Guest, GuestType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface GuestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guest?: Guest | null
  onSaved: () => void
}

const emptyForm = { name: "", phone: "", guestType: "Groom Side" as GuestType, notes: "" }

export default function GuestDialog({ open, onOpenChange, guest, onSaved }: GuestDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{guest ? t("guests.editGuest") : t("guests.addGuest")}</DialogTitle>
        </DialogHeader>
        {/* Keyed so the form starts fresh for each guest; Radix unmounts it when closed */}
        <GuestForm key={guest?._id ?? "new"} guest={guest} onCancel={() => onOpenChange(false)} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  )
}

function GuestForm({ guest, onCancel, onSaved }: { guest?: Guest | null; onCancel: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState(() =>
    guest
      ? { name: guest.name, phone: guest.phone || "", guestType: guest.guestType, notes: guest.notes || "" }
      : emptyForm,
  )
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(guest ? `/api/guests/${guest._id}` : "/api/guests", {
        method: guest ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, phone: formData.phone || undefined }),
      })

      if (!response.ok) throw new Error("Failed to save guest")

      toast({ title: guest ? t("guests.updated") : t("guests.added") })
      onSaved()
    } catch {
      toast({ title: t("common.error"), description: t("guests.saveFailed"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const sides: { value: GuestType; label: string; className: string }[] = [
    {
      value: "Groom Side",
      label: t("side.groom"),
      className:
        "data-[active=true]:border-sky-400 data-[active=true]:bg-sky-50 data-[active=true]:text-sky-800 dark:data-[active=true]:bg-sky-500/10 dark:data-[active=true]:text-sky-300",
    },
    {
      value: "Bride Side",
      label: t("side.bride"),
      className:
        "data-[active=true]:border-rose-400 data-[active=true]:bg-rose-50 data-[active=true]:text-rose-800 dark:data-[active=true]:bg-rose-500/10 dark:data-[active=true]:text-rose-300",
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          {t("guests.name")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t("guests.phone")}</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>
          {t("guests.guestType")} <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {sides.map((side) => (
            <button
              key={side.value}
              type="button"
              role="radio"
              aria-checked={formData.guestType === side.value}
              data-active={formData.guestType === side.value}
              onClick={() => setFormData({ ...formData, guestType: side.value })}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted",
                side.className,
              )}
            >
              {side.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{t("guests.notes")}</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>
      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("form.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? t("form.saving") : guest ? t("form.update") : t("form.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}
