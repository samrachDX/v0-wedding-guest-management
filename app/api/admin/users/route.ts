import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { forbidden, getCurrentUser, serverError, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"
import User from "@/lib/models/User"
import { toPublicUser } from "@/lib/userAdmin"

export async function GET() {
  try {
    const me = await getCurrentUser()
    if (!me) return unauthorized()
    if (me.role !== "admin") return forbidden()

    await connectDB()
    const [users, guestCounts, giftCounts] = await Promise.all([
      User.find().sort({ createdAt: 1 }).select("name email role active createdAt").lean(),
      Guest.aggregate<{ _id: unknown; count: number }>([{ $group: { _id: "$userId", count: { $sum: 1 } } }]),
      Gift.aggregate<{ _id: unknown; count: number }>([{ $group: { _id: "$userId", count: { $sum: 1 } } }]),
    ])

    const countFor = (rows: { _id: unknown; count: number }[], id: string) =>
      rows.find((row) => String(row._id) === id)?.count ?? 0

    return NextResponse.json(
      users.map((user) => {
        const publicUser = toPublicUser(user)
        return {
          ...publicUser,
          guestCount: countFor(guestCounts, publicUser._id),
          giftCount: countFor(giftCounts, publicUser._id),
        }
      }),
    )
  } catch (error) {
    return serverError("List users error", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const me = await getCurrentUser()
    if (!me) return unauthorized()
    if (me.role !== "admin") return forbidden()

    const { name, email, password, role } = await request.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    await connectDB()

    const normalizedEmail = email.trim().toLowerCase()
    if (await User.findOne({ email: { $in: [email.trim(), normalizedEmail] } })) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: role === "admin" ? "admin" : "user",
    })

    return NextResponse.json(toPublicUser(user), { status: 201 })
  } catch (error) {
    return serverError("Create user error", error)
  }
}
