import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get all unique guest IDs that have gifts
    const giftsWithGuestIds = await Gift.distinct("guestId", { userId: session.user.id })

    return NextResponse.json({ guestIds: giftsWithGuestIds })
  } catch (error) {
    console.error("Get guests with gifts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
