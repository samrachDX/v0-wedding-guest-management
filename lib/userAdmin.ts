import User from "@/lib/models/User"
import { resolveRole } from "@/lib/roles"

interface UserDoc {
  _id: { toString(): string }
  name: string
  email: string
  role?: string
  active?: boolean
  createdAt?: Date
}

/** The shape returned to the admin UI; never includes the password hash. */
export function toPublicUser(user: UserDoc) {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: resolveRole(user),
    active: user.active !== false,
    createdAt: user.createdAt,
  }
}

/** Counts enabled admins, including accounts made admin through ADMIN_EMAILS. */
export async function countActiveAdmins() {
  const users = await User.find({ active: { $ne: false } })
    .select("email role")
    .lean<UserDoc[]>()
  return users.filter((user) => resolveRole(user) === "admin").length
}
