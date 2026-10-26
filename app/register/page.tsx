"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { PageLoader } from "@/components/PageLoader"
import { AuthShell } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/LanguageContext"
import { useRegistrationOpen } from "@/hooks/use-registration-open"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const registrationOpen = useRegistrationOpen()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        toast({ title: t("common.success"), description: t("auth.accountCreated") })
        router.push("/login")
      } else {
        const data = await response.json().catch(() => ({}))
        toast({ title: t("common.error"), description: data.error, variant: "destructive" })
      }
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  if (registrationOpen === null) {
    return <PageLoader />
  }

  if (!registrationOpen) {
    return (
      <AuthShell
        title={t("auth.registrationClosed")}
        subtitle={t("auth.registrationClosedHint")}
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("auth.backToSignIn")}
          </Link>
        }
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Lock className="size-7" />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t("auth.registerTitle")}
      subtitle={`${t("auth.registerSubtitle")} ${t("auth.firstAdmin")}`}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("auth.signInLink")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("auth.name")}</Label>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
          <Label htmlFor="password">{t("auth.password")}</Label>
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
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          {isLoading ? t("auth.registering") : t("auth.register")}
        </Button>
      </form>
    </AuthShell>
  )
}
