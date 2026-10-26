import { type NextRequest, NextResponse } from "next/server"
import { escapeRegex, getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    await connectDB()

    const { searchParams } = request.nextUrl
    const search = searchParams.get("search")?.trim()
    const guestType = searchParams.get("guestType")
    const giftFilter = searchParams.get("giftFilter")

    const query: Record<string, unknown> = { userId }

    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: "i" }
      const or: Record<string, unknown>[] = [{ name: pattern }, { phone: pattern }]
      const asNumber = Number(search)
      if (Number.isInteger(asNumber)) or.push({ guestId: asNumber })
      query.$or = or
    }

    if (guestType && guestType !== "all") {
      query.guestType = guestType
    }

    if (giftFilter === "with-gifts" || giftFilter === "without-gifts") {
      const guestIdsWithGifts = await Gift.distinct("guestId", { userId })
      query.guestId = giftFilter === "with-gifts" ? { $in: guestIdsWithGifts } : { $nin: guestIdsWithGifts }
    }

    const guests = await Guest.find(query).sort({ guestId: 1 })
    return NextResponse.json(guests)
  } catch (error) {
    return serverError("Get guests error", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const { name, phone, guestType, notes } = await request.json()

    if (!name?.trim() || !guestType) {
      return NextResponse.json({ error: "Name and guest type are required" }, { status: 400 })
    }

    await connectDB()

    const lastGuest = await Guest.findOne({ userId }).sort({ guestId: -1 })
    const nextGuestId = lastGuest ? lastGuest.guestId + 1 : 1

    const guest = await Guest.create({
      guestId: nextGuestId,
      name: name.trim(),
      phone: phone?.trim() || undefined,
      guestType,
      notes: notes?.trim() || undefined,
      userId,
    })

    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    return serverError("Create guest error", error)
  }
}
