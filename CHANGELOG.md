# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[Unreleased]: https://github.com/flyingfishzxf/fish-admin/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/flyingfishzxf/fish-admin/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/flyingfishzxf/fish-admin/releases/tag/v1.0.0
