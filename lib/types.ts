export type GuestType = "Groom Side" | "Bride Side"
export type GiftType = "money" | "item"
export type Currency = "USD" | "KHR"
export type PaymentMethod = "Cash" | "KHQR"

export interface Guest {
  _id: string
  guestId: number
  name: string
  phone?: string
  guestType: GuestType
  notes?: string
  createdAt?: string
}

export interface Gift {
  _id: string
  guestId: number
  guestName: string
  type: GiftType
  amount?: number
  currency?: Currency
  paymentMethod?: PaymentMethod
  description?: string
  proofImage?: string
  createdAt: string
}
