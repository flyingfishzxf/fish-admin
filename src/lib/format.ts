function toIntlLocale(language: string) {
  return language.startsWith('zh') ? 'zh-CN' : 'en'
}

export function formatDate(
  value: string | number | Date,
  language: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
) {
  return new Intl.DateTimeFormat(toIntlLocale(language), options).format(new Date(value))
}

export function formatDateTime(value: string | number | Date, language: string) {
  return new Intl.DateTimeFormat(toIntlLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(toIntlLocale(language), options).format(value)
}

export function formatCompactNumber(value: number, language: string) {
  return new Intl.NumberFormat(toIntlLocale(language), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatCurrency(
  value: number,
  language: string,
  currency = 'USD',
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat(toIntlLocale(language), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    ...options,
  }).format(value)
}

export function formatPercent(value: number, language: string) {
  const formatted = new Intl.NumberFormat(toIntlLocale(language), {
    maximumFractionDigits: 1,
  }).format(value)
  return `${formatted}%`
}

export function formatRelativeTime(value: string | number | Date, language: string) {
  const diff = new Date(value).getTime() - Date.now()
  const absolute = Math.abs(diff)
  const formatter = new Intl.RelativeTimeFormat(toIntlLocale(language), { numeric: 'auto' })

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['week', 7 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
    ['second', 1000],
  ]

  for (const [unit, milliseconds] of units) {
    if (absolute >= milliseconds || unit === 'second') {
      return formatter.format(Math.round(diff / milliseconds), unit)
    }
  }

  return formatter.format(0, 'second')
}
