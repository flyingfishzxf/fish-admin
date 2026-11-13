# Vue template

`apps/vue-template` is a private Vue 3 admin app for FishAdmin. It reuses the
framework-neutral contracts, i18n resources and MSW mock API, and the
`@fish-admin/vue` component port. It is a demonstration template, not a
published package.

> Client-side permissions are a UX layer, not a security boundary. Every route
> guard and button check can be bypassed in the browser; a real deployment must
> enforce authorization on the server.

## Scope

- Sign-in with optional two-factor verification, sign-out, session restore and
  access-token refresh.
- Registration with email verification, password recovery and reset, and invite
  acceptance — six auth entries in total, all wired to the mock API.
- Account domain: profile (name, bio, avatar), security (password, sessions,
  two-factor) and settings (theme mode, accent, language, demo reset).
- Permission-filtered sidebar, route guards and button-level permission checks.
- Light / dark / system theme, five accent palettes and en / zh-CN language, all
  persisted.
- Dashboard: 7/30 day range, four KPI cards, recent activity.
- Users: search, status filter, server pagination and sorting, row actions,
  create/edit dialog and delete confirmation.
- Reports: range and granularity filters, four KPIs, channel breakdown and a
  paginated table.
- Departments: role="tree" with arrow-key navigation, member counts and inline
  create/rename.
- Roles: search, create/rename/delete, and a permission matrix that saves one
  request per changed role.
- Permissions: reference list of the 13 groups, grouped view and code search.
- Dictionaries: two-pane type and item maintenance, including item reordering
  and enable/disable.
- Audit log: action, object and date filters, server pagination and a detail
  drawer with the recorded metadata and related events.
- Integrations: connection cards, provider and status filters, a form drawer
  with request headers, and a delivery drawer with replay.
- Four full-page status states (401, 500, 503, maintenance) rendered outside the
  shell, plus the existing 403 and 404 pages.

Not included: the header/mixed layouts, density and content-width settings,
command palette, notifications, App tabs, subnav, offline banner, product tour,
the four collaboration pages, dashboard charts, CSV import/export, saved views,
bulk actions or pixel parity. Of the 16 pages in `NAV_CONTRACT`, 12 ship; only
the collaboration group is absent.

## Routes

| Path               | Page              | Access                               |
| ------------------ | ----------------- | ------------------------------------ |
| `/login`           | Sign in           | public; signed-in users go to `/`    |
| `/register`        | Create account    | public; signed-in users go to `/`    |
| `/verify-email`    | Verify email      | public; needs `?token=`              |
| `/forgot-password` | Forgot password   | public; signed-in users go to `/`    |
| `/reset-password`  | Reset password    | public; needs `?token=`              |
| `/accept-invite`   | Accept invitation | public; needs `?token=`              |
| `/otp`             | Two-step verify   | public; needs `?challenge=`          |
| `/`                | Dashboard         | signed in + `dashboard:read`         |
| `/reports`         | Reports           | signed in + `report:read`            |
| `/users`           | Users             | signed in + `user:read`              |
| `/departments`     | Departments       | signed in + `department:read`        |
| `/roles`           | Roles             | signed in + `role:read`              |
| `/roles/matrix`    | Permission matrix | signed in + `role:read`              |
| `/permissions`     | Permissions       | signed in + `permission:read`        |
| `/dictionaries`    | Dictionaries      | signed in + `dictionary:read`        |
| `/audit-logs`      | Audit log         | signed in + `audit:read`             |
| `/integrations`    | Integrations      | signed in + `integration:read`       |
| `/profile`         | Profile           | signed in; no permission key         |
| `/security`        | Security          | signed in; no permission key         |
| `/settings`        | Settings          | signed in; no permission key         |
| `/403`             | Forbidden         | signed in                            |
| `/401`             | Session expired   | public; full page, outside the shell |
| `/500`             | Server error      | public; full page, outside the shell |
| `/503`             | Unavailable       | public; full page, outside the shell |
| `/maintenance`     | Maintenance       | public; full page, outside the shell |
| `/:pathMatch(.*)*` | Not found         | public                               |

`/roles/matrix` has no sidebar entry of its own; it is reachable from the Roles
page header and the sidebar highlights Roles while it is open. The three account
pages appear in the sidebar for every role, because their routes carry no
`meta.permission`.

## Auth flows

| Flow              | Path                                     | Notes                                                            |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Register          | `/register` → `/verify-email` → `/login` | The mock returns the verification token instead of sending mail. |
| Password recovery | `/forgot-password` → `/reset-password`   | Same response whether or not the account exists.                 |
| Invitation        | `/accept-invite?token=fish-demo-invite`  | Signs the invited user in and lands on the dashboard.            |
| Two-factor        | `/login` → `/otp` → `/`                  | Enable it first from `/security`; the demo code is `246810`.     |

Every auth entry redirects a signed-in visitor to `/`: registration, recovery
and the OTP step have nothing to offer someone who already has a session.

## Demo accounts

| Role          | Email              | Password      |
| ------------- | ------------------ | ------------- |
| Administrator | `admin@fish.dev`   | `Admin123!`   |
| Manager       | `manager@fish.dev` | `Manager123!` |
| Viewer        | `viewer@fish.dev`  | `Viewer123!`  |

## Commands

```bash
pnpm dev:vue-template
pnpm build:vue-template
pnpm test:vue-template
pnpm test:e2e:vue-template
```

## Deviations from the React template

| Area                                                             | React                                                                      | Vue template                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Shell                                                            | sidebar / header / mixed + density and width settings                      | sidebar only; no shell card on `/settings`                                      |
| Navigation                                                       | all 16 contracted pages                                                    | 12 of 16; only the collaboration group absent                                   |
| Command palette / notifications / offline banner / tabs / subnav | yes                                                                        | no                                                                              |
| Authentication                                                   | sign in, register, recovery, invite, OTP, 2FA                              | the same six flows; no email delivery, fixed demo TOTP secret                   |
| Dashboard                                                        | KPIs, three charts, product tour                                           | KPIs and activity feed; no charts or tour                                       |
| Users                                                            | column controls, density, saved views, CSV, bulk, import, detail, activity | search, status, paging, sorting, CRUD                                           |
| Roles                                                            | two-step create wizard that also picks permissions                         | one dialog; permissions are granted in the matrix                               |
| Dictionaries                                                     | drag handle plus arrow keys, no pagination                                 | same, and the item list is not paged                                            |
| Audit log                                                        | JSON viewer, per-action icons, debounced search, page-size control         | metadata as a definition list, text badges, no debounce, fixed page size of 20  |
| Integrations                                                     | Combobox, Segmented status filter, numeric page tokens, Popconfirm         | Select filters, prev/next pager, delete dialog                                  |
| Profile                                                          | avatar crop tool, upload progress, timezone and language preferences       | name, bio and avatar only; the avatar is re-encoded to 256×256 locally          |
| Security                                                         | password, 2FA, session list with device icons and revoke                   | the same three cards; no recovery codes                                         |
| Settings                                                         | appearance, shell, language, storage, security, demo data, about           | appearance, language, security, retention, status previews, demo data and about |
| Theme                                                            | light/dark/system + accent                                                 | light/dark/system + the same five accents                                       |
| Remaining pages                                                  | 16 features                                                                | 12 pages plus `/roles/matrix` and four status pages                             |

The DropdownMenu wrapper renames the CSS variables from `--radix-*` to
`--reka-*`; all other classes are copied verbatim from the React source.

Implementation details that also differ from the React template:

- `DropdownMenuItem` and `DropdownMenuLabel` bind `:data-inset="inset || undefined"`,
  so a non-inset entry renders no `data-inset` attribute where React renders
  `data-inset="false"`.
- The breadcrumb group label is a plain `<span>` inside an `<li>` and carries no
  `aria-current`; only the current page crumb does.
- KPI cards omit the React `py-6` padding class — the class strings came from the
  plan, so the vertical padding differs slightly. No pixel baseline was added or
  changed for this work.
- Routing uses a `ShellLayout` wrapper component that renders `AppShell` plus
  `<RouterView>`, because `AppShell` itself has no `RouterView` (the React shell
  nests routes differently).
- `eslint.config.js` carries a one-file override disabling
  `react-hooks/rules-of-hooks` for `apps/vue-template/src/main.ts`; the rule
  false-positives on Pinia `use*Store()` calls outside components.
- The permission matrix writes the PUT response into the roles cache before
  invalidating, so a failed refetch cannot roll the checkboxes back.
- The audit and integrations screens adopt the page the server clamps to instead
  of asking again with the requested page, so a shrink cannot strand the pager.
- The dictionaries screen derives the selected type from the list rather than
  syncing it in an effect, so deleting the selected type converges immediately.
- Reka's `AlertDialogAction` is an alias of the close button, so the shared
  `AlertDialog` renders a plain confirm button instead and leaves `open` under
  the caller's control; the caller closes the dialog after its mutation resolves.
- Reka's `PinInput` reports the code as a character array and renders an extra
  hidden input; `OtpInput` normalises it to a string so pages never see either.
- Pages report success and errors inline through `useTransientMessage` and a
  `role="status"` paragraph — the template ships no toast library.
- `packages/i18n` is shared with the React template, so `src/lib/i18n.ts`
  overrides the one string that names React (`common:app.tagline`) with the Vue
  wording at boot instead of forking the locale package.
- The status pages live outside `ShellLayout`, so `/401`, `/500`, `/503` and
  `/maintenance` render without the sidebar even when the session is gone.

## Tests

Vitest covers redirects, permissions, auth/session, i18n, theme, the login,
registration, verification, recovery, invite and OTP pages, the three account
pages, the four status pages, the sidebar and every management page: 297 tests
in 46 files. Fourteen Playwright specs cover the golden paths, four management
scenarios (nine nav items, viewer 403, matrix persistence, pager recovery) and
four auth/account scenarios (register–verify–sign in, password reset, invite
acceptance, accent persistence across a reload); they do not produce or compare
screenshots.

## Client-side permission boundary

RBAC in this template is presentation only. Hiding a button or redirecting a
route never protects an API. The mock server is inside the browser and is not a
security boundary either. The two-factor flow demonstrates the UI contract
only: the code is fixed and the secret is public.
