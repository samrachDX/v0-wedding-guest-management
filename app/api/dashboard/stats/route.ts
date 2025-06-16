import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Guest from "@/lib/models/Guest"
import Gift from "@/lib/models/Gift"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userId = new mongoose.Types.ObjectId(session.user.id)

    // Get guest statistics
    const totalGuests = await Guest.countDocuments({ userId })

    // Get gift statistics
    const totalGifts = await Gift.countDocuments({ userId })

    // Get USD money gifts total
    const usdGifts = await Gift.aggregate([
      { $match: { userId: userId, type: "money", currency: "USD" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    const totalUSD = usdGifts.length > 0 ? usdGifts[0].total : 0

    // Get KHR money gifts total
    const khrGifts = await Gift.aggregate([
      { $match: { userId: userId, type: "money", currency: "KHR" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    const totalKHR = khrGifts.length > 0 ? khrGifts[0].total : 0

    // Get recent guests and gifts
    const recentGuests = await Guest.find({ userId }).sort({ createdAt: -1 }).limit(5)
    const recentGifts = await Gift.find({ userId }).sort({ createdAt: -1 }).limit(5)

    return NextResponse.json({
      guests: {
        total: totalGuests,
        recent: recentGuests,
      },
      gifts: {
        total: totalGifts,
        totalUSD,
        totalKHR,
        recent: recentGifts,
      },
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
