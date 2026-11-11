// `route.query.redirect` is `string | null | (string | null)[]`, so anything
// that is not a plain string (repeated params, `null`, ...) is not a redirect.
export function sanitizeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//'))
    return undefined
  if (value.startsWith('/\\')) return undefined
  if (value === '/login' || value.startsWith('/login?')) return undefined
  return value
}

export function loginRedirect(path: string) {
  return `/login?redirect=${encodeURIComponent(path)}`
}
