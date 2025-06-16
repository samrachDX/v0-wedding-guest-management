import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Guest from "@/lib/models/Guest"
import Gift from "@/lib/models/Gift"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const userId = session.user.id

    // Get guest statistics
    const totalGuests = await Guest.countDocuments({ userId })
    const confirmedGuests = await Guest.countDocuments({ userId, attendanceStatus: "Confirmed" })
    const pendingGuests = await Guest.countDocuments({ userId, attendanceStatus: "Pending" })
    const notAttendingGuests = await Guest.countDocuments({ userId, attendanceStatus: "Not Attending" })

    // Get gift statistics
    const totalGifts = await Gift.countDocuments({ userId })
    const moneyGifts = await Gift.aggregate([
      { $match: { userId: session.user.id, type: "money" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    const totalMoney = moneyGifts.length > 0 ? moneyGifts[0].total : 0

    // Get recent guests and gifts
    const recentGuests = await Guest.find({ userId }).sort({ createdAt: -1 }).limit(5)
    const recentGifts = await Gift.find({ userId }).sort({ createdAt: -1 }).limit(5)

    return NextResponse.json({
      guests: {
        total: totalGuests,
        confirmed: confirmedGuests,
        pending: pendingGuests,
        notAttending: notAttendingGuests,
        recent: recentGuests,
      },
      gifts: {
        total: totalGifts,
        totalMoney,
        recent: recentGifts,
      },
    })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
