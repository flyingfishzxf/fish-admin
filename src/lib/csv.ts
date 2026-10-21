export interface CsvColumn<T> {
  key: keyof T & string
  label: string
}

function escapeCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]) {
  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const body = rows.map((row) => columns.map((column) => escapeCell(row[column.key])).join(','))
  return [header, ...body].join('\r\n')
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
