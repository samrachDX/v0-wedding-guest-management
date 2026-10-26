export type Role = "admin" | "user"

/**
 * Emails listed in ADMIN_EMAILS (comma separated) are always admins. This lets an existing
 * database, whose accounts predate roles, get its first admin without editing documents.
 */
function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function resolveRole(user: { role?: string | null; email?: string | null }): Role {
  if (user.role === "admin") return "admin"
  if (user.email && adminEmails().includes(user.email.toLowerCase())) return "admin"
  return "user"
}
