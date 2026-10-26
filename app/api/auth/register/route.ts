import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { serverError } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

/** Public sign-up is closed. Only the very first account can register here, and it becomes the admin. */
export async function GET() {
  try {
    await connectDB()
    const registrationOpen = (await User.estimatedDocumentCount()) === 0
    return NextResponse.json({ registrationOpen })
  } catch (error) {
    return serverError("Registration status error", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    await connectDB()

    if ((await User.countDocuments()) > 0) {
      return NextResponse.json(
        { error: "Registration is closed. Ask an administrator to create an account for you." },
        { status: 403 },
      )
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 12),
      role: "admin",
    })

    return NextResponse.json({ message: "User created successfully", userId: user._id }, { status: 201 })
  } catch (error) {
    return serverError("Registration error", error)
  }
}
