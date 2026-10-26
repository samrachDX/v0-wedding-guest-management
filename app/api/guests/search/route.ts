import { type NextRequest, NextResponse } from "next/server"
import { escapeRegex, getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Guest from "@/lib/models/Guest"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const query = request.nextUrl.searchParams.get("q")?.trim()
    if (!query) return NextResponse.json([])

    await connectDB()

    const or: Record<string, unknown>[] = [{ name: { $regex: escapeRegex(query), $options: "i" } }]
    const asNumber = Number(query)
    if (Number.isInteger(asNumber)) or.push({ guestId: asNumber })

    const guests = await Guest.find({ userId, $or: or }).sort({ guestId: 1 }).limit(10).select("guestId name guestType")

    return NextResponse.json(guests)
  } catch (error) {
    return serverError("Search guests error", error)
  }
}
