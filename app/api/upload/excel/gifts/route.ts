import { type NextRequest, NextResponse } from "next/server"
import { errorMessage, getUserId, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
import Guest from "@/lib/models/Guest"
import { hasColumn, pick, readSpreadsheet } from "@/lib/spreadsheet"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const file = (await request.formData()).get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const { headers, rows } = await readSpreadsheet(file)
    for (const column of ["Guest ID", "Type"]) {
      if (!hasColumn(headers, column)) {
        return NextResponse.json({ error: `Required column "${column}" not found` }, { status: 400 })
      }
    }

    await connectDB()

    const results = { success: 0, errors: [] as string[], total: rows.length }

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2
      try {
        const guestId = Number.parseInt(pick(row, "Guest ID"), 10)
        const type = pick(row, "Type").toLowerCase()
        const amount = Number.parseFloat(pick(row, "Amount").replace(/,/g, ""))
        const currency = (pick(row, "Currency") || "USD").toUpperCase()
        const rawMethod = pick(row, "Payment Method")
        const paymentMethod =
          rawMethod.toUpperCase() === "KHQR" ? "KHQR" : rawMethod.toLowerCase() === "cash" ? "Cash" : ""
        const description = pick(row, "Description") || undefined

        if (!Number.isInteger(guestId) || guestId <= 0) {
          results.errors.push(`Row ${rowNumber}: Valid Guest ID is required`)
          continue
        }
        if (type !== "money" && type !== "item") {
          results.errors.push(`Row ${rowNumber}: Type must be "money" or "item"`)
          continue
        }

        const guest = await Guest.findOne({ guestId, userId })
        if (!guest) {
          results.errors.push(`Row ${rowNumber}: Guest with ID ${guestId} not found`)
          continue
        }

        if (type === "money") {
          if (!Number.isFinite(amount) || amount <= 0) {
            results.errors.push(`Row ${rowNumber}: Valid amount is required for money gifts`)
            continue
          }
          if (!paymentMethod) {
            results.errors.push(`Row ${rowNumber}: Payment method must be "Cash" or "KHQR" for money gifts`)
            continue
          }
          if (currency !== "USD" && currency !== "KHR") {
            results.errors.push(`Row ${rowNumber}: Currency must be "USD" or "KHR"`)
            continue
          }
        }

        await Gift.create({
          guestId,
          guestName: guest.name,
          type,
          userId,
          description,
          ...(type === "money" ? { amount, currency, paymentMethod } : {}),
        })
        results.success++
      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${errorMessage(error, "Unknown error")}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Gift import error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to process file") }, { status: 500 })
  }
}
