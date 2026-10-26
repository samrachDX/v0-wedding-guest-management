import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    // "admin" accounts can manage other users. Older accounts have no role and count as "user".
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    // Disabled accounts cannot sign in or use the API
    active: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      default: "en",
      enum: ["en", "km"],
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.User || mongoose.model("User", UserSchema)
