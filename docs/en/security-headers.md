# Security headers

FishAdmin carries one response-header policy, and every layer that can serve the
app ships the same bytes: `vite preview` (which is what the end-to-end suite
drives), nginx inside the container, and Vercel for the hosted demo.
[`e2e/security.spec.ts`](../../e2e/security.spec.ts) fails the build if a path
stops carrying it, so the policy cannot drift one layer at a time.

The source of truth is [`src/config/security-headers.ts`](../../src/config/security-headers.ts).
The nginx snippet (`security-headers.conf` at the repository root) and
[`vercel.json`](../../vercel.json) repeat the same string, and
`src/config/security-headers.test.ts` compares all three on every `pnpm test`.

## The policy

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self' data:; worker-src 'self';
connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';
frame-ancestors 'self'
```

| Directive         | Value                    | What it is for                                                                                                                                                                                       |
| ----------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`     | `'self'`                 | The fallback for every directive not named below, so a new resource type starts closed.                                                                                                              |
| `script-src`      | `'self'`                 | No inline script and no `eval`. This is the directive that reshaped the document shell — see below.                                                                                                  |
| `style-src`       | `'self' 'unsafe-inline'` | **Deliberate concession.** React, Radix and recharts write `style` attributes constantly, and CSP governs those under the same directive; removing it breaks layout rather than tightening anything. |
| `img-src`         | `'self' data: blob:`     | **Deliberate concession.** Avatars arrive as base64 data URLs, file previews and CSV exports use object URLs.                                                                                        |
| `font-src`        | `'self' data:`           | Inter is bundled by `@fontsource-variable/inter`, so `'self'` is what this app uses; `data:` is left open for a subset an integrator inlines.                                                        |
| `worker-src`      | `'self'`                 | The MSW service worker, when a build keeps it.                                                                                                                                                       |
| `connect-src`     | `'self'`                 | `fetch` and XHR targets. Point this at your API origin when you connect a backend.                                                                                                                   |
| `object-src`      | `'none'`                 | No plugin content.                                                                                                                                                                                   |
| `base-uri`        | `'self'`                 | Blocks a hijacked `<base>` from rewriting every relative URL.                                                                                                                                        |
| `form-action`     | `'self'`                 | Login and search forms cannot be redirected off-origin.                                                                                                                                              |
| `frame-ancestors` | `'self'`                 | Clickjacking. `X-Frame-Options: SAMEORIGIN` is the legacy pair for browsers without it.                                                                                                              |

The remaining three headers travel with it: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` and
`Permissions-Policy: camera=(), microphone=(), geolocation=()`.

`Strict-Transport-Security` is added only on Vercel, because that is the layer
with TLS. `upgrade-insecure-requests` is absent on purpose: the container is
served over plain http on localhost and the directive would rewrite those
requests to an https origin that does not answer.

## What `script-src 'self'` forced in the code

Enabling the directive without these two changes produces a blank page or a
stream of console violations, so they are part of the policy, not refactors that
happened alongside it.

**The document shell has no inline script or style.** The theme bootstrap that
prevents a flash of the wrong palette is now
[`public/theme-bootstrap.js`](../../public/theme-bootstrap.js), loaded
synchronously before the stylesheet, and the boot-screen CSS is
[`public/boot.css`](../../public/boot.css). Both live in `public/` rather than
`src/` because Vite's dev server answers `/src/**.css` as `text/javascript`, and
a `<link rel="stylesheet">` pointed at it is silently refused — the shell would
render unstyled in development only. A unit test asserts `index.html` still has
no inline `<script>` or `<style>`, because putting them back is a one-line change
that only fails in production.

**zod runs without its JIT compiler.** zod v4 compiles each validator with
`new Function` on first parse. It catches the CSP refusal and falls back to the
interpreted parser, so nothing appears broken — but the browser still reports
every attempt as a `securitypolicyviolation`, and the first version of this page
counted three of them from `assets/schemas-*.js`. The fix is
[`src/config/validation.ts`](../../src/config/validation.ts), which calls
`z.config({ jitless: true })` and re-exports `z`; every schema imports from it.
An ESLint `no-restricted-imports` rule rejects a direct `import { z } from 'zod'`,
so the fallback cannot come back unnoticed. Form validation is nowhere near hot
enough to miss the compiled path.

Do not solve a violation like that with `'unsafe-eval'`. Find the library.

## Where each layer sets it

| Layer                | File                                                       | Checked by                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite preview`       | [`vite.config.ts`](../../vite.config.ts) `preview.headers` | `e2e/security.spec.ts`, and all 70 other e2e tests run under the policy.                                                                                        |
| `vite dev`           | no CSP                                                     | Cannot have one: Vite's dev HTML injects an inline React Refresh preamble, and `script-src 'self'` would stop hot module reload.                                |
| nginx (container)    | [`nginx.conf`](../../nginx.conf) + `security-headers.conf` | `curl -I` against the running container; `add_header` is not inherited into a location that declares its own, which is why every location includes the snippet. |
| Vercel (hosted demo) | [`vercel.json`](../../vercel.json)                         | No local test. Confirm with `curl -I` against the deployment after a push.                                                                                      |

## Checking it yourself

```bash
pnpm build:demo && pnpm exec vite preview --port 4173 --strictPort &
pnpm exec playwright test e2e/security.spec.ts

docker build -t fish-admin:local .
docker run -d --rm -p 8080:8080 --name fish-admin fish-admin:local
curl -sI http://127.0.0.1:8080/ | grep -iE 'content-security|x-content|x-frame|referrer|permissions'
curl -sI http://127.0.0.1:8080/assets/$(ls dist/assets | head -1) | grep -i content-security
curl -sI http://127.0.0.1:8080/no-such-route | grep -i content-security   # error responses too, via `always`
docker rm -f fish-admin
```

## Tightening it for your own deployment

1. Add the API origin to `connect-src` — `'self' https://api.example.com` — or
   keep the app on the same origin behind a reverse proxy and change nothing.
2. If assets move to a CDN, add that origin to `script-src`, `img-src` and
   `font-src`, and remember the CDN must serve `Access-Control-Allow-Origin`
   because the module scripts are fetched with `crossorigin`.
3. Roll out with `Content-Security-Policy-Report-Only` first if you have a report
   collector: the browser logs violations without blocking, so you can find the
   inline style a third-party widget depends on before it is an outage.
4. Keep `object-src 'none'`, `base-uri 'self'` and `frame-ancestors 'self'` even
   if you relax everything else. They cost nothing and close the dull holes.

Headers protect the document. They say nothing about who may do what — that is
[the RBAC caveat](rbac.md), and it still applies to every screen in this
template.

Related: [Deployment](deployment.md) for the container and Vercel setup,
[Architecture](architecture.md) for the boot sequence,
[API integration](api-integration.md) for the request client.
