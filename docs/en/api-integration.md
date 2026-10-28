# Connecting a real API

The app talks to its backend through `src/lib/api-client.ts`. The demo backend is MSW, but the request/response contract is ordinary JSON over HTTP. You can either keep the shapes below or adapt the small `api.ts` files per feature.

## Switch the environment

| Variable               | Default                      | Meaning                                                                                                        |
| ---------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | `/api`                       | Prefix for every request. No trailing slash needed.                                                            |
| `VITE_ENABLE_MOCK`     | dev: `true` / build: `false` | Starts the MSW Service Worker when `true`. Left unset, `pnpm dev` turns it on and `pnpm build` turns it off.   |
| `VITE_MOCK_LATENCY`    | `300`                        | Artificial delay in milliseconds for mock responses.                                                           |
| `VITE_REQUEST_TIMEOUT` | `15000`                      | Milliseconds before a request is aborted as `REQUEST_TIMEOUT`. Valid range 1000–300000.                        |
| `VITE_UPLOAD_TIMEOUT`  | `60000`                      | Milliseconds allowed for the two base64 upload calls (`/files`, project attachments). Valid range 1000–600000. |

An unset variable keeps its default; one that is set but unparseable throws at startup instead of silently falling back (validated in `src/config/env.ts`). Only `.env.example` is tracked by git — every other `.env*` file is ignored, so a fresh clone starts from the mode defaults above.

To run against a real backend:

1. Set `VITE_ENABLE_MOCK=false` and `VITE_API_BASE_URL=https://api.example.com` in `.env.local`.
2. Remove the mock bootstrap block from `src/main.tsx` (or keep it guarded by the flag).
3. Delete `src/mocks` and `public/mockServiceWorker.js` once you no longer need them.
4. Point your server at the contract below, or edit `src/features/*/api.ts` to map your own shapes.

> If your API lives on another origin, configure CORS for the app origin and allow the `Authorization` and `Content-Type` headers. If you use cookies instead of bearer tokens, add `credentials: 'include'` in `apiRequest` and update CORS to allow credentials.

## Error contract

Every non-2xx response should return JSON:

```json
{ "code": "FORBIDDEN", "message": "Missing permission: user:delete" }
```

The client wraps this in `ApiError` with `status`, `code` and `message`. A `401` on an authenticated request triggers the refresh flow described below; a `401` from a pre-session endpoint such as `/auth/login` is surfaced as-is, and every other status goes to TanStack Query and the UI.

| Status | When                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `400`  | Validation failed (`VALIDATION_ERROR`, `INVALID_TOKEN`, `WEAK_PASSWORD`, `INVALID_PASSWORD`, `PASSWORD_UNCHANGED`, `SETUP_REQUIRED`, `INVALID_PARENT`, `PROTECTED_ROLE`) |
| `401`  | Missing/expired token (`UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_REFRESH_TOKEN`, `INVALID_CREDENTIALS`, `INVALID_CODE`, `MFA_EXPIRED`)                                   |
| `403`  | Authenticated but not allowed (`FORBIDDEN`, `ACCOUNT_INACTIVE`, `EMAIL_NOT_VERIFIED`)                                                                                    |
| `404`  | Unknown resource (`USER_NOT_FOUND`, `ROLE_NOT_FOUND`, `DEPARTMENT_NOT_FOUND`, `AUDIT_EVENT_NOT_FOUND`, `SESSION_NOT_FOUND`, `INVITE_NOT_FOUND`)                          |
| `409`  | Conflict (`EMAIL_TAKEN`, `ALREADY_ENABLED`, `ROLE_NAME_TAKEN`, `ROLE_IN_USE`, `DEPARTMENT_NAME_TAKEN`)                                                                   |
| `410`  | Invitation already used or expired (`INVITE_USED`, `INVITE_EXPIRED`)                                                                                                     |
| `429`  | Too many failed sign-ins (`ACCOUNT_LOCKED`)                                                                                                                              |

A non-2xx response that does not follow this contract — an HTML error page from a proxy, for example — still becomes an `ApiError`: `code` falls back to `REQUEST_FAILED` and `message` to the HTTP status text.

### Client-side failures

Requests that never produced an HTTP response use the same `ApiError` with `status: 0`:

| Code              | When                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `REQUEST_TIMEOUT` | No response within `VITE_REQUEST_TIMEOUT` milliseconds.                                                 |
| `NETWORK_ERROR`   | `fetch` rejected before reaching the API: offline, DNS failure, blocked CORS, mismatched mixed content. |

Both are treated as transient by `src/lib/query-client.ts` and retried at most twice, alongside `5xx`.

A caller-owned cancellation is never converted. When TanStack Query aborts a superseded fetch, the original `AbortError` is rethrown so the query is discarded instead of shown as an error. Each read function takes an optional trailing `signal`, and every `queryFn` forwards the one it receives.

### Request options

`apiRequest(path, options)` is the only code that touches the network:

| Option      | Default                | Purpose                                                                                                                                 |
| ----------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `method`    | `GET`                  | HTTP verb.                                                                                                                              |
| `body`      | –                      | Serialized as JSON with `Content-Type: application/json`.                                                                               |
| `headers`   | –                      | Extra headers, merged last.                                                                                                             |
| `signal`    | –                      | Caller-owned cancellation.                                                                                                              |
| `auth`      | `true`                 | Attach the session token and allow the refresh flow. Pre-session endpoints (`/auth/login`, `/auth/refresh`, `/auth/me`, …) set `false`. |
| `token`     | –                      | Explicit bearer for a call made before the session exists.                                                                              |
| `retry`     | `true`                 | Allow exactly one refresh-and-retry after a `401`.                                                                                      |
| `timeoutMs` | `VITE_REQUEST_TIMEOUT` | Per-request override. The two upload calls pass `VITE_UPLOAD_TIMEOUT` instead.                                                          |

## Auth

The client stores `accessToken` and `refreshToken` in `fish-admin:session`. Access tokens are sent as `Authorization: Bearer <token>`.

### `POST /auth/login`

```json
{ "email": "admin@fish.dev", "password": "Admin123!" }
```

Response:

```json
{ "accessToken": "…", "refreshToken": "…" }
```

When the account has two-factor authentication enabled, the same endpoint answers with a challenge instead of tokens:

```json
{ "mfaRequired": true, "challengeId": "mfa-…", "expiresAt": "2026-10-21T10:05:00.000Z" }
```

`isMfaRequired()` in `src/features/auth/api.ts` narrows the union, and the client then routes to `/otp?challenge=…`. Five wrong passwords should lock the address; the mock returns `429 ACCOUNT_LOCKED` for one minute.

The app then calls `/auth/me` to load the user.

### `POST /auth/mfa/verify`

```json
{ "challengeId": "mfa-…", "code": "246810" }
```

Returns the `{ accessToken, refreshToken }` pair, or `401 INVALID_CODE`. A challenge expires after five minutes and after five wrong codes.

### `POST /auth/register` and `POST /auth/verify-email`

`register` takes `{ name, email, password }` and creates an unverified account with the default role. The mock also returns the verification token so the demo can finish without email delivery:

```json
{ "email": "visitor@fish.dev", "verificationToken": "…" }
```

`verify-email` takes `{ token }` and returns `{ email }`. In production, send a link to `{email}` and never expose the token in the response body — the UI reads it from the query string only in demo mode.

### `POST /auth/forgot-password` and `POST /auth/reset-password`

`forgot-password` takes `{ email }` and must return the same successful body whether or not the address exists (the mock adds `demoResetToken` only because the flow is browser-only). `reset-password` takes `{ token, password }`, returns `204`, and should invalidate the token and every existing session for that user.

### `GET /auth/invites/:token` and `POST /auth/accept-invite`

The preview returns `{ email, name, roleName, invitedByName, expiresAt }` (`name` is optional — the invite may only carry an address). Accepting takes `{ token, name, email, password }` and returns a token pair, so the invited user lands signed in. Reuse or expiry must answer `410`.

### `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `DELETE /auth/sessions`

Sessions are the device list on `/security`:

```json
[
  {
    "id": "sess-…",
    "browser": "Chrome",
    "os": "Windows",
    "ip": "203.0.113.7",
    "createdAt": "2026-10-21T08:00:00.000Z",
    "lastActiveAt": "2026-10-21T09:40:00.000Z",
    "expiresAt": "2026-10-28T09:40:00.000Z",
    "current": true
  }
]
```

`DELETE /auth/sessions/:id` revokes one session and must reject the caller's own session (`400 CANNOT_REVOKE_CURRENT`); `DELETE /auth/sessions` revokes all others.

### `POST /auth/change-password`

`{ currentPassword, newPassword }` → `204`. Revoke the other sessions, as the mock does, so a stolen device is signed out.

### `POST /auth/2fa/setup`, `/2fa/enable`, `/2fa/disable`

`setup` returns the shared secret (the demo also returns `demoCode`), `enable` verifies a code before turning 2FA on, `disable` requires the current password and signs other sessions out. With a real backend, generate the secret server-side and validate TOTP windows rather than comparing a fixed code.

### `POST /auth/refresh`

```json
{ "refreshToken": "…" }
```

Response: the same `{ accessToken, refreshToken }` pair. Tokens are rotated on every refresh; the old refresh token becomes invalid.

### `POST /auth/logout`

Body `{ "refreshToken": "…" }`, response `204`. The client clears local state even if this request fails.

### `GET /auth/me`

Returns the signed-in user with resolved permissions:

```json
{
  "id": "user-admin",
  "name": "Avery Chen",
  "email": "admin@fish.dev",
  "avatar": null,
  "bio": "…",
  "roleId": "admin",
  "roleName": "Administrator",
  "permissions": ["*"]
}
```

`permissions` must be the effective list, wildcards included. The UI resolves `*` and `resource:*` locally; see [RBAC](./rbac.md).

### Refresh behaviour

`apiRequest` handles `401` like this:

1. Call `refreshSession()`; concurrent requests share one refresh promise.
2. Retry the original request once with the new access token.
3. If refresh fails, clear the session and Query cache, emit an unauthorized event and redirect to `/login?redirect=…`.

Your refresh endpoint should return `401` for invalid, expired or revoked refresh tokens. Do not return `403`, which the client treats as a permission error.

Requests sent with `auth: false` — `/auth/login`, `/auth/mfa/verify`, `/auth/refresh`, `/auth/me` and the register/invite/reset flows — skip this path entirely, so a wrong password reaches the form instead of clearing the session and starting a refresh.

## Users

### `GET /users`

Query parameters:

| Parameter            | Type                                         | Notes                                     |
| -------------------- | -------------------------------------------- | ----------------------------------------- |
| `page`               | number                                       | 1-based                                   |
| `pageSize`           | number                                       | 10 by default                             |
| `q`                  | string                                       | Matches name or email                     |
| `roleId`             | string                                       | Exact role                                |
| `status`             | `active \| invited \| inactive`              | Exact status                              |
| `departmentId`       | string                                       | Exact department                          |
| `includeDescendants` | `1`                                          | Include child departments with the filter |
| `sort`               | `name \| email \| createdAt \| lastActiveAt` | Column id                                 |
| `order`              | `asc \| desc`                                | Sort direction                            |

Response:

```json
{
  "items": [
    {
      "id": "user-admin",
      "name": "Avery Chen",
      "email": "admin@fish.dev",
      "avatar": null,
      "roleId": "admin",
      "roleName": "Administrator",
      "status": "active",
      "department": "Platform",
      "departmentId": "dept-platform",
      "departmentPath": ["Engineering", "Platform"],
      "jobTitle": "Staff Engineer",
      "tags": ["on-call", "backend"],
      "bio": "…",
      "createdAt": "2025-01-10T08:00:00.000Z",
      "lastActiveAt": "2026-10-21T09:12:00.000Z"
    }
  ],
  "total": 60,
  "page": 1,
  "pageSize": 10,
  "pageCount": 6
}
```

Search, filters, sort and paging live in the URL (`validateSearch` in `src/features/users/search.ts`), so a copied link restores the same view.

### `POST /users`

```json
{
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "roleId": "manager",
  "status": "active",
  "departmentId": "dept-operations",
  "jobTitle": "Operations Lead",
  "tags": ["remote"]
}
```

Returns the created user (`201` is fine; the mock returns `200`). `departmentId` (or the legacy `department` name) is required; `tags` is capped at eight labels.

### `GET /users/:id`, `PATCH /users/:id`

`GET` returns one user and answers `404 USER_NOT_FOUND` for unknown or deleted ids; the detail page renders a `Result` screen in that case.

`PATCH` accepts any subset of the create fields, including `departmentId`, `jobTitle`, `tags` and `avatar`. Returns the updated user.

Two self-targeted changes are rejected with `400`: `CANNOT_DEACTIVATE_SELF` when `status` becomes `inactive` for the caller's own id, and `CANNOT_CHANGE_OWN_ROLE` when `roleId` differs from the caller's current role. Keep them in your backend — otherwise an Administrator can revoke their own access or demote themselves below the permission needed to undo it.

### `DELETE /users/:id`

Returns `204`. Reject self-deletion with `400 CANNOT_DELETE_SELF` as the mock does. The mock soft-deletes (it sets `deletedAt`), which is what makes the undo action below possible; a hard delete works too as long as restore is dropped from the UI.

### `POST /users/bulk-status`

```json
{ "ids": ["user-1", "user-2"], "status": "inactive" }
```

Returns `{ updated: string[], skipped: string[] }`. Rows the caller may not touch — their own account, already-deleted users, already-correct status — land in `skipped` instead of failing the whole request. Setting a user inactive should revoke their sessions, as the mock does.

### `POST /users/bulk-delete` and `POST /users/restore`

`bulk-delete` takes `{ ids }` and returns `{ deleted: string[], skipped: string[] }`. `restore` takes the same body and returns `{ restored: User[] }` — the client calls it from the toast's Undo action, so keep the ids it just deleted available for one round trip.

## Roles and permissions

### `GET /roles`

```json
[
  {
    "id": "manager",
    "name": "Manager",
    "description": "Runs day-to-day user management.",
    "permissions": [
      "dashboard:read",
      "user:read",
      "user:create",
      "user:update",
      "role:read",
      "role:create",
      "role:update",
      "audit:read",
      "department:read",
      "department:manage",
      "permission:read"
    ],
    "isSystem": true,
    "userCount": 21
  }
]
```

### `POST /roles`

```json
{ "name": "Support", "description": "Handles customer tickets.", "permissions": ["user:read"] }
```

Returns the created role. Duplicate names return `409 ROLE_NAME_TAKEN`; unknown permission codes return `400 VALIDATION_ERROR`.

### `PATCH /roles/:id`, `DELETE /roles/:id`

`PATCH` accepts `{ name?, description? }`. Seeded roles are protected and answer `400 PROTECTED_ROLE`. `DELETE` returns `204`; it also answers `PROTECTED_ROLE` for system roles and `409 ROLE_IN_USE` while any active user still has the role.

### `GET /roles/options`

A lightweight list for selects: `[{ "id": "manager", "name": "Manager" }]`. Requires `user:read`.

### `PUT /roles/:id/permissions`

```json
{ "permissions": ["dashboard:read", "user:read"] }
```

Returns the updated role. Reject unknown codes. The seeded Administrator role is protected: editing it returns `400 PROTECTED_ROLE`.

### `GET /permissions`

Returns the registry:

```json
[
  {
    "code": "user:read",
    "group": "user",
    "labelKey": "roles:permissionItems.userRead",
    "descriptionKey": "roles:permissionItems.userReadDescription"
  }
]
```

## Navigation

### `GET /menu`

Returns the sidebar for the signed-in user. The sidebar, the command palette, the breadcrumbs and the `/403` decision all read this one payload:

```json
{
  "groups": [
    {
      "titleKey": "nav:groups.management",
      "items": [
        {
          "titleKey": "nav:items.users",
          "path": "/users",
          "icon": "users",
          "permission": "user:read"
        },
        {
          "titleKey": "nav:items.roles",
          "path": "/roles",
          "icon": "shield-check",
          "permission": "role:read",
          "children": [
            { "titleKey": "nav:items.auditLogs", "path": "/audit-logs", "icon": "scroll-text" }
          ]
        }
      ]
    }
  ]
}
```

| Field        | Rule                                                                                                                                                                                                                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `titleKey`   | An i18n key rendered with `t()`. A key no locale carries shows the key itself, so reuse `nav:groups.*` / `nav:items.*` or ship the translations in every locale.                                                                                                                                                                       |
| `path`       | Must be a route this build has; the allowlist is derived from `NAV_GROUPS`, currently `/`, `/reports`, `/projects`, `/workflows`, `/files`, `/notifications`, `/users`, `/departments`, `/roles`, `/permissions`, `/dictionaries`, `/audit-logs`, `/integrations`, `/profile`, `/security`, `/settings`. Anything else is dropped.     |
| `icon`       | One of the 17 names in `src/features/navigation/menu-icons.ts`: `bar-chart-3`, `bell`, `boxes`, `circle-dot`, `folder-kanban`, `folder-open`, `key-round`, `layout-dashboard`, `lock-keyhole`, `network`, `palette`, `plug`, `scroll-text`, `settings-2`, `shield-check`, `user-round`, `users`. An unknown name renders `circle-dot`. |
| `permission` | Optional code, intersected with the session's permissions exactly as the static nav is — an entry the menu sends and the session lacks never renders.                                                                                                                                                                                  |
| `children`   | Optional one-level list, rendered as an indented sub-menu. The parent stays a link.                                                                                                                                                                                                                                                    |

How the client treats it (`src/features/navigation/resolve.ts`, `menu-access.ts`):

- Whatever the menu does not carry is not navigable: a directly typed URL to a dropped `path` lands on `/403`, which is how you retire a page without deleting the route. Detail routes follow their parent, so keeping `/users` in the menu keeps `/users/42` reachable.
- A request that fails, answers with a non-JSON body, or exceeds the 2-second budget falls back to `NAV_GROUPS` in `src/config/nav.ts`. An API that has not implemented the endpoint yet — or no network at all — still gives a working app.
- The payload is cached under the `['menu']` query key for five minutes and cleared with the session, so signing in as another role refetches it.
- The demo serializes this endpoint from `NAV_GROUPS` (`src/mocks/menu.ts`) so the mock and the offline fallback cannot drift. Nothing is server-only there: the Component docs entry is appended client-side and never crosses the wire, because a backend that has never heard of the docs site must still produce a working menu.

> A server-driven menu changes what the interface shows, nothing more. The payload goes to a client that already holds a token, and every page it lists still answers to anyone who asks. Keep the server authoritative for data — see [RBAC](./rbac.md).

## Departments

### `GET /departments`

Returns a flat, pre-order list; the client builds the tree:

```json
{
  "items": [
    {
      "id": "dept-engineering",
      "name": "Engineering",
      "parentId": null,
      "managerId": "user-admin",
      "managerName": "Avery Chen",
      "directMemberCount": 12,
      "memberCount": 34,
      "sortOrder": 1,
      "createdAt": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

`memberCount` includes descendants, which is what the detail panel and `includeDescendants` filtering use.

### `POST /departments`, `PATCH /departments/:id`

`POST` takes `{ name, parentId }` (use `null` for a root) and returns the created department. `PATCH` accepts `{ name?, parentId? }`; renaming also updates the denormalized `department` name on members. Both require `department:manage` and answer `409 DEPARTMENT_NAME_TAKEN` on duplicate names. Moving a node below its own descendant is rejected with `400 INVALID_PARENT`, and so is an unknown parent.

## Audit events

### `GET /audit-events`

| Parameter    | Type                                 | Notes                                           |
| ------------ | ------------------------------------ | ----------------------------------------------- |
| `page`       | number                               | 1-based                                         |
| `pageSize`   | number                               | Clamped to 10–100                               |
| `q`          | string                               | Matches actor, entity label and metadata values |
| `action`     | `AuditAction`                        | Exact action, e.g. `user.updated`               |
| `entityType` | `user \| role \| department \| auth` | Exact entity type                               |
| `entityId`   | string                               | Exact entity id                                 |
| `from`, `to` | `yyyy-MM-dd`                         | Inclusive local-day boundaries                  |

Returns `PaginatedResult<AuditEvent>`:

```json
{
  "items": [
    {
      "id": "audit-…",
      "action": "user.updated",
      "actorId": "user-admin",
      "actorName": "Avery Chen",
      "entityType": "user",
      "entityId": "user-42",
      "entityLabel": "Jordan Lee",
      "metadata": { "fields": "departmentId, tags" },
      "createdAt": "2026-10-21T09:12:00.000Z"
    }
  ],
  "total": 160,
  "page": 1,
  "pageSize": 20,
  "pageCount": 8
}
```

Unknown actions or entity types return `400 VALIDATION_ERROR`; malformed dates or `from > to` return `400 INVALID_DATE_RANGE`.

### `GET /audit-events/:id`

Returns `{ event, related }`, where `related` holds up to five newer events for the same entity. A missing id returns `404 AUDIT_EVENT_NOT_FOUND`. The demo keeps at most 500 events.

## Dashboard

### `GET /dashboard?range=7|30`

Returns everything the dashboard needs in one request:

```json
{
  "range": 7,
  "kpis": [{ "id": "revenue", "value": 48250, "change": 12.4 }],
  "revenue": [{ "date": "2026-10-15", "value": 6200 }],
  "traffic": [{ "date": "2026-10-15", "visits": 1840, "signups": 96 }],
  "channels": [{ "name": "Organic", "value": 42 }],
  "activity": [
    {
      "id": "act-1",
      "action": "user.created",
      "actorName": "Avery Chen",
      "target": "Jordan Lee",
      "createdAt": "2026-10-21T09:12:00.000Z"
    }
  ]
}
```

You can split this into several endpoints; update `src/features/dashboard/api.ts` and `queries.ts` accordingly.

## Profile

### `PATCH /profile`

```json
{ "name": "Avery Chen", "bio": "Building things.", "avatar": "data:image/png;base64,…" }
```

Returns the updated `AuthUser`. Send `null` or an empty string to remove the avatar. The demo caps data URLs at 1.5 MB; use object storage in production instead.

## Demo reset

### `POST /__mock/reset`

Only exists in the mock, and requires `demo:reset`. It reseeds users, roles, departments, audit events, invitations and tokens, then reattaches the current session when the signed-in account still exists. Remove the Settings action when you connect a real API.

## Replacing the mock, step by step

1. Keep `src/types` as the internal contract, or replace it with generated types from your OpenAPI schema.
2. Rewrite the feature `api.ts` files (`auth`, `users`, `roles`, `permissions`, `departments`, `audit`, `dashboard`, `profile`, `settings`) to call your endpoints. They are the only places that use `apiRequest`; the security screen reuses `auth/api.ts`.
3. Keep `apiRequest` for bearer tokens, single-flight refresh and global 401 handling. If your backend uses cookies, simplify it: drop the Authorization header, add `credentials: 'include'`, and keep the 401 redirect.
4. Implement the auth lifecycle on the server — registration with verification, reset tokens with a TTL, invitations, TOTP, lockout and a session table. `src/mocks/handlers/auth.ts` documents the request/response shape each screen expects, and the client only depends on those shapes.
5. Update the `permissions` field in `/auth/me` to your server's effective permission list.
6. Decide where roles, departments and permissions live. The demo keeps a full registry on the client for the role editor and matrix; a real backend may expose only the labels it needs, but it must still enforce every code.
7. Remove `src/mocks` and `public/mockServiceWorker.js`, then verify a production build with `pnpm build && pnpm preview`.

## Testing against a real API

- Point Playwright's `webServer` at a backend-enabled build, or stub network calls with `page.route`.
- Keep one contract test per endpoint that asserts the response shape the UI expects.
- Exercise the refresh path by expiring the access token on purpose; the UI should retry once and then sign the user out.
