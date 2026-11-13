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

Not included: the header/mixed layouts, command palette, notifications,
profile/security/settings pages, registration/recovery/OTP, dashboard charts,
CSV import/export, saved views, bulk actions or pixel parity. Of the 16 pages in
`NAV_CONTRACT`, 9 ship; the collaboration and account groups are absent.

## Routes

| Path               | Page              | Access                            |
| ------------------ | ----------------- | --------------------------------- |
| `/login`           | Sign in           | public; signed-in users go to `/` |
| `/`                | Dashboard         | signed in + `dashboard:read`      |
| `/reports`         | Reports           | signed in + `report:read`         |
| `/users`           | Users             | signed in + `user:read`           |
| `/departments`     | Departments       | signed in + `department:read`     |
| `/roles`           | Roles             | signed in + `role:read`           |
| `/roles/matrix`    | Permission matrix | signed in + `role:read`           |
| `/permissions`     | Permissions       | signed in + `permission:read`     |
| `/dictionaries`    | Dictionaries      | signed in + `dictionary:read`     |
| `/audit-logs`      | Audit log         | signed in + `audit:read`          |
| `/integrations`    | Integrations      | signed in + `integration:read`    |
| `/403`             | Forbidden         | signed in                         |
| `/:pathMatch(.*)*` | Not found         | public                            |

`/roles/matrix` has no sidebar entry of its own; it is reachable from the Roles
page header and the sidebar highlights Roles while it is open.

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

| Area                                                             | React                                                                      | Vue template                                                                   |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Shell                                                            | sidebar / header / mixed + density and width settings                      | sidebar only                                                                   |
| Navigation                                                       | all 16 contracted pages                                                    | 9 of 16; collaboration and account groups absent                               |
| Command palette / notifications / offline banner / tabs / subnav | yes                                                                        | no                                                                             |
| Authentication                                                   | sign in, register, recovery, invite, OTP, 2FA                              | sign in and session restore only                                               |
| Dashboard                                                        | KPIs, three charts, product tour                                           | KPIs and activity feed; no charts or tour                                      |
| Users                                                            | column controls, density, saved views, CSV, bulk, import, detail, activity | search, status, paging, sorting, CRUD                                          |
| Roles                                                            | two-step create wizard that also picks permissions                         | one dialog; permissions are granted in the matrix                              |
| Dictionaries                                                     | drag handle plus arrow keys, no pagination                                 | same, and the item list is not paged                                           |
| Audit log                                                        | JSON viewer, per-action icons, debounced search, page-size control         | metadata as a definition list, text badges, no debounce, fixed page size of 20 |
| Integrations                                                     | Combobox, Segmented status filter, numeric page tokens, Popconfirm         | Select filters, prev/next pager, delete dialog                                 |
| Profile / security / settings                                    | yes                                                                        | no entry; the account menu only signs out                                      |
| Theme                                                            | light/dark/system + accent                                                 | light/dark/system, accent fixed to violet                                      |
| Remaining pages                                                  | 16 features                                                                | 9 pages plus `/roles/matrix`                                                   |

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
- The permission matrix writes the PUT response into the roles cache before
  invalidating, so a failed refetch cannot roll the checkboxes back.
- The audit and integrations screens adopt the page the server clamps to instead
  of asking again with the requested page, so a shrink cannot strand the pager.
- The dictionaries screen derives the selected type from the list rather than
  syncing it in an effect, so deleting the selected type converges immediately.

## Tests

Vitest covers redirects, permissions, auth/session, i18n, theme, login, the
sidebar and every management page: 200 tests in 28 files. Ten Playwright specs
cover the golden paths and the four management scenarios (nine nav items, viewer
403, matrix persistence, pager recovery); they do not produce or compare
screenshots.

## Client-side permission boundary

RBAC in this template is presentation only. Hiding a button or redirecting a
route never protects an API. The mock server is inside the browser and is not a
security boundary either.
