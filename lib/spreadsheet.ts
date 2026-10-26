import ExcelJS from "exceljs"

export type SheetRow = Record<string, string>

/** Parses one CSV document, honouring quoted fields, escaped quotes and CRLF line endings. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text
    if ("result" in value && value.result !== undefined) return String(value.result)
    if ("richText" in value) return value.richText.map((part) => part.text).join("")
  }
  return String(value)
}

async function parseXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []
  const rows: string[][] = []
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = []
    for (let col = 1; col <= sheet.columnCount; col++) {
      values.push(cellToString(row.getCell(col).value))
    }
    rows.push(values)
  })
  return rows
}

/**
 * Reads an uploaded .csv or .xlsx file into rows keyed by their header.
 * Header lookup is case-insensitive; blank rows are skipped.
 */
export async function readSpreadsheet(file: File): Promise<{ headers: string[]; rows: SheetRow[] }> {
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  let table: string[][]
  if (name.endsWith(".xlsx")) {
    table = await parseXlsx(buffer)
  } else if (name.endsWith(".csv") || file.type === "text/csv") {
    table = parseCsv(new TextDecoder().decode(buffer).replace(/^﻿/, ""))
  } else {
    throw new Error("Unsupported file type. Please upload a .csv or .xlsx file.")
  }

  const [headerRow, ...dataRows] = table
  if (!headerRow) throw new Error("The file is empty.")

  const headers = headerRow.map((h) => h.trim())
  const rows = dataRows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const record: SheetRow = {}
      headers.forEach((header, index) => {
        record[header.toLowerCase()] = (cells[index] ?? "").trim()
      })
      return record
    })

  return { headers, rows }
}

/** Returns the value of the first header that matches one of the given names. */
export function pick(row: SheetRow, ...names: string[]): string {
  for (const name of names) {
    const value = row[name.toLowerCase()]
    if (value !== undefined) return value
  }
  return ""
}

export function hasColumn(headers: string[], ...names: string[]) {
  const lower = headers.map((h) => h.toLowerCase())
  return names.some((name) => lower.includes(name.toLowerCase()))
}
