import { z } from 'zod'

// zod v4 compiles each validator with `new Function` on first parse. It catches
// the CSP refusal and falls back to the interpreted parser, so nothing visibly
// breaks — but the browser still reports the attempt as a `securitypolicyviolation`
// on every page under `script-src 'self'`, which is what `e2e/security.spec.ts`
// counts. `jitless` is the documented switch that stops the attempt from being
// made at all; form validation is nowhere near hot enough to miss the compiled
// path.
z.config({ jitless: true })

export { z }
