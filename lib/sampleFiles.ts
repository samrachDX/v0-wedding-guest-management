const toCsv = (rows: string[][]) =>
  rows
    .map((row) => row.map((cell) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(","))
    .join("\r\n")

export function createSampleGuestsCsv(): string {
  return toCsv([
    ["Name", "Phone", "Guest Type", "Notes"],
    ["Sok Dara", "012345678", "Groom Side", "Best friend from college"],
    ["Chan Sreypov", "087654321", "Bride Side", "Sister"],
    ["Bob Johnson", "", "Groom Side", "Colleague"],
    ["សុខ សុភា", "098765432", "Bride Side", "មិត្តភក្តិវិទ្យាល័យ"],
  ])
}

export function createSampleGiftsCsv(): string {
  return toCsv([
    ["Guest ID", "Type", "Amount", "Currency", "Payment Method", "Description"],
    ["1", "money", "100", "USD", "Cash", "Wedding gift"],
    ["2", "money", "500000", "KHR", "KHQR", "Congratulations"],
    ["3", "item", "", "", "", "Beautiful vase"],
    ["4", "money", "50", "USD", "Cash", "Best wishes"],
  ])
}
