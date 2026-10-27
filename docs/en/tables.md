# Large tables

`ProTable` is the shell every business list uses. This page covers the three capabilities added in
1.7.0 — windowed rows, grouped headers and column pinning — and the mock-only 5 000-row demo.

Virtualization is **opt-in**. `/users` and `/workflows` turn it on; every other table keeps the
default all-rows render, so a six-row list does not pay for a scroll container it never needs.

## Windowed rows

```tsx
<ProTable
  virtualized
  virtualRowHeight={64}
  virtualMaxHeight={800}
  scrollLabel={t('users:tableRegion')}
  table={table}
  /* … */
/>
```

- Rows are fixed height. Supply `virtualRowHeight` that fits the tallest cell; content that needs
  two lines must fit inside it, because the table uses that value for spacer rows and scroll math.
- The container caps at `virtualMaxHeight` and owns the scroll. `ui/table.tsx` accepts
  `container={false}` so the table does not nest a second scroll box.
- Six rows of overscan stay mounted above and below the viewport. The React table still holds every
  row model entry; only the DOM is windowed.
- Headers stick: the group row at `top: 0`, the leaf header at `top: 32px`. Sticky headers need an
  opaque background, so virtualized tables use `bg-muted` instead of the translucent default.
- Only virtualized tables render a `<colgroup>`. Fixed layout needs those widths for pinned offsets
  to line up; auto layout elsewhere stays untouched.
- The scroll container is focusable (`tabIndex={0}`) and exposes the label passed in
  `scrollLabel` as a `region`, so keyboard users can scroll it and screen readers can find it.
  Virtualized tables also set `aria-rowcount` (including header rows) and `aria-rowindex` on body
  rows.
- A change in the first/last row id resets the scroll position. Paging, filtering and sorting
  therefore start at the top instead of leaving the viewport on an empty spacer.

## Grouped headers

Give every leaf column `meta.group` and `meta.groupLabel`:

```ts
meta: {
  label: t('users:columns.status'),
  group: 'access',
  groupLabel: t('users:columnGroups.access'),
}
```

Adjacent visible columns with the same `group` become one run. The header row is derived on every
render, so hiding, reordering or resizing columns updates the spans without extra state. If **any**
visible leaf lacks a group, `DataTable` renders no group row at all — this is what keeps the other
pages unchanged. A group split by reordering becomes two runs with the same label.

The group row is rendered from `table.getVisibleLeafColumns()`, not from a second table instance.
A run is pinned only when every column in it shares the same pinning; otherwise its columns pin
individually and the group label scrolls with the content.

## Pinning and layout persistence

Pinning uses TanStack's built-in column pinning:

```ts
initialState: {
  columnPinning: {
    left: ['select', 'name']
  }
}
```

Pinned cells get `position: sticky` and the offset from `column.getStart('left')`. The users page
persists visibility, order and sizing under `fish-admin:users-table-layout`:

```json
{ "visibility": { "department": false }, "order": ["…"], "sizing": { "name": 310 } }
```

The layout is read once when the page mounts and written after every change. Invalid or partial
payloads fall back to defaults; blocked storage only loses persistence for the session. Resizing
writes through `onColumnSizingChange`, so the existing **Columns** popover keeps working.

## The 5 000-row demo dataset

Open `/users?dataset=large`. This is a mock-only affordance:

- The route validator forces `pageSize=5000` and hides pagination in this mode. The badge in the
  toolbar and the `aria-rowcount` both reflect 5 000 rows.
- Rows are generated **in memory** by `src/mocks/db/synthetic-users.ts` with a fixed faker seed.
  They are not written into `localStorage` and not added to the seed database; the regular list
  still returns stored users only.
- Bulk status, delete and restore work against the in-memory array and reset on reload. Every other
  mutation still targets the stored database, so do not treat these rows as durable records.
- The E2E suite asserts that at most 80 body rows exist in the DOM, scrolls to the last synthetic
  row, selects it and changes its status through the bulk bar.

Removing `dataset=large` from the URL returns to the normal paginated list.

## What a real backend owes

Virtualization is a rendering strategy, not a data-query strategy.

- Do not return 5 000 rows in one response. Page with an offset or keyset cursor, and filter and
  sort on the server; the mock's single-page shortcut exists only to make the volume visible.
- Send an accurate total (or `hasMore`) so the scroll bar and `aria-rowcount` are honest.
- Keep authorization per record. A wide table is still a list of records the caller may read.
- Bulk endpoints need explicit limits. The mock caps a selection at 100 ids; a real service should
  validate ownership, report per-id failures and write an audit entry per state change.

## Testing checklist

- `e2e/users-large-dataset.spec.ts` — 5 000 rows, ≤ 80 rendered body rows, scroll to the end,
  select and bulk-update.
- `e2e/users-bulk.spec.ts` — pinned column, resize, and the width surviving a reload.
- `e2e/users-columns.spec.ts` — reorder/visibility survive a reload.
- `e2e/workflows.spec.ts` — the grouped, pinned and virtualized approval queue, including the
  Chinese queue/detail flow.
- Visual baselines cover `/users` and `/workflows`; both now include the group header row.
