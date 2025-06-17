import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
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
    const guestType = searchParams.get("guestType")
    const giftFilter = searchParams.get("giftFilter")

    const query: any = { userId: session.user.id }

    if (search) {
      query.$or = [
        { guestId: Number.parseInt(search) || 0 },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ]
    }

    if (guestType && guestType !== "all") {
      query.guestType = guestType
    }

    let guests = await Guest.find(query).sort({ guestId: 1 })

    // Filter by gift status if specified
    if (giftFilter && giftFilter !== "all") {
      // Get guest IDs that have gifts
      const Gift = require("@/lib/models/Gift").default
      const guestsWithGifts = await Gift.distinct("guestId", { userId: session.user.id })
      const guestIdsWithGifts = new Set(guestsWithGifts)

      if (giftFilter === "with-gifts") {
        guests = guests.filter((guest) => guestIdsWithGifts.has(guest.guestId))
      } else if (giftFilter === "without-gifts") {
        guests = guests.filter((guest) => !guestIdsWithGifts.has(guest.guestId))
      }
    }

    return NextResponse.json(guests)
  } catch (error) {
    console.error("Get guests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, phone, guestType, notes } = await request.json()

    if (!name || !guestType) {
      return NextResponse.json({ error: "Name and guest type are required" }, { status: 400 })
    }

    await connectDB()

    // Get the next guest ID
    const lastGuest = await Guest.findOne({ userId: session.user.id }).sort({ guestId: -1 })
    const nextGuestId = lastGuest ? lastGuest.guestId + 1 : 1

    const guest = await Guest.create({
      guestId: nextGuestId,
      name,
      phone: phone || undefined,
      guestType,
      notes,
      userId: session.user.id,
    })

    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    console.error("Create guest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
