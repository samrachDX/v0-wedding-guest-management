import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const gift = await Gift.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      {
        guestId: guest.guestId,
        guestName: guest.name,
        type,
        amount: type === "money" ? amount : undefined,
        currency: type === "money" ? currency || "USD" : undefined,
        description,
        proofImage,
      },
      { new: true },
    )

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    return NextResponse.json(gift)
  } catch (error) {
    console.error("Update gift error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const gift = await Gift.findOneAndDelete({ _id: params.id, userId: session.user.id })

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Gift deleted successfully" })
  } catch (error) {
    console.error("Delete gift error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
