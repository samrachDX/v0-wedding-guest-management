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
    const language = searchParams.get("language") || "en" // language preference

    await connectDB()

    let data: any[] = []
    let headers: string[] = []

    // Define headers based on language
    const getHeaders = (type: string, lang: string) => {
      if (type === "guests") {
        return lang === "km"
          ? ["លេខសម្គាល់ភ្ញៀវ", "ឈ្មោះ", "ទូរស័ព្ទ", "ប្រភេទភ្ញៀវ", "កំណត់ចំណាំ"]
          : ["Guest ID", "Name", "Phone", "Guest Type", "Notes"]
      } else {
        return lang === "km"
          ? ["លេខសម្គាល់ភ្ញៀវ", "ឈ្មោះភ្ញៀវ", "ប្រភេទ", "ចំនួន", "រូបិយប័ណ្ណ", "វិធីបង់ប្រាក់", "ការពិពណ៌នា", "កាលបរិច្ឆេទ"]
          : ["Guest ID", "Guest Name", "Type", "Amount", "Currency", "Payment Method", "Description", "Date"]
      }
    }

    headers = getHeaders(type, language)

    if (type === "guests") {
      const query: any = { userId: session.user.id }
      if (status && status !== "all") {
        query.guestType = status
      }

      const guests = await Guest.find(query).sort({ guestId: 1 })
      data = guests.map((guest) => {
        const guestType =
          language === "km" ? (guest.guestType === "Groom Side" ? "ភាគីកូនប្រុស" : "ភាគីកូនស្រី") : guest.guestType

        return [guest.guestId, guest.name, guest.phone || "", guestType, guest.notes || ""]
      })
    } else if (type === "gifts") {
      const gifts = await Gift.find({ userId: session.user.id }).sort({ createdAt: -1 })
      data = gifts.map((gift) => {
        const giftType = language === "km" ? (gift.type === "money" ? "ប្រាក់" : "របស់") : gift.type

        const paymentMethod =
          gift.paymentMethod && language === "km"
            ? gift.paymentMethod === "Cash"
              ? "សាច់ប្រាក់"
              : "ខេអាកូអារ"
            : gift.paymentMethod || ""

        return [
          gift.guestId,
          gift.guestName,
          giftType,
          gift.amount || "",
          gift.currency || "",
          paymentMethod,
          gift.description || "",
          gift.createdAt.toISOString().split("T")[0],
        ]
      })
    }

    if (format === "csv") {
      // Create CSV with proper UTF-8 encoding for Unicode support
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          row
            .map((cell) => {
              // Convert to string and handle Unicode properly
              const cellStr = String(cell || "")
              // Escape commas, quotes, and newlines
              if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n") || cellStr.includes("\r")) {
                return `"${cellStr.replace(/"/g, '""')}"`
              }
              return cellStr
            })
            .join(","),
        ),
      ].join("\r\n") // Use Windows line endings for better Excel compatibility

      // Add UTF-8 BOM for proper Unicode display in Excel and other applications
      const utf8BOM = "\uFEFF"
      const csvWithBOM = utf8BOM + csvContent

      return new NextResponse(csvWithBOM, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(type)}-export.csv`,
          "Cache-Control": "no-cache",
        },
      })
    }

    // Return JSON data for other formats
    return NextResponse.json({ headers, data })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
