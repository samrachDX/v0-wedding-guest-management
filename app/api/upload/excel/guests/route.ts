import { type NextRequest, NextResponse } from "next/server"
import { errorMessage, escapeRegex, getUserId, unauthorized } from "@/lib/api"
import connectDB from "@/lib/mongodb"
import Guest from "@/lib/models/Guest"
import { hasColumn, pick, readSpreadsheet } from "@/lib/spreadsheet"

const GUEST_TYPES = ["Groom Side", "Bride Side"]

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const file = (await request.formData()).get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const { headers, rows } = await readSpreadsheet(file)
    if (!hasColumn(headers, "Name")) {
      return NextResponse.json({ error: 'Required column "Name" not found' }, { status: 400 })
    }
    if (!hasColumn(headers, "Guest Type")) {
      return NextResponse.json({ error: 'Required column "Guest Type" not found' }, { status: 400 })
    }

    await connectDB()

    const lastGuest = await Guest.findOne({ userId }).sort({ guestId: -1 })
    let nextGuestId = lastGuest ? lastGuest.guestId + 1 : 1

    const results = { success: 0, errors: [] as string[], total: rows.length }

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2
      try {
        const name = pick(row, "Name")
        const phone = pick(row, "Phone") || undefined
        const guestType = GUEST_TYPES.find((type) => type.toLowerCase() === pick(row, "Guest Type").toLowerCase())
        const notes = pick(row, "Notes") || undefined

        if (!name) {
          results.errors.push(`Row ${rowNumber}: Name is required`)
          continue
        }
        if (!guestType) {
          results.errors.push(`Row ${rowNumber}: Guest Type must be "Groom Side" or "Bride Side"`)
          continue
        }

        const existingGuest = await Guest.findOne({
          name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
          userId,
        })
        if (existingGuest) {
          results.errors.push(`Row ${rowNumber}: Guest "${name}" already exists`)
          continue
        }

        await Guest.create({ guestId: nextGuestId++, name, phone, guestType, notes, userId })
        results.success++
      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${errorMessage(error, "Unknown error")}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Guest import error:", error)
    return NextResponse.json({ error: errorMessage(error, "Failed to process file") }, { status: 500 })
  }
}
