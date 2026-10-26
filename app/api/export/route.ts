import { type NextRequest, NextResponse } from "next/server"
import { getUserId, serverError, unauthorized } from "@/lib/api"
import { giftTypeLabel, guestSideLabel, type Language, paymentMethodLabel } from "@/lib/i18n"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"

const HEADERS: Record<"guests" | "gifts", Record<Language, string[]>> = {
  guests: {
    en: ["Guest ID", "Name", "Phone", "Guest Type", "Notes"],
    km: ["លេខសម្គាល់ភ្ញៀវ", "ឈ្មោះ", "លេខទូរស័ព្ទ", "ភ្ញៀវខាង", "កំណត់ចំណាំ"],
  },
  gifts: {
    en: ["Guest ID", "Guest Name", "Type", "Amount", "Currency", "Payment Method", "Description", "Date"],
    km: [
      "លេខសម្គាល់ភ្ញៀវ",
      "ឈ្មោះភ្ញៀវ",
      "ប្រភេទ",
      "ចំនួនទឹកប្រាក់",
      "រូបិយប័ណ្ណ",
      "វិធីបង់ប្រាក់",
      "ការពិពណ៌នា",
      "កាលបរិច្ឆេទ",
    ],
  },
}

function toCsvCell(value: unknown) {
  const text = value === undefined || value === null ? "" : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const { searchParams } = request.nextUrl
    const type = searchParams.get("type") === "gifts" ? "gifts" : "guests"
    const status = searchParams.get("status")
    const language: Language = searchParams.get("language") === "km" ? "km" : "en"

    await connectDB()

    let rows: unknown[][]

    if (type === "guests") {
      const query: Record<string, unknown> = { userId }
      if (status && status !== "all") query.guestType = status

      const guests = await Guest.find(query).sort({ guestId: 1 })
      rows = guests.map((guest) => [
        guest.guestId,
        guest.name,
        guest.phone,
        language === "km" ? guestSideLabel(language, guest.guestType) : guest.guestType,
        guest.notes,
      ])
    } else {
      const gifts = await Gift.find({ userId }).sort({ createdAt: -1 })
      rows = gifts.map((gift) => [
        gift.guestId,
        gift.guestName,
        language === "km" ? giftTypeLabel(language, gift.type) : gift.type,
        gift.amount,
        gift.currency,
        paymentMethodLabel(language, gift.paymentMethod),
        gift.description,
        gift.createdAt.toISOString().split("T")[0],
      ])
    }

    const csv = [HEADERS[type][language], ...rows].map((row) => row.map(toCsvCell).join(",")).join("\r\n")

    // UTF-8 BOM so Excel shows Khmer text correctly
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${type}-export.csv`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    return serverError("Export error", error)
  }
}
