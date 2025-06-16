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
    const status = searchParams.get("status")

    const query: any = { userId: session.user.id }

    if (search) {
      query.$or = [
        { guestId: Number.parseInt(search) || 0 },
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ]
    }

    if (status && status !== "all") {
      query.attendanceStatus = status
    }

    const guests = await Guest.find(query).sort({ guestId: 1 })

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

    const { name, phone, email, attendanceStatus, tableNumber, notes } = await request.json()

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    await connectDB()

    // Get the next guest ID
    const lastGuest = await Guest.findOne({ userId: session.user.id }).sort({ guestId: -1 })
    const nextGuestId = lastGuest ? lastGuest.guestId + 1 : 1

    const guest = await Guest.create({
      guestId: nextGuestId,
      name,
      phone,
      email,
      attendanceStatus: attendanceStatus || "Pending",
      tableNumber,
      notes,
      userId: session.user.id,
    })

    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    console.error("Create guest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
