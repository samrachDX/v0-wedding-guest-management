import { NextResponse } from "next/server"
import { getUserId, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"

/** Gives money gifts that predate the payment-method field a default of "Cash". */
export async function POST() {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    await connectDB()

    const filter = {
      userId,
      type: "money",
      $or: [{ paymentMethod: { $exists: false } }, { paymentMethod: null }, { paymentMethod: "" }],
    }
    const totalFound = await Gift.countDocuments(filter)
    const paymentResult = await Gift.updateMany(filter, { $set: { paymentMethod: "Cash" } })
    await Gift.updateMany(
      { userId, type: "money", $or: [{ currency: { $exists: false } }, { currency: null }] },
      { $set: { currency: "USD" } },
    )

    return NextResponse.json({
      message: "Migration completed successfully",
      updatedCount: paymentResult.modifiedCount,
      totalFound,
    })
  } catch (error) {
    return serverError("Migration error", error)
  }
}
