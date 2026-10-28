# M3 — 模板收口与发布 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the docs site the single front door — delete the template's in-app component catalog, point the template's menu and README at `@fish-admin/react`'s documentation, and version the result for release.

**Architecture:** The 83-component registry moves out of the template into `packages/ui/registry.json`, which becomes the shared source of truth for the package check, the API docgen and the docs structure gate. The template then loses `/components` and `/ui`; a new `VITE_DOCS_URL` seam drives an external sidebar entry, a login-page link and the retired routes' redirects. README, `index.html` meta and re-taken screenshots reposition the project as "component library + template".

**Tech Stack:** React 19.3.1, Vite 8.3.4, TanStack Router (file-based, generated `routeTree.gen.ts`), TypeScript 5.9.3, Vitest + Testing Library, Playwright 1.64.1 (Linux baselines in `mcr.microsoft.com/playwright:v1.64.1-noble`), Rspress 2.0.23, pnpm 9.1.1 workspace.

**Spec:** [docs/plans/component-library.md](../../plans/component-library.md) — section `M3 — 模板收口与发布（1–1.5 周）`. Read it alongside this plan; the acceptance list at the end of that section is the gate.

## Global Constraints

- **External actions need separate approval.** `npm publish`, creating the Vercel docs project, pushing `main` or tags, GitHub Release, and repo description/topics are never executed as part of a task. Task 10 lists them; stop and ask.
- **RBAC is never a security boundary.** Every user-facing surface touched in this plan (README both languages, login page, docs pages) must keep or add the client-side caveat.
- **Bilingual parity.** Anything added to `src/locales/en/**` gets the `src/locales/zh-CN/**` twin in the same commit; the same goes for `docs/en/**` ↔ `docs/zh-CN/**` and `apps/docs/docs/en/**` ↔ `apps/docs/docs/zh/**`.
- **No new runtime dependency.** Nothing in `package.json` → `dependencies`, and nothing in `packages/ui/package.json` → `dependencies`/`peerDependencies`.
- **Bundle budgets do not move:** `firstPaintJs` 180 KB, `largestAsyncJs` 115 KB, `totalJs` 800 KB, `totalCss` 30 KB ([scripts/check-bundle-size.mjs:6-11](../../../scripts/check-bundle-size.mjs#L6-L11)). `src/config/env.ts` is inside the first-paint graph — keep new validation hand-rolled there.
- **The spec's `172.4 + 1 KB` first-paint ceiling is stale.** M0 measured 174.4 KB and kept the 180 KB gate; M3 must not exceed 174.4 KB, and must record the deviation rather than silently restate the old number.
- **Commits** follow Conventional Commits (`feat`/`refactor`/`docs`/`test`/`chore`/`ci`); `!` marks the breaking route removal. Never `--no-verify`.
- **Verify UI in a real browser** (Playwright or the logged-in ego session) before marking a UI task done; type checks are not evidence a screen works.

## File Structure

Created:

- `packages/ui/registry.json` — the 83-entry component inventory (id, name, category, usedIn, isNew).
- `packages/ui/src/registry.test.ts` — inventory ↔ package barrel lock-step.
- `src/config/site.ts` — the only module that knows the docs URL exists.
- `src/config/site.test.ts` — env seam, nav item, legacy mapping.
- `src/components/layout/nav-item-link.tsx` — one internal/external anchor renderer shared by the four nav surfaces.
- `src/components/layout/nav-item-link.test.tsx` — link semantics for the external item.
- `e2e/docs-link.spec.ts` — the shipped build shows no external item and the retired routes 404.
- `e2e/visual/readme-shots.spec.ts` — the four README screenshots, Docker-rendered.
- `apps/docs/public/screenshots/` — the single copy of the screenshots.

Deleted (Task 2): `src/routes/_app/components.tsx`, `src/routes/_app/ui.tsx`, `src/config/components.ts`, `src/config/components.test.ts`, all nine files under `src/features/playground/`, `src/locales/{en,zh-CN}/{catalog,ui}.json`, `e2e/components-catalog.spec.ts`, `e2e/ui-playground.spec.ts`, `e2e/visual/__screenshots__/pages.spec.ts/components-linux.png`.

Modified: the three registry consumers under `scripts/` and `apps/docs/scripts/`, `src/config/{nav,env}.ts`, `src/lib/permissions.ts`, `src/features/navigation/{resolve,queries}.ts`, the four nav surfaces, `src/mocks/menu.ts`, `src/routes/_app/$.tsx`, `src/features/auth/components/auth-shell.tsx`, `scripts/scaffold.mjs` (+ its test), `scripts/gen-api.mjs`, `.env.example`, `README.md`, `README.zh-CN.md`, `index.html`, `package.json`, `CHANGELOG.md`, `docs/{en,zh-CN}/*.md`, `apps/docs/docs/{en,zh}/versions.md`, `apps/docs/template-index/{en,zh}.md`, `e2e/{a11y,security}.spec.ts`, `e2e/visual/pages.spec.ts`, `CONTRIBUTING.md`.

---

### Task 1: Move the component registry into the package

The registry currently lives at [src/config/components.ts](../../../src/config/components.ts) and is regex-parsed by three scripts. M3 deletes that file's only consumers (the playground), so the inventory has to move first or the docs pipeline dies with it.

**Files:**

- Create: `packages/ui/registry.json`
- Create: `packages/ui/src/registry.test.ts`
- Modify: `scripts/gen-api.mjs:8` and `scripts/gen-api.mjs:61-83`
- Modify: `scripts/check-package.mjs:33-34`
- Modify: `apps/docs/scripts/check-docs.mjs:52-69`
- Test: `packages/ui/src/registry.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `packages/ui/registry.json` — `{ version: 1, components: Array<{ id, name, category, usedIn, isNew? }> }`, grouped by category (`primitive` → `enterprise` → `pro`) and sorted by `id` inside each group, which is the exact order `src/config/components.ts` emits today, so `apps/docs/generated/*` stays byte-identical. Every script that needs the inventory reads this one file. `src/config/components.ts` keeps working until Task 2 deletes it.

- [x] **Step 1: Generate the JSON from the current TS source**

The parser already exists in [apps/docs/scripts/check-docs.mjs:53-68](../../../apps/docs/scripts/check-docs.mjs#L53-L68); reuse it so the JSON cannot drift from what `gen-api` produces today. Sort by _first-appearance_ category, then id — a global id sort would reorder `generated/registry.json` and fail Step 4. Run from the repo root:

```bash
node --input-type=module -e "
import fs from 'node:fs'
const source = fs.readFileSync('src/config/components.ts', 'utf8')
const block = source.slice(source.indexOf('export const COMPONENTS'), source.indexOf('export const COMPONENT_COUNTS'))
const components = [...block.matchAll(/\{([^}]*)\}/g)].map((match) => {
  const get = (key) => (match[1].match(new RegExp(key + \": '([^']*)'\")) || [])[1]
  return {
    id: get('id'),
    name: get('name'),
    category: get('category'),
    usedIn: get('usedIn'),
    ...( /isNew: true/.test(match[1]) ? { isNew: true } : {} ),
  }
}).filter((entry) => entry.id && entry.name && entry.category && entry.usedIn)
if (components.length !== 83) throw new Error('Expected 83 entries, got ' + components.length)
const groupOrder = []
for (const entry of components) if (!groupOrder.includes(entry.category)) groupOrder.push(entry.category)
components.sort((a, b) => groupOrder.indexOf(a.category) - groupOrder.indexOf(b.category) || a.id.localeCompare(b.id))
fs.writeFileSync('packages/ui/registry.json', JSON.stringify({ version: 1, components }, null, 2) + '\n')
console.log('wrote', components.length, 'entries')
"
```

Expected: `wrote 83 entries`. Spot-check the first entry with `head -12 packages/ui/registry.json` — `accordion`, `primitive`, `usedIn: /projects/$id`, no `demo` key.

- [ ] **Step 2: Write the failing package test**

Create `packages/ui/src/registry.test.ts`. The JSON is read with `readFileSync` so the test does not depend on `resolveJsonModule`, and the barrel is imported as the consumer would. Resolve the path with `join(import.meta.dirname, ...)`, not `new URL(..., import.meta.url)`: the jsdom environment replaces the global `URL`, so a relative URL resolves against `http://localhost:3000/` and `fileURLToPath` throws.

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import * as ui from './index'

interface RegistryEntry {
  id: string
  name: string
  category: 'primitive' | 'enterprise' | 'pro'
  usedIn: string
  isNew?: boolean
}

// jsdom replaces the global URL, so `new URL('../registry.json', import.meta.url)`
// would resolve against the document base; join against the real module dir instead.
const registry = JSON.parse(readFileSync(join(import.meta.dirname, '../registry.json'), 'utf8'))
  .components as RegistryEntry[]

// Registry ids -> export names; these four ids do not map by PascalCase.
const EXPORT_NAME_OVERRIDES: Record<string, string> = {
  chart: 'ChartContainer',
  'input-otp': 'InputOTP',
  resizable: 'ResizablePanelGroup',
  sonner: 'Toaster',
}

function exportNameFor(id: string) {
  return (
    EXPORT_NAME_OVERRIDES[id] ??
    id
      .split('-')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join('')
  )
}

describe('component registry', () => {
  it('tracks 83 shared components across three layers', () => {
    expect(registry).toHaveLength(83)
    const counts = registry.reduce(
      (acc, entry) => ({ ...acc, [entry.category]: (acc[entry.category] ?? 0) + 1 }),
      {} as Record<string, number>,
    )
    expect(counts).toEqual({ primitive: 47, enterprise: 30, pro: 6 })
  })

  it('keeps ids and names unique and kebab-cased', () => {
    const ids = registry.map((entry) => entry.id)
    const names = registry.map((entry) => entry.name)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    for (const entry of registry) expect(entry.name.trim()).not.toBe('')
  })

  it('publishes every component from the package barrel', () => {
    const exports = ui as Record<string, unknown>
    for (const entry of registry) {
      const name = exportNameFor(entry.id)
      expect(exports[name], `${entry.id} should export ${name}`).toBeTruthy()
    }
  })

  it('points every component at an absolute template route', () => {
    for (const entry of registry) {
      expect(entry.usedIn, `${entry.id} usedIn`).toBeTruthy()
      expect(entry.usedIn.startsWith('/'), `${entry.id} usedIn`).toBe(true)
      // The in-app catalog is gone; nothing may point at it again.
      expect(entry.usedIn, `${entry.id} usedIn`).not.toMatch(/^\/(components|ui)(\/|$)/)
    }
  })

  it('groups by layer and sorts by id so manifests stay stable', () => {
    const LAYER_ORDER = { primitive: 0, enterprise: 1, pro: 2 } as const
    const expected = [...registry].sort(
      (a, b) => LAYER_ORDER[a.category] - LAYER_ORDER[b.category] || a.id.localeCompare(b.id),
    )
    expect(registry.map((entry) => entry.id)).toEqual(expected.map((entry) => entry.id))
  })
})
```

- [x] **Step 3: Run it to verify it passes against the new JSON**

Run: `pnpm --filter @fish-admin/react test src/registry`
Measured: PASS, 5 tests.

- [x] **Step 4: Repoint `scripts/gen-api.mjs`**

Replace the path constant at [scripts/gen-api.mjs:8](../../../scripts/gen-api.mjs#L8) and the whole `readRegistry` body (lines 61-83) with a JSON read. The generated `apps/docs/generated/registry.json` must stay byte-identical, so keep the field order `{ id, name, category, usedIn, isNew }`:

```js
const registryPath = path.join(repoRoot, 'packages/ui/registry.json')
```

```js
function readRegistry() {
  const { components } = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
  return components.map((entry) => ({
    id: entry.id,
    name: entry.name,
    category: entry.category,
    usedIn: entry.usedIn,
    isNew: entry.isNew === true,
  }))
}
```

Run: `pnpm gen-api` then `git diff --stat apps/docs/generated`
Measured: no diff; coverage stayed at `78.80% (floor 78.70%)`.

- [x] **Step 5: Repoint `scripts/check-package.mjs`**

At [scripts/check-package.mjs:33-34](../../../scripts/check-package.mjs#L33-L34) replace the regex read:

```js
const registry = fs.readFileSync(path.join(root, 'src/config/components.ts'), 'utf8')
const ids = [...registry.matchAll(/^\s+id: '([^']+)'/gm)].map((match) => match[1])
```

with:

```js
const { components } = JSON.parse(
  fs.readFileSync(path.join(root, 'packages/ui/registry.json'), 'utf8'),
)
const ids = components.map((entry) => entry.id)
```

Run: `pnpm check:package`
Measured: `check-package: 83 component exports verified`.

- [x] **Step 6: Repoint `apps/docs/scripts/check-docs.mjs`**

Replace `extractRegistry()` ([apps/docs/scripts/check-docs.mjs:52-69](../../../apps/docs/scripts/check-docs.mjs#L52-L69)) with the same JSON read, keeping the returned shape the rest of the file already expects:

```js
function extractRegistry() {
  const { components } = readJson(path.join(repoRoot, 'packages/ui/registry.json'))
  return components.map((entry) => ({
    id: entry.id,
    name: entry.name,
    category: entry.category,
    usedIn: entry.usedIn,
    isNew: entry.isNew === true,
  }))
}
```

Also update the failure copy in `checkRegistry()` at line 73, which still names the old file:

```js
if (source.length !== 83)
  fail(`packages/ui/registry.json has ${source.length} entries, expected 83`)
```

Run: `pnpm docs:check`
Measured: `docs:check passed: 83 registry entries, 83 documented components, 167 demos, 20 template pages`.

- [x] **Step 7: Prove the gate still catches drift**

Temporarily change one `name` in `packages/ui/registry.json` to `Accordionx`, run `pnpm docs:check`, and confirm it fails with `generated/registry.json is stale; run pnpm gen-api`. Revert the edit and re-run to green. This is the check that the relocation did not quietly sever the lock-step.

Measured: the injected drift failed with exactly `::error::generated/registry.json is stale; run pnpm gen-api`; regenerating the JSON from `src/config/components.ts` restored green.

- [x] **Step 8: Run the surrounding gates and commit**

```bash
pnpm format:check && pnpm lint && pnpm typecheck
pnpm --filter @fish-admin/react test
pnpm gen-api:check && pnpm docs:check && pnpm check:package
git add packages/ui/registry.json packages/ui/src/registry.test.ts \
  scripts/gen-api.mjs scripts/check-package.mjs apps/docs/scripts/check-docs.mjs
git commit -m "refactor(ui): move the component registry into the package"
```

Expected: every command exits 0 and `src/config/components.ts` is untouched — Task 2 removes it.
Measured: format/lint/typecheck green (one pre-existing `react-refresh` warning in `apps/docs/theme/index.tsx`), 165 package tests across 43 files pass, and the three generators/checks stayed green.

---

### Task 2: Delete the in-app catalog and the UI playground

Nine playground files, two routes, 2 800 lines of catalog-only locale strings and two Playwright specs go away. The sidebar loses two entries, which invalidates every template visual baseline that shows the sidebar — those are re-recorded here, not in a later task.

**Files:**

- Delete: `src/routes/_app/components.tsx`, `src/routes/_app/ui.tsx`, `src/config/components.ts`, `src/config/components.test.ts`, `src/features/playground/` (9 files), `src/locales/en/{catalog,ui}.json`, `src/locales/zh-CN/{catalog,ui}.json`, `e2e/components-catalog.spec.ts`, `e2e/ui-playground.spec.ts`, `e2e/visual/__screenshots__/pages.spec.ts/components-linux.png`
- Modify: `src/config/nav.ts:1-21,25-43,58-85`, `src/mocks/menu.ts:1-22`, `src/routeTree.gen.ts` (generated), `e2e/a11y.spec.ts:212-225`, `e2e/security.spec.ts:60`, `e2e/visual/pages.spec.ts:95-102`, `src/config/nav.test.ts:122`, `src/mocks/menu.test.ts:31-35`, `src/features/navigation/resolve.test.ts:55-56`, `src/features/navigation/menu-access.test.ts:56,65,79`, `src/stores/ui-store.test.ts:94,97`, `scripts/scaffold.mjs`, `scripts/scaffold.test.mjs`

**Interfaces:**

- Consumes: `packages/ui/registry.json` from Task 1 (the scripts no longer read `src/config/components.ts`).
- Produces: `AppPath` without `'/ui'` and `'/components'`; `NAV_GROUPS` with 21 items instead of 23; no `WILDCARD_ONLY_PATHS` in the mock menu. Task 3 adds the external nav type on top of this shape, so do not introduce `href` here.

- [ ] **Step 1: Confirm nothing outside the deletion set imports it**

```bash
grep -rn "features/playground\|config/components\|locales/.*catalog.json\|'/ui'\|'/components'" \
  src e2e scripts --include=*.ts --include=*.tsx --include=*.mjs | grep -v "^src/features/playground/"
```

Expected: only the files listed under **Files:** above. `src/routeTree.gen.ts` hits are generated output. Anything else is a live dependency — resolve it before deleting rather than after.

- [ ] **Step 2: Delete the subsystem**

```bash
git rm -r src/features/playground src/routes/_app/components.tsx src/routes/_app/ui.tsx \
  src/config/components.ts src/config/components.test.ts \
  src/locales/en/catalog.json src/locales/en/ui.json \
  src/locales/zh-CN/catalog.json src/locales/zh-CN/ui.json \
  e2e/components-catalog.spec.ts e2e/ui-playground.spec.ts \
  e2e/visual/__screenshots__/pages.spec.ts/components-linux.png
```

- [ ] **Step 3: Drop the nav entries and their icons**

In [src/config/nav.ts](../../../src/config/nav.ts): remove `Boxes,` (line 12) and `Palette,` (line 12-ish import block), delete the `| '/ui'` and `| '/components'` members of `AppPath` (lines 27-28), and delete the two `NAV_GROUPS` overview entries (lines 74-83). The `nav:items.ui` / `nav:items.components` locale keys stay for now — Step 4 removes them with their only readers.

- [ ] **Step 4: Remove the nav locale keys in both languages**

Delete the `"ui"` and `"components"` lines from `items` in [src/locales/en/nav.json:11-12](../../../src/locales/en/nav.json#L11-L12) and `src/locales/zh-CN/nav.json:11-12`. `src/lib/locales.test.ts:59-88` compares namespace sets between languages, so both files must change in the same commit.

- [ ] **Step 5: Delete the mock menu's admin-only special case**

In [src/mocks/menu.ts](../../../src/mocks/menu.ts) remove the `WILDCARD_ONLY_PATHS` constant, its explanatory comment (lines 5-11) and the guard at line 14. `toRoute` becomes:

```ts
function toRoute(item: NavItem): MenuRoutePayload {
  return {
    titleKey: item.titleKey,
    path: item.to,
    icon: iconNameFor(item.icon) ?? 'circle-dot',
    ...(item.permission ? { permission: item.permission } : {}),
  }
}
```

Update the two call sites that pass the now-unused `wildcard` argument, and re-read the comment above `buildMenuPayload` — it still describes pages only the wildcard role sees, which is no longer true.

- [ ] **Step 6: Regenerate the route tree**

`src/routeTree.gen.ts` is generated by the TanStack Router plugin during a build:

```bash
pnpm build > /tmp/route-tree-regen.log 2>&1; tail -5 /tmp/route-tree-regen.log
git diff --stat src/routeTree.gen.ts
```

Expected: the diff removes the `components` and `ui` route ids and their imports. If the build fails on a stale reference, that reference is a Step 1 miss — fix it, do not hand-edit the generated file.

- [ ] **Step 7: Fix the unit tests that used the deleted paths**

- `src/config/nav.test.ts:122` uses `findNavItem('/ui', withChildren)` as its "not in the menu" probe — switch it to `'/nope'`.
- `src/mocks/menu.test.ts:31-35` (`keeps the design-system pages on the full-access role only`) has no subject left; delete the whole test.
- `src/features/navigation/resolve.test.ts:55-56` asserts the fallback menu `toContain('/components')` — retarget it at `'/projects'` and fix the comment.
- `src/features/navigation/menu-access.test.ts:65,79` redirect `/components` to `/403`/`undefined`; retarget both at `/reports` (a managed path a viewer lacks) and re-check the comment at line 56.
- `src/stores/ui-store.test.ts:94,97` only uses the string as an opaque tab path; rename to `'/reports'` so the fixture stops implying a live route.

Run: `pnpm test -- src/config src/mocks src/features/navigation src/stores`
Expected: PASS.

- [ ] **Step 8: Fix the Playwright specs that visited them**

- Delete the whole `test('component catalog and ui playground', ...)` block at [e2e/a11y.spec.ts:212-225](../../../e2e/a11y.spec.ts#L212-L225).
- In [e2e/security.spec.ts:60](../../../e2e/security.spec.ts#L60) replace `'/components'` with `'/projects'` in the CSP crawl list.
- Delete `test('component catalog hero', ...)` at [e2e/visual/pages.spec.ts:95-102](../../../e2e/visual/pages.spec.ts#L95-L102).

- [ ] **Step 9: Remove the scaffold's catalog option**

`pnpm scaffold --catalog=strip` no longer has anything to strip, so the option, its step and its anchors all go. In [scripts/scaffold.mjs](../../../scripts/scaffold.mjs):

- Delete `CATALOG_DELETIONS` (lines 478-487) and the whole `catalogStep` function (lines 489-534).
- Delete the `PLAN_STEPS` entry `{ id: 'catalog', ... }` (lines 874-879).
- Delete `catalog: input.catalog ?? 'keep',` from `buildOptions` (line 914) and `catalog: 'strip',` from `checkPlan` (line 963).
- `PLAN_VARIANTS` (lines 978-982): drop `catalog: 'keep'` from the first variant's overrides and relabel the second variant `'locale strip, mock kept'`.
- Delete `'catalog'` from `VALUE_FLAGS` (line 992), the `choice('catalog', ...)` line (1051) and its `catalog: catalog ?? 'keep'` (1058), the interactive question (line 1095) and its `catalog,` entry (1109), the `Catalog:` summary line (1119), the `if (options.catalog === 'strip')` route-tree regeneration (1196-1198) and next-steps hint (1218-1222), and the `--catalog=keep|strip` help line (1246).
- Keep `regenerateRouteTree` itself only if another step still calls it; if `catalogStep` was its sole caller, delete the function and its imports too, and confirm with `grep -n regenerateRouteTree scripts/scaffold.mjs`.

In [scripts/scaffold.test.mjs](../../../scripts/scaffold.test.mjs) remove the `--catalog=yes` rejection case (lines 78-79) and any `catalog` key in the option fixtures (lines 34, 68, 87, 97-100).

Run: `pnpm test -- scripts/scaffold.test.mjs`
Expected: PASS. Then `node scripts/scaffold.mjs --plan` (or the documented plan-check entry point) to confirm every remaining anchor still matches the trimmed template.

- [ ] **Step 10: Run the template gates**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
pnpm docs:check && pnpm gen-api:check && pnpm check:package
```

Expected: all green. `docs:check` still reports 83 registry entries because it now reads the package JSON.

- [ ] **Step 11: Re-record the template visual baselines**

The sidebar shrank by two entries, so every full-page baseline that renders it changes. Inside Docker:

```bash
pnpm test:visual:docker --update
pnpm test:visual:docker
```

Expected: 16 tests pass, second run reports zero diff. `git status` should show 16 modified `*-linux.png` files under `e2e/visual/__screenshots__/pages.spec.ts/` and the deleted `components-linux.png`. Review at least `dashboard-light-linux.png` and `users-linux.png` by eye before committing — the sidebar must end at `Reports` in the Overview group.

- [ ] **Step 12: Run the full e2e suite**

```bash
pnpm test:e2e --workers=1
```

Expected: 85 − 8 (the two deleted specs) = 77 passed. If the count differs, recount the deleted specs' tests before assuming a regression.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "refactor(template)!: remove the in-app component catalog"
```

Body should name what adopters must do: delete `src/features/playground`, drop the two nav entries, and link the docs site instead.

---

### Task 3: Put the docs URL behind an env seam and into the menu

`VITE_DOCS_URL` becomes the one switch for everything docs-related in this plan: the sidebar entry, the login link (Task 5) and the retired-route redirects (Task 4). Unset means none of them render, so a scaffolded copy never links to FishAdmin's documentation.

**Files:**

- Create: `src/config/site.ts`, `src/config/site.test.ts`, `src/components/layout/nav-item-link.tsx`, `src/components/layout/nav-item-link.test.tsx`
- Modify: `src/config/env.ts:37-53`, `src/config/env.test.ts:14-28`, `src/config/nav.ts:25-51,183-223`, `src/lib/permissions.ts:15-21`, `src/features/navigation/resolve.ts:12-32,49-57`, `src/components/layout/{app-sidebar,app-top-nav,app-subnav,command-menu,app-tabs}.tsx`, `src/locales/{en,zh-CN}/nav.json`, `.env.example`
- Test: `src/config/site.test.ts`, `src/components/layout/nav-item-link.test.tsx`, `src/features/navigation/resolve.test.ts`, `src/config/nav.test.ts`

**Interfaces:**

- Consumes: `NavItem` shape from Task 2 (no external members yet).
- Produces:
  - `env.docsUrl: string | undefined` (no trailing slash).
  - `docsNavItem(): ExternalNavItem | undefined` in `src/config/site.ts`.
  - `docsUrlFor(pathname: string): string | undefined` in `src/config/site.ts` (used by Task 4).
  - `isExternalNavItem(item): item is ExternalNavItem`, `internalNavItems(items): InternalNavItem[]`, `flattenInternalNavItems(groups): InternalNavItem[]` in `src/config/nav.ts`.
  - `<NavItemLink item={...} />` shared by the nav surfaces.

- [ ] **Step 1: Write the failing env test**

Append to [src/config/env.test.ts](../../../src/config/env.test.ts) using that file's existing `loadEnv()` + `vi.stubEnv` helpers:

```ts
it('treats an unset or blank docs URL as no docs site', async () => {
  await expect(loadEnv()).resolves.toMatchObject({ docsUrl: undefined })

  vi.stubEnv('VITE_DOCS_URL', '   ')
  await expect(loadEnv()).resolves.toMatchObject({ docsUrl: undefined })
})

it('keeps only an absolute docs URL and drops its trailing slash', async () => {
  vi.stubEnv('VITE_DOCS_URL', ' https://docs.acme.test/guide/ ')
  await expect(loadEnv()).resolves.toMatchObject({ docsUrl: 'https://docs.acme.test/guide' })

  vi.stubEnv('VITE_DOCS_URL', 'docs.acme.test')
  await expect(loadEnv()).rejects.toThrow(/VITE_DOCS_URL/)
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- src/config/env.test.ts`
Expected: FAIL — `docsUrl` is `undefined` in the first case only by accident, and the second case throws nothing because the variable is unknown.

- [ ] **Step 3: Parse the variable in `env.ts`**

Add the helper above the `env` object, then the field. Keep it hand-rolled: this module is in the first-paint graph and must not import `zod`.

```ts
// A relative value would resolve against the app origin and render a broken
// external link, so anything without a scheme is a configuration mistake.
function readHttpsUrl(label: string, value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Invalid ${label}="${value}" — expected an absolute http(s) URL.`)
  }
  return trimmed.replace(/\/+$/, '')
}
```

```ts
export const env = {
  apiBaseUrl,
  docsUrl: readHttpsUrl('VITE_DOCS_URL', import.meta.env.VITE_DOCS_URL),
  // ...the rest unchanged
} as const
```

`src/config/env.test.ts:14-28` asserts the whole object with `toEqual`, so add `docsUrl: undefined` to that literal in the same edit.

- [ ] **Step 4: Document the variable**

Append to [.env.example](../../../.env.example):

```text
# Absolute URL of the component documentation site. Unset hides the "Component docs"
# menu entry, the login-page link, and the redirects for the retired /components and
# /ui routes. Set it to your own deployment, or to https://fish-admin-docs.vercel.app.
VITE_DOCS_URL=
```

- [ ] **Step 5: Write the failing `site.ts` test**

Create `src/config/site.test.ts`. `env` is read at module load, so the test drives it with `vi.stubEnv` + `vi.resetModules`, matching the `loadEnv` pattern:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadSite(docsUrl?: string) {
  vi.resetModules()
  if (docsUrl === undefined) vi.stubEnv('VITE_DOCS_URL', '')
  else vi.stubEnv('VITE_DOCS_URL', docsUrl)
  return import('@/config/site')
}

afterEach(() => vi.unstubAllEnvs())

describe('docs site seam', () => {
  it('offers no docs entry when the URL is unset', async () => {
    const { docsNavItem } = await loadSite()
    expect(docsNavItem()).toBeUndefined()
  })

  it('labels the entry through the nav namespace and opens a new tab', async () => {
    const { docsNavItem } = await loadSite('https://docs.acme.test')
    const item = docsNavItem()
    expect(item).toMatchObject({
      titleKey: 'nav:items.docs',
      href: 'https://docs.acme.test',
      external: true,
    })
  })

  it('maps the retired catalog routes onto the docs site', async () => {
    const { docsUrlFor } = await loadSite('https://docs.acme.test')
    expect(docsUrlFor('/components')).toBe('https://docs.acme.test/components')
    expect(docsUrlFor('/ui')).toBe('https://docs.acme.test/guide/theming')
    expect(docsUrlFor('/components/button')).toBeUndefined()
    expect(docsUrlFor('/users')).toBeUndefined()
  })

  it('maps nothing when there is no docs site to send anyone to', async () => {
    const { docsUrlFor } = await loadSite()
    expect(docsUrlFor('/components')).toBeUndefined()
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm test -- src/config/site.test.ts`
Expected: FAIL — `Cannot find package '@/config/site'`.

- [ ] **Step 7: Create `src/config/site.ts`**

```ts
import { BookOpen } from 'lucide-react'

import { env } from '@/config/env'
import type { ExternalNavItem } from '@/config/nav'

/**
 * The retired in-app catalog routes, mapped onto the docs site pages that
 * replaced them. Kept for one release so links from old READMEs and issues land
 * somewhere useful; delete the map when that grace period ends.
 */
const LEGACY_DOCS_PATHS: Readonly<Record<string, string>> = {
  '/components': '/components',
  '/ui': '/guide/theming',
}

export function docsNavItem(): ExternalNavItem | undefined {
  if (!env.docsUrl) return undefined
  return { titleKey: 'nav:items.docs', href: env.docsUrl, icon: BookOpen, external: true }
}

export function docsUrlFor(pathname: string): string | undefined {
  const target = LEGACY_DOCS_PATHS[pathname]
  if (!target || !env.docsUrl) return undefined
  return `${env.docsUrl}${target}`
}
```

- [ ] **Step 8: Run the seam test to verify it passes**

Run: `pnpm test -- src/config/site.test.ts src/config/env.test.ts`
Expected: PASS.

- [ ] **Step 9: Teach the nav types about external items**

In [src/config/nav.ts:45-51](../../../src/config/nav.ts#L45-L51) replace the single `NavItem` interface with a discriminated union, and add the guards below it. Children stay internal-only because an external entry never expands:

```ts
interface NavItemBase {
  titleKey: string
  icon: LucideIcon
  permission?: PermissionCode
}

export interface InternalNavItem extends NavItemBase {
  to: AppPath
  children?: InternalNavItem[]
}

export interface ExternalNavItem extends NavItemBase {
  href: string
  external: true
}

export type NavItem = InternalNavItem | ExternalNavItem

export interface NavGroup {
  titleKey: string
  items: NavItem[]
}

export function isExternalNavItem(item: NavItem): item is ExternalNavItem {
  return item.external === true
}

export function internalNavItems(items: NavItem[]): InternalNavItem[] {
  return items.filter((item) => !isExternalNavItem(item))
}
```

Then retype the helpers so nothing has to re-check the union at every call site:

```ts
export function flattenInternalNavItems(groups: NavGroup[]): InternalNavItem[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item) =>
      isExternalNavItem(item) ? [] : [item, ...(item.children ?? [])],
    ),
  )
}

const NAV_PATHS: readonly string[] = flattenInternalNavItems(NAV_GROUPS).map((item) => item.to)

export function isManagedNavPath(pathname: string) {
  return flattenInternalNavItems(NAV_GROUPS).some((item) => isPathActive(pathname, item.to))
}

export function findNavItem(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  return flattenInternalNavItems(groups)
    .filter((item) => isPathActive(pathname, item.to))
    .sort((a, b) => b.to.length - a.to.length)[0]
}
```

`flattenNavItems` stays exported (the command palette renders every item) but its `NAV_PATHS` comment above it must be updated: the list is now "internal paths only, external entries are not routes".

- [ ] **Step 10: Keep the permission filter type-safe**

[src/lib/permissions.ts:15-21](../../../src/lib/permissions.ts#L15-L21) touches `item.children`, which external entries do not have. An external item carries no `permission`, so `hasPermission` already lets it through; only the recursion needs a guard:

```ts
function filterItems(items: NavItem[], granted: readonly string[]): NavItem[] {
  return items
    .filter((item) => hasPermission(granted, item.permission))
    .map((item) =>
      !isExternalNavItem(item) && item.children
        ? { ...item, children: filterItems(item.children, granted) }
        : item,
    )
}
```

Add `import { isExternalNavItem, type NavGroup, type NavItem } from '@/config/nav'`.

- [ ] **Step 11: Merge the docs entry at the single menu choke point**

Every nav surface reads `useMenuNavGroups()`, which returns `resolveMenuGroups(...)`. Appending there means the entry appears for all three roles in both the server-driven and offline menus, without touching the wire format. In [src/features/navigation/resolve.ts:49-57](../../../src/features/navigation/resolve.ts#L49-L57):

```ts
import { docsNavItem } from '@/config/site'

/**
 * The docs live outside this build, so the entry is appended client-side rather
 * than served: a backend that does not know about it still shows it, and an
 * unset VITE_DOCS_URL still hides it.
 */
function withDocsEntry(groups: NavGroup[]): NavGroup[] {
  const docs = docsNavItem()
  if (!docs || groups.length === 0) return groups
  const index = groups.findIndex((group) => group.titleKey === 'nav:groups.overview')
  const at = index === -1 ? 0 : index
  return groups.map((group, position) =>
    position === at ? { ...group, items: [...group.items, docs] } : group,
  )
}

export function resolveMenuGroups(
  payload: MenuPayload | null | undefined,
  granted: readonly string[],
): NavGroup[] {
  const groups = Array.isArray(payload?.groups)
    ? payload.groups.map(toNavGroup).filter(isDefined)
    : []

  return filterNavGroups(withDocsEntry(groups.length > 0 ? groups : NAV_GROUPS), granted)
}
```

- [ ] **Step 12: Write the failing resolve tests**

Append to [src/features/navigation/resolve.test.ts](../../../src/features/navigation/resolve.test.ts). `ROLES`/`payloadFor` helpers already exist in that file — reuse them; if the file builds payloads inline, copy that style.

```ts
describe('docs entry', () => {
  it('appears for every role, in both the served and the offline menu', async () => {
    vi.stubEnv('VITE_DOCS_URL', 'https://docs.acme.test')
    vi.resetModules()
    const { resolveMenuGroups } = await import('@/features/navigation/resolve')

    for (const granted of [['*'], ['project:read'], []]) {
      const served = resolveMenuGroups(payloadWithOneGroup(), granted)
      const offline = resolveMenuGroups(null, granted)
      expect(externalItems(served)).toHaveLength(1)
      expect(externalItems(offline)).toHaveLength(1)
    }
  })

  it('is absent when the docs URL is unset', async () => {
    vi.stubEnv('VITE_DOCS_URL', '')
    vi.resetModules()
    const { resolveMenuGroups } = await import('@/features/navigation/resolve')
    expect(externalItems(resolveMenuGroups(null, ['*']))).toHaveLength(0)
  })
})
```

with the two module-scope helpers it needs:

```ts
function externalItems(groups: NavGroup[]) {
  return groups.flatMap((group) => group.items.filter((item) => item.external === true))
}

function payloadWithOneGroup(): MenuPayload {
  return {
    groups: [
      {
        titleKey: 'nav:groups.overview',
        items: [{ titleKey: 'nav:items.dashboard', path: '/', icon: 'layout-dashboard' }],
      },
    ],
  }
}
```

- [ ] **Step 13: Run them to verify they fail, then pass**

Run: `pnpm test -- src/features/navigation/resolve.test.ts`
Expected: FAIL first (no `withDocsEntry` yet if you skipped Step 11), PASS after. Then `pnpm test -- src/config/nav.test.ts` — `ALL_NAV_ITEMS` is still internal-only, so the existing per-item assertions hold.

- [ ] **Step 14: Write the failing shared link renderer test**

Create `src/components/layout/nav-item-link.test.tsx`. It renders the component for both item kinds and asserts the anchor semantics the acceptance list asks for:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Boxes } from 'lucide-react'

import type { NavItem } from '@/config/nav'
import { NavItemLink } from '@/components/layout/nav-item-link'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const internal: NavItem = { titleKey: 'nav:items.projects', to: '/projects', icon: Boxes }
const external: NavItem = {
  titleKey: 'nav:items.docs',
  href: 'https://docs.acme.test',
  icon: Boxes,
  external: true,
}

describe('NavItemLink', () => {
  it('routes an internal item through the router', () => {
    render(<NavItemLink item={internal} onNavigate={vi.fn()} />)
    const link = screen.getByRole('link', { name: 'nav:items.projects' })
    expect(link).toHaveAttribute('href', '/projects')
    expect(link).not.toHaveAttribute('target')
  })

  it('opens an external item in a new tab with a safe rel', () => {
    render(<NavItemLink item={external} onNavigate={vi.fn()} />)
    const link = screen.getByRole('link', { name: 'nav:items.docs' })
    expect(link).toHaveAttribute('href', 'https://docs.acme.test')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
```

- [ ] **Step 15: Run it to verify it fails**

Run: `pnpm test -- src/components/layout/nav-item-link.test.tsx`
Expected: FAIL — module `@/components/layout/nav-item-link` does not exist.

- [ ] **Step 16: Create `nav-item-link.tsx`**

```tsx
import { Link } from '@tanstack/react-router'

import { isExternalNavItem, type NavItem } from '@/config/nav'

/**
 * One anchor for every nav surface. The external case has to exist in all four
 * menus at once, so the branch lives here instead of at each call site.
 */
export function NavItemLink({
  item,
  onNavigate,
  children,
}: {
  item: NavItem
  onNavigate?: () => void
  children: React.ReactNode
}) {
  if (isExternalNavItem(item)) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
        {children}
      </a>
    )
  }

  return (
    <Link to={item.to} onClick={onNavigate}>
      {children}
    </Link>
  )
}
```

Run: `pnpm test -- src/components/layout/nav-item-link.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 17: Use it in the sidebar**

In [src/components/layout/app-sidebar.tsx:61-91](../../../src/components/layout/app-sidebar.tsx#L61-L91) the `key` and the active check both assume `item.to`. Rewrite the loop body:

```tsx
{
  group.items.map((item) => {
    const Icon = item.icon
    const children = isExternalNavItem(item) ? [] : (item.children ?? [])
    const href = isExternalNavItem(item) ? item.href : item.to
    return (
      <SidebarMenuItem key={href}>
        <SidebarMenuButton
          asChild
          isActive={!isExternalNavItem(item) && isPathActive(pathname, item.to)}
          tooltip={t(item.titleKey)}
        >
          <NavItemLink item={item} onNavigate={closeMobileSidebar}>
            <Icon />
            <span>{t(item.titleKey)}</span>
          </NavItemLink>
        </SidebarMenuButton>
        {/* the existing SidebarMenuSub block, unchanged, now iterates InternalNavItem[] */}
      </SidebarMenuItem>
    )
  })
}
```

Add `import { NavItemLink } from '@/components/layout/nav-item-link'` and `isExternalNavItem` to the `@/config/nav` import.

- [ ] **Step 18: Use it in the sub-nav and the top nav**

[app-subnav.tsx:27-40](../../../src/components/layout/app-subnav.tsx#L27-L40): replace `<Link key={item.to} to={item.to} className={...}>` with `<NavItemLink key={href} item={item} className={...}>` — so `NavItemLink` must forward `className`. Add `className?: string` to its props and spread it onto both branches.

[app-top-nav.tsx:45-83](../../../src/components/layout/app-top-nav.tsx#L45-L83): `inGroup` compares `item.to` — compute it from internal items only (`internalNavItems(group.items).some(...)`), and render each entry through `NavItemLink` instead of `onClick={() => navigate({ to: entry.to })}`:

```tsx
<DropdownMenuItem key={href} asChild className={active ? 'bg-accent' : undefined}>
  <NavItemLink item={entry}>{t(entry.titleKey)}</NavItemLink>
</DropdownMenuItem>
```

`DropdownMenuItem asChild` + a plain `<a>` is how Radix renders link items, so no `navigate` call is needed for the external case.

- [ ] **Step 19: Use it in the command palette and keep tabs internal**

[command-menu.tsx:74-86](../../../src/components/layout/command-menu.tsx#L74-L86): the palette cannot render an `<a>` as a `CommandItem`, so select opens the tab:

```tsx
onSelect={() =>
  runAction(() => {
    if (isExternalNavItem(item)) window.open(item.href, '_blank', 'noopener,noreferrer')
    else navigate({ to: item.to })
  })
}
value={`${t(item.titleKey)} ${isExternalNavItem(item) ? item.href : item.to}`}
```

and `key={item.to}` becomes `key={isExternalNavItem(item) ? item.href : item.to}`.

[app-tabs.tsx:45](../../../src/components/layout/app-tabs.tsx#L45): a tab is a route in the shell, so exclude externals — `flattenInternalNavItems(groups).map((item) => item.to)`.

- [ ] **Step 20: Add the nav label in both languages**

`src/locales/en/nav.json` `items`: add `"docs": "Component docs"`. `src/locales/zh-CN/nav.json` `items`: add `"docs": "组件文档"`.

Run: `pnpm test -- src/lib/locales.test.ts src/config/nav.test.ts`
Expected: PASS — the parity test now sees `docs` on both sides, and `nav.test.ts:65-71` finds a translation for the new `titleKey`.

- [ ] **Step 21: Typecheck and run the whole unit suite**

```bash
pnpm typecheck && pnpm test
```

Expected: PASS. A `TS2339: Property 'to' does not exist on type 'ExternalNavItem'` anywhere is an unfixed render site — fix it there, do not widen the type.

- [ ] **Step 22: Verify in a browser with the variable set**

Start the docs site and the app against it, then drive the menu:

```bash
pnpm docs:preview --port 4175 &
VITE_DOCS_URL=http://localhost:4175 pnpm dev
```

Using the logged-in browser session (or a scratch Playwright script), sign in as each of the three demo accounts, and on each: confirm the sidebar's Overview group ends with `Component docs`, its `href` is `http://localhost:4175`, `target="_blank"`, `rel="noopener noreferrer"`; open the command palette and select it (a new tab appears); switch the shell layout to `header` and `mixed` in `/settings` and confirm the entry renders in the top-nav dropdown and the sub-nav row. Then sign out and load `/login` with `VITE_DOCS_URL` unset (`pnpm dev` without the var) and confirm no docs entry exists anywhere and the console is clean.

Expected: all three roles see it; unset hides it everywhere.

- [ ] **Step 23: Confirm the baselines did not move**

`VITE_DOCS_URL` is unset in `pnpm test:visual:docker`, so Task 2's baselines must still match:

```bash
pnpm test:visual:docker
```

Expected: 16 passed, zero diff.

- [ ] **Step 24: Commit**

```bash
git add -A
git commit -m "feat(template): link the component docs from the shell menu"
```

---

### Task 4: Redirect the retired routes to the docs site

Old READMEs, issues and bookmarks point at `/components` and `/ui`. With the routes deleted they would render the 404 screen; the spec wants them to reach the docs site when one is configured, and to keep 404 when it is not.

**Files:**

- Modify: `src/routes/_app/$.tsx:8-10`
- Test: `e2e/docs-link.spec.ts` (created in this task, extended in Step 5)

**Interfaces:**

- Consumes: `docsUrlFor(pathname)` from `src/config/site.ts`.
- Produces: nothing downstream depends on it.

- [ ] **Step 1: Add the redirect to the catch-all route**

In [src/routes/_app/$.tsx](../../../src/routes/_app/$.tsx) extend the `createFileRoute` call. `redirect({ href })` is how TanStack Router leaves the app:

```ts
export const Route = createFileRoute('/_app/$')({
  // The catalog and playground routes are gone; their old links keep working for
  // one release when the deployment names a docs site, and 404 when it does not.
  beforeLoad: ({ location }) => {
    const target = docsUrlFor(location.pathname)
    if (target) throw redirect({ href: target })
  },
  component: InShellNotFound,
})
```

with `import { redirect } from '@tanstack/react-router'` and `import { docsUrlFor } from '@/config/site'` added.

- [ ] **Step 2: Write the e2e guard for the default build**

Create `e2e/docs-link.spec.ts`. The suite's build has no `VITE_DOCS_URL`, which is the case adopters get:

```ts
import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('docs seam', () => {
  test('the retired catalog routes render the shell 404 when no docs site is configured', async ({
    page,
  }) => {
    await signInAs(page, 'admin')
    for (const path of ['/components', '/ui']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/not found|未找到/i)
      await expect(page.locator('a[href^="https://fish-admin-docs"]')).toHaveCount(0)
    }
  })

  test('the sidebar carries no external entry when the URL is unset', async ({ page }) => {
    await signInAs(page, 'admin')
    await expect(page.getByRole('link', { name: /Component docs|组件文档/ })).toHaveCount(0)
  })
})
```

- [ ] **Step 3: Run it to verify it passes**

Run: `pnpm test:e2e -- e2e/docs-link.spec.ts --workers=1`
Expected: 2 passed. The 404 assertion is the regression guard: if the redirect fired without a configured URL, the heading assertion fails.

- [ ] **Step 4: Verify the configured path locally**

Rebuild with the seam set and intercept the docs origin so no network is needed:

```bash
VITE_ENABLE_MOCK=true VITE_DOCS_URL=https://docs.invalid pnpm build
pnpm preview --port 4173 --strictPort
```

Then in a scratch Playwright script: `page.route('**docs.invalid**', route => route.fulfill({ status: 200, body: 'docs stub' }))`, sign in, `page.goto('/components')` and assert `page.url()` is `https://docs.invalid/components`; repeat for `/ui` → `https://docs.invalid/guide/theming`. Record both results; delete the scratch script afterwards.

Expected: both redirects land. If `/components` renders the 404 instead, `env.docsUrl` was inlined as `undefined` — the build did not see the variable.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_app/\$.tsx e2e/docs-link.spec.ts
git commit -m "feat(template): redirect the retired catalog routes to the docs site"
```

---

### Task 5: Give the login page a docs link

The login page is the template's front door for anyone who arrives without context; it must offer the component documentation next to the demo accounts and the RBAC caveat.

**Files:**

- Modify: `src/features/auth/components/auth-shell.tsx:52-54`, `src/locales/en/auth.json`, `src/locales/zh-CN/auth.json`
- Test: `src/features/auth/components/auth-shell.test.tsx` (create), `e2e/docs-link.spec.ts` (extend)

**Interfaces:**

- Consumes: `env.docsUrl` from Task 3.
- Produces: nothing.

- [ ] **Step 1: Write the failing component test**

Create `src/features/auth/components/auth-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AuthShell } from '@/features/auth/components/auth-shell'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('AuthShell docs link', () => {
  it('renders nothing docs-related without a configured site', () => {
    vi.stubEnv('VITE_DOCS_URL', '')
    render(
      <AuthShell title="Sign in" subtitle="Demo">
        <p>form</p>
      </AuthShell>,
    )
    expect(screen.queryByRole('link', { name: 'auth:brand.docs' })).toBeNull()
  })

  it('links the docs site in a new tab', async () => {
    vi.stubEnv('VITE_DOCS_URL', 'https://docs.acme.test')
    vi.resetModules()
    const { AuthShell: Shell } = await import('@/features/auth/components/auth-shell')
    render(
      <Shell title="Sign in" subtitle="Demo">
        <p>form</p>
      </Shell>,
    )
    const link = screen.getByRole('link', { name: 'auth:brand.docs' })
    expect(link).toHaveAttribute('href', 'https://docs.acme.test')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('always states the client-side RBAC caveat', () => {
    render(
      <AuthShell title="Sign in" subtitle="Demo">
        <p>form</p>
      </AuthShell>,
    )
    expect(screen.getByText('auth:demo.disclaimer')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- src/features/auth/components/auth-shell.test.tsx`
Expected: FAIL — no `auth:brand.docs` link exists yet (first two cases), and the third passes.

- [ ] **Step 3: Add the link under the disclaimer**

In [src/features/auth/components/auth-shell.tsx:52-54](../../../src/features/auth/components/auth-shell.tsx#L52-L54) wrap the existing paragraph and append the link. The disclaimer must stay visible on the small screens where the aside is hidden, so the link goes in the aside and the mobile copy is untouched:

```tsx
<div className="relative space-y-2">
  <p className="text-xs leading-relaxed text-white/60">{t('demo.disclaimer')}</p>
  {env.docsUrl ? (
    <a
      href={env.docsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white underline-offset-4 hover:underline"
    >
      <BookOpen className="size-3.5" aria-hidden />
      {t('brand.docs')}
    </a>
  ) : null}
</div>
```

Add `import { BookOpen } from 'lucide-react'` and `import { env } from '@/config/env'`.

- [ ] **Step 4: Add the label in both languages**

`src/locales/en/auth.json` under `brand`: `"docs": "Component documentation"`. `src/locales/zh-CN/auth.json` under `brand`: `"docs": "组件文档"`.

Run: `pnpm test -- src/features/auth/components/auth-shell.test.tsx src/lib/locales.test.ts`
Expected: PASS, 3 tests in the new file.

- [ ] **Step 5: Extend the e2e guard and verify in the browser**

Append to `e2e/docs-link.spec.ts`:

```ts
test('the login page offers no docs link when the URL is unset', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('link', { name: /Component documentation|组件文档/ })).toHaveCount(0)
  await expect(page.getByText(/client-side|前端/i).first()).toBeVisible()
})
```

Run: `pnpm test:e2e -- e2e/docs-link.spec.ts --workers=1`
Expected: 3 passed. Then, with `VITE_DOCS_URL=http://localhost:4175 pnpm dev` and the docs preview running, load `/login` at 1440 px and 375 px in the browser and confirm the link is present at the wide breakpoint, the disclaimer still reads correctly, and nothing overflows at 375 px.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(template): link the component docs from the login page"
```

---

### Task 6: Rebrand the README, the document meta and the screenshots

The README currently sells a dashboard starter. It has to lead with the component library while keeping the template's own story, and the screenshots must stop showing a 1.7.0-era UI — including `ui-playground.png`, whose page no longer exists.

**Files:**

- Create: `e2e/visual/readme-shots.spec.ts`, `apps/docs/public/screenshots/{dashboard,users-tablet,roles-mobile,workflows}.png`
- Modify: `README.md`, `README.zh-CN.md`, `index.html:8,13,16,20,23,27`, `playwright.docs-visual.config.ts` (no change needed — the shots belong to the template runner), `playwright.visual.config.ts` (testMatch), `CONTRIBUTING.md`
- Delete: `docs/assets/ui-playground.png`

**Interfaces:**

- Consumes: the built demo with the mock API, and the Docker image used by `pnpm test:visual:docker`.
- Produces: four PNGs at `apps/docs/public/screenshots/`, referenced by the READMEs as `apps/docs/public/screenshots/<name>.png` and by the docs site as `/screenshots/<name>.png`.

- [ ] **Step 1: Add the screenshot spec**

Create `e2e/visual/readme-shots.spec.ts`. It is gated by an env var so the ordinary visual run is unaffected, and it writes viewport-sized PNGs (not fullPage) straight to the docs asset folder:

```ts
import { expect, test, type Page } from '@playwright/test'

import { signInAs } from '../helpers'

const SHOT_DIR = '../../apps/docs/public/screenshots'
const CAPTURE = process.env.README_SHOTS === '1'

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.waitForTimeout(250)
}

test.describe('readme screenshots', () => {
  test.skip(!CAPTURE, 'set README_SHOTS=1 to write the README screenshots')

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-01T12:00:00.000Z'))
    await signInAs(page, 'admin')
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 10_000 })
  })

  for (const [name, path, heading] of [
    ['dashboard', '/', undefined],
    ['users-tablet', '/users', 'Users'],
    ['roles-mobile', '/roles', 'Roles'],
    ['workflows', '/workflows', 'Approvals'],
  ] as const) {
    test(name, async ({ page }) => {
      const width = name === 'users-tablet' ? 768 : name === 'roles-mobile' ? 375 : 1440
      const height = name === 'users-tablet' ? 1024 : name === 'roles-mobile' ? 812 : 900
      await page.setViewportSize({ width, height })
      await page.goto(path)
      await settle(page)
      if (heading)
        await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
      await page.screenshot({ path: `${SHOT_DIR}/${name}.png` })
    })
  }
})
```

Add `testMatch: ['pages.spec.ts', 'readme-shots.spec.ts']` to [playwright.visual.config.ts](../../../playwright.visual.config.ts) so the runner sees the new file, and note in the config comment that `README_SHOTS=1` writes files instead of comparing them.

- [ ] **Step 2: Capture them in Docker**

```bash
mkdir -p apps/docs/public/screenshots
pnpm test:docs:visual:docker   # not this one — see next line
```

Correct command (the template runner, with the flag forwarded through the Docker script's `bash -lc` chain):

```bash
docker run --rm --init --ipc=host \
  -v "$PWD:/work" \
  -v fishadmin-visual-node-modules:/work/node_modules \
  -v fishadmin-visual-pnpm-store:/root/.local/share/pnpm/store \
  -w /work -e CI=1 -e README_SHOTS=1 \
  mcr.microsoft.com/playwright:v1.64.1-noble \
  bash -lc 'corepack enable && pnpm install --frozen-lockfile --store-dir /root/.local/share/pnpm/store && pnpm exec playwright test -c playwright.visual.config.ts e2e/visual/readme-shots.spec.ts'
```

Expected: 4 tests pass and four PNGs appear in `apps/docs/public/screenshots/`.

- [ ] **Step 3: Look at them**

Open each PNG. Requirements: no toast, no skeleton, no loading spinner, no cursor in an input, the sidebar visible on the 1440 px shots, and the 375 px shot must show the mobile shell rather than a squashed table. Reject and re-capture anything that fails — a stale-looking screenshot is the exact thing this task exists to fix.

- [ ] **Step 4: Confirm the visual suite still passes**

```bash
pnpm test:visual:docker
```

Expected: 16 passed, zero diff — the new spec is skipped without `README_SHOTS=1`.

- [ ] **Step 5: Rewrite the README headline and lead (both languages)**

Replace [README.md:3](../../../README.md#L3) and the first paragraph at line 14. Keep the section list and line-for-line parity with the Chinese file:

```markdown
> **A React component library for enterprise admin apps — plus the template that ships with it.**

FishAdmin is two things: `@fish-admin/react`, 83 documented components with light/dark theming,
English and Chinese locales and RBAC-shaped screens, and a front-end starter you can clone, log
into, break on purpose and then connect to your own backend. The [component documentation](https://fish-admin-docs.vercel.app)
is the front door for both.
```

`README.zh-CN.md:3,14` gets the same content in Chinese:

```markdown
> **面向企业中后台的 React 组件库 —— 以及随它一起发布的模板工程。**

FishAdmin 是两件事：`@fish-admin/react`（83 个有文档的组件，带深浅主题、中英文与按 RBAC 组织的页面），
以及一套可以 clone 下来登录、故意越权试试、再换成自己后端的模板工程。
[组件文档](https://fish-admin-docs.vercel.app) 是这两部分的统一入口。
```

Then, in both files: add a `Docs` badge on the same line as the existing `Demo` badge (line 18 region) pointing at the docs URL, add an `## Install` / `## 安装` line under Quick start with `npm install @fish-admin/react`, and update the Routes table (lines 117-118) to delete the `/ui` and `/components` rows.

- [ ] **Step 6: Fix the screenshot references and the stale counts**

In both READMEs: repoint the four `docs/assets/*.png` image lines at `apps/docs/public/screenshots/*.png`, delete the `ui-playground.png` line, and add a `workflows.png` line with alt text `Approval center` / `审批中心`. Correct the quality-gates bullet at [README.md:308](../../../README.md#L308) from nineteen screenshots with a catalog hero to eighteen, and delete `docs/assets/ui-playground.png`:

```bash
git rm docs/assets/ui-playground.png
```

- [ ] **Step 7: Update the document meta**

In [index.html](../../../index.html), change `:27` title to `FishAdmin — React component library and admin template`, and the `description` (`:8`), `og:title` (`:13`), `og:description` (`:16`), `twitter:title` (`:20`), `twitter:description` (`:23`) to match that framing. Keep `/og.png` and add no external script. Then re-render `public/og.png` if it carries the old tagline — check by opening it; if the text is stale, regenerate it at 1200×630 with the new one-liner and commit the replacement.

- [ ] **Step 8: Verify the rendering**

```bash
pnpm format:check && pnpm lint
```

Then preview: open both READMEs in the editor's Markdown preview (or `git stash`-free `python -m http.server` on the repo is unnecessary — GitHub renders relative paths) and confirm every image path resolves on disk:

```bash
for f in $(grep -ohE 'apps/docs/public/screenshots/[a-z-]+\.png' README.md README.zh-CN.md | sort -u); do
  test -f "$f" && echo "ok $f" || echo "MISSING $f"
done
```

Expected: four `ok` lines, no `MISSING`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "docs: present the component library as the front door"
```

---

### Task 7: Correct the template documentation pages

`docs/{en,zh-CN}/*.md` are copied into the docs site by [apps/docs/scripts/sync-template-docs.mjs](../../../apps/docs/scripts/sync-template-docs.mjs), so every sentence that still describes the in-app catalog ships as fact.

**Files:**

- Modify: `docs/en/{architecture,deployment,rbac,api-integration,dictionaries,account-lifecycle,scaffold}.md` and the `docs/zh-CN/` twins, `apps/docs/template-index/{en,zh}.md`, `CONTRIBUTING.md`

**Interfaces:**

- Consumes: the post-deletion tree from Task 2 and the screenshots from Task 6.
- Produces: docs-site content that matches the code.

- [ ] **Step 1: Find every stale claim**

```bash
grep -rn "components catalog\|component catalog\|/components\|/ui\b\|playground\|COMPONENT_COUNTS\|83 components\|catalog" docs/en docs/zh-CN apps/docs/template-index CONTRIBUTING.md | grep -v "^docs/superpowers"
```

Expected: the architecture route tree (48-49, 195, 213, 215), deployment chunk table (121, 126-131, 137), rbac (35), api-integration (394, 404), dictionaries (139), account-lifecycle (59), scaffold (5, 22, 32, 45, 77), plus the template index pages.

- [ ] **Step 2: Rewrite each hit in place**

Rules: describe the docs site as the place component examples live; keep the English and Chinese files structurally aligned (same headings, same table rows); where a page previously said "open `/components`", say "open the component page at the docs site" and link `/components/button` (docs-relative) rather than a template route. `docs/{en,zh-CN}/scaffold.md` loses the whole `--catalog` paragraph — the option no longer exists — and its "drops the whole browser subsystem" list must drop `components-catalog.spec.ts` / `ui-playground.spec.ts` and `components-linux.png`.

- [ ] **Step 3: Update the template index pages with a screenshot**

`apps/docs/template-index/{en,zh}.md` are docs-owned (not synced). Add the dashboard image using the docs-absolute path so the single copy serves both README and site:

```markdown
![FishAdmin dashboard](/screenshots/dashboard.png)
```

and keep the RBAC caveat line.

- [ ] **Step 4: Update CONTRIBUTING.md**

The visual-regression section still says `e2e/visual/pages.spec.ts` compares sixteen screenshots. It is now sixteen minus the catalog hero, plus a separate README-shot mode. Rewrite that paragraph to state: 16 baselines compared by `pnpm test:visual:docker`, four README PNGs written by `README_SHOTS=1`, and that the docs baselines live in `e2e-docs/__screenshots__/visual.spec.ts/`.

- [ ] **Step 5: Verify the docs site builds with the new content**

```bash
pnpm docs:build && pnpm docs:check
```

Expected: build succeeds (dead-link checking is on, so a stale `/components` link inside a template page fails the build) and `docs:check` reports 20 template pages.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs(template): describe the docs site as the component front door"
```

---

### Task 8: Version the release and write the notes

**Files:**

- Modify: `package.json:4`, `apps/docs/docs/{en,zh}/versions.md`, `CHANGELOG.md`, `apps/docs/theme/ComponentMeta.tsx:6` (verify only)

**Interfaces:**

- Consumes: everything above.
- Produces: template `2.0.0`, package `0.1.0` (already declared), docs status text.

- [ ] **Step 1: Bump the template version**

`package.json:4` `"version": "1.7.0"` → `"2.0.0"`. That is the single source: `vite.config.ts:23` injects `__APP_VERSION__`, `src/config/app.ts:1` re-exports it, and the sidebar, shell footer and settings screen read it.

- [ ] **Step 2: Re-record the visual baselines the version appears in**

The sidebar and footer render `APP_VERSION`, so the version string is inside the screenshots:

```bash
pnpm test:visual:docker --update && pnpm test:visual:docker
```

Expected: 16 updated, then zero diff.

- [ ] **Step 3: Update the docs versions page (both languages)**

`apps/docs/docs/en/versions.md:8-12` becomes:

```markdown
| Surface             | Version | Status                                           |
| ------------------- | ------- | ------------------------------------------------ |
| `@fish-admin/react` | 0.1.0   | Published to npm.                                |
| Template            | 2.0.0   | Running at <https://fish-admin.vercel.app>.      |
| Docs site           | 1.0.0   | Running at <https://fish-admin-docs.vercel.app>. |
```

Write the package row only after Task 10's npm publish succeeds; until then keep `Repository only; not published to npm yet.` and say so in the execution record. `apps/docs/docs/zh/versions.md` gets the same table in Chinese.

- [ ] **Step 4: Add the CHANGELOG entry**

Prepend after the preamble at [CHANGELOG.md:6](../../../CHANGELOG.md#L6), matching the existing style (`### Added` / `### Changed` / `### Fixed`, bold lead-ins, ~100-column wrap, a `See [...](...)` link per cluster):

```markdown
## [2.0.0] - 2026-XX-XX

Delivered against the [component library plan](./docs/plans/component-library.md).

### Added

- **`@fish-admin/react`.** ...
- **Documentation site.** ...
- **Component docs seam.** ...

### Changed

- **Removed the in-app catalog.** ...
- **README positioning.** ...

### Fixed

- ...
```

Fill every `...` from the actual commits made in Tasks 1-7 — no invented entries.

- [ ] **Step 5: Verify the version surfaces**

```bash
pnpm build && node -e "console.log(require('./package.json').version)"
grep -rn "1\.7\.0" src apps/docs/docs README.md README.zh-CN.md | grep -v CHANGELOG
```

Expected: `2.0.0`, and no stale `1.7.0` outside the changelog history.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: version the template for the component library release"
```

---

### Task 9: Full verification and the M3 execution record

**Files:**

- Modify: `docs/plans/component-library.md` (the `M3 / 执行记录` section)

- [ ] **Step 1: Run every gate**

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm --filter @fish-admin/react test
pnpm --filter @fish-admin/react build
pnpm check:package
pnpm size
pnpm gen-api:check
pnpm docs:check
pnpm docs:build
pnpm test:e2e --workers=1
pnpm test:visual:docker
pnpm test:docs:visual:docker
DOCS_FULL_AXE=1 pnpm test:docs
```

Expected: all green. Record the four budget numbers and the docs test count verbatim for the record.

- [ ] **Step 2: Pack and install the package for real**

```bash
pnpm --filter @fish-admin/react build
cd packages/ui && pnpm pack --pack-destination /tmp && cd ../..
node --input-type=module -e "
import { execSync } from 'node:child_process'
console.log(execSync('tar -tzf /tmp/fish-admin-react-0.1.0.tgz').toString().split('\n').slice(0, 12).join('\n'))
"
```

Expected: `package/dist/index.js`, `package/dist/styles.css`, `package/dist/preflight.css`, `package/README.md`, `package/package.json`. Then create a throwaway Vite + React 19 app outside the repo, install the tarball, import `Button` and `styles.css`, build it, and note the result. `registry.json` must not appear in the tarball (`files` is `["dist","README.md"]`).

- [ ] **Step 3: Walk the whole front door in a browser**

With `VITE_DOCS_URL=http://localhost:4175`, the docs preview on 4175 and the demo running: README → docs home → component index → one component page → its demo source toggle → the "Used in the template" link → login → a business page → the sidebar docs entry back to the docs site. Repeat once in Chinese, once in dark mode, once at 375 px. Note console errors; there must be none.

- [ ] **Step 4: Fill the M3 execution record**

Replace `（待实现后填写）` under `## M3` → `### 执行记录` in [docs/plans/component-library.md](../../plans/component-library.md) with: what was deleted (files, lines, specs, one baseline), the registry relocation, the docs seam and its three consumers, README/meta/screenshot changes, versions, the full gate list with real numbers, deviations (including the stale `172.4 + 1 KB` ceiling and the `public/screenshots/` location change), and what remains unverified until the external actions in Task 10 are approved.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: record the M3 template closeout"
```

---

### Task 10: Publish — blocked on explicit approval

Do not start any step here without the user confirming that specific action. Each line is its own approval.

- [ ] Publish `@fish-admin/react@0.1.0` to npm. The user types their own password and 2FA code; 2FA must already be enabled. Never fill or ask for the credential.
- [ ] Create the Vercel project for `apps/docs` (Root Directory `apps/docs`, "Include files outside of Root Directory" enabled) and deploy; then verify headers, cache and the search-index download with the CSP from `apps/docs/vercel.json`.
- [ ] Set `VITE_DOCS_URL` on the template's Vercel project to the deployed docs URL, redeploy, and re-verify the sidebar entry, login link and `/components` redirect against the live sites.
- [ ] Push `main` and the `v2.0.0` tag.
- [ ] Create the GitHub Release for `v2.0.0` (keep the existing Release's Latest flag behaviour as-is) with the CHANGELOG body.
- [ ] Update the repository description and topics to lead with the component library.
- [ ] Only after all of the above: flip the `Repository only` and `M1` rows in `apps/docs/docs/{en,zh}/versions.md` to the published values and redeploy the docs site.

---

## Self-Review

**1. Spec coverage** — M3 做法 1 → Tasks 1-2 (registry relocation is the prerequisite the spec did not name; it is listed as a deviation in Task 9's record). 做法 2 → Task 3. 做法 3 → Tasks 4-5. 做法 4 → Task 6. 做法 5 → Task 8 + Task 10. 做法 6 → Task 9. Acceptance items map: no `/components`+`/ui` (Task 2), external link for three roles (Task 3 Step 12), legacy redirect per config (Task 4), e2e green with two specs deleted (Tasks 2, 4, 5), baselines −1 and re-recorded (Tasks 2, 8), budgets (Task 9 Step 1), docs 83×2 + search + dark + mobile + dead links (Task 9 Step 1), README parity and reachable links with fresh screenshots (Task 6).

**2. Placeholder scan** — Task 6 Step 5's `## Install` line and Task 8 Step 4's CHANGELOG bullets deliberately reference the commits that will exist at that point rather than pre-writing release prose; everything else carries literal code. The `2026-XX-XX` date in Task 8 Step 4 is filled from the actual release date at execution time.

**3. Type consistency** — `ExternalNavItem.external: true`, `isExternalNavItem`, `internalNavItems`, `flattenInternalNavItems`, `docsNavItem`, `docsUrlFor`, `env.docsUrl` and `NavItemLink` are defined once in Task 3 Steps 7-9 and used with those exact names in Tasks 4, 5 and 9.
