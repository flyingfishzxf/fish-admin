import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy, securityHeaders } from './security-headers'

// Vitest runs from the repository root, which is where all three files live.
const repoFile = (relative: string) => readFileSync(resolve(process.cwd(), relative), 'utf8')

const directives = Object.fromEntries(
  contentSecurityPolicy.split('; ').map((entry) => {
    const [key, ...rest] = entry.split(' ')
    return [key, rest.join(' ')]
  }),
)

describe('security header policy', () => {
  it('ships the same CSP from every delivery path', () => {
    // Three files carry the policy — the Vite config, the nginx snippet and the
    // Vercel route rules — and a divergence is invisible until a browser starts
    // blocking something in one of them.
    expect(repoFile('security-headers.conf')).toContain(
      `add_header Content-Security-Policy "${contentSecurityPolicy}" always;`,
    )
    expect(JSON.parse(repoFile('vercel.json')).headers).toContainEqual({
      source: '/(.*)',
      headers: expect.arrayContaining([
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      ]),
    })
    expect(repoFile('vite.config.ts')).toContain('...securityHeaders')
  })

  it('sends all five headers on every path', () => {
    expect(Object.keys(securityHeaders)).toEqual([
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ])
  })

  it('keeps script execution same-origin only', () => {
    expect(directives['default-src']).toBe("'self'")
    expect(directives['script-src']).toBe("'self'")
    expect(contentSecurityPolicy).not.toContain("'unsafe-eval'")
    expect(contentSecurityPolicy).not.toContain('*')
  })

  it('closes the vector CSP cannot express', () => {
    expect(directives['object-src']).toBe("'none'")
    expect(directives['base-uri']).toBe("'self'")
    expect(directives['form-action']).toBe("'self'")
    expect(directives['frame-ancestors']).toBe("'self'")
  })

  it('permits exactly the two documented concessions', () => {
    expect(directives['style-src']).toBe("'self' 'unsafe-inline'")
    expect(directives['img-src']).toBe("'self' data: blob:")
    expect(directives['font-src']).toBe("'self' data:")
    expect(directives['worker-src']).toBe("'self'")
    expect(directives['connect-src']).toBe("'self'")
  })

  it('leaves no inline script or style in the document shell', () => {
    // `script-src 'self'` fails the anti-FOUC bootstrap the moment someone puts
    // it back inline, and the failure is a white page in production only.
    const html = repoFile('index.html')
    const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>(?!\s*<\/script>)/g)]
    expect(inline).toHaveLength(0)
    expect(html).not.toMatch(/<style>/)
    expect(html).toContain('<script src="/theme-bootstrap.js"></script>')
    expect(html).toContain('<link rel="stylesheet" href="/boot.css" />')
  })
})
