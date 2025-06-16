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

interface GiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export default function GiftDialog({ open, onOpenChange, onSaved }: GiftDialogProps) {
  const [formData, setFormData] = useState({
    guestId: "",
    type: "money" as "money" | "item",
    amount: "",
    description: "",
    proofImage: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    if (!open) {
      setFormData({
        guestId: "",
        type: "money",
        amount: "",
        description: "",
        proofImage: "",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        guestId: Number.parseInt(formData.guestId),
        type: formData.type,
        amount: formData.type === "money" ? Number.parseFloat(formData.amount) : undefined,
        description: formData.description,
        proofImage: formData.proofImage,
      }

      const response = await fetch("/api/gifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Gift added successfully",
        })
        onSaved()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add gift")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add gift",
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
          <DialogTitle>{t("gifts.addGift")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestId">{t("gifts.guestId")} *</Label>
            <Input
              id="guestId"
              type="number"
              value={formData.guestId}
              onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">{t("gifts.type")} *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "money" | "item") => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="money">{t("gifts.money")}</SelectItem>
                <SelectItem value="item">{t("gifts.item")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.type === "money" && (
            <div className="space-y-2">
              <Label htmlFor="amount">{t("gifts.amount")} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="description">{t("gifts.description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proofImage">Proof Image URL</Label>
            <Input
              id="proofImage"
              type="url"
              value={formData.proofImage}
              onChange={(e) => setFormData({ ...formData, proofImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
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
