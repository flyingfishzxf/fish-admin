import { describe, expect, it } from 'vitest'

import { z } from './validation'

describe('zod runtime configuration', () => {
  it('keeps zod off the JIT compiler so a no-eval CSP stays clean', () => {
    // Without this, the first parse of any schema runs `new Function`, which a
    // page under `script-src 'self'` reports as a securitypolicyviolation.
    expect(z.config().jitless).toBe(true)
  })

  it('still validates through the interpreted parser', () => {
    const schema = z.object({ name: z.string().min(2), age: z.number().int().min(18) })

    expect(schema.safeParse({ name: 'Fishing', age: 30 }).success).toBe(true)
    expect(schema.safeParse({ name: 'F', age: 7 }).success).toBe(false)
  })
})
