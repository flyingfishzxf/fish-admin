# Parity harness

This directory freezes the documented surface of FishAdmin 2.2.0 and compares a renderer against it.

| Path                           | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `baseline/2.2.0/manifest.json` | SHA-256 manifest for screenshots, generated artifacts and docs hooks |
| `pilot.json`                   | The six components with behaviour scenarios and screenshot parity    |
| `contract/components.json`     | Generated reference API for all 83 documented components             |
| `contract/docs-surface.json`   | Generated route, demo anchor, selector and API-row contract          |
| `scenarios/*.json`             | Accessible-name and ARIA-state behaviour scenarios                   |
| `targets/react.json`           | The current target; a Vue target will add `vue.json`                 |

## What a target must match

Every one of the 83 documented components is checked for its route, demo count, demo anchors, preview, source block and a clean console. The six pilots in `pilot.json` add the behaviour scenarios, screenshot comparison and axe checks, and their demo anchors and API-row counts are checked in both locales.

A target in `api.mode: "reference"` must record a deviation entry for each of the six pilots. The harness does not compare API rows for the other 77 components; reference mode is not a per-component API diff. Widen `pilot.json` when a port needs stricter API coverage.

Commands (from the repository root):

```bash
pnpm check:parity:freeze
pnpm check:parity:contract
pnpm check:parity:scenarios
pnpm test:parity:docker
PARITY_TARGET=vue pnpm test:parity:docker
```

`test:parity:docker` runs `playwright.parity.config.ts` in `mcr.microsoft.com/playwright:v1.64.1-noble`. Screenshots compare against `e2e-docs/__screenshots__/component-visual.spec.ts`; `updateSnapshots` is `'none'`, so the harness can never rewrite a baseline.

Read [docs/en/vue-port-foundation.md](../docs/en/vue-port-foundation.md) before adding a target.
