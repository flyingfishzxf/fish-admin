/**
 * The response header policy the whole delivery chain is supposed to agree on:
 * `vite preview` (which is what `pnpm test:e2e` drives), nginx in the container
 * and Vercel for the hosted demo. `e2e/security.spec.ts` fails if a path stops
 * carrying them, so this file is the only place to change the policy.
 *
 * Two directives are concessions rather than oversights:
 *
 * - `style-src 'unsafe-inline'` — React, Radix and recharts write style
 *   attributes constantly, and CSP treats those under the same directive, so
 *   dropping it breaks layout rather than tightening anything.
 * - `img-src data: blob:` — avatars arrive as base64 data URLs and the file
 *   previews and CSV downloads use object URLs.
 *
 * `upgrade-insecure-requests` is deliberately absent: the container is served
 * over plain http on localhost, and the directive would rewrite those requests
 * to https the browser cannot answer.
 */
export const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

export const securityHeaders = {
  'Content-Security-Policy': contentSecurityPolicy,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const

/** Only a browser needs HTTPS, so this belongs to the hosting layer, not the policy. */
export const strictTransportSecurity = 'max-age=63072000; includeSubDomains; preload'
