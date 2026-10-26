import { type NextRequest, NextResponse } from "next/server"
import { escapeRegex, getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"

export async function PUT(request: NextRequest, { params }: RouteContext<"/api/gifts/[id]">) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const { id } = await params
    const { guestId, type, amount, currency, paymentMethod, description, proofImage } = await request.json()

    if (!guestId || !type) {
      return NextResponse.json({ error: "Guest ID and type are required" }, { status: 400 })
    }

    if (type === "money" && (!amount || !paymentMethod)) {
      return NextResponse.json({ error: "Amount and payment method are required for money gifts" }, { status: 400 })
    }

    await connectDB()

    // guestId is normally numeric; a name is accepted as a fallback
    const guest = Number.isInteger(Number(guestId))
      ? await Guest.findOne({ guestId: Number(guestId), userId })
      : await Guest.findOne({ name: { $regex: escapeRegex(String(guestId)), $options: "i" }, userId })

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    const set: Record<string, unknown> = {
      guestId: guest.guestId,
      guestName: guest.name,
      type,
      description: description || undefined,
      proofImage: proofImage || undefined,
    }
    const unset: Record<string, ""> = {}

    if (type === "money") {
      set.amount = Number(amount)
      set.currency = currency || "USD"
      set.paymentMethod = paymentMethod
    } else {
      // Switching from money to item clears the money-only fields
      unset.amount = ""
      unset.currency = ""
      unset.paymentMethod = ""
    }

    const gift = await Gift.findOneAndUpdate(
      { _id: id, userId },
      { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      { returnDocument: "after" },
    )

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    return NextResponse.json(gift)
  } catch (error) {
    return serverError("Update gift error", error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext<"/api/gifts/[id]">) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const { id } = await params
    await connectDB()

    const gift = await Gift.findOneAndDelete({ _id: id, userId })

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Gift deleted successfully" })
  } catch (error) {
    return serverError("Delete gift error", error)
  }
}
