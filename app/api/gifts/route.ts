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

    const gift = new Gift({
      guestId,
      guestName: guest.name,
      type,
      amount: type === "money" ? amount : undefined,
      currency: type === "money" ? currency : undefined,
      paymentMethod: type === "money" ? paymentMethod : undefined,
      description,
      proofImage,
      userId: session.user.id,
    })

    await gift.save()

    return NextResponse.json(gift, { status: 201 })
  } catch (error) {
    console.error("Create gift error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
