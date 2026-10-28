# Dictionaries and reference data

`/dictionaries` is the worked example of two-level reference data: a dictionary type on the left, its items on the right. Forms and filters read items by value, while people maintain labels, order and availability. The page edits data; it does not decide for the rest of the app what a value means.

> It is a client-side mock. The rules below are a contract demonstration, not a security boundary. A real backend must repeat every validation and run reference checks against the tables that actually store the values — see [Production notes](#production-notes).

## Where things live

| Concern        | Files                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Types          | `src/types/index.ts` (`DictionaryType`, `DictionaryItem`, `DictionaryDetail`)      |
| Client API     | `src/features/dictionaries/api.ts`, `queries.ts`                                   |
| UI             | `src/features/dictionaries/components/*`                                           |
| Route          | `src/routes/_app/dictionaries.tsx`                                                 |
| Mock rules     | `src/mocks/handlers/dictionaries.ts`, `src/mocks/seed-dictionaries.ts`             |
| Permissions    | `dictionary:read`, `dictionary:manage` in `src/config/permissions.ts`              |
| Menu and icons | `src/config/nav.ts`, `src/features/navigation/menu-icons.ts` (`book-marked`)       |
| Consumer       | `src/features/users/components/tags-editor.tsx` reads the enabled `user_tag` items |

## What the page does

- The type list is sorted by creation time, then name. The first type is selected on load, so the page never opens on an empty pane; `?` navigation does not encode selection.
- The item table shows order, label, value, usage, status and row actions. Order is persisted with an exact permutation of item ids, not by sending a partial move.
- Reordering supports dragging the handle and focusing it to press <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd>. Focus follows the row, so repeated key presses keep moving the same item.
- The status switch toggles `enabled`. Disabled items stay in the table and keep their references, but consumers must filter them out; the user profile's tag suggestions do exactly that.
- A type can be deleted only when it has no items; a seeded type cannot be deleted at all. A seeded item can be disabled, not deleted. An item that still has references returns `409 ITEM_IN_USE` on delete, and its value is immutable while referenced.
- Reference counts are what make editing safe: the type row shows the sum across its items, each item row shows active records that use it, and the item dialog locks the value input once the count is positive.

The page itself renders no menu, tab bar or permission logic beyond `canManage`; visibility and `403` handling come from the shared shell, while the mock handler re-checks the permission on every write.

## API contract

Every endpoint requires `Authorization: Bearer <access token>`. Reads need `dictionary:read`; every write needs `dictionary:manage`.

### Types

| Method   | Path                | Body / result                                         |
| -------- | ------------------- | ----------------------------------------------------- |
| `GET`    | `/dictionaries`     | `DictionaryType[]`, sorted by `createdAt` then `name` |
| `POST`   | `/dictionaries`     | `{ code, name, description? }` → `DictionaryDetail`   |
| `GET`    | `/dictionaries/:id` | Accepts an id or a code → `DictionaryDetail`          |
| `PATCH`  | `/dictionaries/:id` | `{ name?, description? }` → `DictionaryDetail`        |
| `DELETE` | `/dictionaries/:id` | `204`; rejects seeded types and non-empty types       |

`code` must match `^[a-z][a-z0-9_]{1,31}$` and is immutable after creation — the edit dialog does not render it. `name` is 1–48 characters, `description` at most 200. A duplicate code returns `409 DICTIONARY_CODE_TAKEN`. Creating, editing and deleting write `dictionary.created` / `dictionary.updated` / `dictionary.deleted` audit events with entity type `dictionary`.

### Items

| Method   | Path                              | Body / result                                |
| -------- | --------------------------------- | -------------------------------------------- |
| `POST`   | `/dictionaries/:id/items`         | `{ label, value, description? }` → detail    |
| `PATCH`  | `/dictionaries/:id/items/reorder` | `{ ids: string[] }` → detail                 |
| `PATCH`  | `/dictionaries/:id/items/:itemId` | `{ label?, value?, description?, enabled? }` |
| `DELETE` | `/dictionaries/:id/items/:itemId` | `204`; rejects seeded and referenced items   |

`label` is 1–40 characters, `value` must match `^[a-z0-9][a-z0-9_-]{0,31}$`, and both are unique within a type, case-insensitively. New items are appended with `sortOrder = length` and are enabled by default.

`reorder` requires the full set of item ids, each exactly once; anything else returns `400 VALIDATION_ERROR`. It rewrites `sortOrder` for every item and stamps the type's `updatedAt`.

Unknown ids return `404 DICTIONARY_NOT_FOUND` / `404 ITEM_NOT_FOUND`.

### Shapes

```ts
interface DictionaryType {
  id: string
  code: string
  name: string
  description: string
  isSystem: boolean
  itemCount: number
  referenceCount: number
  createdAt: string
  updatedAt: string
}

interface DictionaryItem {
  id: string
  dictionaryId: string
  label: string
  value: string
  description: string
  sortOrder: number
  enabled: boolean
  isSystem: boolean
  referenceCount: number
  createdAt: string
  updatedAt: string
}

interface DictionaryDetail {
  dictionary: DictionaryType
  items: DictionaryItem[]
}
```

`isSystem` marks shipped records, not permission. The UI uses it to hide delete actions; the handler enforces it independently.

## Reference counts, precisely

The mock counts a reference by scanning live records that store the item's **value**:

- Only the `user_tag` dictionary is wired into a demo screen. Its count is the number of non-deleted users whose `tags` contain the item value.
- Every other type returns `0`, and the page says so: "stored for reference; not consumed by a demo screen yet". That is intentional — a number invented from nowhere would teach adopters to trust a meaningless guard.
- A type's `referenceCount` is the sum of its items' counts.

When you add your own dictionary, implement the count in `countReferences` in the mock and, more importantly, in the backend that owns the records. The invariant is one-directional: **editing a value must fail while any row still stores the old value**, otherwise existing records silently point at a label that no longer exists. Disabling is the supported alternative because it hides the option without breaking history.

The user profile consumes enabled items only:

```ts
const { data: suggestions = [] } = useDictionaryOptionsQuery('user_tag')
// select enabled items from GET /dictionaries/user_tag → { label, value }[]
```

Seeded tags are also pre-filled by the profile; suggestions exclude values the user already has.

## Data and the mock database

The mock database version is `6`. The migration from v5 adds `dictionaryTypes` and `dictionaryItems` with the shipped seed, preserving users, roles, sessions, workspace data and workflows. Older stores chain through v4 → v5 → v6. A payload missing either array is treated as incompatible and reset to the seed. Clearing `fish-admin:db:v1` from `localStorage` restores the factory state.

The seed contains three system types: `user_tag` (seven items), `expense_category` (five) and `approval_priority` (four). Types carry distinct creation timestamps so the default selection is stable.

## Production notes

- **Validate uniqueness inside a transaction (or with a unique index).** Two clients creating `priority` at once must not both succeed. The mock's `toLowerCase()` comparison is a stand-in for a case-insensitive index.
- **Count references against real tables.** A count is a query over every consumer, not a cached number. If the count is expensive, store it in the same transaction that writes the referencing row.
- **Reorder atomically.** Accepting an arbitrary subset invites duplicate positions; require the complete id list (as the contract does) and write it in one transaction. Concurrent reorders should compare a version or timestamp.
- **Keep values immutable once referenced.** Renaming a label is safe; changing a value rewrites the meaning of existing records. If the business genuinely needs a migration, make it an explicit data migration, not a dictionary edit.
- **Prefer disable over delete.** History and audit entries point at values. Hard deletes should be reserved for never-used items.
- **Audit writes.** The mock logs type-level events; a real system should record which item changed and from what, especially for value changes.
- **Scope reads by tenancy.** The mock returns every type to any session with `dictionary:read`. A multi-tenant backend usually scopes dictionaries per organization and may mark some types global.
- **Client-side RBAC is a UX layer only.** Hiding "New item" or a delete button prevents confusion; it does not prevent requests. See [RBAC](./rbac.md).

## Testing

- `e2e/dictionaries.spec.ts` — admin reorders and reloads, creates an item, sees it as a tag suggestion on `/users/user-admin`, renames it, sees the new label, disables it and sees the suggestion disappear; viewer can read but has no create/edit controls and cannot toggle.
- `src/mocks/db/migrate.test.ts` — v5 → v6 adds the seed and keeps existing data; v4 → v6 chains through both migrations.
- `packages/ui/src/registry.test.ts` — `switch` declares `/dictionaries` as its `usedIn`, so the docs page keeps pointing at a route that exists.
- Visual baseline — `dictionaries.png` (selected type, reorder handles and reference badges).
