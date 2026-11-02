export type WcagLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail'

interface Rgb {
  r: number
  g: number
  b: number
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, value))
}

function linearize(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function gammaEncode(value: number): number {
  const channel = Math.max(0, Math.min(1, value))
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055
}

function parseHex(value: string): Rgb | null {
  const hex = value.slice(1)
  if (![3, 4, 6, 8].includes(hex.length)) return null
  const expanded =
    hex.length <= 4 ? [...hex].map((character) => character + character).join('') : hex
  const r = Number.parseInt(expanded.slice(0, 2), 16)
  const g = Number.parseInt(expanded.slice(2, 4), 16)
  const b = Number.parseInt(expanded.slice(4, 6), 16)
  const alpha = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) : 255
  if ([r, g, b, alpha].some((channel) => Number.isNaN(channel)) || alpha < 255) return null
  return { r, g, b }
}

function parseRgb(value: string): Rgb | null {
  const match =
    /^rgba?\(\s*([\d.]+)(%?)\s*[, ]\s*([\d.]+)(%?)\s*[, ]\s*([\d.]+)(%?)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/.exec(
      value,
    )
  if (!match) return null

  const alpha = match[7] === undefined ? 1 : Number(match[7]) / (match[8] === '%' ? 100 : 1)
  if (alpha < 1) return null

  const channels = [match[1], match[3], match[5]]
  const percentages = [match[2], match[4], match[6]]
  const [r, g, b] = channels.map((channel, index) => {
    const number = Number(channel)
    return clampChannel(percentages[index] === '%' ? (number / 100) * 255 : number)
  })
  return { r, g, b }
}

function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const h = ((hue % 360) + 360) % 360
  const s = Math.max(0, Math.min(1, saturation))
  const l = Math.max(0, Math.min(1, lightness))
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const offset = l - chroma / 2

  let channels: [number, number, number]
  if (h < 60) channels = [chroma, secondary, 0]
  else if (h < 120) channels = [secondary, chroma, 0]
  else if (h < 180) channels = [0, chroma, secondary]
  else if (h < 240) channels = [0, secondary, chroma]
  else if (h < 300) channels = [secondary, 0, chroma]
  else channels = [chroma, 0, secondary]

  return {
    r: clampChannel((channels[0] + offset) * 255),
    g: clampChannel((channels[1] + offset) * 255),
    b: clampChannel((channels[2] + offset) * 255),
  }
}

function parseHsl(value: string): Rgb | null {
  const match =
    /^hsla?\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/.exec(
      value,
    )
  if (!match) return null

  const alpha = match[4] === undefined ? 1 : Number(match[4]) / (match[5] === '%' ? 100 : 1)
  if (alpha < 1) return null

  return hslToRgb(Number(match[1]), Number(match[2]) / 100, Number(match[3]) / 100)
}

function parseOklch(value: string): Rgb | null {
  const match =
    /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)(%?)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/.exec(value)
  if (!match) return null

  const alpha = match[6] === undefined ? 1 : Number(match[6]) / (match[7] === '%' ? 100 : 1)
  if (alpha < 1) return null

  const lightness = match[2] === '%' ? Number(match[1]) / 100 : Number(match[1])
  const chroma = match[4] === '%' ? Number(match[3]) * 0.004 : Number(match[3])
  const hue = (Number(match[5]) * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)

  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b

  const l = lPrime ** 3
  const m = mPrime ** 3
  const s = sPrime ** 3

  const linearR = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const linearG = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const linearB = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  return {
    r: clampChannel(gammaEncode(linearR) * 255),
    g: clampChannel(gammaEncode(linearG) * 255),
    b: clampChannel(gammaEncode(linearB) * 255),
  }
}

export function parseColor(input: string): Rgb | null {
  const value = input.trim()
  if (value.startsWith('#')) return parseHex(value)
  if (value.startsWith('rgb')) return parseRgb(value)
  if (value.startsWith('hsl')) return parseHsl(value)
  if (value.startsWith('oklch(')) return parseOklch(value)
  return null
}

export function relativeLuminance(color: Rgb): number {
  return 0.2126 * linearize(color.r) + 0.7152 * linearize(color.g) + 0.0722 * linearize(color.b)
}

export function contrastRatio(foreground: string, background: string): number | null {
  const fg = parseColor(foreground)
  const bg = parseColor(background)
  if (!fg || !bg) return null

  const light = Math.max(relativeLuminance(fg), relativeLuminance(bg))
  const dark = Math.min(relativeLuminance(fg), relativeLuminance(bg))
  return (light + 0.05) / (dark + 0.05)
}

export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}
