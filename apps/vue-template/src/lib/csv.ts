export type CsvCell = string | number

/** Wraps a cell in quotes only when it would otherwise break the row. */
function escapeCell(value: CsvCell) {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/**
 * Serialises rows as RFC 4180 CSV with a UTF-8 BOM.
 *
 * The BOM is what makes Excel on Windows read the Chinese column headers as
 * text instead of mojibake; without it the file opens as Latin-1.
 */
export function toCsv(rows: CsvCell[][]) {
  return `\ufeff${rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')}`
}

export interface CsvTable {
  headers: string[]
  rows: string[][]
}

/**
 * Parses the same CSV dialect `toCsv` writes: quotes may contain commas and
 * newlines, `""` is a literal quote, and CRLF / CR / LF all end a row. A leading
 * BOM is stripped so the first header still matches by name.
 */
export function parseCsvTable(text: string): CsvTable {
  const input = text.replace(/^\ufeff/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]

    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char === '\r') {
      // CR is only a row break when it is not the first half of CRLF.
      if (input[index + 1] !== '\n') {
        row.push(cell)
        rows.push(row)
        row = []
        cell = ''
      }
    } else {
      cell += char
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  const populated = rows.filter((candidate) => candidate.some((value) => value.trim() !== ''))
  if (populated.length === 0) return { headers: [], rows: [] }

  return {
    headers: populated[0]!.map((header) => header.trim()),
    rows: populated.slice(1),
  }
}

export function downloadCsv(filename: string, rows: CsvCell[][]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
