import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import connectDB from "./mongodb"
import User from "./models/User"
import { resolveRole } from "./roles"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        // Accounts are stored lower-cased now, but older ones may keep their original casing
        const email = credentials.email.trim()
        const user = await User.findOne({ email: { $in: [email, email.toLowerCase()] } })

        if (!user || user.active === false) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      // Re-read role and status so admin changes apply without signing out
      if (token.id) {
        await connectDB()
        const current = await User.findById(token.id).select("name email role active").lean<{
          name: string
          email: string
          role?: string
          active?: boolean
        }>()
        if (!current || current.active === false) {
          token.disabled = true
        } else {
          token.disabled = false
          token.name = current.name
          token.email = current.email
          token.role = resolveRole(current)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = (token.role as "admin" | "user") ?? "user"
        session.user.disabled = !!token.disabled
      }
      return session
    },
  },
}
