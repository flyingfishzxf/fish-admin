export function sanitizeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\'))
    return undefined
  if (value === '/login' || value.startsWith('/login?')) return undefined
  return value
}

export function loginRedirect(path: string) {
  return `/login?redirect=${encodeURIComponent(path)}`
}
