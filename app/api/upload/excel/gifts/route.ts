import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Gift from "@/lib/models/Gift"
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

    // Parse CSV content
    const lines = content.split("\n").filter((line) => line.trim())
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

    // Validate headers
    const requiredHeaders = ["Guest ID", "Type", "Amount", "Currency", "Payment Method", "Description"]
    const headerMap = {}

    requiredHeaders.forEach((required) => {
      const index = headers.findIndex(
        (h) => h.toLowerCase().includes(required.toLowerCase()) || required.toLowerCase().includes(h.toLowerCase()),
      )
      if (index === -1 && !["Amount", "Currency", "Payment Method", "Description"].includes(required)) {
        throw new Error(`Required column "${required}" not found`)
      }
      headerMap[required] = index
    })

    await connectDB()

    const results = {
      success: 0,
      errors: [],
      total: lines.length - 1,
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

        const guestId = Number.parseInt(values[headerMap["Guest ID"]])
        const type = values[headerMap["Type"]]?.trim()
        const amount = values[headerMap["Amount"]]?.trim()
        const currency = values[headerMap["Currency"]]?.trim() || "USD"
        const paymentMethod = values[headerMap["Payment Method"]]?.trim()
        const description = values[headerMap["Description"]]?.trim() || undefined

        if (!guestId || isNaN(guestId)) {
          results.errors.push(`Row ${i + 1}: Valid Guest ID is required`)
          continue
        }

        if (!type || !["money", "item"].includes(type)) {
          results.errors.push(`Row ${i + 1}: Type must be "money" or "item"`)
          continue
        }

        // Find guest
        const guest = await Guest.findOne({ guestId, userId: session.user.id })
        if (!guest) {
          results.errors.push(`Row ${i + 1}: Guest with ID ${guestId} not found`)
          continue
        }

        // Validate money gift requirements
        if (type === "money") {
          if (!amount || isNaN(Number.parseFloat(amount))) {
            results.errors.push(`Row ${i + 1}: Valid amount is required for money gifts`)
            continue
          }
          if (!paymentMethod || !["Cash", "KHQR"].includes(paymentMethod)) {
            results.errors.push(`Row ${i + 1}: Payment method must be "Cash" or "KHQR" for money gifts`)
            continue
          }
          if (!["USD", "KHR"].includes(currency)) {
            results.errors.push(`Row ${i + 1}: Currency must be "USD" or "KHR"`)
            continue
          }
        }

        // Create gift data
        const giftData = {
          guestId,
          guestName: guest.name,
          type,
          userId: session.user.id,
          description,
        }

        if (type === "money") {
          giftData.amount = Number.parseFloat(amount)
          giftData.currency = currency
          giftData.paymentMethod = paymentMethod
        }

        // Create gift
        await Gift.create(giftData)
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
