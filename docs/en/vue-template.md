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
- Shell: three layouts (sidebar / header / mixed), two densities, three content
  widths, a persisted tab workspace, a group subnav in the mixed layout, a
  command palette, an offline banner and a four-step product tour.
- Notifications: a header bell with an unread badge, the `/notifications` inbox
  with filtering, selection and single/bulk read, a detail drawer with deep
  links, and a delivery-preferences card.
- Permission-filtered sidebar, route guards and button-level permission checks.
- Light / dark / system theme, five accent palettes and en / zh-CN language, all
  persisted.
- Dashboard: 7/30 day range, four KPI cards, a revenue area chart, a traffic
  bar chart, an acquisition ring chart and the recent-activity feed.
- Users: search, role and status filters, server pagination, sorting and page
  size, row selection with bulk status change and bulk delete (both undoable),
  a CSV export of the filtered result, density and column-visibility controls,
  saved views, row actions, create/edit dialog and delete confirmation — plus
  `/users/:id` with a nine-field overview, tag and avatar editing, an audit
  activity timeline and an in-page not-found state, and a four-step CSV import
  wizard with column mapping and per-row review.
- Reports: range and granularity filters, four KPIs, a trend chart with a
  metric switch and a target line, a channel ring chart with shares, and a
  paginated table with CSV export.
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
- Files: a folder tree with per-folder counts, breadcrumbs, search plus kind,
  visibility, date and favorite filters, grid and list views, selection with
  bulk delete, a preview panel with metadata, move, visibility, rename, delete
  and a folder gallery, and an upload queue with a destination folder, per-file
  status and retry.
- Projects: a portfolio KPI row, a featured strip, six filters, board and list
  views with server sorting, paging, a two-step create dialog and archive; each
  project opens at `/projects/:id` with an overview (milestone groups,
  attachments, activity), a four-column task board, an editable budget and a
  three-step retrospective, plus member and settings drawers.
- Four full-page status states (401, 500, 503, maintenance) rendered outside the
  shell, plus the existing 403 and 404 pages.

Not included: `/workflows`, column drag-to-reorder / pinning / resizing, and
page-level pixel parity. Of the 16 pages in `NAV_CONTRACT`, 15 ship; only the
workflow editor is absent, because it needs a canvas, a node graph and roughly
two thousand lines of its own.

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
| `/notifications`   | Notifications     | signed in; no permission key         |
| `/users`           | Users             | signed in + `user:read`              |
| `/files`           | Files             | signed in + `file:read`              |
| `/projects`        | Projects          | signed in + `project:read`           |
| `/projects/:id`    | Project workspace | signed in + `project:read`           |
| `/users/:id`       | User detail       | signed in + `user:read`              |
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
`meta.permission`. `/notifications` is keyless for the same reason: every
signed-in role has notifications, and a permission key would break the bell's
deep link.

## Shell

Three layouts, picked on `/settings` and stored with `fish-admin:ui` in
`localStorage` (the same key and `{ state, version }` envelope the React template
writes, so the two templates can share a browser profile):

| Layout    | Chrome                                                                |
| --------- | --------------------------------------------------------------------- |
| `sidebar` | icon rail plus a grouped sidebar; the default                         |
| `header`  | no sidebar; every group is a dropdown in the top bar                  |
| `mixed`   | collapsed icon rail, breadcrumb header and a subnav of the open group |

- **Density** — `default` or `compact`. The compact setting writes
  `html[data-density="compact"]`, which narrows the `--spacing` scale, so
  portalled overlays inherit it too.
- **Content width** — `narrow` / `default` / `full` is a class on `<main>` only;
  it never touches the shell chrome.
- **Tabs** — every reachable page opened stays in a tab bar under the header.
  Tabs persist, can be pinned, closed one at a time, closed to the right or all
  at once, and the bar drops a tab whose page the current role can no longer
  reach. Closing the active tab lands on the last remaining one.
- **Command palette** — `Ctrl/Cmd+K` opens it; type to filter pages and actions,
  arrow keys move, Enter runs. `Ctrl/Cmd+B` collapses the rail, except in the
  `header` layout where there is no rail to collapse.
- **Subnav** — only in the `mixed` layout: a row of chips for the other pages of
  the active group.
- **Offline banner** — the shell watches `online` / `offline` and shows a
  `role="status"` banner while the browser is offline, then confirms the recovery
  briefly.
- **Product tour** — four steps (sidebar, search, bell, account) started from the
  dashboard. The overlay is a portal, skips a step whose anchor is not on screen,
  and closes on Escape.

## Notifications

The bell in the header shows the server's unread count (`9+` past nine) and opens
a preview of the five latest; "view all" opens the inbox.

`/notifications` keeps its state in the URL, so a reload, a bookmark and the
browser's back button all restore the same view:

| Parameter      | Values                                     | Default |
| -------------- | ------------------------------------------ | ------- |
| `page`         | 1…`pageCount`                              | `1`     |
| `pageSize`     | 5–50                                       | `10`    |
| `filter`       | `all`, `unread`, `mention`                 | `all`   |
| `notification` | a notification id; opens the detail drawer | absent  |

The inbox supports per-row read/unread, a row checkbox with select-all
(indeterminate at a partial selection), a bulk "mark selected read", a "mark all
read" in the header and a pager. A filter or page change clears the selection.
Opening an unread row marks it read and writes `?notification=<id>`; closing the
drawer removes only that parameter. The delivery-preferences card at the bottom
edits quiet hours (`HH:mm`), the digest cadence and the in-app/email/push
channels through a draft: the buttons stay disabled until something changes, and
"reset" restores the stored values without a request.

Seven endpoints back the domain, all served by `packages/mock`:
`GET /notifications`, `GET /notifications/:id`, `PATCH /notifications/:id`,
`POST /notifications/read`, `POST /notifications/read-all`,
`GET /notifications/preferences` and `PUT /notifications/preferences`. Every
write invalidates the whole `['notifications']` key, and the unread count is
always the server's number.

## Charts

Three chart shapes cover every visualisation the template needs: area, grouped
bar and ring. They are hand-written SVG rather than Recharts, which only ships
for React; the geometry lives in `components/ui/chart/chart.ts` as pure
functions with unit tests, and the components only render.

| File             | Role                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| `chart.ts`       | `niceTicks`, Fritsch–Carlson monotone interpolation, ring arcs, band layout |
| `ChartShell.vue` | measures the container, draws the grid and both axes, reports hover         |
| `AreaChart.vue`  | gradient fill, optional dashed target line                                  |
| `BarChart.vue`   | grouped bars with rounded caps and a legend                                 |
| `DonutChart.vue` | ring segments with a 3° gap, label tooltip in the hole                      |

The SVG is drawn at the measured pixel width rather than scaled from a fixed
`viewBox`, so tick labels keep their size in a narrow card. Width comes from a
`ResizeObserver`; jsdom has none and reports `0`, so `useChartSize` falls back
to 640 px and the component tests can assert on structure instead of pixels.

Hover is per chart, not per point: `ChartShell` resolves the index (nearest point
for the area chart, band for the bar chart) and emits it, the chart draws a
cursor line and an active dot, and the tooltip is an HTML layer above the SVG so
it can use the same border and shadow tokens as the rest of the UI.

Colours come straight from the caller (`var(--chart-1)`, or the hex the colour
picker returns) instead of the React `ChartConfig` indirection that exists to
feed Recharts' CSS variables. The trend chart on `/reports` is the one place a
colour is user-editable; it defaults to `#6366f1`.

One deliberate divergence: the acquisition legend wraps long channel names
instead of truncating them. In a third-width card the React template reserves
200 px for the ring and leaves the label column too narrow, so "Organic search"
becomes "Organic …"; at 160 px plus wrapping the name survives intact.

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

| Area            | React                                                                                                        | Vue template                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Shell           | sidebar / header / mixed + density and width settings                                                        | the same three layouts, both densities and all three widths, on `/settings`                                                           |
| Navigation      | all 16 contracted pages                                                                                      | 13 of 16; the three collaboration pages absent                                                                                        |
| Authentication  | sign in, register, recovery, invite, OTP, 2FA                                                                | the same six flows; no email delivery, fixed demo TOTP secret                                                                         |
| Dashboard       | KPIs, three charts, product tour                                                                             | the same three charts and the tour, drawn as hand-written SVG                                                                         |
| Users           | column controls, density, saved views, CSV, bulk, import, detail, activity                                   | the same surfaces; column drag / pin / resize are not ported                                                                          |
| Roles           | two-step create wizard that also picks permissions                                                           | one dialog; permissions are granted in the matrix                                                                                     |
| Dictionaries    | drag handle plus arrow keys, no pagination                                                                   | same, and the item list is not paged                                                                                                  |
| Files           | resizable split, watermark, carousel, JSON viewer, combobox and date pickers                                 | fixed two-column split, thumbnail gallery, definition list, Select filters, native date input, flat folder list                       |
| Projects        | featured carousel, statistic cards, query filter, milestone calendar, transfer, editable table, rate/stepper | featured cards, KPI cards, one filter row, grouped milestone list, checkbox roster, inline budget rows, star buttons and a step strip |
| Remaining pages | 16 features                                                                                                  | 15 pages plus `/roles/matrix` and four status pages                                                                                   |
| Audit log       | JSON viewer, per-action icons, debounced search, page-size control                                           | metadata as a definition list, text badges, no debounce, fixed page size of 20                                                        |
| Integrations    | Combobox, Segmented status filter, numeric page tokens, Popconfirm                                           | Select filters, prev/next pager, delete dialog                                                                                        |
| Profile         | avatar crop tool, upload progress, timezone and language preferences                                         | name, bio and avatar only; the avatar is re-encoded to 256×256 locally                                                                |
| Security        | password, 2FA, session list with device icons and revoke                                                     | the same three cards; no recovery codes                                                                                               |
| Settings        | appearance, shell, language, storage, security, demo data, about                                             | appearance, language, security, retention, status previews, demo data and about                                                       |
| Theme           | light/dark/system + accent                                                                                   | light/dark/system + the same five accents                                                                                             |

Shell and notification deviations, item by item:

| Area                       | React                                                 | Vue template                                   | Why                                                                                       |
| -------------------------- | ----------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Command palette            | `cmdk` + `CommandDialog`                              | own input, filter and dialog                   | no dependency for a single call site; filtering is substring matching, not `cmdk` scoring |
| Product tour               | `Tour` from `packages/ui`                             | app-level `Tour.vue` with its own portal       | the `packages/vue` export surface is frozen                                               |
| `Segmented` / `Pagination` | exported by `packages/ui`                             | app-level `components/ui`                      | same frozen export surface                                                                |
| Notification hover preview | `HoverCard` after 300 ms, with the body               | the summary sits in the row; no hover layer    | one primitive fewer; no information is lost, only shown earlier                           |
| Quiet hours                | `TimePicker`                                          | native `<input type="time">`                   | two fields do not justify a new date-time primitive; the value is still `HH:mm`           |
| Notification scroll area   | `ScrollArea`                                          | `max-h-[520px] overflow-y-auto`                | same reason                                                                               |
| Preferences feedback       | `toast.success` / `toast.error`                       | `role="status"` line inside the card           | the template ships no toast library (a rule since Slice 3)                                |
| Detail entity link         | links project, user, file and integration             | links `/integrations`; the rest are plain text | the other targets are not built yet, and a dead link is worse than no link                |
| Sidebar collapsed state    | `SidebarProvider` writes a cookie and never reads it  | persisted by the `ui` store                    | that cookie is dead code in React; here the state actually survives a reload              |
| `Ctrl/Cmd+B`               | registered by `SidebarProvider`                       | registered by `AppShell`, inactive in `header` | with no sidebar the shortcut has nothing to do                                            |
| Server-driven menu         | `GET /menu` plus `enforceMenuAccess`                  | static `NAV_CONTRACT`                          | a standing deviation since Slice 1, not widened here                                      |
| Tab `search`               | generic `Record<string, unknown>` (numbers, booleans) | `Record<string, string>` (navigation only)     | tabs do not carry filter state; filters belong to their pages                             |

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
- Table density is an optional `density` prop on `DataTable` that swaps the two
  padding pairs the React component uses (`py-3`/`h-10` for `py-1.5`/`h-9`), so
  a page can offer the switch without the template reaching into cell classes
  and the parity scenes keep their default rendering.
- The CSV helpers live in `src/lib/csv.ts` because two features write files now;
  the users export walks pages until it has `total` rows (200 pages at most)
  and writes the file once, so a mid-export failure leaves no partial download.
- A saved view stores the query fields but never `page`, and applying one
  replaces the whole query instead of merging it — otherwise "inactive admins"
  would keep whatever filter was set before it.
- Row selection is keyed by user id and cleared whenever the query changes: a
  tick on a row that is no longer in the result set makes "delete selected"
  mean something the user cannot see.
- The undo notice owns its action, so both disappear together; a button that
  outlived its message would offer to restore ids the user has left behind.
- The group band above the column headers is drawn by `DataTable` itself, from
  runs of adjacent visible leaves that share `meta.group`, because TanStack has
  no such row; it stays 32 px under both densities and disappears entirely as
  soon as one column omits a group.
- The projects slice is the largest port so far (3,400 lines of React). It ships
  in one feature commit with three logical parts — data layer and board, detail
  shell with two tabs, then the remaining tabs and drawers — because the card
  links to a detail route that must exist.
- Sixteen primitives are substituted; the two that change the feel most are a
  day-grouped milestone list instead of a calendar grid (the group checkbox
  toggles every milestone on that day) and an inline budget table instead of an
  editable-table component. Both are recorded in the spec.
- The files page replaces twelve React primitives with app-level equivalents, and
  each replacement is written down in the spec's table: a flat, indented folder
  list instead of a roving-tabindex tree, `Select` instead of a searchable
  combobox, a native date input, a definition list instead of a JSON viewer, a
  thumbnail grid instead of a carousel, and a CSS split instead of resizable
  panels. Uploads run one at a time because the mock persists with a
  read-modify-write that silently drops parallel POSTs.
- The CSV parser and the import mapping/validation helpers are pure modules
  (`lib/csv.ts`, `features/users/import.ts`), tested without a DOM. The wizard
  itself is app-level: `packages/vue` has no `ImportWizard` and its export
  surface is frozen, so there is no 35-key labels interface to keep in sync.
- The import dialog reads the `users:import.*` strings directly. Instead of
  toasts, the page composes created and skipped counts into one inline notice;
  a `Dropzone` takes the upload and gained an optional browse label because the
  Chinese import action differs from the shared enterprise wording.
- The detail header is inline in `UserDetailPage.vue` rather than a new
  `DetailPage` primitive: there is one consumer, and the package export surface
  is frozen. The nine overview fields are a `<dl>` grid, not a data-driven
  `Descriptions` component.
- `Timeline`, `TagsInput` and `Dropzone` live in the app-level UI set for the
  same reason. The tone table is shared with the audit page, and the avatar
  encoder (`lib/image.ts`) is shared with the profile page, so neither the
  colours nor the 256 px crop exist in two copies.
- A missing user renders `EmptyState` inside the shell instead of routing to the
  global 404, which would drop the sidebar and leave the user to find the list
  again.
- There is no page-level document title: this template has no such helper, and
  the tab workspace already names the route.
- Column labels and groups are read from `columnDef.meta` through a local cast
  rather than a `ColumnMeta` augmentation: this repo resolves
  `@tanstack/table-core` as a transitive dependency, so the augmentation would
  have no stable module path to target.
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
- Vue casts an absent Boolean prop to `false`, which would make a Reka root
  controlled and permanently closed. The `Dialog` and `Popover` wrappers
  therefore default `open` to `undefined` so the primitive keeps owning its
  state until a caller binds it.
- `DialogContent` sets its own `data-slot`, so anything inside or around a dialog
  is located by a dedicated attribute (`data-command-palette`,
  `data-drawer-body`) instead.
- "Close tabs to the right" is a positional slice, exactly as in React: it closes
  pinned tabs that sit to the right as well.

## Tests

Vitest covers redirects, permissions, auth/session, i18n, theme, the login,
registration, verification, recovery, invite and OTP pages, the three account
pages, the four status pages, the shell (layouts, tabs, command palette, subnav,
offline banner, tour) and the notification surfaces, plus every management page:
615 tests in 88 files. Forty-one Playwright specs cover the golden paths,
four management scenarios (nine nav items, viewer 403, matrix persistence, pager
recovery), four auth/account scenarios (register–verify–sign in, password reset,
invite acceptance, accent persistence), seven shell/notification scenarios
(header layout, mixed layout with compact density, palette navigation, tab close,
single read, mark-all persistence, offline banner), seven chart/report
scenarios (three dashboard charts, range redraw, hover tooltip, report charts,
metric switch, target line, CSV download) and three users-table scenarios
(bulk delete with undo, CSV download, role filter), three user-detail
scenarios (tag save across a reload, an unknown id, the activity request) and
three import scenarios (sample CSV, invalid rows sent nowhere, viewer has no
import action) three files scenarios (batch upload, bulk delete from the
list view, read-only viewer) and four project scenarios (create, view/sort/filter,
a write through every tab, read-only viewer); they do not produce or compare
screenshots.

## Client-side permission boundary

RBAC in this template is presentation only. Hiding a button or redirecting a
route never protects an API. The mock server is inside the browser and is not a
security boundary either. The two-factor flow demonstrates the UI contract
only: the code is fixed and the secret is public.
