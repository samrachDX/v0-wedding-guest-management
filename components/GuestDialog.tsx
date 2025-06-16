"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/LanguageContext"

interface Guest {
  _id: string
  guestId: number
  name: string
  phone?: string
  guestType: "Groom Side" | "Bride Side"
  notes?: string
}

interface GuestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guest?: Guest | null
  onSaved: () => void
}

export default function GuestDialog({ open, onOpenChange, guest, onSaved }: GuestDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    guestType: "Groom Side" as const,
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name,
        phone: guest.phone || "",
        guestType: guest.guestType,
        notes: guest.notes || "",
      })
    } else {
      setFormData({
        name: "",
        phone: "",
        guestType: "Groom Side",
        notes: "",
      })
    }
  }, [guest, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        phone: formData.phone || undefined,
      }

      const url = guest ? `/api/guests/${guest._id}` : "/api/guests"
      const method = guest ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: guest ? "Guest updated successfully" : "Guest added successfully",
        })
        onSaved()
      } else {
        throw new Error("Failed to save guest")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save guest",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{guest ? "Edit Guest" : t("guests.addGuest")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("guests.name")} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("guests.phone")}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guestType">{t("form.guestType")} *</Label>
            <Select
              value={formData.guestType}
              onValueChange={(value: "Groom Side" | "Bride Side") => setFormData({ ...formData, guestType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Groom Side">{t("form.groomSide")}</SelectItem>
                <SelectItem value="Bride Side">{t("form.brideSide")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t("form.notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : t("form.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
