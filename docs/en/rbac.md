# Role-based access control

FishAdmin demonstrates a complete client-side permission flow: navigation, routes and individual buttons all read from one registry. Use it to shape the UX around what a user may do.

> **This is not a security boundary.** Anyone can edit JavaScript in the browser, craft an API request or replay a token. The client-side checks only decide what to render. Your backend must authenticate every request and authorize every action. The mock API enforces the same permission codes so you can see the contract that a real server should implement.

## The model

Permissions use a `resource:action` format:

| Code              | What it protects                                                             |
| ----------------- | ---------------------------------------------------------------------------- |
| `dashboard:read`  | Dashboard route and KPI data                                                 |
| `user:read`       | Users route, user list and role options                                      |
| `user:create`     | "New user" button and `POST /api/users`                                      |
| `user:update`     | Edit action, `PATCH /api/users/:id` and `POST /api/users/bulk-status`        |
| `user:delete`     | Delete action, `DELETE /api/users/:id` and the bulk delete/restore endpoints |
| `role:read`       | Roles route and `GET /api/roles`                                             |
| `role:update`     | Editing a role's permissions                                                 |
| `permission:read` | Read-only permissions page                                                   |
| `demo:reset`      | Resetting the demo database                                                  |

Two areas deliberately have no permission code: `/ui` (the component playground is useful to every signed-in role) and the account pages `/profile` and `/security`, which operate on the current user only.

`src/config/permissions.ts` is the single source of truth. It exports:

- `PERMISSION_CODES` — typed constants used across the app.
- `PERMISSIONS` — display metadata (group, label and description keys) for the role editor and permissions page.
- `DEMO_ROLE_PERMISSIONS` — the initial grants for the three seeded roles.

`hasPermission()` in `src/lib/permissions.ts` supports exact matches plus two wildcards:

- `*` grants everything (used by the Administrator role).
- `resource:*` grants every action on that resource, e.g. `user:*`.

An effective permission list comes from `GET /api/auth/me`; it is not stored with the user profile. If an administrator changes a role, the next `/me` fetch reflects it — the role editor asks the user to refresh the session for this reason.

## Roles in the demo

| Role          | Permissions                                                              |
| ------------- | ------------------------------------------------------------------------ |
| Administrator | `*`                                                                      |
| Manager       | `dashboard:read`, `user:read`, `user:create`, `user:update`, `role:read` |
| Viewer        | `dashboard:read`, `user:read`                                            |

The difference is intentional and visible:

- Administrator sees every menu entry, can delete users, edit role permissions and reset demo data.
- Manager can create and edit users but not delete them, and cannot open `/permissions` or edit roles.
- Viewer sees the dashboard, the users table and nothing else; every write control is hidden.

Try opening `/permissions` while signed in as Manager: the route guard redirects to `/403` even though the URL was typed directly.

## Enforcement layers

| Layer      | Where                                     | Behaviour                                                                                                                    |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Navigation | `src/config/nav.ts` + `filterNavGroups()` | Hides entries the current user cannot use; empty groups are dropped. Breadcrumbs and the command palette read the same tree. |
| Routes     | `beforeLoad` in each leaf route           | Unauthenticated → `/login?redirect=…`; authenticated without permission → `/403`.                                            |
| UI actions | `<Can permission="...">` or `useCan()`    | Hides or disables buttons and menu items.                                                                                    |
| Server     | Mock handlers / your backend              | Returns `401` when unauthenticated and `403` when the role lacks the permission.                                             |

`_app/route.tsx` only checks that a session exists. Permission checks live in leaf routes so `/403` remains reachable for users who just failed a check.

```tsx
// src/routes/_app/users.tsx
export const Route = createFileRoute('/_app/users')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.userRead)(context)
    await ensureNamespaces(['users', 'roles'])
  },
  component: UsersPage,
})
```

For conditional rendering use the component, which accepts a fallback:

```tsx
<Can permission="user:delete" fallback={<span>Read only</span>}>
  <Button variant="destructive">Delete</Button>
</Can>
```

When you need a boolean in logic — a disabled state, a conditional column or an action handler — call `useCan()`:

```tsx
const canDelete = useCan('user:delete')
```

## Add a new permission in four steps

Say you want to add invoice management with `invoice:read`.

1. **Register the permission** in `src/config/permissions.ts`:

   ```ts
   export const PERMISSION_CODES = {
     // ...
     invoiceRead: 'invoice:read',
   } as const
   ```

   Append it to `PERMISSIONS` with a group and translation keys. If the group is new, add it to `PERMISSION_GROUPS` and provide `roles:permissionItems.*` entries in both locales. Grant it to the relevant roles in `DEMO_ROLE_PERMISSIONS`.

2. **Add a navigation item** in `src/config/nav.ts`:

   ```ts
   {
     titleKey: 'nav:items.invoices',
     to: '/invoices',
     icon: ReceiptText,
     permission: PERMISSION_CODES.invoiceRead,
   }
   ```

   Extend `AppPath` and add the `nav:items.invoices` translation.

3. **Create the route with a guard**, `src/routes/_app/invoices.tsx`:

   ```tsx
   export const Route = createFileRoute('/_app/invoices')({
     beforeLoad: (context) => requirePermission(PERMISSION_CODES.invoiceRead)(context),
     component: InvoicesPage,
   })
   ```

4. **Protect the actions** with `<Can permission={PERMISSION_CODES.invoiceRead}>` and, on the server, reject requests without the same permission.

That's all. The sidebar, breadcrumbs and command palette derive from `nav.ts`; the role editor and permissions page derive from `PERMISSIONS`.

## Guard rails in the codebase

- **Nav drift test** — `src/config/nav.test.ts` resolves every nav path against the generated route tree, so a menu item that no longer has a route fails the suite.
- **Registry validation** — the translation test checks every permission label exists in both languages.
- **Single-flight refresh** — a `401` triggers exactly one refresh request; if it fails, the session is cleared and the user is sent to login.
- **Mock 403s** — write handlers call `authorize()` before mutating data. The Playwright suite verifies that a Viewer's direct `POST /api/users` is rejected with `403`.
- **Partial bulk results** — bulk handlers check each row, not only the caller: the current user and already-deleted accounts are returned in `skipped`, so a Manager sending their own id in a bulk delete changes nothing.
- **Self-deletion** — even an Administrator cannot delete their own account; the server returns `CANNOT_DELETE_SELF`.
- **Self lock-out** — the same account cannot be deactivated or re-roled by its own owner (`CANNOT_DEACTIVATE_SELF`, `CANNOT_CHANGE_OWN_ROLE`). Without these guards an Administrator could drop themselves to Viewer and lose the permission needed to undo it, which is how a demo database gets bricked.
- **Auth state is separate from RBAC** — registration, verification, password reset, invitations and the MFA step run without any permission code, and `emailVerified`, `status` and lockout are evaluated by the mock login handler the way a real server would.

## Production checklist

1. Return the user's effective permissions from your own `/auth/me` (or a dedicated permissions endpoint).
2. Validate the token and permissions on every request. Never trust a role or permission sent by the client.
3. Keep the UI checks — they are good UX — but treat them as hints only.
4. Prefer short-lived access tokens in `httpOnly`, `Secure`, `SameSite` cookies. The demo stores tokens in `localStorage` because it has no backend; do not copy that choice for a real system.
5. Log authorization failures and review them; repeated `403`s are a useful signal.
