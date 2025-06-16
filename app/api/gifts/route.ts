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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const type = searchParams.get("type")

    const query: any = { userId: session.user.id }

    if (search) {
      query.$or = [{ guestId: Number.parseInt(search) || 0 }, { guestName: { $regex: search, $options: "i" } }]
    }

    if (type && type !== "all") {
      query.type = type
    }

    const gifts = await Gift.find(query).sort({ createdAt: -1 })

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

    const { guestId, type, amount, currency, description, proofImage } = await request.json()

    if (!guestId || !type) {
      return NextResponse.json({ error: "Guest ID and type are required" }, { status: 400 })
    }

    await connectDB()

    // Get guest name by ID or name search
    let guest
    if (Number.isInteger(Number(guestId))) {
      // Search by ID
      guest = await Guest.findOne({ guestId: Number(guestId), userId: session.user.id })
    } else {
      // Search by name
      guest = await Guest.findOne({
        name: { $regex: guestId, $options: "i" },
        userId: session.user.id,
      })
    }

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    const gift = await Gift.create({
      guestId: guest.guestId,
      guestName: guest.name,
      type,
      amount: type === "money" ? amount : undefined,
      currency: type === "money" ? currency || "USD" : undefined,
      description,
      proofImage,
      userId: session.user.id,
    })

    return NextResponse.json(gift, { status: 201 })
  } catch (error) {
    console.error("Create gift error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
