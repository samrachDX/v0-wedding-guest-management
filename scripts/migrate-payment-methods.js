// Migration script to add payment methods to existing money gifts
import mongoose from "mongoose"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rachya:Y8FseKXRbJoZGSdW@cluster0.9yz8ir7.mongodb.net/rachya?retryWrites=true&w=majority&appName=Cluster0"

const GiftSchema = new mongoose.Schema(
  {
    guestId: Number,
    guestName: String,
    type: String,
    amount: Number,
    currency: String,
    paymentMethod: String,
    description: String,
    proofImage: String,
    userId: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  },
)

const Gift = mongoose.models.Gift || mongoose.model("Gift", GiftSchema)

async function migratePaymentMethods() {
  try {
    console.log("Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB")

    // Find all money gifts without paymentMethod
    const giftsToUpdate = await Gift.find({
      type: "money",
      $or: [{ paymentMethod: { $exists: false } }, { paymentMethod: null }, { paymentMethod: "" }],
    })

    console.log(`Found ${giftsToUpdate.length} gifts to update`)

    // Update each gift with a default payment method
    for (const gift of giftsToUpdate) {
      // Default to Cash for existing records
      const updateResult = await Gift.updateOne(
        { _id: gift._id },
        {
          $set: {
            paymentMethod: "Cash",
            currency: gift.currency || "USD", // Ensure currency is set
          },
        },
      )

      console.log(`Updated gift ${gift._id} (Guest: ${gift.guestName}) - Modified: ${updateResult.modifiedCount}`)
    }

    console.log("Migration completed successfully!")

    // Verify the updates
    const updatedGifts = await Gift.find({ type: "money" }).select("guestName paymentMethod currency amount")
    console.log("Updated gifts:")
    updatedGifts.forEach((gift) => {
      console.log(`- ${gift.guestName}: ${gift.paymentMethod} (${gift.currency} ${gift.amount})`)
    })
  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
  }
}

// Run the migration
migratePaymentMethods()
