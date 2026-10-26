import type { Language } from "@/lib/i18n"

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value)
}

/** "$1,250" for USD and "500,000 ៛" for riel. */
export function formatMoney(amount: number | undefined | null, currency?: string) {
  if (amount === undefined || amount === null) return "-"
  if (currency === "KHR") return `${formatNumber(amount, 0)} ៛`
  return `$${formatNumber(amount)}`
}

// Browsers ship patchy Khmer locale data, so Khmer dates are formatted by hand
const KHMER_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
]

export function formatDate(value: string | Date, language: Language) {
  const date = new Date(value)
  if (language === "km") return `${date.getDate()} ${KHMER_MONTHS[date.getMonth()]} ${date.getFullYear()}`
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date)
}

export function formatDateTime(value: string | Date, language: Language) {
  const date = new Date(value)
  if (language === "km") {
    const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
    return `${formatDate(date, language)} ម៉ោង ${time}`
  }
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}
