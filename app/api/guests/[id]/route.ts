import { type NextRequest, NextResponse } from "next/server"
import { getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Guest from "@/lib/models/Guest"

export async function PUT(request: NextRequest, { params }: RouteContext<"/api/guests/[id]">) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const { id } = await params
    const { name, phone, guestType, notes } = await request.json()

    if (!name?.trim() || !guestType) {
      return NextResponse.json({ error: "Name and guest type are required" }, { status: 400 })
    }

    await connectDB()

    const guest = await Guest.findOneAndUpdate(
      { _id: id, userId },
      { name: name.trim(), phone: phone?.trim() || undefined, guestType, notes: notes?.trim() || undefined },
      { returnDocument: "after" },
    )

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    return NextResponse.json(guest)
  } catch (error) {
    return serverError("Update guest error", error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext<"/api/guests/[id]">) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const { id } = await params
    await connectDB()

    const guest = await Guest.findOneAndDelete({ _id: id, userId })

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Guest deleted successfully" })
  } catch (error) {
    return serverError("Delete guest error", error)
  }
}
