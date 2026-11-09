# Vue port foundation

FishAdmin 2.2.0 is the reference release for a future Vue 3 port. This page documents what is frozen, how the framework-neutral packages are laid out, and how the parity harness works. It does not claim that a Vue port exists.

## What is frozen

`parity/baseline/2.2.0/manifest.json` stores SHA-256 hashes for:

- 198 Linux screenshots: 166 component baselines (83 components × light/dark), 14 docs layout baselines and 18 template baselines.
- The generated docs artifacts: `registry.json`, `documented.json`, `api.json`, `maturity.json` and `rtl-audit.json`.
- `packages/ui/registry.json`, the docs theme hooks (`Demo.tsx`, `ApiTable.tsx`), `e2e-docs/component-visual.spec.ts`, every demo source and `meta.json`, and every `*-linux.png`.

`pnpm check:parity:freeze` recomputes all hashes, key sets, counts and package versions. It never compares `sourceCommit` with the current `HEAD`, so a later commit does not invalidate the baseline. Ordinary work never regenerates the manifest: a new release needs a new `parity/baseline/<version>/` directory and an explicit approval. Baselines are rendered only in `mcr.microsoft.com/playwright:v1.64.1-noble`.

## Shared packages

| Package                 | Owns                                                                                                   | Must not contain    |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ------------------- |
| `@fish-admin/contracts` | Domain and API types, permission codes and grants, `NAV_CONTRACT`, demo/integration/audit data, dates  | React, `@/`, Lucide |
| `@fish-admin/i18n`      | The 21 locale namespaces, `SUPPORTED_LANGUAGES`, eager resources and `setupI18n`                       | React, `@/`, Lucide |
| `@fish-admin/mock`      | MSW handlers, seeded database and migrations, `createMockWorker` / `createMockServer`, runtime options | React, `@/`, Lucide |

The React app keeps only adapters: `src/types` re-exports contracts, `src/config/nav.ts` derives `NAV_GROUPS` from `NAV_CONTRACT`, `src/lib/i18n.ts` plugs react-i18next into `setupI18n`, and `src/main.tsx` calls `createMockWorker`. A Vue app can consume the same three packages without importing React.

## Component contract

`pnpm parity:contract` reads the generated registry, API tables and demo registry, then writes:

- `parity/contract/components.json` — one entry per documented component: `id`, `name`, `category`, `status`, `since`, `exportName`, `source`, `docsPath`, sorted demo IDs, and the documented props/events.
- `parity/contract/docs-surface.json` — one route per component: English and Chinese paths, every demo anchor (`section[data-demo="<component>/<demo>"]`), the preview/source/API selectors and the expected API row count.

`pnpm check:parity:contract` fails when either file is stale. The six pilot components are listed in `parity/pilot.json`: accordion, date-range-picker, dialog, pro-table, select and tabs.

A target declares how strictly it follows the reference API:

- `"api": { "mode": "exact" }` — every API row must match by name, type and order. This is the React target.
- `"api": { "mode": "reference" }` — routes, demos and DOM anchors must match, but the target records per-pilot differences in `api.deviations`. Use this for Vue, where React-only props such as `asChild` have no direct equivalent.

## Behaviour scenarios

`parity/scenarios/*.json` describe the six pilot interactions through roles, accessible names, visible text and ARIA state. There are no component CSS selectors except the table row count in `pro-table`.

Each step is one of `click`, `fill`, `press`, `pressKey`, `expectText`, `expectNotText`, `expectTargetText`, `expectVisible`, `expectHidden`, `expectCount` or `expectState`. `expectState` covers `expanded`, `selected`, `checked` and `disabled`. A target with the same accessible surface can run the scenario unchanged.

`pnpm check:parity:scenarios` validates the schema, the demo references and the one-scenario-per-pilot rule.

## Targets and commands

`parity/targets/react.json` points at the Rspress docs site built from this repository. `playwright.parity.config.ts` reads `PARITY_TARGET` (default `react`), loads `parity/targets/<name>.json`, starts its web server and compares screenshots against the frozen baseline directory; it never writes there. `updateSnapshots` is `'none'`.

```bash
pnpm check:parity:freeze
pnpm check:parity:contract
pnpm check:parity:scenarios
pnpm test:parity:docker
```

`pnpm test:parity:docker` runs the suite in the Playwright image. The suite has 119 tests: 83 API contracts, 12 docs-surface checks (six pilots × two locales), six behaviour scenarios, 12 screenshots (six pilots × light/dark) and six axe scans. The 12 screenshots compare with the same `*-linux.png` files the docs site uses; no baseline is duplicated.

## Adding a Vue target

1. Build a Vue docs target that serves the same component routes, demo IDs and `section[data-demo]` anchors. Keep the same fixed clock and storage keys so screenshots are comparable.
2. Add `parity/targets/vue.json` with its `baseURL`, `webServer` and `"api": { "mode": "reference", "deviations": { ... } }`. Record all six pilots; use `[]` when a component has no API differences.
3. Run `PARITY_TARGET=vue pnpm test:parity:docker`.
4. Fix behaviour, accessibility and pixel differences in the Vue implementation. Never run an update flag to make a parity screenshot pass.

## What parity does not prove

- **Security.** Permissions remain a client-side UX layer. Every write endpoint must enforce authorization on the server; see [RBAC](./rbac.md).
- **API compatibility.** `reference` mode records deviations instead of pretending React-only props exist in Vue.
- **Documentation prose.** The contract checks the DOM surface and API table, not the wording of a guide.
- **SSR, mobile or browser coverage.** The harness runs Chromium at 1440×900 in English, matching the visual baseline. It is not a cross-browser or responsive test.

## Verification

The foundation is complete when `pnpm check:parity:freeze`, `pnpm check:parity:contract`, `pnpm check:parity:scenarios`, `pnpm test:parity:docker`, the existing Docker visual jobs and the full quality gate all pass without modifying a single `*-linux.png`.

### 2026-11-09 run

- Static gates: format, lint, typecheck, package, tokens, RTL, maturity, gen-api, parity contract, parity scenarios — all pass.
- Unit suites: root 383, tokens 94, UI 303, shared 31.
- Browser: template 78 passed; docs 106 passed / 166 skipped; full axe 272 passed.
- Visual: template 18/18, docs 180/180, parity 119/119, zero baseline changes.
- Bundle: first paint 174.2 KB, largest async 103.2 KB, total JS 711.6 KB, total CSS 23.8 KB.
