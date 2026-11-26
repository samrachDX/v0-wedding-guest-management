"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2, Lock } from "lucide-react"
import { AuthShell } from "@/components/AuthShell"
import { PageLoader } from "@/components/PageLoader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/LanguageContext"
import { useToast } from "@/hooks/use-toast"

export default function ResetAdminPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [secret, setSecret] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    fetch("/api/auth/reset-admin")
      .then((response) => response.json())
      .then((data) => setEnabled(!!data.enabled))
      .catch(() => setEnabled(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: t("common.error"), description: t("reset.mismatch"), variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/reset-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, email, password }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        toast({ title: t("common.success"), description: t("reset.done") })
        router.push("/login")
      } else {
        toast({ title: t("common.error"), description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (enabled === null) return <PageLoader />

  const backLink = (
    <Link href="/login" className="font-medium text-primary hover:underline">
      {t("auth.backToSignIn")}
    </Link>
  )

  if (!enabled) {
    return (
      <AuthShell title={t("reset.offTitle")} subtitle={t("reset.offHint")} footer={backLink}>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Lock className="size-7" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t("reset.title")} subtitle={t("reset.subtitle")} footer={backLink}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="secret">{t("reset.secret")}</Label>
          <Input
            id="secret"
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("reset.newPassword")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("reset.confirm")}</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {t("reset.submit")}
        </Button>
      </form>
    </AuthShell>
  )
}
