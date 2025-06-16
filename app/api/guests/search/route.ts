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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json([])
    }

    await connectDB()

    const guests = await Guest.find({
      userId: session.user.id,
      $or: [{ guestId: Number.parseInt(query) || 0 }, { name: { $regex: query, $options: "i" } }],
    })
      .limit(10)
      .select("guestId name")

    return NextResponse.json(guests)
  } catch (error) {
    console.error("Search guests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
