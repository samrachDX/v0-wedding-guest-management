"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Ban, CheckCircle2, Loader2, Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import Layout from "@/components/Layout"
import { PageHeader } from "@/components/PageHeader"
import { PageLoader } from "@/components/PageLoader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToast } from "@/hooks/use-toast"
import { formatDate, initials } from "@/lib/format"
import type { Role } from "@/lib/roles"
import { cn } from "@/lib/utils"

interface ManagedUser {
  _id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt?: string
  guestCount: number
  giftCount: number
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null)
  const { toast } = useToast()
  const { t, language } = useLanguage()

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.status === 403) setForbidden(true)
      else if (response.ok) setUsers(await response.json())
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    fetchUsers()
  }, [fetchUsers])

  const updateUser = async (user: ManagedUser, changes: Partial<ManagedUser>, successMessage: string) => {
    const response = await fetch(`/api/admin/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      toast({ title: successMessage })
      await fetchUsers()
    } else {
      toast({ title: t("common.error"), description: data.error || t("users.saveFailed"), variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    const response = await fetch(`/api/admin/users/${deletingUser._id}`, { method: "DELETE" })
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      toast({ title: t("users.deleted") })
      await fetchUsers()
    } else {
      toast({ title: t("common.error"), description: data.error, variant: "destructive" })
    }
  }

  const openAdd = () => {
    setEditingUser(null)
    setDialogOpen(true)
  }

  const isSelf = (user: ManagedUser) => user._id === session?.user?.id

  const actions = (user: ManagedUser) => (
    <div className="flex shrink-0 justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("common.edit")}
        title={t("common.edit")}
        onClick={() => {
          setEditingUser(user)
          setDialogOpen(true)
        }}
      >
        <Pencil />
      </Button>
      {!isSelf(user) && (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label={user.active ? t("users.disable") : t("users.enable")}
            title={user.active ? t("users.disable") : t("users.enable")}
            onClick={() =>
              updateUser(
                user,
                { active: !user.active },
                user.active ? t("users.disabledToast") : t("users.enabledToast"),
              )
            }
          >
            {user.active ? <Ban /> : <CheckCircle2 />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.delete")}
            title={t("common.delete")}
            onClick={() => setDeletingUser(user)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </>
      )}
    </div>
  )

  const roleBadge = (user: ManagedUser) =>
    user.role === "admin" ? (
      <Badge variant="gold">
        <ShieldCheck />
        {t("users.roleAdmin")}
      </Badge>
    ) : (
      <Badge variant="secondary">{t("users.roleUser")}</Badge>
    )

  const statusBadge = (user: ManagedUser) =>
    user.active ? (
      <Badge variant="success">{t("users.active")}</Badge>
    ) : (
      <Badge variant="muted">{t("users.disabled")}</Badge>
    )

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title={t("users.title")}
          description={t("users.subtitle")}
          actions={
            !forbidden && (
              <Button onClick={openAdd}>
                <Plus />
                {t("users.addUser")}
              </Button>
            )
          }
        />

        {loading ? (
          <PageLoader label={t("common.loading")} />
        ) : forbidden ? (
          <Card>
            <EmptyState icon={ShieldCheck} title={t("users.forbidden")} />
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <EmptyState icon={UserRound} title={t("users.empty")} />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">{t("users.name")}</th>
                    <th className="px-5 py-3 font-medium">{t("users.role")}</th>
                    <th className="px-5 py-3 font-medium">{t("users.status")}</th>
                    <th className="px-5 py-3 font-medium">{t("users.data")}</th>
                    <th className="px-5 py-3 font-medium">{t("gifts.date")}</th>
                    <th className="px-5 py-3 text-right font-medium">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className={cn("transition-colors hover:bg-muted/40", !user.active && "opacity-60")}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                            {initials(user.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-medium">
                              {user.name}
                              {isSelf(user) && <Badge variant="outline">{t("users.you")}</Badge>}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">{roleBadge(user)}</td>
                      <td className="px-5 py-3">{statusBadge(user)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {t("users.dataCounts", { guests: user.guestCount, gifts: user.giftCount })}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                        {user.createdAt ? formatDate(user.createdAt, language) : "-"}
                      </td>
                      <td className="px-5 py-2">{actions(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y md:hidden">
              {users.map((user) => (
                <li key={user._id} className={cn("flex items-start gap-3 px-4 py-3.5", !user.active && "opacity-60")}>
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {initials(user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {roleBadge(user)}
                      {statusBadge(user)}
                      {isSelf(user) && <Badge variant="outline">{t("users.you")}</Badge>}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t("users.dataCounts", { guests: user.guestCount, gifts: user.giftCount })}
                    </p>
                  </div>
                  {actions(user)}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <UserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={editingUser}
          isSelf={!!editingUser && isSelf(editingUser)}
          onSaved={async () => {
            setDialogOpen(false)
            await fetchUsers()
          }}
        />
        <ConfirmDialog
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          title={t("users.deleteTitle")}
          description={deletingUser ? t("users.deleteDescription", { name: deletingUser.name }) : undefined}
          onConfirm={handleDelete}
        />
      </div>
    </Layout>
  )
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ManagedUser | null
  isSelf: boolean
  onSaved: () => void
}

function UserDialog({ open, onOpenChange, user, isSelf, onSaved }: UserDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? t("users.editUser") : t("users.addUser")}</DialogTitle>
        </DialogHeader>
        {/* Keyed so the form starts fresh for each user; Radix unmounts it when closed */}
        <UserForm
          key={user?._id ?? "new"}
          user={user}
          isSelf={isSelf}
          onCancel={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  )
}

function UserForm({
  user,
  isSelf,
  onCancel,
  onSaved,
}: {
  user: ManagedUser | null
  isSelf: boolean
  onCancel: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? ("user" as Role),
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = user
        ? { name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : form
      const response = await fetch(user ? `/api/admin/users/${user._id}` : "/api/admin/users", {
        method: user ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || t("users.saveFailed"))

      toast({ title: user ? t("users.updated") : t("users.created") })
      onSaved()
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("users.saveFailed"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const roles: { value: Role; label: string; hint: string }[] = [
    { value: "user", label: t("users.roleUser"), hint: t("users.roleUserHint") },
    { value: "admin", label: t("users.roleAdmin"), hint: t("users.roleAdminHint") },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-name">
          {t("users.name")} <span className="text-destructive">*</span>
        </Label>
        <Input id="user-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-email">
          {t("users.email")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="user-email"
          type="email"
          autoComplete="off"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-password">
          {user ? t("users.newPassword") : t("users.password")}
          {!user && <span className="text-destructive"> *</span>}
        </Label>
        <Input
          id="user-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required={!user}
        />
        <p className="text-xs text-muted-foreground">{user ? t("users.newPasswordHint") : t("auth.passwordHint")}</p>
      </div>
      <div className="space-y-2">
        <Label>{t("users.role")}</Label>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              role="radio"
              aria-checked={form.role === role.value}
              disabled={isSelf}
              onClick={() => setForm({ ...form, role: role.value })}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                form.role === role.value ? "border-primary bg-accent" : "hover:bg-muted",
              )}
            >
              <span className="block text-sm font-medium">{role.label}</span>
              <span className="block text-xs text-muted-foreground">{role.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("form.cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {saving ? t("form.saving") : user ? t("form.update") : t("form.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}
