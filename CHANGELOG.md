# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/flyingfishzxf/fish-admin/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/flyingfishzxf/fish-admin/releases/tag/v1.0.0
