export type ImportFieldType = 'text' | 'email' | 'number'

export type ImportField = {
  key: string
  label: string
  required?: boolean
  type?: ImportFieldType
  aliases?: string[]
}

export type ImportMessages = {
  required: (label: string) => string
  email: (label: string) => string
  number: (label: string) => string
}

export type ImportRowResult = {
  line: number
  values: Record<string, string>
  errors: { key: string; message: string }[]
  valid: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function autoMapFields(fields: ImportField[], headers: string[]) {
  const normalizedHeaders = headers.map(normalize)
  const used = new Set<number>()
  const mapping: Record<string, number> = {}

  for (const field of fields) {
    const candidates = [field.key, field.label, ...(field.aliases ?? [])].map(normalize)
    const index = normalizedHeaders.findIndex(
      (header, headerIndex) => !used.has(headerIndex) && candidates.includes(header),
    )
    mapping[field.key] = index
    if (index >= 0) used.add(index)
  }

  return mapping
}

export function missingRequiredFields(fields: ImportField[], mapping: Record<string, number>) {
  return fields.filter((field) => field.required && (mapping[field.key] ?? -1) < 0)
}

export function buildImportRows(
  fields: ImportField[],
  mapping: Record<string, number>,
  rows: string[][],
  messages: ImportMessages,
): ImportRowResult[] {
  return rows.map((row, index) => {
    const values: Record<string, string> = {}
    const errors: ImportRowResult['errors'] = []

    for (const field of fields) {
      const column = mapping[field.key] ?? -1
      const raw = column >= 0 ? (row[column] ?? '').trim() : ''
      values[field.key] = raw

      if (field.required && raw === '') {
        errors.push({ key: field.key, message: messages.required(field.label) })
      } else if (raw && field.type === 'email' && !EMAIL_PATTERN.test(raw)) {
        errors.push({ key: field.key, message: messages.email(field.label) })
      } else if (raw && field.type === 'number' && Number.isNaN(Number(raw))) {
        errors.push({ key: field.key, message: messages.number(field.label) })
      }
    }

    return { line: index + 2, values, errors, valid: errors.length === 0 }
  })
}

export function toImportPayload(fields: ImportField[], results: ImportRowResult[]) {
  return results
    .filter((result) => result.valid)
    .map((result) => {
      const record: Record<string, unknown> = {}
      for (const field of fields) {
        const raw = result.values[field.key] ?? ''
        record[field.key] = field.type === 'number' && raw !== '' ? Number(raw) : raw
      }
      return record
    })
}
