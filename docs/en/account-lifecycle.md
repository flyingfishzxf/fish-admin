# Account lifecycle and failure screens

FishAdmin wires the parts of an admin app that are usually left as an exercise: signing up, verifying an address, recovering a password, joining by invitation, a second factor, sessions, and the pages a user lands on when something goes wrong.

> Everything in this document runs in the browser against the MSW mock. The tokens, TTLs and lockouts are demonstrations of a contract, not a security implementation. Read [RBAC](./rbac.md) for the boundary warning.

## Where things live

| Concern          | Files                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------- |
| Pages            | `src/features/auth/components/*`, `src/features/security/*`                           |
| Requests         | `src/features/auth/api.ts`                                                            |
| Validation       | `src/features/auth/schemas.ts`, `src/features/auth/password.ts`                       |
| Session state    | `src/stores/auth-store.ts`                                                            |
| Mock rules       | `src/mocks/handlers/auth.ts`, `src/mocks/auth.ts`, `src/mocks/jwt.ts`                 |
| Failure screens  | `src/components/common/status-screen.tsx`, `src/routes/{401,500,503,maintenance}.tsx` |
| Offline handling | `src/lib/online.ts`, `src/components/layout/offline-banner.tsx`                       |

## Sign-in and the second factor

1. `/login` posts `{ email, password }`. A normal account gets a token pair; the store calls `/auth/me` and then honours `?redirect=` after `sanitizeRedirect()` strips anything that is not an internal path.
2. An account with 2FA returns `{ mfaRequired, challengeId, expiresAt }`. The client navigates to `/otp?challenge=…&email=…&redirect=…`.
3. `/otp` uses `InputOTP`; completing six digits auto-submits. A wrong code returns `401 INVALID_CODE`, shows the message inline and clears the field. An expired challenge returns `MFA_EXPIRED` with "sign in again to get a new challenge"; there is no auto-retry, because the challenge is created during password verification.
4. The demo code is `246810` (`DEMO_MFA_CODE`), fixed so the flow is repeatable. Enable it on `/security` → **Enable 2FA**.

`/security` also exposes **Disable 2FA**, which asks for the current password and revokes other sessions — the same rule a real server should apply.

## Registration and verification

`/register` → `POST /auth/register` creates a `viewer` with `emailVerified: false` and returns the verification token so the demo can continue. `/verify-email?token=…&email=…` posts the token, flips the flag and offers a link to `/login`. Signing in before verification returns `403 EMAIL_NOT_VERIFIED`, which the login page shows inline.

A production server emails a link with a single-use token and returns an opaque result; see [API integration](./api-integration.md).

## Password reset

`/forgot-password` always answers `200` so the form cannot be used to enumerate accounts. If the address exists, the mock stores a reset token (30-minute TTL) and returns it for the demo link. `/reset-password?token=…` sets the new password, invalidates the token and calls `revokeSessionsForUser()`, which is why every other device is signed out afterwards.

## Invitations

`/accept-invite?token=…` loads a preview (invited address, role name, inviter, expiry), the form only asks for a name and password, and `POST /auth/accept-invite` returns a token pair so the new user lands inside the app. The seeded link is `/accept-invite?token=fish-demo-invite` (manager role). Reusing a token returns `410 INVITE_USED`; an expired one returns `INVITE_EXPIRED`, and the page renders the "ask for a new invitation" screen instead of a form.

## Lockout

`src/mocks/auth.ts` keeps per-email counters in the mock database. Five failures set `lockedUntil = now + 60s`; further attempts return `429 ACCOUNT_LOCKED` even with the right password. A successful sign-in clears the record, and so do password changes and resets.

## Sessions

`GET /auth/sessions` lists live sessions for the current user, the caller's own first, then by last activity. Each row can be revoked individually (`DELETE /auth/sessions/:id`, `400 CANNOT_REVOKE_CURRENT` for your own) or in bulk (`DELETE /auth/sessions`). A session stores the request's `User-Agent` and a placeholder IP (`127.0.0.1` — a real backend logs the connecting address), and creating one drops every expired session for that user. Refresh rotates the refresh token but keeps the session id, which is what the `sid` claim in the access token points at.

## Failure screens

`StatusScreen` is the shared layout: code, icon, tone, title, description, optional hint, actions, and theme/language controls in the corner.

| Route          | Tone        | Reach                                                           |
| -------------- | ----------- | --------------------------------------------------------------- |
| `/401`         | warning     | Session expired or revoked; signs out and sends you to `/login` |
| `/500`         | destructive | Server error, or previewed from Settings                        |
| `/503`         | warning     | Service unavailable                                             |
| `/maintenance` | muted       | Planned downtime                                                |

`/401`, `/500`, `/503` and `/maintenance` are public standalone `StatusScreen` pages. `/403` is different: `requirePermission()` redirects there from inside the shell, so its component renders a compact card in the content area and keeps the sidebar, header and breadcrumbs — the user needs a way out that is not "go home". The route-level `defaultErrorComponent` in `src/router.tsx` renders the standalone style when a loader throws, and `_app/route.tsx` overrides it with the shell-preserving version.

## Offline

`useOnlineStatus()` subscribes to the window's `online`/`offline` events through `useSyncExternalStore`. `OfflineBanner`, mounted in `AppShell`, appears while `navigator.onLine` is false and fires a "Connection restored" toast when connectivity returns. A mutation fired during an outage is not silently dropped or retried: `queryClient` sets `mutations.retry = false`, so the request fails immediately with the network error message and the form keeps its input. Queries behave differently — they retry at most twice, and only for network errors or `5xx` responses (`4xx` never retries), and because `refetchOnWindowFocus` is off, back on line you get fresh data on the next navigation, `invalidateQueries`, or manual refetch rather than the moment the tab regains focus.

To try it: DevTools → Network → Offline, or in Playwright `context.setOffline(true)`.

## Testing checklist

- `e2e/auth-lifecycle.spec.ts` — register + verify, weak-password rejection, lockout, reset via demo link, 2FA enable → OTP sign-in, invite accept → used.
- `e2e/status-screens.spec.ts` — each status route, the shell-wrapped 403, Settings previews opening in a new tab, offline banner and recovery, the 404 fallback.
- Unit tests — `src/features/auth/schemas.test.ts`, `password.test.ts`, `api.test.ts` (bearer header, 204 handling, `ApiError` mapping), `src/lib/online.test.ts`, plus the auth-store refresh tests.
