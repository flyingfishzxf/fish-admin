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
2. If `VITE_ENABLE_MOCK` is `true`, dynamically import `src/mocks/browser` and start the Service Worker. The worker URL is resolved from `import.meta.env.BASE_URL`, so subpath deployments work. Unhandled requests pass through.
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
└─ _app/route.tsx       Session guard + AppShell (sidebar, offline banner, command palette)
   ├─ index.tsx         /            dashboard:read
   ├─ ui.tsx            /ui          signed in (component playground)
   ├─ users.tsx         /users       user:read
   ├─ roles.tsx         /roles       role:read
   ├─ permissions.tsx   /permissions permission:read
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

| Data                       | Owner                       | Notes                                                             |
| -------------------------- | --------------------------- | ----------------------------------------------------------------- |
| Session and tokens         | `src/stores/auth-store.ts`  | Persisted under `fish-admin:session`; only tokens are persisted   |
| Theme mode and accent      | `src/stores/theme-store.ts` | Persisted under `fish-admin:theme`                                |
| Command palette visibility | `src/stores/ui-store.ts`    | In-memory                                                         |
| API data                   | TanStack Query              | Keys are defined next to each feature (`queries.ts`)              |
| Table filters and paging   | URL search params           | `validateUsersSearch` keeps links shareable and reloads identical |
| Saved views                | `localStorage`              | `fish-admin:users-views:{userId}`, capped at 10                   |
| Table density              | `localStorage`              | `fish-admin:users-density`                                        |
| Connectivity               | `src/lib/online.ts`         | `useSyncExternalStore` over the `online`/`offline` window events  |
| Demo database              | MSW handlers                | Persisted under `fish-admin:db:v1`                                |

### API client

`apiRequest` in [`src/lib/api-client.ts`](../../src/lib/api-client.ts):

1. Reads the access token from the auth store and adds `Authorization: Bearer …`.
2. On `401`, calls `refreshSession()` once. The store single-flights concurrent refreshes, so parallel 401s produce one `/auth/refresh` request.
3. Retries the original request once with the new token.
4. If the refresh fails, clears the session and Query cache, emits an unauthorized event, and throws an `ApiError`.

`bootstrap()` is also single-flight. This keeps React StrictMode double effects and parallel route preloads from duplicating work.

### Feature modules

Each feature keeps its API calls, query options, schemas and components together:

```text
features/users/
├─ api.ts          fetchUsers, createUser, updateUser, deleteUser, bulk*, restoreUsers
├─ queries.ts      userListQueryOptions
├─ schemas.ts      createUserSchema(t)
├─ search.ts       URL search validation for the table
└─ components/     UsersPage, UserFormDrawer, DeleteUserDialog, SavedViewsMenu, UserContextMenu, columns
```

```text
features/auth/
├─ api.ts          login, mfaVerify, register, verifyEmail, forgot, reset, invites
├─ schemas.ts      RHF schema factories (login, register, reset, invite, change password)
├─ password.ts     strength scoring behind the register/reset password meter
└─ components/     AuthShell plus one page per step of the lifecycle
```

UI components never call `fetch` directly; they use TanStack Query options that wrap the feature API.

## Mock backend

- `src/mocks/seed.ts` creates the database with Faker using a fixed seed: three demo accounts plus 57 generated users, roles, invitations and activity.
- `src/mocks/db/store.ts` reads and writes the database and synchronizes it to `localStorage` on every mutation.
- Handlers under `src/mocks/handlers` implement the auth lifecycle, users (including bulk and restore), roles, permissions, dashboard and reset endpoints. Write handlers call `authorize()` and return `403` when the token's role lacks the permission.
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

- Locale JSON lives in `src/locales/{en,zh-CN}` with 13 namespaces: `common`, `nav`, `auth`, `dashboard`, `users`, `roles`, `permissions`, `profile`, `security`, `settings`, `ui`, `errors`, `validation`.
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

- Unit tests cover permission parsing, nav-to-route resolution, URL search validation, Zod schemas for users and every auth form, password strength, theme application, locale key parity, API clients, query keys, single-flight refresh, saved-view persistence, online status and `<Can>`.
- Playwright covers login redirects, invalid credentials, sign-out, RBAC for all three roles, API-level `403`, the registration/verification/reset/invite/MFA flows, lockout, user CRUD persistence, bulk actions with undo, saved views, density and column controls, URL-restored filters, theme/language persistence, the `/ui` playground and the status and offline screens.
- CI runs format check, lint, typecheck, coverage, a production build and the E2E suite in parallel jobs.
