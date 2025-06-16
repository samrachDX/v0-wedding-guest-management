import mongoose from "mongoose"

const GiftSchema = new mongoose.Schema(
  {
    guestId: {
      type: Number,
      required: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["money", "item"],
      required: true,
    },
    amount: {
      type: Number,
    },
    currency: {
      type: String,
      enum: ["USD", "KHR"],
      default: "USD",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "KHQR"],
      required: function () {
        return this.type === "money"
      },
    },
    description: {
      type: String,
    },
    proofImage: {
      type: String, // URL to uploaded image
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Gift || mongoose.model("Gift", GiftSchema)
