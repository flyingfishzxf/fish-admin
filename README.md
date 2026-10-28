# FishAdmin

> **A React component library for enterprise admin apps — plus the template that ships with it.**

English · [简体中文](./README.zh-CN.md)

[![CI](https://github.com/flyingfishzxf/fish-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/flyingfishzxf/fish-admin/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/Docs-component_library-8b5cf6)](https://fish-admin-docs.vercel.app)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](./LICENSE)

FishAdmin is two things: `@fish-admin/react`, 83 documented components with light/dark theming, English and Chinese locales and RBAC-shaped screens, and a front-end starter you can clone, log into, break on purpose and then connect to your own backend. The [component documentation](https://fish-admin-docs.vercel.app) is the front door for both.

> **Security note:** client-side RBAC is a UX layer, **not a security boundary**. Every permission check in this project can be bypassed by editing JavaScript or calling the API directly. Your backend must enforce authorization. The mock API returns `403` for forbidden writes to demonstrate the expected contract.

**Live demo: <https://fish-admin.vercel.app>** — built with `pnpm build:demo`, so the MSW mock API runs entirely in your browser. Sign in with any [demo account](#demo-accounts) below. Data lives in `localStorage`; clear site storage to reset it. The client-side permission checks there are still a UX layer, not a security boundary.

## Preview

![FishAdmin dashboard](apps/docs/docs/public/screenshots/dashboard.png)

| Users on a 1024 px viewport                                                             | Roles on a 375 px viewport                                                            | Approval center                                                     |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![Users table on a tablet viewport](apps/docs/docs/public/screenshots/users-tablet.png) | ![Roles page on a phone viewport](apps/docs/docs/public/screenshots/roles-mobile.png) | ![Approval center](apps/docs/docs/public/screenshots/workflows.png) |

The same four files are served by the [documentation site](https://fish-admin-docs.vercel.app) under `/screenshots/`.

## Features

- **Full account lifecycle** — login, registration with email verification, forgot/reset password, invitation links, TOTP-style two-factor sign-in, five-attempt lockout, password change and a per-device session list. Session restore uses single-flight refresh-token rotation, deep-link redirect after login and global 401 handling.
- **Three-level RBAC** — navigation, route guards and button-level `<Can>` checks derived from one permission registry. Twenty-five permission codes cover projects, approvals, files, reports, integrations, users, roles, departments, dictionaries and audit. Admin, Manager and Viewer accounts are ready to compare.
- **Three shells and a tabbed workbench** — sidebar, header or mixed navigation, compact density and a content-width cap, all persisted per browser. Opened pages become tabs you can pin, reload with the query intact, close to the right or close all; paths the server menu hides never leave a tab behind. The layout switch lives in Settings.
- **Approval center** — `/workflows` splits requests into My requests, Awaiting me and All, with filters that survive the tab. A request opens a snapshot, decision panel, timeline and comments; approve/reject advances a mock state machine and writes an audit event. See [Approval center](docs/en/workflows.md).
- **Realistic mock API** — MSW, a seeded in-memory database persisted to `localStorage`, 60 users across a 10-node department tree, 12 projects with 72 tasks and 48 milestones, 18 files in an 8-node folder tree, 6 integrations with 24 delivery records, a notification inbox with preferences, 220 audit events, pagination, filtering, sorting, fake JWTs, refresh tokens, `403` responses and a demo-data reset.
- **Project delivery workspace** — `/projects` combines a URL-driven filter bar, board/list switch, featured-project carousel, create wizard, context menus, archive confirmations and paging. Each project opens at `/projects/$id` with overview, task board, milestone calendar, member transfer, budget editing, attachments and a retrospective stepper.
- **File library** — `/files` pairs a folder tree and breadcrumb with grid/list views, upload queue, resizable preview pane with watermark, image carousel, JSON metadata, bulk selection and move/delete flows. Uploads are read client-side and stored as data URLs; large files keep metadata only.
- **Reports and notifications** — `/reports` renders a lazy-loaded KPI/trend/channel report with date range, granularity, thresholds, anchor navigation, back-to-top and CSV export. `/notifications` adds segmented inbox filters, bulk read, a detail drawer, quiet hours and per-channel preferences; the header bell reuses the same query.
- **Integrations and user import** — `/integrations` manages webhook connections, headers, delivery history payloads and replay, while `/users` gains a bulk import wizard and `/audit-logs` renders raw event JSON with links for project, file and integration entities.
- **Guided tour** — the dashboard header starts a `Tour` that walks through the sidebar, search, notification bell and account menu.
- **Advanced users table** — URL-driven search, filters, sorting and paging; row selection with bulk status changes and bulk delete/restore (undo from the toast); column visibility, drag-to-reorder, pinning and resizing; two densities; per-row context menu; saved views; CSV export; drawer forms with React Hook Form + Zod; loading, empty and error states.
- **Tables that survive volume** — `/users` and `/workflows` window their rows with sticky grouped headers and pinned columns. `?dataset=large` renders 5 000 mock rows while keeping at most ~80 in the DOM; visibility, column order and widths persist per user. The synthetic rows are generated in memory and never touch `localStorage`. See [Large tables](docs/en/tables.md).
- **Dictionaries and reference data** — `/dictionaries` maintains two-level types and items with drag or keyboard reordering, enabled switches, reference counts and protection rules. The user profile reads enabled `user_tag` items as tag suggestions, so editing a dictionary has a visible effect. See [Dictionaries](docs/en/dictionaries.md).
- **User detail and history** — `/users/$id` combines an overview, inline tag editing, an avatar dropzone and a per-user activity timeline, with a not-found Result state.
- **Organization tree** — `/departments` renders a keyboard-navigable department tree with member counts, plus create/rename actions and deep-linkable selection.
- **Role governance** — system and custom roles, a two-step create-role wizard, and a `/roles/matrix` permission matrix with grouped checkboxes, sticky headers and an explicit save bar.
- **Audit log** — `/audit-logs` with URL-synced filters, date-range presets, a detail drawer with related events, and links back to the affected user, role or department.
- **Failure handling you can see** — dedicated `401`, `403`, `500`, `503` and maintenance screens, an offline banner with recovery toast, a route error boundary and preview links from Settings.
- **Dashboard** — KPI cards, revenue area chart, traffic bars, acquisition donut and recent activity, with a 7/30-day switch. Charts are lazy-loaded with the dashboard route.
- **83 components, one package** — `@fish-admin/react` exports 47 shadcn/ui primitives, 30 enterprise components and 6 Pro compositions (`DetailPage`, `EditableTable`, `ImportWizard`, `ProForm`, `QueryFilter`, `ProTable`). Each of the 83 has a page on the [documentation site](https://fish-admin-docs.vercel.app), in English and Chinese, with a business-framed live demo, the copyable import path and the generated props table. `pnpm check:package` fails the build if the barrel stops exporting any of them, and `pnpm docs:check` fails if a page, demo or registry entry drifts. ProTable powers the users and audit pages, so the template is the package's first consumer.
- **Product-style design system** — light, dark and system modes, five accent colors, oklch tokens, refined shadows and a FOUC-free first paint.
- **English + Simplified Chinese** — lazy-loaded i18next namespaces, `Intl` date/number formatting and locale-aware validation messages.
- **Command palette** — `Ctrl/⌘ K` navigation and actions, filtered by the current role.
- **Responsive layout** — mobile sidebar sheet, adaptive tables and drawers that work at 375, 768 and 1440 pixels.
- **Engineering included** — strict TypeScript, Vitest + Testing Library, Playwright with axe accessibility scans, gzip bundle and runtime performance budgets, Docker-based visual regression, ESLint, Prettier, Husky, lint-staged, commitlint, GitHub Actions, Docker and Vercel configuration.

## Quick start

Requirements: **Node.js >= 22** (24 LTS recommended) and **pnpm 9.1.1** (`corepack enable` is enough).

### Install the components

```bash
npm install @fish-admin/react
```

That is the same 83-component set the template runs on. [Installation](https://fish-admin-docs.vercel.app/guide/installation) covers the peer dependencies, the Tailwind v4 import and the CSS entry; [Quick start](https://fish-admin-docs.vercel.app/guide/quick-start) walks the first table.

### Start from the demo

```bash
git clone <repository-url>
cd fish-admin
pnpm install
pnpm dev
```

Open http://localhost:5173. The mock API starts automatically in development.

### Start from your own name

```bash
git clone <repository-url> my-app && cd my-app
pnpm install
pnpm scaffold
```

It rebrands the app and can drop the extra locales, and the mock API with the Playwright suite that drives it. `pnpm scaffold --dry-run` prints the plan first. See [docs/en/scaffold.md](docs/en/scaffold.md).

### Demo accounts

| Role          | Email              | Password      | What it can do                                                                                                   |
| ------------- | ------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Administrator | `admin@fish.dev`   | `Admin123!`   | Everything, including user and role deletion, the permission matrix and demo reset                               |
| Manager       | `manager@fish.dev` | `Manager123!` | Manage projects, files and users; read reports, integrations, departments and the audit log; edit custom roles   |
| Viewer        | `viewer@fish.dev`  | `Viewer123!`  | Read the dashboard, projects, files, reports, integrations, users, departments and audit log; no writes anywhere |

The login page fills these credentials with one click. Mock data lives in your browser under `fish-admin:db:v1`; use **Settings → Reset demo data** or clear site storage to start over. These credentials exist only in the browser mock — never ship them to a real backend.

More things to try:

- **Projects** — `/projects` filters by status, priority and owner. Create a project with the two-step wizard, open it at `/projects/$id`, move a task, drag the budget, transfer members, upload an attachment and finish the retrospective stepper.
- **Files** — `/files` browses the folder tree, switches grid and list views, uploads a small image, opens the preview pane and watermark, moves files between folders and deletes them with an undo toast.
- **Notifications** — the header bell opens the unread count. `/notifications` filters all/unread/mentions, marks everything read, opens the detail drawer and saves quiet hours and channel preferences.
- **Reports** — `/reports` changes the date range, granularity, goal threshold and series colors, jumps between anchored sections, returns to the top and downloads CSV.
- **Integrations** — `/integrations` creates a webhook, edits headers in an inline table, toggles a connection, inspects a delivery payload and replays a failed delivery.
- **Bulk import** — `/users` → **Import users** walks through CSV paste, preview and commit, then records the import in the audit log.
- **Guided tour** — the dashboard header's **Product tour** button highlights the sidebar, command palette, notification bell and account menu.
- **Two-factor sign-in** — enable 2FA on `/security`, sign out and sign in again. The demo code is `246810`; a real app would generate it from a TOTP secret.
- **Invitations** — open `/accept-invite?token=fish-demo-invite` to join as `manager`, then reload it to see the used-token screen.
- **Recovery** — `/forgot-password` returns a demo reset link so you can finish the flow without email delivery.
- **Permission matrix** — open `/roles/matrix` as Administrator, toggle a permission, save and reload. The matrix refuses to change the admin column.
- **Audit trail** — `/audit-logs` filters by action, entity and date range. Every change made in the demo is recorded there.
- **Departments** — `/departments?dept=dept-engineering` deep-links to a node and lists its members, including descendants.
- **Failure screens** — `/401`, `/500`, `/503` and `/maintenance` are directly reachable, and the offline banner appears when you throttle the network.
- **Component docs** — when `VITE_DOCS_URL` names a deployment, the sidebar, the command palette and the wide login layout all open the [documentation site](https://fish-admin-docs.vercel.app) in a new tab, and the retired `/components` and `/ui` paths redirect there instead of 404ing.

## What is inside

### Routes

| Path                 | Description                                                  | Required permission |
| -------------------- | ------------------------------------------------------------ | ------------------- |
| `/`                  | Dashboard with KPIs, charts, activity and the product tour   | `dashboard:read`    |
| `/reports`           | KPI, trend and channel reports with anchors and CSV export   | `report:read`       |
| `/projects`          | Project portfolio: filters, board/list, wizard and paging    | `project:read`      |
| `/projects/$id`      | Project workspace: tasks, calendar, budget and retrospective | `project:read`      |
| `/workflows`         | Approval center: my requests, awaiting me and all            | `workflow:read`     |
| `/workflows/$id`     | Approval snapshot, decision, timeline and comments           | `workflow:read`     |
| `/files`             | Asset library: folders, upload, preview, move and delete     | `file:read`         |
| `/notifications`     | Notification inbox, bulk read and channel preferences        | signed in           |
| `/users`             | Users table, CRUD, bulk operations and CSV import            | `user:read`         |
| `/users/$id`         | User overview, tags, avatar and activity timeline            | `user:read`         |
| `/departments`       | Department tree, members and create/rename actions           | `department:read`   |
| `/dictionaries`      | Two-level dictionaries, ordering, references and protection  | `dictionary:read`   |
| `/roles`             | Role cards and permission editor                             | `role:read`         |
| `/roles/matrix`      | Permission matrix across every role                          | `role:read`         |
| `/permissions`       | Read-only permission registry                                | `permission:read`   |
| `/audit-logs`        | Filterable audit trail with a raw-JSON detail drawer         | `audit:read`        |
| `/integrations`      | Webhook connections, headers and delivery history            | `integration:read`  |
| `/profile`           | Profile details and avatar upload demo                       | signed in           |
| `/security`          | Password, two-factor authentication and active sessions      | signed in           |
| `/settings`          | Theme, accent, language, status previews, demo reset         | signed in           |
| `/403`               | Access denied inside the app shell                           | signed in           |
| `/login`             | Sign in (and start MFA when the account has it)              | public              |
| `/register`          | Create an account, then verify the email                     | public              |
| `/verify-email`      | Consumes the verification token                              | public              |
| `/forgot-password`   | Requests a reset link                                        | public              |
| `/reset-password`    | Sets a new password and signs out other sessions             | public              |
| `/accept-invite`     | Turns an invitation token into a `manager` account           | public              |
| `/otp`               | Second step after a successful password                      | public              |
| `/401` `/500` `/503` | Expired session, server error, unavailable service           | public              |
| `/maintenance`       | Planned-downtime screen                                      | public              |

Unknown paths render a 404 inside the shell when you are signed in; unauthenticated visitors are redirected to `/login?redirect=…` and returned to the original URL after signing in. The two retired catalog paths are the exception: with `VITE_DOCS_URL` set they leave the app for the docs site, and without it they 404 like any other unknown path. Every page above is guarded by `beforeLoad`, and a throwing route falls back to an error boundary with a retry action instead of a blank screen.

### Roles and permissions

Permissions use a `resource:action` format and are defined in [`src/config/permissions.ts`](src/config/permissions.ts). Buttons, menus and routes are all derived from that registry.

| Role          | Permissions                                                                                                                                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrator | `*`                                                                                                                                                                                                                                                                              |
| Manager       | `dashboard:read`, `project:read`, `project:manage`, `file:read`, `file:manage`, `report:read`, `integration:read`, `user:read`, `user:create`, `user:update`, `role:read`, `role:create`, `role:update`, `audit:read`, `department:read`, `department:manage`, `permission:read` |
| Viewer        | `dashboard:read`, `project:read`, `file:read`, `report:read`, `integration:read`, `user:read`, `audit:read`, `department:read`                                                                                                                                                   |

The route guard lives in each leaf route's `beforeLoad`; the sidebar is the list `GET /menu` returns, filtered by the same permission codes and falling back to [`src/config/nav.ts`](src/config/nav.ts) when the endpoint is missing; buttons use `<Can permission="user:delete">`. See [docs/en/rbac.md](docs/en/rbac.md) for the four-step guide to adding a permission.

### Mock API

The demo runs entirely in the browser through a Service Worker.

| Method   | Endpoint                                             | Notes                                                                                                                          |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `POST`   | `/api/auth/login`                                    | Tokens, or an MFA challenge when the account has 2FA                                                                           |
| `POST`   | `/api/auth/mfa/verify`                               | Exchanges the challenge and the six-digit code for tokens                                                                      |
| `POST`   | `/api/auth/register`                                 | Creates an unverified `viewer`; returns the demo verify token                                                                  |
| `POST`   | `/api/auth/verify-email`                             | Marks the address verified                                                                                                     |
| `POST`   | `/api/auth/forgot-password`                          | Always `200`; returns the demo reset token when the account hits                                                               |
| `POST`   | `/api/auth/reset-password`                           | Sets the password and revokes the other sessions                                                                               |
| `GET`    | `/api/auth/invites/:token`                           | Invitation preview                                                                                                             |
| `POST`   | `/api/auth/accept-invite`                            | Creates the invited user and signs them in                                                                                     |
| `POST`   | `/api/auth/refresh`                                  | Rotates the refresh token                                                                                                      |
| `POST`   | `/api/auth/logout`                                   | Revokes the refresh token                                                                                                      |
| `GET`    | `/api/auth/me`                                       | Returns the current user and resolved permissions                                                                              |
| `GET`    | `/api/auth/sessions`                                 | Active sessions for the current user                                                                                           |
| `DELETE` | `/api/auth/sessions/:id`                             | Revoke one session (never the current one)                                                                                     |
| `DELETE` | `/api/auth/sessions`                                 | Sign out every other session                                                                                                   |
| `POST`   | `/api/auth/change-password`                          | Requires the current password                                                                                                  |
| `POST`   | `/api/auth/2fa/setup`                                | Returns the demo secret and code                                                                                               |
| `POST`   | `/api/auth/2fa/enable`                               | Confirms the code and turns 2FA on                                                                                             |
| `POST`   | `/api/auth/2fa/disable`                              | Confirms the password and turns 2FA off                                                                                        |
| `GET`    | `/api/users`                                         | `page`, `pageSize`, `q`, `roleId`, `status`, `departmentId`, `includeDescendants`, `sort`, `order`                             |
| `POST`   | `/api/users`                                         | Requires `user:create`                                                                                                         |
| `GET`    | `/api/users/:id`                                     | Requires `user:read`                                                                                                           |
| `PATCH`  | `/api/users/:id`                                     | Requires `user:update`; accepts `departmentId`, `jobTitle`, `tags`, `avatar`                                                   |
| `DELETE` | `/api/users/:id`                                     | Requires `user:delete`; soft delete, cannot delete yourself                                                                    |
| `POST`   | `/api/users/bulk-status`                             | Requires `user:update`; skips rows the caller may not touch                                                                    |
| `POST`   | `/api/users/bulk-delete`                             | Requires `user:delete`; returns the ids actually removed                                                                       |
| `POST`   | `/api/users/restore`                                 | Requires `user:delete`; undo target for the bulk toast                                                                         |
| `POST`   | `/api/users/import`                                  | Requires `user:create`; validates rows, reports per-row errors and creates the accepted users                                  |
| `GET`    | `/api/roles`                                         | Roles with user and permission counts                                                                                          |
| `GET`    | `/api/roles/options`                                 | Lightweight role options                                                                                                       |
| `POST`   | `/api/roles`                                         | Requires `role:create`; 409 `ROLE_NAME_TAKEN`                                                                                  |
| `PATCH`  | `/api/roles/:id`                                     | Requires `role:update`; system roles return `PROTECTED_ROLE`                                                                   |
| `DELETE` | `/api/roles/:id`                                     | Requires `role:delete`; `ROLE_IN_USE` while members remain                                                                     |
| `PUT`    | `/api/roles/:id/permissions`                         | Requires `role:update`                                                                                                         |
| `GET`    | `/api/departments`                                   | Flat department list with direct and total member counts                                                                       |
| `POST`   | `/api/departments`                                   | Requires `department:manage`; 409 `DEPARTMENT_NAME_TAKEN`                                                                      |
| `PATCH`  | `/api/departments/:id`                               | Requires `department:manage`; rename or reparent, rejects cycles                                                               |
| `GET`    | `/api/audit-events`                                  | Requires `audit:read`; `page`, `pageSize`, `q`, `action`, `entityType`, `entityId`, `from`, `to`                               |
| `GET`    | `/api/audit-events/:id`                              | Requires `audit:read`; event plus five related events                                                                          |
| `GET`    | `/api/permissions`                                   | Permission registry                                                                                                            |
| `GET`    | `/api/dashboard?range=7\|30`                         | Dashboard payload                                                                                                              |
| `GET`    | `/api/projects`                                      | Requires `project:read`; `page`, `pageSize`, `q`, `status`, `priority`, `ownerId`, `departmentId`, `archived`, `sort`, `order` |
| `GET`    | `/api/projects/:id`                                  | Requires `project:read`; project with tasks, milestones, members and attachments                                               |
| `POST`   | `/api/projects`                                      | Requires `project:manage`; 409 `KEY_TAKEN` for a duplicate key                                                                 |
| `PATCH`  | `/api/projects/:id`                                  | Requires `project:manage`; status, priority, members, budget, progress, tags, rating, retro, archive                           |
| `POST`   | `/api/projects/:id/tasks`                            | Requires `project:manage`; creates a task in the project                                                                       |
| `PATCH`  | `/api/projects/:id/tasks/:taskId`                    | Requires `project:manage`; title, status, assignee, due date and estimate                                                      |
| `PATCH`  | `/api/projects/:id/milestones/:milestoneId`          | Requires `project:manage`; toggles milestone completion                                                                        |
| `POST`   | `/api/projects/:id/attachments`                      | Requires `project:manage`; links an existing file to the project                                                               |
| `DELETE` | `/api/projects/:id/attachments/:fileId`              | Requires `project:manage`                                                                                                      |
| `GET`    | `/api/file-folders`                                  | Requires `file:read`; flat folder tree with file counts                                                                        |
| `GET`    | `/api/files`                                         | Requires `file:read`; `folderId`, `q`, `kind`, `visibility`, `favorite`, `sort`, `order`, `updatedAfter`, `page`, `pageSize`   |
| `POST`   | `/api/files`                                         | Requires `file:manage`; JSON metadata plus an optional data URL for small files                                                |
| `PATCH`  | `/api/files/:id`                                     | Requires `file:manage`; name, folder, visibility, favorite                                                                     |
| `DELETE` | `/api/files/:id`                                     | Requires `file:manage`                                                                                                         |
| `POST`   | `/api/files/bulk-delete`                             | Requires `file:manage`; returns the ids actually removed                                                                       |
| `GET`    | `/api/reports`                                       | Requires `report:read`; `from`, `to` (`yyyy-MM-dd`) and `granularity=day\|week\|month`                                         |
| `GET`    | `/api/notifications`                                 | Signed in; `filter=all\|unread\|mentions`, `page`, `pageSize`                                                                  |
| `GET`    | `/api/notifications/:id`                             | Signed in; one notification for the current user                                                                               |
| `PATCH`  | `/api/notifications/:id`                             | Signed in; read state                                                                                                          |
| `POST`   | `/api/notifications/read`                            | Signed in; marks the given ids read                                                                                            |
| `POST`   | `/api/notifications/read-all`                        | Signed in; marks every notification read                                                                                       |
| `GET`    | `/api/notifications/preferences`                     | Signed in; quiet hours, digest and channels                                                                                    |
| `PUT`    | `/api/notifications/preferences`                     | Signed in; saves quiet hours, digest and channels                                                                              |
| `GET`    | `/api/integrations`                                  | Requires `integration:read`; `page`, `pageSize`, `q`, `provider`, `enabled`                                                    |
| `POST`   | `/api/integrations`                                  | Requires `integration:manage`                                                                                                  |
| `PATCH`  | `/api/integrations/:id`                              | Requires `integration:manage`; endpoint, event, mode, enabled and headers                                                      |
| `DELETE` | `/api/integrations/:id`                              | Requires `integration:manage`                                                                                                  |
| `GET`    | `/api/integrations/deliveries`                       | Requires `integration:read`; `limit` across all connections                                                                    |
| `GET`    | `/api/integrations/:id/deliveries`                   | Requires `integration:read`; delivery log for one connection                                                                   |
| `POST`   | `/api/integrations/:id/deliveries/:deliveryId/retry` | Requires `integration:manage`; replays a delivery                                                                              |
| `PATCH`  | `/api/profile`                                       | Current user's profile                                                                                                         |
| `POST`   | `/api/__mock/reset`                                  | Reseeds users, roles, departments, workspace data and audit events, keeps the current session                                  |

Access tokens are fake base64url JWTs valid for 15 minutes; refresh tokens last 7 days, verification tokens 24 hours and password-reset tokens 30 minutes. Five wrong passwords lock an email for one minute. The client retries a request once after refreshing; if that fails it clears the session and redirects to login. In a real deployment, prefer `httpOnly` cookies over `localStorage` and never return reset or verification tokens in a response body — see [docs/en/api-integration.md](docs/en/api-integration.md).

### Tech stack

| Layer                     | Choice                                                            |
| ------------------------- | ----------------------------------------------------------------- |
| Runtime / package manager | Node 24 LTS, pnpm 9.1.1                                           |
| Build                     | Vite 8, React 19, TypeScript (strict)                             |
| Styling                   | Tailwind CSS 4, shadcn/ui (new-york), Radix UI, Lucide icons      |
| Routing                   | TanStack Router 1 (file-based, typed search params, route guards) |
| Data                      | TanStack Query 5, Zustand 5                                       |
| Forms                     | React Hook Form, Zod 4                                            |
| Tables / charts           | TanStack Table 8, Recharts 3                                      |
| i18n                      | i18next, react-i18next                                            |
| Mock API                  | MSW 2, Faker (fixed seed)                                         |
| Testing                   | Vitest, React Testing Library, Playwright                         |
| Quality                   | ESLint 9, Prettier, Husky, lint-staged, commitlint                |

## Project structure

```text
packages/ui/                 # @fish-admin/react — the component library
├─ src/components/           # ui (47 primitives), enterprise (30), pro (6), data-table, common
├─ src/locales/              # en + zh-CN strings the components ship with
├─ src/styles/               # tokens, utilities, preflight and the app-owned base
├─ registry.json             # the 83-entry inventory gen-api reads
└─ test/                     # package-level tests
apps/docs/                   # the Rspress documentation site
├─ docs/{en,zh}/             # 83 component pages, guides and the versions page
├─ demos/<component>/        # the live example each page renders
├─ generated/                # registry.json + the API tables, produced by pnpm gen-api
└─ docs/public/screenshots/  # the README and docs hero shots
src/                         # the template
├─ routes/                   # File-based routes; routeTree.gen.ts is generated
├─ features/                 # auth, dashboard, users, roles, permissions, departments, audit, projects, files, reports, notifications, integrations, profile, security, settings
├─ components/
│  ├─ layout/                # AppShell, sidebar, header, notification bell, breadcrumbs, command menu, offline banner
│  └─ common/                # Can, EmptyState, StatusScreen, theme/language toggles
├─ config/                   # env, permissions, audit actions, navigation, theme presets
├─ lib/                      # API client, auth helpers, i18n, formatting, CSV, online status
├─ stores/                   # Auth, theme and UI Zustand stores
├─ locales/{en,zh-CN}/       # Lazy-loaded namespaces
├─ mocks/                    # MSW handlers, seeded database, workspace seed and fake auth
└─ styles/index.css
e2e/                         # Playwright specs
docs/{en,zh-CN}/             # Repository documentation (the site above is the product one)
```

## Scripts

| Command                             | Description                                                |
| ----------------------------------- | ---------------------------------------------------------- |
| `pnpm scaffold`                     | Rebrand the clone and drop the parts you do not want       |
| `pnpm dev`                          | Start Vite with the mock API enabled                       |
| `pnpm build`                        | Type-check and build for production (mock off by default)  |
| `pnpm build:demo`                   | Build with the mock API enabled, as used by the live demo  |
| `pnpm preview`                      | Preview the production build                               |
| `pnpm build:ui` / `pnpm test:ui`    | Build / test `@fish-admin/react`                           |
| `pnpm check:package`                | Fail unless the barrel exports every registry entry        |
| `pnpm gen-api` / `gen-api:check`    | Regenerate / verify the docs API tables and coverage floor |
| `pnpm docs:dev` / `docs:build`      | Run / build the documentation site                         |
| `pnpm docs:check`                   | Fail on a missing page, demo or registry drift             |
| `pnpm test:docs`                    | Build the site, then run its Playwright suite              |
| `pnpm lint` / `pnpm lint:fix`       | Run ESLint                                                 |
| `pnpm format` / `pnpm format:check` | Run Prettier                                               |
| `pnpm typecheck`                    | Run TypeScript without emitting                            |
| `pnpm test` / `pnpm test:watch`     | Run unit tests                                             |
| `pnpm test:coverage`                | Unit tests with a coverage report                          |
| `pnpm test:e2e`                     | Build the demo, then run E2E, axe and performance specs    |
| `pnpm perf`                         | Run only the runtime performance budgets                   |
| `pnpm size`                         | Build production and check gzip budgets                    |
| `pnpm test:visual:docker`           | Compare screenshots in the Playwright Docker image         |

## Quality gates

CI runs these gates on every push and pull request:

- **Accessibility** — `eslint-plugin-jsx-a11y` runs with the lint job, and `e2e/a11y.spec.ts` scans twelve flows (login in light, dark and Simplified Chinese; dashboard in both themes; users list and create dialog; user detail; roles and permission matrix; audit log; security and settings; projects board, create dialog and project detail; file library, upload drawer and preview; notification inbox and preferences; reports and the integration form) against WCAG 2.1 A/AA with axe. Any violation fails the run. The documentation site has its own axe scan in `e2e-docs/axe-full.spec.ts`.
- **Bundle size** — `pnpm size` builds the production bundle (mock API off), gzips every chunk and fails on four budgets: 180 KB of JavaScript for first paint, 115 KB for the largest lazy chunk, 800 KB for all JavaScript and 30 KB for all CSS. First paint counts the entry script _and_ every `modulepreload` tag in `dist/index.html`, together with the shell's blocking `/theme-bootstrap.js` — 27 chunks totalling 172.4 KB — because that set, not the entry file alone, is what the browser downloads before it paints. The CSS total counts the linked `/boot.css` as well.
- **Runtime budget** — `e2e/perf.spec.ts` measures first contentful paint, largest contentful paint, cumulative layout shift and request count on the dashboard. Budgets: FCP ≤ 2.5 s, LCP ≤ 3 s, CLS ≤ 0.1 and ≤ 140 requests.
- **Visual regression** — eighteen template screenshots (login, dashboard in both themes, users, permission matrix, audit log, security, settings, projects, project detail, files, reports in both themes, notifications, integrations, approval center, approval detail and dictionaries) plus eight docs baselines (home, installation, one primitive and one pro page, each in light and dark) are compared against images rendered in `mcr.microsoft.com/playwright:v1.64.1-noble`. The mock database is seeded and the tests freeze the clock, so relative dates stay stable. `e2e/visual/readme-shots.spec.ts` lives in the same run but only writes files, and only when `README_SHOTS=1`.
- **Security headers** — `e2e/security.spec.ts` checks that `/`, `/index.html`, a hashed asset and the two shell files all carry the identical header set, then walks sign-in, dashboard, users, reports, files, projects and settings with a `securitypolicyviolation` listener that must stay empty. See [docs/en/security-headers.md](docs/en/security-headers.md).
- **Documentation** — `pnpm gen-api:check` fails when the generated props tables drift from the package source, `pnpm docs:check` fails when a registry entry has no page, no demo or no translation, and `pnpm test:docs` runs the site's own Playwright suite.
- **Supply chain** — `pnpm audit --audit-level=high` fails the quality job, CodeQL analyses JavaScript and TypeScript on every push, pull request and weekly schedule, [`.github/dependabot.yml`](.github/dependabot.yml) opens grouped minor/patch and major pull requests for npm and for the actions, every workflow runs on a read-scoped token (`permissions: contents: read`), and the build job uploads the bundle it measured.

Baselines are platform-specific. Run `pnpm test:visual:docker` (Docker required) instead of `pnpm test:visual` on your machine — the local script refuses to run outside Linux — and regenerate them after an intentional UI change with `pnpm test:visual:docker --update`. The docs site has the same pair under `pnpm test:docs:visual` and `pnpm test:docs:visual:docker`.

## Connect your own backend

1. Set `VITE_API_BASE_URL=https://your-api.example.com`, and `VITE_ENABLE_MOCK=false` too if you want the dev server to stop mocking — builds already leave it off. `VITE_DOCS_URL` is optional: name a documentation deployment and the shell, the command palette and the wide login layout gain the Component docs entry.
2. Remove the mock bootstrap block in `src/main.tsx`, then delete `src/mocks` and `public/mockServiceWorker.js`.
3. Implement the endpoints in [docs/en/api-integration.md](docs/en/api-integration.md). You can keep the response shapes and adjust only the base URL while developing.
4. Enforce every permission on the server. The client checks improve UX; they do not protect your data.

If you keep the demo mock in a production build, set `VITE_ENABLE_MOCK=true` at build time and make sure `/mockServiceWorker.js` is served from the app root with a non-cached response.

## Deployment

- **Vercel** — import the repository. [`vercel.json`](vercel.json) builds `pnpm build:demo`, rewrites SPA routes and keeps the service worker revalidated. Use `pnpm build` instead if you connect a real API.
- **Docker** — `docker build -t fish-admin . && docker run --rm -p 8080:8080 fish-admin` gives an API-only image: nginx runs as uid 101 on `8080`, and no mock code ships. `docker compose up --build` is the demo path (it passes `VITE_ENABLE_MOCK=true`); add `--build-arg VITE_ENABLE_MOCK=true` to get the same image without Compose.
- **Any static host** — serve `dist/`, rewrite unknown paths to `index.html`, and do not cache `mockServiceWorker.js`.

Details and subpath notes: [docs/en/deployment.md](docs/en/deployment.md).

## Documentation

**Component documentation: <https://fish-admin-docs.vercel.app>** — 83 pages in English and Chinese, each with a live demo, the import path and the generated props table, plus the installation, quick-start and theming guides.

The pages below document the template itself:

- [Architecture](docs/en/architecture.md) — boot sequence, routing, data flow, theming and i18n.
- [RBAC](docs/en/rbac.md) — permission model, guards, adding a permission.
- [Account lifecycle](docs/en/account-lifecycle.md) — sign-up, verification, 2FA, sessions, failure screens and offline behaviour.
- [Approval center](docs/en/workflows.md) — multi-step chains, decisions, timeline and the server-side transaction a real backend owes.
- [Large tables](docs/en/tables.md) — windowing, grouped headers, pinned columns, persisted layout and the 5 000-row mock demo.
- [Dictionaries](docs/en/dictionaries.md) — two-level reference data, reference counts, protected records and what a real backend must enforce.
- [API integration](docs/en/api-integration.md) — contract, auth flow, replacing the mock.
- [Deployment](docs/en/deployment.md) — Vercel, Docker, nginx and service-worker pitfalls.
- [Security headers](docs/en/security-headers.md) — the exact CSP, what `script-src 'self'` forced in the code, and how to verify it.
- [Scaffold](docs/en/scaffold.md) — turn a clone into your own app: rebrand, drop the locales, drop the mock API.
- [中文文档](docs/zh-CN/architecture.md)

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), run `pnpm lint && pnpm typecheck && pnpm test` before opening a pull request, and follow the Conventional Commits format. Please report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](./LICENSE) © FishAdmin contributors
