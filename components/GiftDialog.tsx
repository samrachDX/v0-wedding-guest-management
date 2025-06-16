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
import { Upload, Search, X } from "lucide-react"

interface Guest {
  guestId: number
  name: string
}

interface Gift {
  _id?: string
  guestId: number
  guestName: string
  type: "money" | "item"
  amount?: number
  currency?: string
  paymentMethod?: string
  description?: string
  proofImage?: string
}

interface GiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  gift?: Gift | null
}

export default function GiftDialog({ open, onOpenChange, onSaved, gift }: GiftDialogProps) {
  const [formData, setFormData] = useState({
    guestSearch: "",
    selectedGuest: null as Guest | null,
    type: "money" as "money" | "item",
    amount: "",
    currency: "USD" as "USD" | "KHR",
    paymentMethod: "Cash" as "Cash" | "KHQR",
    description: "",
    proofImage: "",
  })
  const [searchResults, setSearchResults] = useState<Guest[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const isEditing = !!gift

  useEffect(() => {
    if (open) {
      if (gift) {
        // Editing existing gift
        setFormData({
          guestSearch: `${gift.guestId} - ${gift.guestName}`,
          selectedGuest: { guestId: gift.guestId, name: gift.guestName },
          type: gift.type,
          amount: gift.amount?.toString() || "",
          currency: (gift.currency as "USD" | "KHR") || "USD",
          paymentMethod: (gift.paymentMethod as "Cash" | "KHQR") || "Cash",
          description: gift.description || "",
          proofImage: gift.proofImage || "",
        })
      } else {
        // Adding new gift
        setFormData({
          guestSearch: "",
          selectedGuest: null,
          type: "money",
          amount: "",
          currency: "USD",
          paymentMethod: "Cash",
          description: "",
          proofImage: "",
        })
      }
      setSearchResults([])
    }
  }, [open, gift])

  // Search guests as user types
  useEffect(() => {
    const searchGuests = async () => {
      if (formData.guestSearch.length > 0 && !formData.selectedGuest) {
        try {
          const response = await fetch(`/api/guests/search?q=${encodeURIComponent(formData.guestSearch)}`)
          if (response.ok) {
            const guests = await response.json()
            setSearchResults(guests)
          }
        } catch (error) {
          console.error("Error searching guests:", error)
        }
      } else {
        setSearchResults([])
      }
    }

    const debounceTimer = setTimeout(searchGuests, 300)
    return () => clearTimeout(debounceTimer)
  }, [formData.guestSearch, formData.selectedGuest])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({ ...prev, proofImage: data.url }))
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.selectedGuest) {
      toast({
        title: "Error",
        description: t("form.selectGuest"),
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const payload = {
        guestId: formData.selectedGuest.guestId,
        type: formData.type,
        amount: formData.type === "money" ? Number.parseFloat(formData.amount) : undefined,
        currency: formData.type === "money" ? formData.currency : undefined,
        paymentMethod: formData.type === "money" ? formData.paymentMethod : undefined,
        description: formData.description,
        proofImage: formData.proofImage,
      }

      const url = isEditing ? `/api/gifts/${gift._id}` : "/api/gifts"
      const method = isEditing ? "PUT" : "POST"

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
          description: isEditing ? "Gift updated successfully" : "Gift added successfully",
        })
        onSaved()
      } else {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditing ? "update" : "add"} gift`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "add"} gift`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Gift" : t("gifts.addGift")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Search */}
          <div className="space-y-2">
            <Label htmlFor="guestSearch">{t("search.guestIdOrName")} *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="guestSearch"
                value={formData.guestSearch}
                onChange={(e) => setFormData({ ...formData, guestSearch: e.target.value, selectedGuest: null })}
                placeholder="Enter guest ID or name..."
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {searchResults.map((guest) => (
                  <div
                    key={guest.guestId}
                    className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        selectedGuest: guest,
                        guestSearch: `${guest.guestId} - ${guest.name}`,
                      })
                      setSearchResults([])
                    }}
                  >
                    <div className="font-medium">ID: {guest.guestId}</div>
                    <div className="text-sm text-gray-600">{guest.name}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Guest */}
            {formData.selectedGuest && (
              <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                <span className="text-green-800">
                  Selected: {formData.selectedGuest.guestId} - {formData.selectedGuest.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, selectedGuest: null, guestSearch: "" })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Gift Type */}
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

          {/* Amount, Currency, and Payment Method (for money gifts) */}
          {formData.type === "money" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
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
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("form.currency")}</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value: "USD" | "KHR") => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="KHR">KHR (៛)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">{t("form.paymentMethod")} *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: "Cash" | "KHQR") => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">{t("form.cash")}</SelectItem>
                    <SelectItem value="KHQR">{t("form.khqr")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("gifts.description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Proof Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="proofImage">{t("form.proofImage")}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={uploading}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? t("form.uploading") : t("form.uploadImage")}</span>
                </Button>
              </div>

              {/* Image Preview */}
              {formData.proofImage && (
                <div className="relative">
                  <img
                    src={formData.proofImage || "/placeholder.svg"}
                    alt="Proof"
                    className="w-full h-32 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 bg-white/80"
                    onClick={() => setFormData({ ...formData, proofImage: "" })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={loading || !formData.selectedGuest}>
              {loading ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Update" : t("form.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
