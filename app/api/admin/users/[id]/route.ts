import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { forbidden, getCurrentUser, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"
import User from "@/lib/models/User"
import { resolveRole } from "@/lib/roles"
import { countActiveAdmins, toPublicUser } from "@/lib/userAdmin"

export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/admin/users/[id]">) {
  try {
    const me = await getCurrentUser()
    if (!me) return unauthorized()
    if (me.role !== "admin") return forbidden()

    const { id } = await params
    const { name, email, password, role, active } = await request.json()

    await connectDB()
    const user = await User.findById(id)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const isSelf = id === me.id
    const wasActiveAdmin = user.active !== false && resolveRole(user) === "admin"
    const losesAdmin = (role !== undefined && role !== "admin") || active === false
    if (isSelf && losesAdmin) {
      return NextResponse.json({ error: "You cannot remove your own admin access" }, { status: 400 })
    }
    if (wasActiveAdmin && losesAdmin && (await countActiveAdmins()) <= 1) {
      return NextResponse.json({ error: "At least one active admin is required" }, { status: 400 })
    }

    if (name !== undefined) {
      if (!String(name).trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })
      user.name = String(name).trim()
    }
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase()
      if (!normalizedEmail) return NextResponse.json({ error: "Email is required" }, { status: 400 })
      const taken = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } })
      if (taken) return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
      user.email = normalizedEmail
    }
    if (password) {
      if (String(password).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }
      user.password = await bcrypt.hash(password, 12)
    }
    if (role === "admin" || role === "user") user.role = role
    if (typeof active === "boolean") user.active = active

    await user.save()
    return NextResponse.json(toPublicUser(user))
  } catch (error) {
    return serverError("Update user error", error)
  }
}

/** Deletes the account together with its guests and gifts. */
export async function DELETE(_request: NextRequest, { params }: RouteContext<"/api/admin/users/[id]">) {
  try {
    const me = await getCurrentUser()
    if (!me) return unauthorized()
    if (me.role !== "admin") return forbidden()

    const { id } = await params
    if (id === me.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(id)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (user.active !== false && resolveRole(user) === "admin" && (await countActiveAdmins()) <= 1) {
      return NextResponse.json({ error: "At least one active admin is required" }, { status: 400 })
    }

    await Promise.all([Guest.deleteMany({ userId: user._id }), Gift.deleteMany({ userId: user._id })])
    await user.deleteOne()

    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    return serverError("Delete user error", error)
  }
}
