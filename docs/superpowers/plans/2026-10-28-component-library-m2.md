# M2 — 80 Component Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the docs site from 3 pilot component pages to all 83, each with ≥2 live demos, generated API tables filled with JSDoc, bilingual prose, and passing gates — without publishing anything.

**Architecture:** One MDX page pair (`en`, `zh`) per component plus per-component demo folders. Demo metadata moves next to the demos (`demos/<id>/meta.json`) and a generator merges it into the manifests that the site and checks consume, so parallel authoring never edits shared JSON. `check-docs.mjs` is generalised from the three pilots to every documented page, and a Playwright sweep renders every demo and catches console errors. Waves are independent and end with a green, committable state.

**Tech Stack:** Rspress 2.0.23 (SSG), React 19, TypeScript 5.9, Playwright 1.64, axe-core, `react-docgen-typescript` (existing `gen-api` pipeline), pnpm workspace.

**Spec:** `docs/plans/component-library.md` — M2 chapter (page standard, waves, per-wave acceptance).

## Global Constraints

- **No publish/tag/Vercel/repo-metadata actions in M2.** Everything stays local; push happens only after the programme is complete and approved.
- **Page standard is fixed.** Every page has: frontmatter title+description, one-line intro, category badge, `## When to use`, `## When not to use`, `## Basic usage` (first demo), a variant demo section, `## API` with `<ApiTable component="<id>" />`, `## Design guidance`, `## Accessibility`, `## FAQ` (2–3 Q/A), `## Related`. zh headings: `何时使用`, `何时不使用`, `基础用法`, `变体…`(自由), `API`, `设计指引`, `无障碍`, `FAQ`, `相关`.
- **≥2 live demos per page** (ports count as one; add one variant). W1 high-frequency components get 3.
- **Demo import rule:** a file under `apps/docs/demos/<id>/` may import only `react`, `@fish-admin/react`, `lucide-react`, `@docs/demos/data/*`, and relative `./…` files inside its own folder. No MSW, router, stores, i18n hooks or `@/` aliases. Copy is English in both locales; package chrome localizes via `UIProvider`.
- **JSDoc:** one line per public prop the component declares itself; `@default` where a literal default exists. No behaviour or type changes. `pnpm gen-api` is re-run after every batch; coverage may only rise.
- **Shared manifests are generated:** nobody edits `apps/docs/demos/registry.json`, `apps/docs/docs/{en,zh}/components/_meta.json` or `apps/docs/generated/documented.json` by hand. Authoring agents own only:
  - `packages/ui/src/components/**` (JSDoc lines in the target component)
  - `apps/docs/demos/<id>/**`
  - `apps/docs/docs/en/components/<id>.mdx`
  - `apps/docs/docs/zh/components/<id>.mdx`
- **Gates after every wave:** `pnpm gen-api` (regenerate), `pnpm exec tsc --noEmit -p apps/docs/tsconfig.json`, `pnpm docs:build`, `pnpm docs:check`, `pnpm exec playwright test -c playwright.docs.config.ts`, plus axe on a 1/4 sample of the wave's pages.

---

## File Structure

```
apps/docs/scripts/build-manifests.mjs        # new: meta.json -> registry/_meta/documented manifests
apps/docs/scripts/check-docs.mjs             # generalised to all documented pages
apps/docs/demos/<id>/meta.json               # new: demo metadata per component
apps/docs/demos/<id>/<variant>.tsx           # demos (2+ per component)
apps/docs/demos/registry.json                # generated
apps/docs/generated/documented.json          # generated: ids with en+zh pages
apps/docs/theme/ComponentIndex.tsx           # reads documented.json
apps/docs/theme/ComponentMeta.tsx            # new: category badge + Since 0.1.0
apps/docs/docs/{en,zh}/components/<id>.mdx   # 83 × 2 pages
packages/ui/src/components/**                 # JSDoc only
e2e-docs/sweep.spec.ts                       # new: every documented page renders every demo
e2e-docs/axe-full.spec.ts                    # new: env-gated full axe sweep (closeout)
```

---

### Task 1: Manifest pipeline, generalised checks, page scaffolding

**Files:**

- Create: `apps/docs/scripts/build-manifests.mjs`
- Create: `apps/docs/theme/ComponentMeta.tsx`
- Create: `apps/docs/demos/{button,pro-table,date-range-picker}/meta.json` (migrate existing entries)
- Modify: `apps/docs/package.json` (scripts), `apps/docs/scripts/check-docs.mjs`, `apps/docs/theme/ComponentIndex.tsx`, `apps/docs/theme/index.tsx` (export `ComponentMeta` if needed by MDX import path), `apps/docs/docs/{en,zh}/components/button.mdx` (add `<ComponentMeta />`), `apps/docs/package.json` deps (`lucide-react`), `e2e-docs/sweep.spec.ts`
- Test: `e2e-docs/sweep.spec.ts`, `apps/docs/scripts/check-docs.mjs`

**Interfaces:**

- `meta.json` per component is an array of `{ id, component, file, title: {en,zh}, description: {en,zh} }`, same shape as today's `demos/registry.json` entries.
- `build-manifests.mjs` writes `demos/registry.json` (sorted by `id`), `docs/{en,zh}/components/_meta.json` (`["index", ...documentedIds]` sorted, documented = has both en and zh mdx), and `generated/documented.json` (`{ "version": 1, "components": string[] }`). `--check` compares and exits non-zero with a "run pnpm docs:manifests" hint.
- `check-docs.mjs` validates every documented page pair: required headings, ≥2 `<Demo>`, `<ApiTable component="<id>" />`, every registered demo of that component imported with `?raw`, identical demo import sets across languages, legal demo imports, manifest freshness, and (with `--complete`) that all 83 ids are documented.

- [x] **Step 1: Write `build-manifests.mjs`** — scan `demos/*/meta.json` (skip `data`), validate fields, merge, write the three outputs; `--check` variant; sorted deterministic JSON with trailing newline.
- [x] **Step 2: Migrate the pilot metadata** — split the three existing registry entries into `meta.json` files; delete nothing else.
- [x] **Step 3: Wire scripts** — `apps/docs/package.json`: `"manifests": "node scripts/build-manifests.mjs"`, add it to `predev`, `prebuild` (after `sync:template`) and `pretypecheck`; `check` runs `node scripts/build-manifests.mjs --check && node scripts/check-docs.mjs`.
- [x] **Step 4: Generalise `check-docs.mjs`** — replace the `PILOTS` loop with a loop over `generated/documented.json`; add import-legality and cross-language parity checks; keep the pilot assertions as part of the general rule; add `--complete`.
- [x] **Step 5: ComponentIndex + ComponentMeta** — index links every id in `documented.json`; `<ComponentMeta id="…" />` renders the category label and `Since 0.1.0`, wired through `theme/index.tsx`; add it to the button pilot pages.
- [x] **Step 6: Add `lucide-react`** to `apps/docs` dependencies (same range as root).
- [x] **Step 7: Write `e2e-docs/sweep.spec.ts`** — for each id in `documented.json`: go to `/components/<id>`, wait for network idle, assert every `[data-demo]` has at least one visible child and its source block shows `export default`, assert `<ApiTable>` rows exist when the API has props, capture console errors per page and fail listing them.
- [x] **Step 8: Verify** — `pnpm docs:manifests && pnpm docs:check && pnpm docs:build && pnpm test:docs`; all green, sweep runs 3 pages.

---

### Task 2: Wave 1 — high-frequency primitives (23 new pages)

**Components:** button _(pilot, add 3rd demo + ComponentMeta)_, input, textarea, select, checkbox, radio-group, switch, label, form, dialog, alert-dialog, sheet, drawer, tabs, table, card, badge, alert, avatar, separator, skeleton, spinner, tooltip, dropdown-menu.

**Execution recipe (same for every wave):**

- Split the list into batches of 4–5 components; dispatch one subagent per batch with: the page contract, the demo rules, the component's source path (`packages/ui/src/components/ui/<id>.tsx`, enterprise `<id>/`, pro), its playground body (`src/features/playground/components/component-catalog-demos*.tsx`, function `<Name>Demo`) to port (strip i18n, hardcode English copy, replace `DemoSurface` with plain divs + `fish-demo-stack`/`fish-demo-row` classes), the second-demo angle, and the four files it owns.
- Agents must read the component source and its tests before writing; never invent props; mark unverified behaviour as a "Known gap" in Accessibility.
- After all batches: run `pnpm gen-api`, fix any docgen regressions, run the gate set, spot-check 6 pages in a browser (render + console), axe the 1/4 sample, commit `feat(docs): document wave 1 primitives`.

**Interfaces:**

- Every page imports `ComponentMeta`, `ApiTable`, `Demo`, and its demos with `?raw`.
- Demo ids are `<id>/basic` and `<id>/<variant>`; variant slugs describe the angle (`controlled`, `sizes`, `empty`, `states`, …).

- [x] **Step 1:** dispatch batches and collect the files
- [x] **Step 2:** `pnpm gen-api` + review api.json descriptions for the wave (no empty tables, no wrong display names)
- [x] **Step 3:** gate set + axe sample + browser spot check
- [ ] **Step 4:** commit

---

### Task 3: Wave 2 — remaining primitives (23 new pages)

**Components:** accordion, breadcrumb, calendar, chart, collapsible, color-picker, command, context-menu, empty, hover-card, input-number, input-otp, pagination, popover, progress, resizable, scroll-area, segmented, sidebar, slider, sonner, toggle, toggle-group.

Same recipe and gates as Task 2; commit `feat(docs): document wave 2 primitives`.

---

### Task 4: Wave 3 — enterprise, first 20 (19 new pages)

**Components:** anchor-nav, auto-complete, back-top, carousel, cascader, combobox, date-picker, date-range-picker _(pilot)_, descriptions, dropzone, image-preview, json-viewer, list, notification-center, page-container, popconfirm, rate, result, statistic, stepper.

Same recipe; enterprise sources live in `packages/ui/src/components/enterprise/<id>/`. Commit `feat(docs): document wave 3 enterprise components`.

---

### Task 5: Wave 4 — enterprise tail + pro (15 new pages)

**Components:** tags-input, time-picker, timeline, tour, transfer, tree, tree-select, trend, upload, watermark, detail-page, editable-table, import-wizard, pro-form, pro-table _(pilot)_, query-filter.

Pro sources live in `packages/ui/src/components/pro/<id>.tsx`. Commit `feat(docs): document wave 4 enterprise and pro components`.

---

### Task 6: M2 closeout — full coverage, axe, visual baselines, record

**Files:**

- Modify: `e2e-docs/docs.spec.ts` (AXE_ROUTES → full sweep delegation), `e2e-docs/axe-full.spec.ts`, `scripts/gen-api-floor.json`
- Create: `playwright.docs-visual.config.ts`, `e2e-docs/visual.spec.ts` (+ baselines), `scripts/visual-regression-docs.mjs` (reuse the template's Docker image)
- Modify: `docs/plans/component-library.md` (M2 execution record)

- [ ] **Step 1:** `docs:check --complete` — all 83 × 2 pages, ≥166 demos, en/zh parity.
- [ ] **Step 2:** full demo sweep (`e2e-docs/sweep.spec.ts` over 83 pages) with console-error capture; fix everything it finds.
- [ ] **Step 3:** full axe scan gated by `DOCS_FULL_AXE=1`; fix violations; record pass counts.
- [ ] **Step 4:** docs visual baselines: 4 routes (home, installation, button, pro-table) × light/dark at 1440×900, captured in the Playwright Docker image, zero diff on re-run.
- [ ] **Step 5:** raise the `gen-api` coverage floor to the measured M2 value (floored to 0.1%), record build time, CSS/JS totals, search index sizes, demo count and page count.
- [ ] **Step 6:** fill the M2 execution record; run the full gate set once more; commit `docs: complete the component library coverage`.

---

## Self-Review

- Every M2 acceptance item maps to Task 6 steps: 166 pages (Steps 1–2), demo e2e (Step 2), axe (Step 3), visual (Step 4), index/search/versions (existing pages, verified in Step 2), build metrics (Step 5), record (Step 6).
- No wave depends on a later wave; each ends green.
- No placeholder content rules: the page skeleton and demo rules are contracts; prose is produced from the component source during execution.
