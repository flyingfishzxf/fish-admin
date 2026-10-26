# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-10-26

Delivered against the [1.6.0 plan](./docs/plans/1.6.0.md).

### Added

- **A Content Security Policy on every response.** `src/config/security-headers.ts` is the single
  definition of the header set — a CSP with `default-src 'self'`, `script-src 'self'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `frame-ancestors 'self'`, plus
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` — and all
  four delivery layers serve it: `vite preview`, `security-headers.conf` for nginx, `vercel.json` for
  the hosted demo, and the unit tests in `src/config/security-headers.test.ts` that fail if the three
  literal copies drift apart. `Strict-Transport-Security` is added only on Vercel, because the
  container serves plain HTTP.
- **`e2e/security.spec.ts`** compares the headers of `/`, `/index.html`, a hashed asset and the two
  shell files, then walks sign-in, dashboard, users, reports, files, the component catalog and
  settings with a `securitypolicyviolation` listener that must stay empty — including the theme
  switch and reload, which is where a first-paint script belongs.
- **Supply-chain gates.** `.github/dependabot.yml` opens grouped minor/patch and major pull requests
  weekly for npm and for the actions; `.github/workflows/codeql.yml` analyses JavaScript and
  TypeScript on every push, pull request and Monday schedule; the quality job fails on
  `pnpm audit --audit-level=high`; every workflow declares `permissions: contents: read`; the build
  job uploads the `dist/` it measured; and CI can be started manually with `workflow_dispatch`.
- **`docs/en/security-headers.md` and `docs/zh-CN/security-headers.md`** explain every directive,
  the two documented concessions, what `script-src 'self'` forced in the code and how to roll the
  policy out behind a real API.
- **`pnpm scaffold`** (`scripts/scaffold.mjs`) turns a clone into the skeleton of your own app. It
  rebrands `package.json`, the `<title>` and six Open Graph / Twitter tags, the boot screen,
  `APP_NAME` / `APP_TAGLINE`, the per-locale `app.*` strings, the Docker Compose service and image
  and the `fish-admin:` storage prefix across the ten files that read or write it, and can remove the
  component catalog (`/ui`, `/components`, `src/features/playground`, their nav entries, `AppPath`
  members, specs, baseline and locale bundles), any locale except the `en` fallback, and the mock API
  together with `src/config/demo.ts`, the MSW worker, the demo-account UI and the Playwright subsystem
  that drove it. Every edit is buffered and applied atomically, `--dry-run` prints the plan, and
  `.scaffold.json` records what was applied.
- **`scripts/scaffold.test.mjs`** validates every anchor in that plan against the template in three
  shapes — rename-only, catalog and locale strip, and full strip including the mock API — so a
  reformatted target fails `pnpm test` instead of shipping a scaffolded app that cannot build.
- **`docs/en/scaffold.md` and `docs/zh-CN/scaffold.md`** document both starting points, every flag,
  what each step rewrites and what the scaffold deliberately leaves alone.
- **The sidebar can now come from the server.** `GET /menu` is a documented contract
  (`{ groups: [{ titleKey, items: [{ titleKey, path, icon, permission?, children? }] }] }`), answered
  by `src/mocks/handlers/navigation.ts`, and `src/features/navigation/` turns the payload into the same
  `NavGroup[]` the static config produces: `menu-icons.ts` maps 17 kebab-case names to `LucideIcon`s
  through an explicit registry — a namespace import would have put all ~1600 lucide icons in the
  first-paint graph — and degrades an unknown name to `circle-dot`; `resolve.ts` drops entries whose
  `path` this build does not have and falls back to `NAV_GROUPS` when the request fails, answers
  non-JSON or exceeds its 2-second budget, so an API without the endpoint and a laptop with no network
  both keep a working app; `menu-access.ts` is the route guard that reads it. `docs/en/api-integration.md`
  and `docs/zh-CN/api-integration.md` specify the payload, the icon registry and the fallback, and both
  RBAC docs record that a server-side menu is still only a UX layer.

### Changed

- **One request client.** `src/features/auth/api.ts` kept a private `fetch` wrapper for its eleven
  pre-session endpoints — login, MFA verify, register, verify-email, forgot/reset password, invite
  preview, accept invite, refresh, logout and `/auth/me` — so those calls had no deadline, no
  cancellation and a second, divergent error parser. They now call `apiRequest`, and the only
  remaining network primitive in `src/` is `src/lib/api-client.ts`. The option `auth: false` keeps a
  `401` from an unauthenticated endpoint out of the refresh flow, so a rejected login can never
  clear a session or trigger a token refresh.
- **Every request has a deadline.** `apiRequest` composes the caller's signal with
  `AbortSignal.timeout()`, so a stalled backend can no longer hang a page. The budget is
  `VITE_REQUEST_TIMEOUT` (default 15000 ms); the two base64 upload endpoints use
  `VITE_UPLOAD_TIMEOUT` (default 60000 ms). A blown deadline becomes `ApiError(0, 'REQUEST_TIMEOUT')`
  and an API that never answered becomes `NETWORK_ERROR` — both are retried like a `5xx`, and neither
  leaks a `DOMException` into a toast.
- **Superseded reads are cancelled.** All 26 `queryFn` sites now forward TanStack Query's signal to
  the fetch function, so paging, filtering or a background refetch aborts the request it replaced.
  A caller-driven abort is rethrown untouched and discarded instead of rendered as an error.
- **Startup validates the environment.** `src/config/env.ts` throws on a set-but-unparseable
  `VITE_ENABLE_MOCK`, `VITE_MOCK_LATENCY`, `VITE_REQUEST_TIMEOUT` or `VITE_UPLOAD_TIMEOUT` instead of
  silently falling back to the documented default.
- **The language controls follow the installed locales.** `src/lib/i18n.ts` gained
  `nextLanguage()` and `currentLanguage()`, the command palette hides its language action and
  `LanguageToggle` unmounts when a build ships a single locale, replacing three hard-coded
  `resolvedLanguage === 'zh-CN' ? 'en' : 'zh-CN'` reads. `src/config/nav.test.ts` and
  `src/lib/locales.test.ts` now discover locales and catalog sources through `import.meta.glob`
  instead of listing them, so the gates shrink with the app rather than failing on a locale the
  adopter removed.
- **One tree decides what is navigable.** `AppSidebar`, `AppBreadcrumbs`, the command palette and the
  `_app` route guard all read `useMenuNavGroups()`, so the menu a role is served, the routes it can
  open and the `/403` it lands on come from the same list; a page the menu dropped is unreachable by
  typed URL, while `/403`, `/404` and unmanaged routes are never redirected back into that decision.
  `filterNavGroups()` now filters `children` recursively, `flattenNavItems()` is shared by the lookups,
  and `isAppPath()` accepts any nav path rather than a flat list. The demo serves `/ui` and
  `/components` only to the full-access role, which is the one thing in the sidebar no permission code
  hides.
- `docs/en/api-integration.md` and `docs/zh-CN/api-integration.md` gained the timeout options, the
  `status: 0` client-side codes and the `REQUEST_FAILED` fallback; the architecture docs now walk the
  client through its six steps.
- **A default `docker build` is API-only.** The `VITE_ENABLE_MOCK` build arg flipped from `true` to
  `false`, so the image nobody customizes no longer ships 73 mock handlers; the demo is now the
  explicit path — `docker compose up --build`, or `--build-arg VITE_ENABLE_MOCK=true`. A mock-free
  build also drops `mockServiceWorker.js` from `dist/`, so nothing in the output references the demo
  backend.
- **The container runs unprivileged.** The runtime stage is `nginxinc/nginx-unprivileged`: nginx
  serves on `8080` as uid 101 instead of root on `80`, `GET /healthz` answers `ok`, and the image's
  `HEALTHCHECK` targets it. Both stages pin their base images by digest, so a rebuild cannot
  silently change the Node or nginx version the gates ran against. Map `8080:8080` when you
  `docker run`.
- **`.env.development` and `.env.production` are no longer committed.** Only `.env.example` is
  tracked. The mock flag falls back to the Vite mode instead — on for `pnpm dev`, off for
  `pnpm build` — so a bare clone behaves exactly as before without any env file, and an explicit
  `VITE_ENABLE_MOCK` still wins over the fallback in both directions.
- **The boot shell left `index.html`.** The inline theme script and the inline `<style>` became
  `public/theme-bootstrap.js` and `public/boot.css`, linked from the document head, because
  `script-src 'self'` rejects the inline script and a theme flash on the first paint was the
  alternative. They live in `public/` rather than `src/` so the URLs stay stable and because Vite's
  dev server answers `/src/**.css` as `text/javascript`, which a `<link>` cannot consume. The budget
  script counts both: first paint now includes the blocking shell chunk, and the CSS total includes
  `/boot.css`.
- **Zod runs jitless.** Zod v4 compiles each validator with `new Function`; under `script-src 'self'`
  the refusal is swallowed by the library but still reported as a `securitypolicyviolation`, so three
  schema chunks triggered it on every load. `src/config/validation.ts` now calls
  `z.config({ jitless: true })` and re-exports `z`, an ESLint `no-restricted-imports` rule keeps
  `src/` importing from there instead of from `zod` directly, and the fix is a config switch rather
  than `'unsafe-eval'`.
- **nginx sends the headers from one snippet.** `add_header` is not inherited into a `location` that
  declares its own, so the previous config left `/` without any header and repeated four lines in the
  two static blocks; every `location` now includes `/etc/nginx/snippets/security-headers.conf`, with
  `always` so a 404 carries the same policy as a 200.

## [1.5.0] - 2026-10-25

### Added

- **Five business domains, six new routes.** `/projects` is a portfolio board with
  query filters, board/list layouts, a two-step creation wizard, archived-project
  popconfirms and a featured carousel. `/projects/$id` adds a project workspace
  with overview, tasks, budget, retrospective, member transfer, milestones,
  attachments and activity. `/files` is an asset library with a folder tree,
  grid/list views, upload queue, watermarked previews, metadata, move and bulk
  delete. `/notifications` is an inbox with unread/mention filters, bulk read,
  a detail drawer and quiet-hours/channel preferences. `/integrations` manages
  webhook connections, request headers, delivery history and replay. `/reports`
  turns the same range and granularity controls into KPI cards, anchor-linked
  sections, threshold-aware charts and a CSV export.
- **A “Collaboration” navigation group** (Projects, Files, Notifications), a
  header notification bell fed by the same inbox query, a dashboard product tour,
  a user import wizard on `/users`, raw-event JSON in the audit drawer and a
  collapsible data-retention card on `/settings`.
- **Workspace data in the mock backend.** DB version 4 adds projects, tasks,
  milestones, file folders, files, notification preferences, integrations and
  webhook deliveries, plus 60 workspace audit events. Updates persist to
  `localStorage` and write audit records; the v3 → v4 migration keeps existing
  users, roles, sessions and audit history and merges the new permission codes
  into the system roles.
- **Seven new permission codes** — `project:read`/`manage`, `file:read`/`manage`,
  `report:read` and `integration:read`/`manage` — wired into routes, navigation,
  `<Can>` checks and the permission matrix.
- **`usedIn` is now required for every catalog component.** All 83 entries name a
  real business route, and `src/config/components.test.ts` resolves each one
  against the generated route tree and rejects `/components` and `/ui`.

### Changed

- Demo workspace copy now covers project, file, report, notification and
  integration scenarios in English and Simplified Chinese, including the new
  audit entity/action labels.
- Tables expose their scroll containers to the keyboard, carousel slides are
  inert while hidden, and the project key badge, file-card open control and
  primary buttons meet WCAG 2.1 AA contrast and naming rules.
- **The bundle gate now measures first paint instead of the entry file.** `pnpm size`
  counts the entry chunk together with the 23 `modulepreload` chunks Vite writes into
  `dist/index.html`, so `firstPaintJs` budgets the 164.7 KB the browser really downloads
  rather than the 90 KB entry file that let the eager graph grow unnoticed. Budget: 180 KB.
- **The largest-chunk budget covers lazy chunks only and names the offender**, and the
  total-JS ceiling moved from 750 KB to 800 KB — v1.5.0 added five business domains and
  left 0.4 KB of headroom, so any routine dependency update would have turned CI red.
  `docs/en/deployment.md` and `docs/zh-CN/deployment.md` now carry the measured chunk
  numbers and explain why the gate runs against the API build rather than the demo build.

### Fixed

- **The notification list no longer spills under its pagination.** The `ScrollArea`
  viewport now inherits the root's `max-height`, so the clipped row fades out above
  a bordered pager instead of overlapping it.
- **Page headers stop pushing the document sideways at tablet widths.** Actions wrap
  below the title from `lg` rather than `sm`, which removes the horizontal overflow on
  `/reports` and `/roles` at 768 px.
- **`/files` sizes its lists to the pane, not the viewport.** The asset grid now
  repeats `auto-fill` tracks with a 160 px floor instead of `sm:`/`xl:` column
  counts, so cards stop collapsing to 92 px inside the resizable pane, and the
  table drops Type, Size, Visibility and Updated by container width rather than
  viewport width, which removes the sideways scroll inside the pane. Below `xl`
  (was `lg`) the split gives up entirely and the preview opens in a drawer — at
  1024 px it had been a 159 px column.
- **The list/preview split scrolls again.** `ResizablePanelGroup` sets its own
  inline `height: 100%`, so `min-h-[560px]` let both panes grow to ~2 000 px and
  pushed the pager below the clipped edge. The group now sits in a fixed-height
  wrapper and the list `ScrollArea` gets `min-h-0`, so each pane scrolls on its
  own and the page is about 1 000 px tall.
- **File cards line up.** Private and favorite badges are icon-only with
  screen-reader labels, so every card keeps a single badge row and the delete
  footer no longer floats above a gap; the metadata viewer drops the duplicate
  "File metadata" caption it rendered on top of its own header, truncated names
  expose a tooltip, and the preview drawer gains the close button the other
  drawers already had.
- **Icon collapse works again.** The collapsed rail width now wins the Tailwind v4
  cascade, so `collapsible="icon"` really narrows the sidebar to 64 px; this affected
  every release since the inset sidebar shipped, including the live demo.
- **The sidebar fits without hunting for a scroll region.** Group and item spacing is
  tightened so all sixteen navigation entries fit a 900 px-tall window.

### Security

- Client-side RBAC remains a UX and authorization demo, **not** a security
  boundary. The new pages add no server-side enforcement; authorize every write
  on your backend.

## [1.4.0] - 2026-10-24

### Added

- **Four engineering credibility gates in CI.** Accessibility: `eslint-plugin-jsx-a11y` joins the lint job and `e2e/a11y.spec.ts` scans nine flows against WCAG 2.1 A/AA with axe. Bundle: `scripts/check-bundle-size.mjs` fails the build when gzipped output exceeds 750 KB JS, 30 KB CSS, 115 KB for the largest chunk or 100 KB for the entry chunk. Runtime: `e2e/perf.spec.ts` budgets FCP (2.5 s), LCP (3 s), CLS (0.1) and request count (140) on the dashboard. Visual: `e2e/visual/pages.spec.ts` compares nine screenshots with baselines rendered in the Playwright Docker image, with the clock frozen and the mock database seeded. The local visual script exits with instructions off Linux, so screenshots are only ever compared against the Docker-rendered baselines.
- `pnpm size`, `pnpm perf`, `pnpm test:visual` and `pnpm test:visual:docker` scripts, plus `--update` baseline regeneration through the Docker runner. `pnpm size` builds the production bundle itself, so a leftover demo build can no longer skew the budgets.

### Changed

- Darkened `--success` and `--warning`, and added theme-aware `--chart-1-foreground` … `--chart-5-foreground` tokens so chart badges, alerts and toasts meet AA contrast in both themes.
- Picker triggers, tree items, image previews, OTP inputs, file inputs and icon-only controls now expose accessible names that include their visible text, and scrollable demos are reachable with the keyboard.

### Fixed

- Tab labels, role codes, avatar fallbacks, alert descriptions and the account menu no longer fail axe contrast or `label-content-name-mismatch` checks.

## [1.3.0] - 2026-10-23

### Added

- **A live demo for every registered component.** `/components` coverage went
  from 28 of 83 to 83 of 83 — 55 new demos across three waves that place each
  component in an admin context instead of an isolated widget: an input-number
  field that quotes the monthly cost for the selected seats, a budget slider
  that names the threshold at which alerts fire, an invite-a-teammate dialog, an
  audit-event filter drawer, a retention collapsible, on-call rotation avatars,
  a report-label tag input and a two-factor switch.
- **Copyable import path on every catalog card.** The card footer renders the
  specifier a consumer actually types (`@/components/ui/button`,
  `@/components/enterprise/tree/tree`, …) and copies it to the clipboard;
  `getComponentModulePath()` in `src/config/components.ts` derives it from the
  registry category.
- **Sticky section navigation on `/ui`.** The playground's eight sections are
  reachable from an always-visible bar that tracks the scroll position.
  `AnchorNav` gained an `orientation` prop — `horizontal` renders that underline
  section bar, `vertical` (the default) keeps the in-page rail.
- **Registry and demo invariants** in `src/config/components.test.ts`: every
  component must have a demo anchor, a demo component and an import path that
  resolves to a real file, so a card that renders nothing can no longer ship.

### Changed

- Catalog card footers show the import path and the screen that already uses
  the component; 21 wide demos — tables, charts, forms, the sidebar, the
  stepper, the tree and the Pro compositions — now span multiple grid columns
  so they stay legible.
- The catalog header states its own coverage — 83 components, 83 live demos —
  and links to `/ui`, so the claim degrades visibly rather than silently if
  coverage ever regresses. The stats row was cut to four honest tiles and the
  dead locale keys were removed.

### Fixed

- `SidebarProvider` accepts an `embedded` flag. The catalog's sidebar preview
  no longer writes the shell's sidebar cookie or registers a second global
  `Cmd/Ctrl+B` handler, so collapsing the preview can no longer hijack the app
  shell.
- Opening or closing a dropdown, select or dialog no longer nudges the page
  sideways. The layout reserves a stable scrollbar gutter and cancels the margin
  Radix adds while it locks scrolling, guarded by `@supports` so older browsers
  keep the previous behaviour.
- Labels that rendered as raw keys or English-only text are translated in both
  languages — permission names, pagination and sheet controls, the input-number
  accessible names and the shared action vocabulary. `src/lib/locales.test.ts`
  now fails when a literal `t('…')` key is missing from either locale.

### Security

- Client-side RBAC remains a UX and authorization demo, **not** a security
  boundary. The new demos add no server-side checks; enforce authorization on
  your backend.

## [1.2.0] - 2026-10-23

### Added

- **Searchable component catalog** (`/components`): a registry of 83 shared
  components (47 primitives, 30 enterprise, 6 Pro) with search, category
  filters, 68 live demos and links to where each component is used.
- **Thirty-three new components** across three waves:
  - Primitives and Pro: input number, slider, segmented control, empty state,
    spinner/loading overlay, color picker, query filter, ProTable, ProForm,
    DetailPage, EditableTable and ImportWizard.
  - Enterprise: date picker, time picker, page container, popconfirm,
    statistic, trend, rate, watermark, back top, JSON viewer, image preview,
    notification center, combobox, cascader, upload, anchor navigation,
    tree select, auto complete, list, tour and carousel.
- **ProTable and QueryFilter** now back the users and audit log pages, sharing
  one table shell for search, filters, selection, pagination and fetching
  states.

### Fixed

- The ProTable catalog demo no longer enables TanStack Table's automatic
  page-index reset; filtering a client-paginated table could previously queue
  renders indefinitely.
- Carousel overlay copy no longer collides with the previous/next controls on
  narrow screens.
- ColorPicker's native swatch and hex input now expose distinct accessible
  names.

## [1.1.0] - 2026-10-23

Enterprise administration release: four new admin pages, role governance, a
mock audit trail and department tree, nine shared components, and draggable
table columns.

### Added

- **User detail page** (`/users/$id`): profile overview, activity timeline,
  inline tag editor, avatar drop zone, permission-aware quick actions, and a
  squashed/not-found state.
- **Departments page** (`/departments`): hierarchical tree with member counts,
  search, expand/collapse, and create/rename flows gated by
  `department:manage`.
- **Role permission matrix** (`/roles/matrix`): grouped permission grid, search
  and group filters, per-role toggles with dirty tracking, save/reset, and
  read-only handling when the user lacks `permission:read`.
- **Audit log page** (`/audit-logs`): date-range and actor/action filters,
  resource column, pagination, empty state, and an event detail sheet with raw
  metadata.
- **Role governance**: create-role wizard, rename dialog, and delete dialog
  with system-role and in-use guards, plus a row action menu.
- **Nine enterprise components** in `src/components/enterprise/`:
  descriptions, timeline, result, stepper, transfer, tree, tags input, date
  range picker, and drop zone, each wired into a real screen.
- **Draggable table columns**: reorder columns by drag and drop or with
  `ArrowUp`/`ArrowDown` in the columns popover, with focus retention and a
  tested pure reorder helper.
- **Five permission codes**: `role:create`, `role:delete`, `audit:read`,
  `department:read`, and `department:manage`, wired into navigation, routes,
  and buttons.
- **Mock API and data**: `POST/PATCH/DELETE /roles`, `POST/PATCH /departments`,
  `GET /audit-events` and `GET /audit-events/:id`; mock DB schema v3 with
  departments and an audit event log, including migrations from v1/v2.
- **i18n**: new `audit` and `departments` namespaces and expanded `roles` and
  `users` strings in English and Simplified Chinese.

### Changed

- Users table state now tracks column order; the columns popover was redesigned
  around drag handles, visibility checkboxes, and keyboard hints.
- Mock seed data expanded with department hierarchy, audit events, and richer
  role/user fixtures.
- Documentation updated in both languages: route tree, permission table, API
  endpoints, request/response examples, bundle chunk table, and deployment
  notes.

### Fixed

- `/ui` **Layout & data** no longer overlaps the resizable panel demo with the
  table above it; the demo uses a fixed-height wrapper and E2E asserts the
  bounding boxes do not intersect.
- Audit log detail tests now target the named dialog and raw metadata heading,
  avoiding collisions with the description text and closed popovers.

### Security

- Client-side RBAC is a UX and authorization demo, **not** a security boundary.
  Every permission check in this release is client-side; enforce authorization
  on your server.

## [1.0.0] - 2026-10-21

### Added

- Initial open-source release: authentication lifecycle with 2FA and session
  management, menu/route/button RBAC, typed mock API with pagination, filtering
  and token refresh, advanced data tables, dashboard charts, bilingual
  documentation, five accent themes, light/dark/system modes, and a UI
  playground.

[Unreleased]: https://github.com/flyingfishzxf/fish-admin/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/flyingfishzxf/fish-admin/releases/tag/v1.0.0
