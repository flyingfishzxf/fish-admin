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

export function downloadCsv(filename: string, rows: CsvCell[][]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
