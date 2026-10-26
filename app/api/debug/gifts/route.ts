import { NextResponse } from "next/server"
import { getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    await connectDB()

    const gifts = await Gift.find({ userId }).lean()

    return NextResponse.json({
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
      })),
    })
  } catch (error) {
    return serverError("Debug gifts error", error)
  }
}
