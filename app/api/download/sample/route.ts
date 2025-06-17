import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createSampleGuestsExcel, createSampleGiftsExcel } from "@/lib/sampleFiles"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'guests' or 'gifts'

    let content: string
    let filename: string

    if (type === "guests") {
      content = createSampleGuestsExcel()
      filename = "sample-guests.csv"
    } else if (type === "gifts") {
      content = createSampleGiftsExcel()
      filename = "sample-gifts.csv"
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    // Add UTF-8 BOM for proper Unicode display
    const utf8BOM = "\uFEFF"
    const csvWithBOM = utf8BOM + content

    return new NextResponse(csvWithBOM, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Sample download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
