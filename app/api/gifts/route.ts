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
    console.log("=== FETCHED GIFTS FROM DB ===")
    gifts.forEach((gift, index) => {
      console.log(`Gift ${index + 1}:`, {
        id: gift._id,
        guestName: gift.guestName,
        type: gift.type,
        amount: gift.amount,
        currency: gift.currency,
        paymentMethod: gift.paymentMethod,
        hasPaymentMethod: !!gift.paymentMethod,
      })
    })
    console.log("=== END GIFTS DEBUG ===")

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

    console.log("=== CREATING NEW GIFT ===")
    console.log("Request body:", { guestId, type, amount, currency, paymentMethod, description })

    if (!guestId || !type) {
      return NextResponse.json({ error: "Guest ID and type are required" }, { status: 400 })
    }

    if (type === "money") {
      if (!amount) {
        return NextResponse.json({ error: "Amount is required for money gifts" }, { status: 400 })
      }
      if (!paymentMethod) {
        return NextResponse.json({ error: "Payment method is required for money gifts" }, { status: 400 })
      }
    }

    await connectDB()

    // Get guest name
    const guest = await Guest.findOne({ guestId, userId: session.user.id })
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    // Prepare gift data
    const giftData = {
      guestId,
      guestName: guest.name,
      type,
      userId: session.user.id,
      description: description || undefined,
      proofImage: proofImage || undefined,
    }

    // Add money-specific fields
    if (type === "money") {
      giftData.amount = Number(amount)
      giftData.currency = currency || "USD"
      giftData.paymentMethod = paymentMethod
    }

    console.log("Final gift data to save:", giftData)

    const gift = new Gift(giftData)
    const savedGift = await gift.save()

    console.log("=== SAVED GIFT ===")
    console.log("Saved gift data:", {
      id: savedGift._id,
      guestName: savedGift.guestName,
      type: savedGift.type,
      amount: savedGift.amount,
      currency: savedGift.currency,
      paymentMethod: savedGift.paymentMethod,
      hasPaymentMethod: !!savedGift.paymentMethod,
    })
    console.log("=== END SAVE DEBUG ===")

    return NextResponse.json(savedGift, { status: 201 })
  } catch (error) {
    console.error("Create gift error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
