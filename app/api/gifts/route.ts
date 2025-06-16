import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const gifts = await Gift.find({ userId: session.user.id }).sort({ createdAt: -1 })

    // Debug log to check what data we're getting
    console.log("Fetched gifts from DB:", JSON.stringify(gifts, null, 2))

    return NextResponse.json(gifts)
  } catch (error) {
    console.error("Get gifts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { guestId, type, amount, currency, paymentMethod, description, proofImage } = body

    console.log("Creating gift with data:", { guestId, type, amount, currency, paymentMethod, description })

    if (!guestId || !type) {
      return NextResponse.json({ error: "Guest ID and type are required" }, { status: 400 })
    }

    if (type === "money" && (!amount || !paymentMethod)) {
      return NextResponse.json({ error: "Amount and payment method are required for money gifts" }, { status: 400 })
    }

    await connectDB()

    // Get guest name
    const guest = await Guest.findOne({ guestId, userId: session.user.id })
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    const giftData = {
      guestId,
      guestName: guest.name,
      type,
      userId: session.user.id,
      description,
      proofImage,
    }

    // Only add money-specific fields if type is money
    if (type === "money") {
      giftData.amount = amount
      giftData.currency = currency || "USD"
      giftData.paymentMethod = paymentMethod
    }

    console.log("Final gift data to save:", giftData)

    const gift = new Gift(giftData)
    await gift.save()

    console.log("Saved gift:", JSON.stringify(gift, null, 2))

    return NextResponse.json(gift, { status: 201 })
  } catch (error) {
    console.error("Create gift error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
