# Vue template shell

`apps/vue-template` is a private Vue 3 admin shell for FishAdmin. It reuses the
framework-neutral contracts, i18n resources and MSW mock API, and the
`@fish-admin/vue` component port. It is a demonstration template, not a
published package.

> Client-side permissions are a UX layer, not a security boundary. Every route
> guard and button check can be bypassed in the browser; a real deployment must
> enforce authorization on the server.

## Scope

- Sign-in, sign-out, session restore and access-token refresh.
- Permission-filtered sidebar, route guards and button-level permission checks.
- Light / dark / system theme and en / zh-CN language, both persisted.
- Dashboard: 7/30 day range, four KPI cards, recent activity.
- Users: search, status filter, server pagination and sorting, row actions,
  create/edit dialog and delete confirmation.

Not included: the header/mixed layouts, command palette, notifications,
profile/security/settings pages, registration/recovery/OTP, dashboard charts,
CSV import/export, saved views, bulk actions or pixel parity.

## Routes

| Path               | Page      | Access                            |
| ------------------ | --------- | --------------------------------- |
| `/login`           | Sign in   | public; signed-in users go to `/` |
| `/`                | Dashboard | signed in + `dashboard:read`      |
| `/users`           | Users     | signed in + `user:read`           |
| `/403`             | Forbidden | signed in                         |
| `/:pathMatch(.*)*` | Not found | public                            |

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

| Area                                                             | React                                                                      | Vue template                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| Shell                                                            | sidebar / header / mixed + density and width settings                      | sidebar only                              |
| Navigation                                                       | all 21 contracted pages                                                    | only Dashboard and Users                  |
| Command palette / notifications / offline banner / tabs / subnav | yes                                                                        | no                                        |
| Authentication                                                   | sign in, register, recovery, invite, OTP, 2FA                              | sign in and session restore only          |
| Dashboard                                                        | KPIs, three charts, product tour                                           | KPIs and activity feed; no charts or tour |
| Users                                                            | column controls, density, saved views, CSV, bulk, import, detail, activity | search, status, paging, sorting, CRUD     |
| Profile / security / settings                                    | yes                                                                        | no entry; the account menu only signs out |
| Theme                                                            | light/dark/system + accent                                                 | light/dark/system, accent fixed to violet |
| Remaining pages                                                  | 21 features                                                                | Dashboard and Users only                  |

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
  changed for this slice.
- Routing uses a `ShellLayout` wrapper component that renders `AppShell` plus
  `<RouterView>`, because `AppShell` itself has no `RouterView` (the React shell
  nests routes differently).
- `eslint.config.js` carries a one-file override disabling
  `react-hooks/rules-of-hooks` for `apps/vue-template/src/main.ts`; the rule
  false-positives on Pinia `use*Store()` calls outside components.

## Tests

Vitest covers redirects, permissions, auth/session, i18n, theme, login, users
and the sidebar: 54 tests in 14 files. Six Playwright smoke tests cover the
golden paths; they do not produce or compare screenshots.

## Client-side permission boundary

RBAC in this template is presentation only. Hiding a button or redirecting a
route never protects an API. The mock server is inside the browser and is not a
security boundary either.
