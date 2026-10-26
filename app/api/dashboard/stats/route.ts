import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"

export async function GET() {
  try {
    const id = await getUserId()
    if (!id) return unauthorized()

    await connectDB()

    const userId = new mongoose.Types.ObjectId(id)

    const [totalGuests, groomSide, brideSide, totalGifts, moneyTotals, guestIdsWithGifts, recentGuests, recentGifts] =
      await Promise.all([
        Guest.countDocuments({ userId }),
        Guest.countDocuments({ userId, guestType: "Groom Side" }),
        Guest.countDocuments({ userId, guestType: "Bride Side" }),
        Gift.countDocuments({ userId }),
        Gift.aggregate<{ _id: string; total: number; count: number }>([
          { $match: { userId, type: "money" } },
          { $group: { _id: "$currency", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        Gift.distinct("guestId", { userId }),
        Guest.find({ userId }).sort({ createdAt: -1 }).limit(5),
        Gift.find({ userId }).sort({ createdAt: -1 }).limit(5),
      ])

    const totalFor = (currency: string) => moneyTotals.find((row) => row._id === currency)?.total ?? 0

    return NextResponse.json({
      guests: {
        total: totalGuests,
        groomSide,
        brideSide,
        withGifts: guestIdsWithGifts.length,
        recent: recentGuests,
      },
      gifts: {
        total: totalGifts,
        totalUSD: totalFor("USD"),
        totalKHR: totalFor("KHR"),
        recent: recentGifts,
      },
    })
  } catch (error) {
    return serverError("Get dashboard stats error", error)
  }
}
