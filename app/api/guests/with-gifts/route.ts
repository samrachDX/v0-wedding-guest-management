import { NextResponse } from "next/server"
import { getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    await connectDB()
    const guestIds = await Gift.distinct("guestId", { userId })

    return NextResponse.json({ guestIds })
  } catch (error) {
    return serverError("Get guests with gifts error", error)
  }
}
