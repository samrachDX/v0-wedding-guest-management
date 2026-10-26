import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { type Role, resolveRole } from "@/lib/roles"

export interface CurrentUser {
  id: string
  email: string
  role: Role
}

/** Loads the signed-in user from the database; null when signed out or the account is disabled. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions)
  const id = session?.user?.id
  if (!id) return null

  await connectDB()
  const user = await User.findById(id).select("email role active").lean<{
    email: string
    role?: string
    active?: boolean
  }>()
  if (!user || user.active === false) return null

  return { id, email: user.email, role: resolveRole(user) }
}

/** Returns the signed-in user's id, or null when the request is unauthenticated or the account is disabled. */
export async function getUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export function serverError(label: string, error: unknown) {
  console.error(`${label}:`, error)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}

/** Escapes user input so it can be used safely inside a MongoDB $regex. */
export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
