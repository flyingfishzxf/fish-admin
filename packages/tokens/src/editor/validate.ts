import type { TokenType } from './types'

const TOKEN_NAME = /^[a-z][a-z0-9-]*$/
const MAX_VALUE_LENGTH = 160
const FORBIDDEN_FRAGMENTS = [
  ';',
  '{',
  '}',
  '<',
  '>',
  '\\',
  '@',
  '`',
  'url(',
  'expression(',
  'javascript:',
]

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const OKLCH =
  /^oklch\(\s*(?:\d+(?:\.\d+)?%?|\.\d+%?)(?:\s+(?:\d+(?:\.\d+)?%?|\.\d+%?)){2}(?:\s*\/\s*(?:\d+(?:\.\d+)?%?|\.\d+%?))?\s*\)$/
const RGB = /^rgba?\(\s*[\d.]+%?(?:\s*[, ]\s*[\d.]+%?){2}(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/
const HSL = /^hsla?\(\s*[\d.]+(?:deg)?(?:\s*[, ]\s*[\d.]+%?){2}(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/
const VAR = /^var\(--([a-z][a-z0-9-]*)\)$/
const LENGTH = /^(?:0|\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|ch|ex))$/
const DURATION = /^(?:0|\d+(?:\.\d+)?(?:ms|s))$/
const EASING =
  /^(?:linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\(\s*-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?){3}\s*\))$/

export function isTokenName(value: string): boolean {
  return TOKEN_NAME.test(value)
}

function hasControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

export function isSafeValue(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_VALUE_LENGTH &&
    !hasControlCharacters(value) &&
    !FORBIDDEN_FRAGMENTS.some((fragment) => value.includes(fragment))
  )
}

export function isValidColorValue(
  value: string,
  allowedTokens: ReadonlySet<string> = new Set(),
): boolean {
  if (HEX.test(value) || OKLCH.test(value) || RGB.test(value) || HSL.test(value)) return true
  const variable = VAR.exec(value)
  return variable ? allowedTokens.has(`--${variable[1]}`) : false
}

export function isValidLengthValue(value: string): boolean {
  return LENGTH.test(value)
}

export function isValidDurationValue(value: string): boolean {
  return DURATION.test(value)
}

export function isValidEasingValue(value: string): boolean {
  return EASING.test(value)
}

export function isValidValueForType(
  type: TokenType,
  value: string,
  allowedTokens: ReadonlySet<string> = new Set(),
): boolean {
  if (!isSafeValue(value)) return false
  switch (type) {
    case 'color':
      return isValidColorValue(value, allowedTokens)
    case 'length':
      return isValidLengthValue(value)
    case 'duration':
      return isValidDurationValue(value)
    case 'easing':
      return isValidEasingValue(value)
  }
}
