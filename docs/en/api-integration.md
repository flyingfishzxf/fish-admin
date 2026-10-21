# Connecting a real API

The app talks to its backend through `src/lib/api-client.ts`. The demo backend is MSW, but the request/response contract is ordinary JSON over HTTP. You can either keep the shapes below or adapt the small `api.ts` files per feature.

## Switch the environment

| Variable            | Default | Meaning                                                                                    |
| ------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | `/api`  | Prefix for every request. No trailing slash needed.                                        |
| `VITE_ENABLE_MOCK`  | `false` | Starts the MSW Service Worker when `true`. Vite dev enables it through `.env.development`. |
| `VITE_MOCK_LATENCY` | `300`   | Artificial delay in milliseconds for mock responses.                                       |

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

The client wraps this in `ApiError` with `status`, `code` and `message`. Any `401` triggers the refresh flow described below; other statuses are surfaced to TanStack Query and shown in the UI.

| Status | When                                                                                                                                   |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Validation failed (`VALIDATION_ERROR`, `INVALID_TOKEN`, `WEAK_PASSWORD`, `INVALID_PASSWORD`, `PASSWORD_UNCHANGED`, `SETUP_REQUIRED`)   |
| `401`  | Missing/expired token (`UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_REFRESH_TOKEN`, `INVALID_CREDENTIALS`, `INVALID_CODE`, `MFA_EXPIRED`) |
| `403`  | Authenticated but not allowed (`FORBIDDEN`, `ACCOUNT_INACTIVE`, `EMAIL_NOT_VERIFIED`)                                                  |
| `404`  | Unknown resource (`USER_NOT_FOUND`, `ROLE_NOT_FOUND`, `SESSION_NOT_FOUND`, `INVITE_NOT_FOUND`)                                         |
| `409`  | Conflict (`EMAIL_TAKEN`, `ALREADY_ENABLED`)                                                                                            |
| `410`  | Invitation already used or expired (`INVITE_USED`, `INVITE_EXPIRED`)                                                                   |
| `429`  | Too many failed sign-ins (`ACCOUNT_LOCKED`)                                                                                            |

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

## Users

### `GET /users`

Query parameters:

| Parameter  | Type                                         | Notes                 |
| ---------- | -------------------------------------------- | --------------------- |
| `page`     | number                                       | 1-based               |
| `pageSize` | number                                       | 10 by default         |
| `q`        | string                                       | Matches name or email |
| `roleId`   | string                                       | Exact role            |
| `status`   | `active \| invited \| inactive`              | Exact status          |
| `sort`     | `name \| email \| createdAt \| lastActiveAt` | Column id             |
| `order`    | `asc \| desc`                                | Sort direction        |

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
  "department": "Operations"
}
```

Returns the created user (`201` is fine; the mock returns `200`).

### `GET /users/:id`, `PATCH /users/:id`

`PATCH` accepts any subset of the create fields. Returns the updated user.

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
    "permissions": ["dashboard:read", "user:read", "user:create", "user:update", "role:read"],
    "isSystem": false,
    "userCount": 21
  }
]
```

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

Only exists in the mock, and requires `demo:reset`. It reseeds users, roles, invitations, tokens and activity, then reattaches the current session when the signed-in account still exists. Remove the Settings action when you connect a real API.

## Replacing the mock, step by step

1. Keep `src/types` as the internal contract, or replace it with generated types from your OpenAPI schema.
2. Rewrite the seven `api.ts` files (`auth`, `users`, `roles`, `permissions`, `dashboard`, `profile`, `settings`) to call your endpoints. They are the only places that use `apiRequest`; the security screen reuses `auth/api.ts`.
3. Keep `apiRequest` for bearer tokens, single-flight refresh and global 401 handling. If your backend uses cookies, simplify it: drop the Authorization header, add `credentials: 'include'`, and keep the 401 redirect.
4. Implement the auth lifecycle on the server — registration with verification, reset tokens with a TTL, invitations, TOTP, lockout and a session table. `src/mocks/handlers/auth.ts` documents the request/response shape each screen expects, and the client only depends on those shapes.
5. Update the `permissions` field in `/auth/me` to your server's effective permission list.
6. Decide where roles and permissions live. The demo keeps a full registry on the client for the role editor; a real backend may expose only the labels it needs.
7. Remove `src/mocks` and `public/mockServiceWorker.js`, then verify a production build with `pnpm build && pnpm preview`.

## Testing against a real API

- Point Playwright's `webServer` at a backend-enabled build, or stub network calls with `page.route`.
- Keep one contract test per endpoint that asserts the response shape the UI expects.
- Exercise the refresh path by expiring the access token on purpose; the UI should retry once and then sign the user out.
