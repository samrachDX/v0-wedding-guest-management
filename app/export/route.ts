import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Dummy data for demonstration
  const gifts = [
    { id: 1, name: "Gift 1", paymentMethod: "Cash" },
    { id: 2, name: "Gift 2", paymentMethod: "Online" },
  ]

  const language = request.headers.get("accept-language") || "en"

  const exportedData = gifts.map((gift) => {
    const paymentMethod =
      gift.paymentMethod && language === "km"
        ? gift.paymentMethod === "Cash"
          ? "សាច់ប្រាក់"
          : "KHQR"
        : gift.paymentMethod || ""

    return {
      id: gift.id,
      name: gift.name,
      paymentMethod: paymentMethod,
    }
  })

  return NextResponse.json(exportedData)
}
