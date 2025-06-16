import mongoose from "mongoose"

const GuestSchema = new mongoose.Schema(
  {
    guestId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    attendanceStatus: {
      type: String,
      enum: ["Confirmed", "Pending", "Not Attending"],
      default: "Pending",
    },
    tableNumber: {
      type: Number,
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

export default mongoose.models.Guest || mongoose.model("Guest", GuestSchema)
