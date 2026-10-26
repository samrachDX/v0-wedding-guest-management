"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { AuthShell } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/LanguageContext"
import { useRegistrationOpen } from "@/hooks/use-registration-open"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const registrationOpen = useRegistrationOpen()
  const [disabledNotice, setDisabledNotice] = useState(false)

  useEffect(() => {
    // Set when a disabled account is signed out by the app shell
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the URL once after mount
    setDisabledNotice(new URLSearchParams(window.location.search).get("error") === "disabled")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", { email, password, redirect: false })

      if (result?.error) {
        toast({ title: t("common.error"), description: t("auth.invalidCredentials"), variant: "destructive" })
      } else {
        toast({ title: t("auth.signedIn") })
        router.push("/dashboard")
      }
    } catch {
      toast({ title: t("common.error"), description: t("auth.invalidCredentials"), variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title={t("auth.signInTitle")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        registrationOpen ? (
          <>
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              {t("auth.registerLink")}
            </Link>
          </>
        ) : null
      }
    >
      {disabledNotice && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {t("auth.disabled")}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          {isLoading ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>
    </AuthShell>
  )
}
