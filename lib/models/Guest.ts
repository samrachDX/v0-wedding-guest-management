import mongoose from "mongoose"

const GuestSchema = new mongoose.Schema(
  {
    guestId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false, // Made optional
    },
    guestType: {
      type: String,
      enum: ["Groom Side", "Bride Side"],
      required: true,
    },
    notes: {
      type: String,
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

// Guest numbers are counted per account, so they only need to be unique within one account
GuestSchema.index({ userId: 1, guestId: 1 }, { unique: true })

export default mongoose.models.Guest || mongoose.model("Guest", GuestSchema)
