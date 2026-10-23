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

export interface CsvTable {
  headers: string[]
  rows: string[][]
}

function splitCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const input = text.replace(/^\uFEFF/, '')

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

  return rows
}

export function parseCsvTable(text: string): CsvTable {
  const rows = splitCsvRows(text).filter((row) => row.some((cell) => cell.trim() !== ''))
  if (rows.length === 0) return { headers: [], rows: [] }

  return {
    headers: rows[0]!.map((header) => header.trim()),
    rows: rows.slice(1),
  }
}
