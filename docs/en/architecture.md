# Architecture

FishAdmin is a single-page React application. There is no server in this repository: the demo API runs in a Service Worker, and the same client can point at a real backend through one environment variable.

## Stack at a glance

| Concern      | Implementation                                     |
| ------------ | -------------------------------------------------- |
| Rendering    | React 19 + Vite 8                                  |
| Routing      | TanStack Router, file-based, typed search params   |
| Server state | TanStack Query                                     |
| Client state | Zustand                                            |
| Styling      | Tailwind CSS 4 with shadcn/ui and Radix primitives |
| Forms        | React Hook Form + Zod                              |
| Mock backend | MSW 2 + Faker + `localStorage`                     |
| i18n         | i18next with lazy JSON namespaces                  |

## Boot sequence

[`src/main.tsx`](../../src/main.tsx) coordinates startup so route guards never run against an unknown session:

1. Wait for `i18nReady`, which loads the bundled `common`, `nav` and `errors` namespaces.
2. Resolve the mock flag: an explicit `VITE_ENABLE_MOCK` wins, otherwise it is `true` on the dev server and `false` in a build. When it is on, dynamically import `src/mocks/browser` and start the Service Worker. The worker URL is resolved from `import.meta.env.BASE_URL`, so subpath deployments work. Unhandled requests pass through. The test reads `import.meta.env` literals rather than `env.enableMock` on purpose, so a mock-free build tree-shakes the whole MSW chunk away.
3. Call `useAuthStore.getState().bootstrap()`. With no refresh token the state becomes `anonymous`; otherwise the store refreshes tokens and loads `/auth/me`.
4. Register the global unauthorized handler used by `apiRequest`.
5. Mount React: `QueryClientProvider` → `RouterProvider` + `Toaster`.

`index.html` contains a small inline script that reads the persisted theme before React loads. It applies `.dark` and the accent attribute to `<html>` so the first paint already matches the saved preferences. A minimal CSS spinner covers the gap while the app mounts.

## Routing and guards

Routes live in `src/routes` and are generated into `src/routeTree.gen.ts` by `@tanstack/router-plugin`. The generated file is committed; do not edit it.

```text
__root.tsx              Providers, global 404, error fallback
├─ 401.tsx  500.tsx  503.tsx  maintenance.tsx   Standalone StatusScreen pages
├─ _auth/route.tsx      Redirects signed-in users away from the auth pages
│  ├─ login.tsx         /login
│  ├─ register.tsx      /register           → verification token in the response
│  ├─ verify-email.tsx  /verify-email?token=…
│  ├─ forgot-password.tsx  /forgot-password → demo reset link
│  ├─ reset-password.tsx   /reset-password?token=…
│  ├─ accept-invite.tsx    /accept-invite?token=…
│  └─ otp.tsx              /otp?challenge=…  second factor
└─ _app/route.tsx       Session guard + AppShell (sidebar, bell, offline banner, command palette)
   ├─ index.tsx         /            dashboard:read
   ├─ reports.tsx       /reports     report:read
   ├─ components.tsx    /components  signed in (searchable component catalog)
   ├─ ui.tsx            /ui          signed in (component playground)
   ├─ projects.tsx      /projects    project:read
   ├─ projects_.$id.tsx /projects/$id project:read
   ├─ files.tsx         /files       file:read
   ├─ notifications.tsx /notifications signed in
   ├─ users.tsx         /users       user:read
   ├─ users_.$id.tsx    /users/$id   user:read
   ├─ departments.tsx   /departments department:read
   ├─ roles.tsx         /roles       role:read
   ├─ roles_.matrix.tsx /roles/matrix role:read
   ├─ permissions.tsx   /permissions permission:read
   ├─ audit-logs.tsx    /audit-logs  audit:read
   ├─ integrations.tsx  /integrations integration:read
   ├─ profile.tsx       /profile     signed in
   ├─ security.tsx      /security    signed in
   ├─ settings.tsx      /settings    signed in
   ├─ 403.tsx           Rendered inside the shell
   └─ $.tsx             Shell-level 404
```

- `_app` checks only that a session exists. Permission checks belong to each leaf route so `/403` itself stays reachable.
- Guards call `requirePermission(code)` inside `beforeLoad`. Unauthenticated users are redirected to `/login?redirect=…`; signed-in users without the permission are redirected to `/403`.
- The login page sanitizes `redirect` and only allows internal paths, preventing open redirects.
- Each route preloads the namespaces it needs (`ensureNamespaces`) before rendering, which avoids Suspense flashes.
- A throwing loader or render is caught by `defaultErrorComponent` in `src/router.tsx`; `_app/route.tsx` overrides it with a shell-preserving error screen so navigation keeps working.

The Vite plugin runs before the React and Tailwind plugins and enables `autoCodeSplitting`, so feature code (including Recharts on the dashboard) is loaded per route.

## Data flow

| Data                       | Owner                       | Notes                                                                      |
| -------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| Session and tokens         | `src/stores/auth-store.ts`  | Persisted under `fish-admin:session`; only tokens are persisted            |
| Theme mode and accent      | `src/stores/theme-store.ts` | Persisted under `fish-admin:theme`                                         |
| Command palette visibility | `src/stores/ui-store.ts`    | In-memory                                                                  |
| API data                   | TanStack Query              | Keys are defined next to each feature (`queries.ts`)                       |
| Table filters and paging   | URL search params           | `validateUsersSearch` keeps links shareable and reloads identical          |
| Audit filters and paging   | URL search params           | `validateAuditSearch` syncs search, action, entity and date range          |
| Project filters and paging | URL search params           | `validateProjectsSearch` keeps status, priority, owner and view in the URL |
| File filters and folder    | URL search params           | `validateFilesSearch` drives the folder tree, view mode and paging         |
| Report range               | URL search params           | `validateReportsSearch` keeps `from`, `to` and granularity shareable       |
| Integration filters        | URL search params           | `validateIntegrationsSearch` keeps provider, enabled and paging            |
| Selected department        | URL search params           | `/departments?dept=…` deep-links to a node, invalid ids fall back          |
| Saved views                | `localStorage`              | `fish-admin:users-views:{userId}`, capped at 10                            |
| Table density              | `localStorage`              | `fish-admin:users-density`                                                 |
| Connectivity               | `src/lib/online.ts`         | `useSyncExternalStore` over the `online`/`offline` window events           |
| Demo database              | MSW handlers                | Persisted under `fish-admin:db:v1`                                         |

### API client

`apiRequest` in [`src/lib/api-client.ts`](../../src/lib/api-client.ts) is the only code that calls `fetch`:

1. Reads the access token from the auth store — or the explicit `token` option for a call made before the session exists — and adds `Authorization: Bearer …`.
2. Composes the caller's `AbortSignal` with `AbortSignal.timeout(VITE_REQUEST_TIMEOUT)` so no request can hang forever.
3. A caller-driven abort is rethrown untouched, so TanStack Query discards the superseded fetch instead of showing an error. A timeout or a `fetch` rejection becomes an `ApiError` with `status: 0` and code `REQUEST_TIMEOUT` / `NETWORK_ERROR`, both retried by the query defaults.
4. On `401`, calls `refreshSession()` once. The store single-flights concurrent refreshes, so parallel 401s produce one `/auth/refresh` request.
5. Retries the original request once with the new token.
6. If the refresh fails, clears the session and Query cache, emits an unauthorized event, and throws an `ApiError`.

Requests marked `auth: false` — the pre-session auth endpoints — skip steps 4 to 6, so a rejected sign-in reaches the form instead of tearing down the session.

`bootstrap()` is also single-flight. This keeps React StrictMode double effects and parallel route preloads from duplicating work.

### Feature modules

Each feature keeps its API calls, query options, schemas and components together:

```text
features/users/
├─ api.ts          fetchUsers, fetchUser, createUser, updateUser, updateUserProfile, deleteUser, bulk*, restoreUsers
├─ queries.ts      userListQueryOptions, userDetailQueryOptions, userActivityQueryOptions
├─ schemas.ts      createUserSchema(t)
├─ search.ts       URL search validation for the table
└─ components/     UsersPage, UserDetailPage, UserFormDrawer, DeleteUserDialog, SavedViewsMenu, UserContextMenu, columns
```

```text
features/departments/           features/audit/
├─ api.ts          CRUD over     ├─ api.ts       list and detail queries
│                  /departments  ├─ queries.ts   auditListQueryOptions,
├─ queries.ts      departments  │                auditEventQueryOptions
│                  QueryOptions  ├─ search.ts    URL search + range presets
└─ components/     tree panel,  └─ components/  AuditLogsPage, filters,
                   detail, form                  columns, detail drawer
```

```text
features/auth/
├─ api.ts          login, mfaVerify, register, verifyEmail, forgot, reset, invites
├─ schemas.ts      RHF schema factories (login, register, reset, invite, change password)
├─ password.ts     strength scoring behind the register/reset password meter
└─ components/     AuthShell plus one page per step of the lifecycle
```

```text
features/projects/              features/files/
├─ api.ts          list, detail ├─ api.ts       folders, files, bulk delete
│                  and mutations├─ queries.ts   folder and file queries
├─ queries.ts      project      ├─ search.ts    folder, view, filters, paging
│                  queries      └─ components/  FileLibraryPage, folder tree,
├─ search.ts       filters, view,                 upload drawer, preview pane
│                  paging
└─ components/     ProjectsPage, project board,
                   create wizard, detail tabs
```

```text
features/reports/               features/notifications/       features/integrations/
├─ api.ts          report query ├─ api.ts       inbox and pref├─ api.ts       connections and
├─ queries.ts      range-aware  │                mutations      │                deliveries
│                  query keys   ├─ queries.ts   notification   ├─ queries.ts   list and delivery
├─ search.ts       from/to/     │                queries        │                query keys
│                  granularity  └─ components/  inbox, drawer, ├─ search.ts    filters/paging
└─ components/     ReportPage     preferences                  └─ components/  list, editor,
                   lazy charts                                                 deliveries drawer
```

UI components never call `fetch` directly; they use TanStack Query options that wrap the feature API.

## Mock backend

- `src/mocks/seed.ts` creates the database with Faker using a fixed seed: three demo accounts plus 57 generated users, a 10-node department tree, roles, invitations and 160 audit events spread over 90 days.
- `src/mocks/seed-workspace.ts` deterministically seeds the business collections shared by seed and migration: 12 projects with 72 tasks, 48 milestones and budget items; 8 file folders and 18 files (image thumbnails are small SVG data URIs); 6 integrations with 24 delivery records; a notification inbox with per-user quiet hours and channel preferences; and 60 audit events tied to real project, file and integration ids.
- `src/mocks/db/store.ts` reads and writes the database and synchronizes it to `localStorage` on every mutation. `MOCK_DB_VERSION` is 4: it migrates v1 → v2 → v3 → v4, preserves users, roles, departments, sessions and tokens, merges the new permission codes into system roles and appends the workspace collections idempotently. Only an unknown version triggers a reset.
- Handlers under `src/mocks/handlers` implement the auth lifecycle, users (including bulk, restore and CSV import), departments, roles (including create, rename and delete), permissions, audit events, projects (tasks, milestones and attachments), file folders and files (including bulk delete), reports, notifications and preferences, integrations (deliveries and replay), dashboard and reset endpoints. Write handlers call `authorize()` and return `403` when the token's role lacks the permission.
- Reports are generated deterministically from the requested range and granularity; thresholds and series colors are presentation-only and never persisted. File uploads send metadata plus an optional data URL; files above 256 KB keep metadata only.
- Audit events are the single activity log. User, role, department, profile, project, file and integration mutations call `logAuditEvent()`; `logActivity()` remains a thin wrapper, and the dashboard maps the newest events through `recentActivity()`. The list is capped at 500 entries.
- Tokens are fake but structurally realistic: a base64url access token with an expiry, opaque refresh tokens tied to session records, and separate verification, password-reset and MFA-challenge entries with their own TTLs.
- `src/mocks/auth.ts` holds the auth rules: session rotation on refresh, five failed passwords locking an email for one minute, an MFA challenge that short-circuits login, and revocation of other sessions when a password changes.
- Deleting a user is soft (`deletedAt`), so `POST /api/users/restore` can undo a bulk delete; deactivating a user revokes their sessions.
- `VITE_MOCK_LATENCY` adds a default 300 ms delay so loading states are visible. `POST /api/__mock/reset` (requires `demo:reset`) reseeds the database and keeps the current session when the account still exists.

The Service Worker file is generated by `msw init public --save` and committed. In production, serve it from the app root without long-lived caching.

## Theming

- `src/styles/index.css` is the only Tailwind entry. Semantic tokens are CSS variables in oklch on `:root` and `.dark`, mapped into utilities with `@theme inline`.
- Five accents (`violet`, `cyan`, `emerald`, `orange`, `rose`) are applied as `data-accent` on `<html>`. Each accent overrides the primary tokens.
- `applyTheme()` in `src/lib/theme.ts` toggles `.dark`, sets `colorScheme`, updates the accent and the `theme-color` meta tag.
- `ThemeSync` re-applies the theme when the store changes or when the OS color scheme changes.
- Mode and accent are stored separately from the language and are independent of it.

Tailwind 4 is CSS-first: there is no `tailwind.config.js`. Custom tokens live in a clearly marked section of `index.css`; keep them separate from blocks that shadcn CLI may rewrite.

## Internationalization

- Locale JSON lives in `src/locales/{en,zh-CN}` with 21 namespaces: `common`, `nav`, `auth`, `dashboard`, `projects`, `files`, `reports`, `notifications`, `integrations`, `users`, `roles`, `permissions`, `departments`, `audit`, `profile`, `security`, `settings`, `ui`, `catalog`, `errors`, `validation`.
- `common`, `nav` and `errors` are bundled; other namespaces are loaded on demand with `i18next-resources-to-backend` and `import.meta.glob`.
- The initial language comes from `localStorage`, then the browser language, then English.
- `changeLanguage()` persists the choice, switches i18next and updates `<html lang>`.
- Dates, numbers, currency and relative time use `Intl` in `src/lib/format.ts`; no date library is needed. The `react-day-picker` calendar receives the matching locale so month names translate too.
- Validation messages are translation keys passed into Zod schema factories such as `createUserSchema(t)`.
- A unit test compares the flattened key sets of both languages, so a missing key fails CI.

## Failure handling

- `StatusScreen` renders the shared layout for `/401`, `/403`, `/500`, `/503` and `/maintenance`; each screen gets its own tone, icon, hint and actions, and the pages are reachable from Settings and `/ui`.
- `useOnlineStatus()` drives the offline banner in `AppShell`; when connectivity returns it clears and fires a Sonner toast.
- `src/router.tsx` sets `defaultErrorComponent`, and `_app/route.tsx` overrides it so a crash keeps the sidebar and header instead of unmounting the app.
- Query-level failures surface through `ErrorState` with a retry button; mutation failures become toasts with the server message when one exists.

## Testing strategy

- Unit tests cover permission parsing and wildcard expansion, nav-to-route resolution (including longest-prefix matching), URL search validation for users, audit logs, projects, files, reports and integrations, Zod schemas for users and every auth form, password strength, theme application, locale key parity, API clients, query keys, single-flight refresh, saved-view persistence, online status, `<Can>`, the tree utilities, transfer selection, the tags input, notification preferences, integration headers and deterministic report generation.
- The component registry test requires all 83 entries to declare a `usedIn` route, rejects `/components` and `/ui`, resolves each route through the generated route tree, and checks that every new business route is referenced.
- Database migration tests replay v1, v2 and v3 payloads into v4, verify that users, sessions and tokens survive, that the new permissions are merged and that a second migration is idempotent; damaged storage resets instead of crashing.
- Playwright covers login redirects, invalid credentials, sign-out, RBAC for all three roles, API-level `403`, the registration/verification/reset/invite/MFA flows, lockout, user CRUD persistence, bulk actions with undo, CSV import, saved views, density and column controls, URL-restored filters, user detail and tags, department deep links and creation, the role matrix and role CRUD, audit filters and the JSON detail drawer, project filters, the create wizard, archiving, detail tabs, tasks, members, budget and retrospective, file upload, preview, watermark, move and delete, notification read state and preferences, report ranges, anchors and CSV export, integration creation, toggling, payloads and replay, theme/language persistence, the `/components` catalog and `/ui` playground, and the status and offline screens.
- CI runs format check, lint, typecheck, coverage, a production build and the E2E suite in parallel jobs.
