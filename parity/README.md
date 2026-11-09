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
