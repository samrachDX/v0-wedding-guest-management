"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/LanguageContext"
import { Gift, DollarSign, Package, Clock, User, CreditCard, Banknote } from "lucide-react"

interface GiftData {
  _id: string
  guestId: number
  guestName: string
  type: "money" | "item"
  amount?: number
  currency?: string
  paymentMethod?: string
  description?: string
  proofImage?: string
  createdAt: string
}

export default function GiftDisplayPage() {
  const [lastGift, setLastGift] = useState<GiftData | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [lastGiftId, setLastGiftId] = useState<string | null>(null)
  const { t, language } = useLanguage()

  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return "-"
    const curr = currency || "USD"
    if (curr === "KHR") {
      return `${amount.toLocaleString()} ៛`
    }
    return `$${amount.toLocaleString()}`
  }

  const getLocalizedType = (type: string) => {
    if (language === "km") {
      return type === "money" ? "លុយ" : "វត្ថុ"
    }
    return type === "money" ? "Money" : "Item"
  }

  const getLocalizedPaymentMethod = (method: string) => {
    if (language === "km") {
      const methods: Record<string, string> = {
        Cash: "សាច់ប្រាក់",
        "Bank Transfer": "ផ្ទេរប្រាក់តាមធនាគារ",
        ABA: "ABA",
        ACLEDA: "អេស៊ីលីដា",
        Wing: "វីង",
        "True Money": "ត្រូម៉ានី",
        Other: "ផ្សេងទៀត",
      }
      return methods[method] || method
    }
    return method
  }

  const fetchLastGift = useCallback(async () => {
    try {
      const response = await fetch("/api/gifts")
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          // Sort by createdAt to get the most recent
          const sortedGifts = [...data].sort((a: GiftData, b: GiftData) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          const newest = sortedGifts[0]
          
          // Check if this is a new gift
          if (newest._id !== lastGiftId) {
            setLastGift(newest)
            setLastGiftId(newest._id)
            setIsNew(true)
            
            // Remove "new" animation after 5 seconds
            setTimeout(() => setIsNew(false), 5000)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch gifts:", error)
    }
  }, [lastGiftId])

  // Poll for new gifts every 2 seconds
  useEffect(() => {
    fetchLastGift()
    const interval = setInterval(fetchLastGift, 2000)
    return () => clearInterval(interval)
  }, [fetchLastGift])

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-4">
            <Gift className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === "km" ? "ចំណងដៃថ្មីបំផុត" : "Latest Gift"}
          </h1>
          <p className="text-gray-500 mt-2">
            {language === "km" ? "បង្ហាញដោយស្វ័យប្រវត្តិ" : "Auto-updating display"}
          </p>
        </div>

        {lastGift ? (
          <Card 
            className={`overflow-hidden transition-all duration-500 ${
              isNew 
                ? "ring-4 ring-rose-400 ring-opacity-50 shadow-2xl scale-105" 
                : "shadow-xl"
            }`}
          >
            {/* New Gift Banner */}
            {isNew && (
              <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white py-3 px-4 text-center animate-pulse">
                <span className="font-bold text-lg">
                  {language === "km" ? "ចំណងដៃថ្មី!" : "New Gift Received!"}
                </span>
              </div>
            )}
            
            <CardContent className="p-8">
              {/* Guest Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white text-2xl font-bold">
                  {lastGift.guestName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{lastGift.guestName}</h2>
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <User className="w-4 h-4" />
                    <span>ID: {lastGift.guestId}</span>
                  </div>
                </div>
              </div>

              {/* Gift Details */}
              <div className="space-y-4">
                {/* Type & Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${
                      lastGift.type === "money" 
                        ? "bg-green-100 text-green-600" 
                        : "bg-blue-100 text-blue-600"
                    }`}>
                      {lastGift.type === "money" ? (
                        <DollarSign className="w-6 h-6" />
                      ) : (
                        <Package className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === "km" ? "ប្រភេទ" : "Type"}
                      </p>
                      <Badge 
                        variant={lastGift.type === "money" ? "default" : "secondary"}
                        className="text-sm"
                      >
                        {getLocalizedType(lastGift.type)}
                      </Badge>
                    </div>
                  </div>
                  
                  {lastGift.type === "money" && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {language === "km" ? "ចំនួនទឹកប្រាក់" : "Amount"}
                      </p>
                      <p className={`text-4xl font-bold ${
                        isNew ? "text-rose-600 animate-pulse" : "text-gray-900"
                      }`}>
                        {formatAmount(lastGift.amount, lastGift.currency)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                {lastGift.type === "money" && lastGift.paymentMethod && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 rounded-full bg-white">
                      {lastGift.paymentMethod === "Cash" ? (
                        <Banknote className="w-5 h-5 text-green-600" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === "km" ? "វិធីបង់ប្រាក់" : "Payment Method"}
                      </p>
                      <p className="font-medium text-gray-900">
                        {getLocalizedPaymentMethod(lastGift.paymentMethod)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Description for Items */}
                {lastGift.type === "item" && lastGift.description && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">
                      {language === "km" ? "ការពិពណ៌នា" : "Description"}
                    </p>
                    <p className="font-medium text-gray-900">{lastGift.description}</p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-gray-400 text-sm pt-4 border-t">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(lastGift.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl">
            <CardContent className="py-16">
              <div className="text-center text-gray-400">
                <Gift className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-xl">
                  {language === "km" 
                    ? "កំពុងរង់ចាំចំណងដៃ..." 
                    : "Waiting for gifts..."}
                </p>
                <p className="text-sm mt-2">
                  {language === "km" 
                    ? "ចំណងដៃថ្មីនឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ" 
                    : "New gifts will appear here automatically"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {language === "km" ? "ភ្ជាប់បន្តផ្ទាល់" : "Live connection"}
          </div>
        </div>
      </div>
    </div>
  )
}
