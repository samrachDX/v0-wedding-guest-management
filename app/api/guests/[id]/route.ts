import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Guest from "@/lib/models/Guest"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, phone, guestType, notes } = await request.json()

    await connectDB()

    const guest = await Guest.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      { name, phone: phone || undefined, guestType, notes },
      { new: true },
    )

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    return NextResponse.json(guest)
  } catch (error) {
    console.error("Update guest error:", error)
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

    const guest = await Guest.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    })

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Guest deleted successfully" })
  } catch (error) {
    console.error("Delete guest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
