import { type NextRequest, NextResponse } from "next/server"
import { getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    await connectDB()

    // ?latest=1 returns only the newest gift (used by the live display screen)
    if (request.nextUrl.searchParams.get("latest")) {
      const latest = await Gift.findOne({ userId }).sort({ createdAt: -1 })
      return NextResponse.json(latest ? [latest] : [])
    }

    const gifts = await Gift.find({ userId }).sort({ createdAt: -1 })
    return NextResponse.json(gifts)
  } catch (error) {
    return serverError("Get gifts error", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const { guestId, type, amount, currency, paymentMethod, description, proofImage } = await request.json()

    if (!guestId || !type) {
      return NextResponse.json({ error: "Guest ID and type are required" }, { status: 400 })
    }

    if (type === "money") {
      if (!amount || Number(amount) <= 0) {
        return NextResponse.json({ error: "Amount is required for money gifts" }, { status: 400 })
      }
      if (!paymentMethod) {
        return NextResponse.json({ error: "Payment method is required for money gifts" }, { status: 400 })
      }
    }

    await connectDB()

    const guest = await Guest.findOne({ guestId, userId })
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    const gift = await Gift.create({
      guestId,
      guestName: guest.name,
      type,
      userId,
      description: description || undefined,
      proofImage: proofImage || undefined,
      ...(type === "money" ? { amount: Number(amount), currency: currency || "USD", paymentMethod } : {}),
    })

    return NextResponse.json(gift, { status: 201 })
  } catch (error) {
    return serverError("Create gift error", error)
  }
}
