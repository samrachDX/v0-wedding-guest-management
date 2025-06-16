import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Find all money gifts without paymentMethod for this user
    const giftsToUpdate = await Gift.find({
      userId: session.user.id,
      type: "money",
      $or: [{ paymentMethod: { $exists: false } }, { paymentMethod: null }, { paymentMethod: "" }],
    })

    console.log(`Found ${giftsToUpdate.length} gifts to update for user ${session.user.id}`)

    let updatedCount = 0

    // Update each gift with a default payment method
    for (const gift of giftsToUpdate) {
      const updateResult = await Gift.updateOne(
        { _id: gift._id },
        {
          $set: {
            paymentMethod: "Cash",
            currency: gift.currency || "USD",
          },
        },
      )

      if (updateResult.modifiedCount > 0) {
        updatedCount++
        console.log(`Updated gift ${gift._id} (Guest: ${gift.guestName})`)
      }
    }

    return NextResponse.json({
      message: "Migration completed successfully",
      updatedCount,
      totalFound: giftsToUpdate.length,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
