import { createHash, timingSafeEqual } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { escapeRegex, serverError } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

/**
 * Emergency recovery for a locked-out admin. It only works while ADMIN_RESET_SECRET is set in the
 * environment, so the owner sets it, uses this once, then removes it again.
 */
function resetSecret() {
  const secret = process.env.ADMIN_RESET_SECRET?.trim()
  return secret && secret.length >= 12 ? secret : null
}

function matches(given: string, expected: string) {
  const a = createHash("sha256").update(given).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function GET() {
  return NextResponse.json({ enabled: !!resetSecret() })
}

export async function POST(request: NextRequest) {
  try {
    const secret = resetSecret()
    if (!secret) {
      return NextResponse.json({ error: "Admin reset is turned off" }, { status: 404 })
    }

    const { secret: given, email, password } = await request.json()

    if (!given || !matches(String(given), secret)) {
      // Slow down guessing
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return NextResponse.json({ error: "Wrong secret phrase" }, { status: 403 })
    }
    if (!email?.trim() || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOneAndUpdate(
      { email: { $regex: `^${escapeRegex(email.trim())}$`, $options: "i" } },
      { $set: { password: await bcrypt.hash(password, 12), role: "admin", active: true } },
      { returnDocument: "after" },
    )
    if (!user) {
      return NextResponse.json({ error: "No account with that email" }, { status: 404 })
    }

    return NextResponse.json({ message: "Password reset", email: user.email })
  } catch (error) {
    return serverError("Admin reset error", error)
  }
}
