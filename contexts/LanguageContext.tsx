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
    "nav.settings": "Settings",

    // Dashboard
    "dashboard.title": "Wedding Dashboard",
    "dashboard.totalGuests": "Total Guests",
    "dashboard.confirmed": "Confirmed",
    "dashboard.pending": "Pending",
    "dashboard.notAttending": "Not Attending",
    "dashboard.totalGifts": "Total Gifts",
    "dashboard.totalMoney": "Total Money",
    "dashboard.totalMoneyUSD": "Total Money (USD)",
    "dashboard.totalMoneyKHR": "Total Money (KHR)",
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
    "guests.groomSide": "Groom Side",
    "guests.brideSide": "Bride Side",
    "guests.guestType": "Guest Type",
    "guests.notes": "Notes",

    // Gifts
    "gifts.title": "Gift Management",
    "gifts.addGift": "Add Gift",
    "gifts.editGift": "Edit Gift",
    "gifts.guestId": "Guest ID",
    "gifts.guestName": "Guest Name",
    "gifts.type": "Type",
    "gifts.amount": "Amount",
    "gifts.currency": "Currency",
    "gifts.paymentMethod": "Payment Method",
    "gifts.description": "Description",
    "gifts.proof": "Proof",
    "gifts.money": "Money",
    "gifts.item": "Item",
    "gifts.cash": "Cash",
    "gifts.khqr": "KHQR",
    "gifts.date": "Date",
    "gifts.filters": "Filters",
    "gifts.searchPlaceholder": "Search by guest name, ID, or description...",
    "gifts.filterByType": "Filter by type",
    "gifts.filterByCurrency": "Filter by currency",
    "gifts.allTypes": "All Types",
    "gifts.allCurrencies": "All Currencies",

    // Forms
    "form.save": "Save",
    "form.update": "Update",
    "form.cancel": "Cancel",
    "form.required": "Required",
    "form.optional": "Optional",
    "form.saving": "Saving...",
    "form.updating": "Updating...",
    "form.currency": "Currency",
    "form.paymentMethod": "Payment Method",
    "form.cash": "Cash",
    "form.khqr": "KHQR",
    "form.proofImage": "Proof Image",
    "form.guestType": "Guest Type",
    "form.groomSide": "Groom Side",
    "form.brideSide": "Bride Side",
    "form.notes": "Notes",
    "form.uploadImage": "Upload Image",
    "form.uploading": "Uploading...",
    "form.selectGuest": "Please select a guest",

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
    "common.actions": "Actions",
    "common.noData": "No data found",
    "common.confirm": "Are you sure?",
    "common.refresh": "Refresh",

    // Export
    "export.title": "Export Data",
    "export.guests": "Export Guests",
    "export.gifts": "Export Gifts",
    "export.csv": "CSV",
    "export.excel": "Excel",

    // Search
    "search.guestIdOrName": "Search Guest (ID or Name)",
  },
  km: {
    // Navigation
    "nav.dashboard": "ផ្ទាំងគ្រប់គ្រង",
    "nav.guests": "ភ្ញៀវ",
    "nav.gifts": "អំណោយ",
    "nav.export": "នាំចេញ",
    "nav.logout": "ចាកចេញ",
    "nav.settings": "ការកំណត់",

    // Dashboard
    "dashboard.title": "ផ្ទាំងគ្រប់គ្រងអាពាហ៍ពិពាហ៍",
    "dashboard.totalGuests": "ភ្ញៀវសរុប",
    "dashboard.confirmed": "បានបញ្ជាក់",
    "dashboard.pending": "កំពុងរង់ចាំ",
    "dashboard.notAttending": "មិនចូលរួម",
    "dashboard.totalGifts": "អំណោយសរុប",
    "dashboard.totalMoney": "ប្រាក់សរុប",
    "dashboard.totalMoneyUSD": "ប្រាក់សរុប (ដុល្លារ)",
    "dashboard.totalMoneyKHR": "ប្រាក់សរុប (រៀល)",
    "dashboard.recentGuests": "ភ្ញៀវថ្មីៗ",
    "dashboard.recentGifts": "អំណោយថ្មីៗ",

    // Guests
    "guests.title": "គ្រប់គ្រងភ្ញៀវ",
    "guests.addGuest": "បន្ថែមភ្ញៀវ",
    "guests.searchPlaceholder": "ស្វែងរកតាម លេខសម្គាល់ ឈ្មោះ ឬលេខទូរស័ព្ទ...",
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
    "guests.groomSide": "ភាគីកូនប្រុស",
    "guests.brideSide": "ភាគីកូនស្រី",
    "guests.guestType": "ប្រភេទភ្ញៀវ",
    "guests.notes": "កំណត់ចំណាំ",

    // Gifts
    "gifts.title": "គ្រប់គ្រងអំណោយ",
    "gifts.addGift": "បន្ថែមអំណោយ",
    "gifts.editGift": "កែប្រែអំណោយ",
    "gifts.guestId": "លេខសម្គាល់ភ្ញៀវ",
    "gifts.guestName": "ឈ្មោះភ្ញៀវ",
    "gifts.type": "ប្រភេទ",
    "gifts.amount": "ចំនួន",
    "gifts.currency": "រូបិយប័ណ្ណ",
    "gifts.paymentMethod": "វិធីបង់ប្រាក់",
    "gifts.description": "ការពិពណ៌នា",
    "gifts.proof": "ភស្តុតាង",
    "gifts.money": "ប្រាក់",
    "gifts.item": "របស់",
    "gifts.cash": "សាច់ប្រាក់",
    "gifts.khqr": "ខេអាកូអារ",
    "gifts.date": "កាលបរិច្ឆេទ",
    "gifts.filters": "តម្រង",
    "gifts.searchPlaceholder": "ស្វែងរកតាមឈ្មោះភ្ញៀវ លេខសម្គាល់ ឬការពិពណ៌នា...",
    "gifts.filterByType": "តម្រងតាមប្រភេទ",
    "gifts.filterByCurrency": "តម្រងតាមរូបិយប័ណ្ណ",
    "gifts.allTypes": "ប្រភេទទាំងអស់",
    "gifts.allCurrencies": "រូបិយប័ណ្ណទាំងអស់",

    // Forms
    "form.save": "រក្សាទុក",
    "form.update": "ធ្វើបច្ចុប្បន្នភាព",
    "form.cancel": "បោះបង់",
    "form.required": "ចាំបាច់",
    "form.optional": "ស្រេចចិត្ត",
    "form.saving": "កំពុងរក្សាទុក...",
    "form.updating": "កំពុងធ្វើបច្ចុប្បន្នភាព...",
    "form.currency": "រូបិយប័ណ្ណ",
    "form.paymentMethod": "វិធីបង់ប្រាក់",
    "form.cash": "សាច់ប្រាក់",
    "form.khqr": "ខេអាកូអារ",
    "form.proofImage": "រូបភាពភស្តុតាង",
    "form.guestType": "ប្រភេទភ្ញៀវ",
    "form.groomSide": "ភាគីកូនប្រុស",
    "form.brideSide": "ភាគីកូនស្រី",
    "form.notes": "កំណត់ចំណាំ",
    "form.uploadImage": "ផ្ទុកឡើងរូបភាព",
    "form.uploading": "កំពុងផ្ទុកឡើង...",
    "form.selectGuest": "សូមជ្រើសរើសភ្ញៀវ",

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
    "common.actions": "សកម្មភាព",
    "common.noData": "មិនមានទិន្នន័យ",
    "common.confirm": "តើអ្នកប្រាកដទេ?",
    "common.refresh": "ផ្ទុកឡើងវិញ",

    // Export
    "export.title": "នាំចេញទិន្នន័យ",
    "export.guests": "នាំចេញភ្ញៀវ",
    "export.gifts": "នាំចេញអំណោយ",
    "export.csv": "ស៊ីអេសវី",
    "export.excel": "អិចសែល",

    // Search
    "search.guestIdOrName": "ស្វែងរកភ្ញៀវ (លេខសម្គាល់ ឬឈ្មោះ)",
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
