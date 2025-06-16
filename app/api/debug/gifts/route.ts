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

    // Get raw data from database
    const gifts = await Gift.find({ userId: session.user.id }).lean()

    // Return detailed debug information
    const debugInfo = {
      totalGifts: gifts.length,
      gifts: gifts.map((gift) => ({
        _id: gift._id,
        guestId: gift.guestId,
        guestName: gift.guestName,
        type: gift.type,
        amount: gift.amount,
        currency: gift.currency,
        paymentMethod: gift.paymentMethod,
        hasPaymentMethod: !!gift.paymentMethod,
        paymentMethodType: typeof gift.paymentMethod,
        allFields: Object.keys(gift),
      })),
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("Debug gifts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
