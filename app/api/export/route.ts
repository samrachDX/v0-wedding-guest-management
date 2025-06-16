import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Guest from "@/lib/models/Guest"
import Gift from "@/lib/models/Gift"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'guests' or 'gifts'
    const format = searchParams.get("format") // 'csv' or 'xlsx'
    const status = searchParams.get("status") // for filtering guests

    await connectDB()

    let data: any[] = []
    let headers: string[] = []

    if (type === "guests") {
      const query: any = { userId: session.user.id }
      if (status && status !== "all") {
        query.guestType = status
      }

      const guests = await Guest.find(query).sort({ guestId: 1 })
      headers = ["Guest ID", "Name", "Phone", "Guest Type", "Notes"]
      data = guests.map((guest) => [guest.guestId, guest.name, guest.phone || "", guest.guestType, guest.notes || ""])
    } else if (type === "gifts") {
      const gifts = await Gift.find({ userId: session.user.id }).sort({ createdAt: -1 })
      headers = ["Guest ID", "Guest Name", "Type", "Amount", "Currency", "Payment Method", "Description", "Date"]
      data = gifts.map((gift) => [
        gift.guestId,
        gift.guestName,
        gift.type,
        gift.amount || "",
        gift.currency || "",
        gift.paymentMethod || "",
        gift.description || "",
        gift.createdAt.toISOString().split("T")[0],
      ])
    }

    if (format === "csv") {
      // Create CSV with proper UTF-8 BOM for Unicode support
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          row
            .map((cell) => {
              // Escape commas and quotes in cell data
              const cellStr = String(cell || "")
              if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                return `"${cellStr.replace(/"/g, '""')}"`
              }
              return cellStr
            })
            .join(","),
        ),
      ].join("\n")

      // Add UTF-8 BOM for proper Unicode display in Excel
      const utf8BOM = "\uFEFF"
      const csvWithBOM = utf8BOM + csvContent

      return new NextResponse(csvWithBOM, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${type}-export.csv"`,
        },
      })
    }

    // For now, return JSON data that can be processed on the client side for Excel export
    return NextResponse.json({ headers, data })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
