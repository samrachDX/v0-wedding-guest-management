import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Guest from "@/lib/models/Guest"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files only.",
        },
        { status: 400 },
      )
    }

    // Read file content
    const buffer = await file.arrayBuffer()
    const content = new TextDecoder().decode(buffer)

    // Parse CSV content (for simplicity, we'll handle CSV format)
    // In a real implementation, you'd use a library like xlsx to handle Excel files
    const lines = content.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    // Validate headers
    const requiredHeaders = ["Name", "Phone", "Guest Type", "Notes"]
    const headerMap = {}

    requiredHeaders.forEach((required) => {
      const index = headers.findIndex(
        (h) => h.toLowerCase().includes(required.toLowerCase()) || required.toLowerCase().includes(h.toLowerCase()),
      )
      if (index === -1 && required !== "Phone" && required !== "Notes") {
        throw new Error(`Required column "${required}" not found`)
      }
      headerMap[required] = index
    })

    await connectDB()

    // Get the next guest ID
    const lastGuest = await Guest.findOne({ userId: session.user.id }).sort({ guestId: -1 })
    let nextGuestId = lastGuest ? lastGuest.guestId + 1 : 1

    const results = {
      success: 0,
      errors: [],
      total: lines.length - 1,
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

        const name = values[headerMap["Name"]]?.trim()
        const phone = values[headerMap["Phone"]]?.trim() || undefined
        const guestType = values[headerMap["Guest Type"]]?.trim()
        const notes = values[headerMap["Notes"]]?.trim() || undefined

        if (!name) {
          results.errors.push(`Row ${i + 1}: Name is required`)
          continue
        }

        if (!guestType || !["Groom Side", "Bride Side"].includes(guestType)) {
          results.errors.push(`Row ${i + 1}: Guest Type must be "Groom Side" or "Bride Side"`)
          continue
        }

        // Check if guest already exists
        const existingGuest = await Guest.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
          userId: session.user.id,
        })

        if (existingGuest) {
          results.errors.push(`Row ${i + 1}: Guest "${name}" already exists`)
          continue
        }

        // Create guest
        await Guest.create({
          guestId: nextGuestId++,
          name,
          phone,
          guestType,
          notes,
          userId: session.user.id,
        })

        results.success++
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error.message}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Excel upload error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to process Excel file",
      },
      { status: 500 },
    )
  }
}
