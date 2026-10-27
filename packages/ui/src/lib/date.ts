const DAY_VALUE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const DEFAULT_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}

/**
 * Parses a strict `YYYY-MM-DD` string into a local date at midnight.
 * Returns `undefined` for missing or malformed values.
 */
export function parseDay(value?: string): Date | undefined {
  if (!value) return undefined
  const match = DAY_VALUE_PATTERN.exec(value)
  if (!match) return undefined

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Serializes a date into a `YYYY-MM-DD` string using its local calendar day.
 */
export function formatDayValue(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a `YYYY-MM-DD` value for display in the given language.
 * Returns `undefined` when the value is missing or malformed.
 */
export function formatDayDisplay(
  value: string | undefined,
  language: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DISPLAY_OPTIONS,
): string | undefined {
  const date = parseDay(value)
  if (!date) return undefined
  return new Intl.DateTimeFormat(language, options).format(date)
}
