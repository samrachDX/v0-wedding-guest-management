"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "km"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.guests": "Guests",
    "nav.gifts": "Gifts",
    "nav.export": "Export",
    "nav.logout": "Logout",

    // Dashboard
    "dashboard.title": "Wedding Dashboard",
    "dashboard.totalGuests": "Total Guests",
    "dashboard.confirmed": "Confirmed",
    "dashboard.pending": "Pending",
    "dashboard.notAttending": "Not Attending",
    "dashboard.totalGifts": "Total Gifts",
    "dashboard.totalMoney": "Total Money",
    "dashboard.recentGuests": "Recent Guests",
    "dashboard.recentGifts": "Recent Gifts",

    // Guests
    "guests.title": "Guest Management",
    "guests.addGuest": "Add Guest",
    "guests.searchPlaceholder": "Search by ID, name, or phone...",
    "guests.name": "Name",
    "guests.phone": "Phone",
    "guests.email": "Email",
    "guests.status": "Status",
    "guests.table": "Table",
    "guests.actions": "Actions",
    "guests.edit": "Edit",
    "guests.delete": "Delete",
    "guests.confirmed": "Confirmed",
    "guests.pending": "Pending",
    "guests.notAttending": "Not Attending",

    // Gifts
    "gifts.title": "Gift Management",
    "gifts.addGift": "Add Gift",
    "gifts.guestId": "Guest ID",
    "gifts.guestName": "Guest Name",
    "gifts.type": "Type",
    "gifts.amount": "Amount",
    "gifts.description": "Description",
    "gifts.proof": "Proof",
    "gifts.money": "Money",
    "gifts.item": "Item",

    // Forms
    "form.save": "Save",
    "form.cancel": "Cancel",
    "form.required": "Required",
    "form.optional": "Optional",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.language": "Language",
  },
  km: {
    // Navigation
    "nav.dashboard": "ផ្ទាំងគ្រប់គ្រង",
    "nav.guests": "ភ្ញៀវ",
    "nav.gifts": "អំណោយ",
    "nav.export": "នាំចេញ",
    "nav.logout": "ចាកចេញ",

    // Dashboard
    "dashboard.title": "ផ្ទាំងគ្រប់គ្រងអាពាហ៍ពិពាហ៍",
    "dashboard.totalGuests": "ភ្ញៀវសរុប",
    "dashboard.confirmed": "បានបញ្ជាក់",
    "dashboard.pending": "កំពុងរង់ចាំ",
    "dashboard.notAttending": "មិនចូលរួម",
    "dashboard.totalGifts": "អំណោយសរុប",
    "dashboard.totalMoney": "ប្រាក់សរុប",
    "dashboard.recentGuests": "ភ្ញៀវថ្មីៗ",
    "dashboard.recentGifts": "អំណោយថ្មីៗ",

    // Guests
    "guests.title": "គ្រប់គ្រងភ្ញៀវ",
    "guests.addGuest": "បន្ថែមភ្ញៀវ",
    "guests.searchPlaceholder": "ស្វែងរកតាម ID ឈ្មោះ ឬលេខទូរស័ព្ទ...",
    "guests.name": "ឈ្មោះ",
    "guests.phone": "ទូរស័ព្ទ",
    "guests.email": "អ៊ីមែល",
    "guests.status": "ស្ថានភាព",
    "guests.table": "តុ",
    "guests.actions": "សកម្មភាព",
    "guests.edit": "កែប្រែ",
    "guests.delete": "លុប",
    "guests.confirmed": "បានបញ្ជាក់",
    "guests.pending": "កំពុងរង់ចាំ",
    "guests.notAttending": "មិនចូលរួម",

    // Gifts
    "gifts.title": "គ្រប់គ្រងអំណោយ",
    "gifts.addGift": "បន្ថែមអំណោយ",
    "gifts.guestId": "លេខភ្ញៀវ",
    "gifts.guestName": "ឈ្មោះភ្ញៀវ",
    "gifts.type": "ប្រភេទ",
    "gifts.amount": "ចំនួន",
    "gifts.description": "ការពិពណ៌នា",
    "gifts.proof": "ភស្តុតាង",
    "gifts.money": "ប្រាក់",
    "gifts.item": "របស់",

    // Forms
    "form.save": "រក្សាទុក",
    "form.cancel": "បោះបង់",
    "form.required": "ចាំបាច់",
    "form.optional": "ស្រេចចិត្ត",

    // Common
    "common.loading": "កំពុងផ្ទុក...",
    "common.error": "កំហុស",
    "common.success": "ជោគជ័យ",
    "common.delete": "លុប",
    "common.edit": "កែប្រែ",
    "common.view": "មើល",
    "common.search": "ស្វែងរក",
    "common.filter": "តម្រង",
    "common.export": "នាំចេញ",
    "common.language": "ភាសា",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "km")) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
