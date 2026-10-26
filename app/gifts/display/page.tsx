"use client"

import { useEffect, useRef, useState } from "react"
import { Banknote, Clock, Gift as GiftIcon, Package, QrCode } from "lucide-react"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useLanguage } from "@/contexts/LanguageContext"
import { formatDateTime, formatMoney, initials } from "@/lib/format"
import { giftTypeLabel, paymentMethodLabel } from "@/lib/i18n"
import type { Gift } from "@/lib/types"
import { cn } from "@/lib/utils"

const POLL_INTERVAL = 2500

export default function GiftDisplayPage() {
  const [lastGift, setLastGift] = useState<Gift | null>(null)
  const [isNew, setIsNew] = useState(false)
  const lastGiftId = useRef<string | null>(null)
  const { t, language } = useLanguage()

  useEffect(() => {
    let highlightTimer: ReturnType<typeof setTimeout> | undefined

    const fetchLastGift = async () => {
      try {
        const response = await fetch("/api/gifts?latest=1", { cache: "no-store" })
        if (!response.ok) return
        const [newest] = (await response.json()) as Gift[]
        if (!newest || newest._id === lastGiftId.current) return

        // Only celebrate gifts that arrive while the screen is open
        const isFirstLoad = lastGiftId.current === null
        lastGiftId.current = newest._id
        setLastGift(newest)
        if (!isFirstLoad) {
          setIsNew(true)
          clearTimeout(highlightTimer)
          highlightTimer = setTimeout(() => setIsNew(false), 6000)
        }
      } catch (error) {
        console.error("Failed to fetch gifts:", error)
      }
    }

    fetchLastGift()
    const interval = setInterval(fetchLastGift, POLL_INTERVAL)
    return () => {
      clearInterval(interval)
      clearTimeout(highlightTimer)
    }
  }, [])

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-background to-amber-50 p-6 dark:from-[oklch(0.2_0.03_10)] dark:via-background dark:to-[oklch(0.2_0.03_70)]">
      <div className="pointer-events-none absolute -left-32 -top-32 size-[28rem] rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-[32rem] rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />

      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.72_0.13_50)] text-primary-foreground shadow-lg shadow-primary/30">
            <GiftIcon className="size-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("display.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("display.subtitle")}</p>
        </div>

        {lastGift ? (
          <div
            key={lastGift._id}
            className={cn(
              "overflow-hidden rounded-3xl border bg-card/90 shadow-xl backdrop-blur transition-all duration-500 animate-in fade-in zoom-in-95",
              isNew && "scale-[1.02] shadow-2xl ring-4 ring-primary/30",
            )}
          >
            {isNew && (
              <div className="bg-gradient-to-r from-primary to-[oklch(0.72_0.13_50)] px-4 py-3 text-center text-lg font-semibold text-primary-foreground">
                {t("display.newGift")}
              </div>
            )}

            <div className="p-6 sm:p-10">
              <div className="flex items-center gap-4 border-b pb-6">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-amber-400 text-2xl font-bold text-white">
                  {initials(lastGift.guestName)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold sm:text-3xl">{lastGift.guestName}</h2>
                  <p className="mt-1 text-muted-foreground">
                    {t("gifts.guestId")} #{lastGift.guestId}
                  </p>
                </div>
              </div>

              <div className="space-y-5 pt-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-xl",
                        lastGift.type === "money"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                      )}
                    >
                      {lastGift.type === "money" ? <Banknote className="size-6" /> : <Package className="size-6" />}
                    </span>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("gifts.type")}</p>
                      <p className="font-medium">{giftTypeLabel(language, lastGift.type)}</p>
                    </div>
                  </div>

                  {lastGift.type === "money" && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t("gifts.amount")}</p>
                      <p
                        className={cn(
                          "text-4xl font-bold tabular-nums tracking-tight sm:text-5xl",
                          isNew ? "text-primary" : "text-foreground",
                        )}
                      >
                        {formatMoney(lastGift.amount, lastGift.currency)}
                      </p>
                    </div>
                  )}
                </div>

                {lastGift.type === "money" && lastGift.paymentMethod && (
                  <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-4">
                    {lastGift.paymentMethod === "Cash" ? (
                      <Banknote className="size-5 text-emerald-600" />
                    ) : (
                      <QrCode className="size-5 text-sky-600" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">{t("gifts.paymentMethod")}</p>
                      <p className="font-medium">{paymentMethodLabel(language, lastGift.paymentMethod)}</p>
                    </div>
                  </div>
                )}

                {lastGift.description && (
                  <div className="rounded-2xl bg-muted/70 p-4">
                    <p className="text-sm text-muted-foreground">{t("gifts.description")}</p>
                    <p className="mt-1 font-medium">{lastGift.description}</p>
                  </div>
                )}

                <p className="flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  {formatDateTime(lastGift.createdAt, language)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border bg-card/90 px-6 py-16 text-center shadow-xl backdrop-blur">
            <GiftIcon className="mx-auto mb-4 size-16 text-muted-foreground/40" />
            <p className="text-xl font-medium">{t("display.waiting")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("display.waitingHint")}</p>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {t("display.live")}
          </span>
        </div>
      </div>
    </div>
  )
}
