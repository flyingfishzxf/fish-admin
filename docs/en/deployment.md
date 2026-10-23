# Deployment

FishAdmin builds to static files. The demo build also ships a Service Worker (MSW), which adds a few hosting requirements. Choose the path that matches your use case.

## Build commands

| Command           | Mock API                                           | Use for                                  |
| ----------------- | -------------------------------------------------- | ---------------------------------------- |
| `pnpm build`      | Off (unless `VITE_ENABLE_MOCK=true` at build time) | Production with a real backend           |
| `pnpm build:demo` | On                                                 | Public demo, Docker, preview deployments |
| `pnpm preview`    | Serves the last build                              | Local check of the production output     |

`pnpm build` runs `tsc --noEmit` first, so a type error fails the build.

### Environment variables

Vite inlines variables at build time. Set them in the hosting provider's build settings or in `.env.*` files; changing them requires a rebuild.

| Variable            | Example                   | Notes                                                         |
| ------------------- | ------------------------- | ------------------------------------------------------------- |
| `VITE_ENABLE_MOCK`  | `true`                    | Starts MSW in the browser. Never enable it against real data. |
| `VITE_API_BASE_URL` | `https://api.example.com` | Defaults to `/api`.                                           |
| `VITE_MOCK_LATENCY` | `300`                     | Mock-only artificial delay.                                   |

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

A multi-stage [`Dockerfile`](../../Dockerfile) builds with Node 24 and serves with nginx.

```bash
docker compose up --build
# → http://localhost:8080
```

Or without Compose:

```bash
docker build -t fish-admin .
docker run --rm -p 8080:80 fish-admin
```

Build arguments:

| Argument            | Default | Notes                                |
| ------------------- | ------- | ------------------------------------ |
| `VITE_ENABLE_MOCK`  | `true`  | Set to `false` for an API-only image |
| `VITE_API_BASE_URL` | `/api`  | Base URL baked into the bundle       |
| `VITE_MOCK_LATENCY` | `300`   | Mock delay                           |

Example for a real API:

```bash
docker build \
  --build-arg VITE_ENABLE_MOCK=false \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t fish-admin .
```

[`nginx.conf`](../../nginx.conf) does four things:

- `try_files $uri $uri/ /index.html` for SPA deep links.
- Serves `/mockServiceWorker.js` with `no-cache` so browsers pick up a new worker.
- Caches `/assets/` immutably because Vite fingerprints file names.
- Adds basic gzip and security headers.

The container includes a healthcheck against `/`.

## Any static host

Copy `dist/` to your host and configure:

1. **SPA fallback** — unknown paths return `index.html` with status 200.
2. **Service worker** — serve `/mockServiceWorker.js` from the root with `Cache-Control: no-cache`. If you deploy under a subpath, MSW is started with `import.meta.env.BASE_URL`, so build with the matching `base` in `vite.config.ts`.
3. **Assets** — hashed files under `/assets/` can be cached for a year.
4. **MIME types** — the worker must be served as `text/javascript` (not `text/html`). A misconfigured fallback that returns HTML for the worker breaks the mock with a clear console error.

### Subpath deployments

If the app lives at `https://example.com/admin/`, set `base: '/admin/'` in `vite.config.ts`, rebuild, and make sure the host rewrites `/admin/*` to `/admin/index.html`. TanStack Router's basepath is configured from the same value, and the worker is fetched from `/admin/mockServiceWorker.js`.

## Bundle layout

`autoCodeSplitting` gives each route its own chunk, so the dashboard's chart dependency, the `/components` catalog and the `/ui` playground are only fetched when those pages open.

| Chunk          | Build             | Size (gzip)  | When it loads                                 |
| -------------- | ----------------- | ------------ | --------------------------------------------- |
| `index-*`      | `pnpm build`      | 287 kB (89)  | First paint: shell, router, i18n, auth store  |
| `index-*`      | `pnpm build:demo` | 293 kB (91)  | Same shell plus the mock entry stub           |
| `charts-*`     | either            | 384 kB (111) | Dashboard only                                |
| `ui-*`         | either            | 170 kB (47)  | `/ui` playground only (three chunks)          |
| `components-*` | either            | 102 kB (26)  | `/components` catalog only                    |
| `browser-*`    | demo              | 883 kB (326) | MSW plus the seeded database, demo build only |

The `browser-*` chunk exists only in a demo build. `src/main.tsx` imports it behind `VITE_ENABLE_MOCK`, so `pnpm build` (flag off) tree-shakes the branch away and emits no such chunk — `ls dist/assets | grep browser` and `grep -r mockServiceWorker dist` both come back empty. Vite prints a chunk-size warning for it; that is expected, because it is a lazy, dev-demo-only chunk that never ships in an API build.

Run `pnpm build && pnpm preview` and check the Network panel before shipping: the first paint should load only the shell, auth and locale chunks.

## Turning the mock off in production

1. Build with `VITE_ENABLE_MOCK=false` (the default for `pnpm build`).
2. Set `VITE_API_BASE_URL`.
3. Optionally delete `src/mocks`, `public/mockServiceWorker.js` and the mock block in `src/main.tsx` to keep the bundle lean.

If the flag is off, `main.tsx` never imports the mock module, so MSW and Faker are not shipped to users.

## Caching and updates

- Hashed assets: `Cache-Control: public, max-age=31536000, immutable`.
- `index.html`: `no-cache` so new deploys are picked up.
- `/mockServiceWorker.js`: `no-cache`. Browsers also check for a new worker on navigation; the mock file changes rarely, but an outdated worker can be confusing during development.
- When you deploy a new version with the demo enabled, reload with DevTools → Application → Service Workers → Update if needed.

## Security headers

The bundled nginx config sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`. Adjust them for your infrastructure and add a Content Security Policy appropriate to your API origins. Remember that the demo's client-side RBAC is **not** an authorization mechanism — enforce permissions on the server.

The hosted demo also runs the mock in the browser, so `/auth/register` and `/auth/forgot-password` return verification and reset tokens in the response body, and 2FA uses a fixed code. That is intentional for a sandbox where every account is public; a real deployment must email the link, keep the token server-side and generate TOTP codes from a secret.
