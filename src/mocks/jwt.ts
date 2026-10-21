export const ACCESS_TOKEN_TTL = 15 * 60 * 1000
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000

export interface AccessTokenPayload {
  sub: string
  roleId: string
  sid: string
  exp: number
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

export function createAccessToken(
  userId: string,
  roleId: string,
  sessionId: string,
  ttl = ACCESS_TOKEN_TTL,
) {
  const payload: AccessTokenPayload = {
    sub: userId,
    roleId,
    sid: sessionId,
    exp: Date.now() + ttl,
  }
  const header = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  return `${header}.${encodeBase64Url(JSON.stringify(payload))}.demo`
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null

    const parsed = JSON.parse(decodeBase64Url(payload)) as Partial<AccessTokenPayload>
    if (typeof parsed.sub !== 'string' || typeof parsed.roleId !== 'string') return null
    if (typeof parsed.sid !== 'string' || typeof parsed.exp !== 'number') return null

    return { sub: parsed.sub, roleId: parsed.roleId, sid: parsed.sid, exp: parsed.exp }
  } catch {
    return null
  }
}

export function createRefreshToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '')
}
