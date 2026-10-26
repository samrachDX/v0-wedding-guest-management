import { type NextRequest, NextResponse } from "next/server"
import { getUserId, serverError, unauthorized } from "@/lib/api"
import { createSampleGiftsCsv, createSampleGuestsCsv } from "@/lib/sampleFiles"

export async function GET(request: NextRequest) {
  try {
    if (!(await getUserId())) return unauthorized()

    const type = request.nextUrl.searchParams.get("type")
    if (type !== "guests" && type !== "gifts") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    const content = type === "guests" ? createSampleGuestsCsv() : createSampleGiftsCsv()
    const filename = `sample-${type}.csv`

    // UTF-8 BOM so Excel shows Khmer text correctly
    return new NextResponse("﻿" + content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    return serverError("Sample download error", error)
  }
}
