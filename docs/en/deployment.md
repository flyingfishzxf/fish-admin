# Deployment

FishAdmin builds to static files. The demo build also ships a Service Worker (MSW), which adds a few hosting requirements. Choose the path that matches your use case.

## Build commands

| Command           | Mock API                                           | Use for                              |
| ----------------- | -------------------------------------------------- | ------------------------------------ |
| `pnpm dev`        | On by default                                      | Local development without a backend  |
| `pnpm build`      | Off (unless `VITE_ENABLE_MOCK=true` at build time) | Production with a real backend       |
| `pnpm build:demo` | On                                                 | Public demo and preview deployments  |
| `pnpm preview`    | Serves the last build                              | Local check of the production output |

`pnpm build` runs `tsc --noEmit` first, so a type error fails the build.

### Environment variables

Vite inlines variables at build time. Set them in the hosting provider's build settings or in `.env.*` files; changing them requires a rebuild.

Only [`.env.example`](../../.env.example) is tracked. `.env.development` and `.env.production` are gitignored and unnecessary — the defaults above come from `src/config/env.ts`, which reads the flag and falls back to the Vite mode. Copy the example to `.env.local` when you want to pin a value for both dev and build.

| Variable            | Example                   | Notes                                                                                                             |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCK`  | `true`                    | Starts MSW in the browser. On for `pnpm dev`, off for `pnpm build` when unset. Never enable it against real data. |
| `VITE_API_BASE_URL` | `https://api.example.com` | Defaults to `/api`.                                                                                               |
| `VITE_MOCK_LATENCY` | `300`                     | Mock-only artificial delay.                                                                                       |

## Vercel

This exact configuration is deployed at <https://fish-admin.vercel.app>. The repository ships with [`vercel.json`](../../vercel.json):

```json
{
  "buildCommand": "pnpm build:demo",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Steps:

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project** and import it. Vercel detects Vite and pnpm; keep the Node version at 24.
3. Deploy. Every pull request gets a preview URL.
4. For a real backend, change the build command to `pnpm build`, set `VITE_API_BASE_URL`, and add your API domain to the rewrite rules if needed.
5. After the first deploy, replace the relative `og:image` and `twitter:image` values in [`index.html`](../../index.html) with absolute URLs on your domain, and upload `public/og.png` as the repository social preview.

The rewrite sends unknown paths to `index.html` so deep links such as `/users?status=active` work. Static assets and `/mockServiceWorker.js` are served directly before the rewrite applies.

`vercel.json` also sets `Cache-Control` so the service worker is revalidated and hashed assets are immutable. This matters: a stale worker can keep serving an old demo after a deploy.

## Docker

A multi-stage [`Dockerfile`](../../Dockerfile) builds with Node 24 and serves the result with nginx running as uid 101 on port 8080 — no root, no privileged port. Both base images are pinned by digest, so a rebuild cannot silently pick up a different Node or nginx.

A plain `docker build` produces an API-only image: `VITE_ENABLE_MOCK` defaults to `false`, the mock branch in `src/main.tsx` is folded away so no MSW chunk lands in `dist/`, and the worker script copied out of `public/` is stripped from the output too.

```bash
docker build -t fish-admin .
docker run --rm -p 8080:8080 fish-admin
```

The demo is the Compose path, because `docker-compose.yml` passes the flag explicitly:

```bash
docker compose up --build
# → http://localhost:8080
```

Build arguments:

| Argument            | Default | Notes                          |
| ------------------- | ------- | ------------------------------ |
| `VITE_ENABLE_MOCK`  | `false` | Set to `true` to ship the demo |
| `VITE_API_BASE_URL` | `/api`  | Base URL baked into the bundle |
| `VITE_MOCK_LATENCY` | `300`   | Mock delay                     |

Demo image without Compose:

```bash
docker build \
  --build-arg VITE_ENABLE_MOCK=true \
  -t fish-admin-demo .
```

API-only image pointed at your own server:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t fish-admin .
```

[`nginx.conf`](../../nginx.conf) does five things:

- Listens on `8080`, which the unprivileged runtime image can bind as uid 101.
- `try_files $uri $uri/ /index.html` for SPA deep links.
- Serves `/mockServiceWorker.js` with `no-cache` so browsers pick up a new worker.
- Caches `/assets/` immutably because Vite fingerprints file names.
- Adds gzip and, in every location, `include /etc/nginx/snippets/security-headers.conf`.

The last one is not decoration. nginx does not inherit a parent's `add_header` into a location that declares its own, so headers set at `server` level silently disappear from `/assets/` and from the `no-cache` routes. The snippet lives in `/etc/nginx/snippets/` rather than `conf.d/` because `conf.d/*.conf` is included into the `http` context, and each line ends with `always` so a 404 carries the same headers as a 200.

`GET /healthz` answers `ok` with access logging off, and the image declares a `HEALTHCHECK` against it, so `docker ps` shows the real state of the container.

## Any static host

Copy `dist/` to your host and configure:

1. **SPA fallback** — unknown paths return `index.html` with status 200.
2. **Service worker** — serve `/mockServiceWorker.js` from the root with `Cache-Control: no-cache`. If you deploy under a subpath, MSW is started with `import.meta.env.BASE_URL`, so build with the matching `base` in `vite.config.ts`.
3. **Assets** — hashed files under `/assets/` can be cached for a year.
4. **MIME types** — the worker must be served as `text/javascript` (not `text/html`). A misconfigured fallback that returns HTML for the worker breaks the mock with a clear console error.

### Subpath deployments

If the app lives at `https://example.com/admin/`, set `base: '/admin/'` in `vite.config.ts`, rebuild, and make sure the host rewrites `/admin/*` to `/admin/index.html`. TanStack Router's basepath is configured from the same value, and the worker is fetched from `/admin/mockServiceWorker.js`.

## Bundle layout

`autoCodeSplitting` gives each route its own chunk, so the chart library and the mock API are only fetched when something actually needs them. `pnpm size` enforces that split; the figures below are measured by the budget script (gzip level 9) at v2.0.0.

| Measure                                      | `pnpm build`  | `pnpm build:demo` | Budget              |
| -------------------------------------------- | ------------- | ----------------- | ------------------- |
| First paint: entry + `modulepreload` + shell | 175.2 kB      | 176.1 kB          | 180 kB              |
| Entry chunk `index-*`                        | 309 kB (95)   | 314 kB (97)       | counted in the line |
| Largest lazy chunk `chart-*`                 | 357 kB (103)  | 357 kB (103)      | 115 kB              |
| Every JavaScript chunk                       | 707 kB        | 1,042 kB          | 800 kB              |
| Every CSS chunk                              | 143 kB (22.0) | 143 kB (22.0)     | 30 kB               |

Two things about that table are deliberate.

The first-paint budget counts the entry chunk, _every_ `modulepreload` chunk Vite writes into `dist/index.html` and the blocking `/theme-bootstrap.js` shell script — 31 chunks in `pnpm build`, 35 in the demo build — because the browser downloads all of them before it paints. The entry file alone is 95 kB, so a budget on `index-*` only would pass while the real cost crept up. The CSS budget likewise counts the linked `/boot.css`, not just the Tailwind chunk.

The budgets are enforced against `pnpm build`, not the demo build. The demo build adds `browser-*` (929 kB, 333 gzip — MSW plus the seeded workspace database), which on its own breaks the largest-chunk and total-JS budgets. First paint is close but not identical — 176.1 kB against 175.2 kB — because that chunk stays lazy and `src/main.tsx` imports it only behind the mock flag: an explicit `VITE_ENABLE_MOCK` wins, otherwise the dev server turns it on and a build turns it off. What the flag does change is the eager graph: the demo build preloads 34 chunks instead of 30, and the extra ones (`react`, `env`, `createLucideIcon`, `boxes`, `integrations`) are shared code the mock handlers pull in. `pnpm build` tree-shakes the branch away and drops `mockServiceWorker.js` from the output, so `ls dist/assets | grep browser`, `ls dist | grep mock` and `grep -r mockServiceWorker dist` all come back empty. Vite still prints a chunk-size warning for it in a demo build, which is expected.

The other large lazy chunks are the ones you would expect: `chart-*` is recharts, shared by the dashboard and `/reports`. The component catalog and the UI playground used to own demo chunks of their own; they left with the in-app pages, so the bundle no longer carries them. None of the remaining chunks is fetched on the way to `/users`.

Run `pnpm build && pnpm preview` and check the Network panel before shipping: the first paint should load only the shell, auth and locale chunks.

## Turning the mock off in production

1. Leave `VITE_ENABLE_MOCK` unset in a build — `pnpm build` and a default `docker build` both resolve it to `false`. Set it explicitly if a previous `.env*` file pinned it to `true`.
2. Set `VITE_API_BASE_URL`.
3. `dist/` already contains no mock code: `vite.config.ts` removes the copied `mockServiceWorker.js` when the flag is off. Delete `src/mocks` and the mock block in `src/main.tsx` only if you want the source gone as well.

If the flag is off, `main.tsx` never imports the mock module, so MSW and Faker are not shipped to users. The worker script that `public/mockServiceWorker.js` contributes to `dist/` stays inert: nothing registers it.

## Caching and updates

- Hashed assets: `Cache-Control: public, max-age=31536000, immutable`.
- `index.html`: `no-cache` so new deploys are picked up.
- `/mockServiceWorker.js`: `no-cache`. Browsers also check for a new worker on navigation; the mock file changes rarely, but an outdated worker can be confusing during development.
- When you deploy a new version with the demo enabled, reload with DevTools → Application → Service Workers → Update if needed.

## Security headers

Every response ships the same header set — a Content Security Policy, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` — from all four layers: `securityHeaders` in [`src/config/security-headers.ts`](../../src/config/security-headers.ts) is the source of truth, `vite preview` serves it, [`security-headers.conf`](../../security-headers.conf) is the nginx snippet every location includes, and [`vercel.json`](../../vercel.json) repeats the same values on the `/(.*)` rule. `e2e/security.spec.ts` asserts the delivery, and [`docs/en/security-headers.md`](security-headers.md) explains each directive, the two concessions (`style-src 'unsafe-inline'`, `img-src data: blob:`) and what `script-src 'self'` forced in the code.

HSTS is the one exception: nginx does not send it, because the container serves plain HTTP, and `vercel.json` adds it only on the Vercel deployment where TLS is terminated at the edge.

Remember that the demo's client-side RBAC is **not** an authorization mechanism — enforce permissions on the server. A CSP constrains which origins can run code; it does not authenticate anyone.

The hosted demo also runs the mock in the browser, so `/auth/register` and `/auth/forgot-password` return verification and reset tokens in the response body, and 2FA uses a fixed code. That is intentional for a sandbox where every account is public; a real deployment must email the link, keep the token server-side and generate TOTP codes from a secret.
