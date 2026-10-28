# Contributing to FishAdmin

Thanks for taking the time to contribute. This guide keeps changes easy to review and safe to release.

## Before you start

- For a bug, open an issue using the bug report template. Small fixes can go straight to a pull request.
- For a feature, open a feature request first so the approach can be discussed. Large, unreviewed pull requests are hard to merge.
- For a security problem, **do not open a public issue**. Follow [SECURITY.md](./SECURITY.md).

## Development setup

Requirements: Node.js >= 22 (24 LTS recommended) and pnpm 9.1.1.

```bash
corepack enable
pnpm install
pnpm dev
```

The demo API starts automatically at http://localhost:5173. Demo accounts and data reset are described in the [README](./README.md#demo-accounts).

## Quality checks

Run these before pushing:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

For changes that affect a user flow, also run the end-to-end suite:

```bash
pnpm test:e2e
```

`pnpm test:e2e` builds the demo bundle with the mock API enabled and runs Playwright against it, including the axe accessibility scans (`e2e/a11y.spec.ts`) and the runtime performance budgets (`e2e/perf.spec.ts`). Install the browser once with `pnpm exec playwright install chromium`.

`pnpm size` builds the production bundle (without the mock API) and then checks four gzip budgets against it — `firstPaintJs` 180 KB, `largestAsyncJs` 115 KB, `totalJs` 800 KB, `totalCss` 30 KB — so run it after a dependency change. It rebuilds `dist/` itself, because the demo builds used by `test:e2e` and the visual suite carry the MSW chunk and would break the two JavaScript totals; first paint is the number the gate actually protects, and it is identical in both builds.

### Visual regression

`e2e/visual/pages.spec.ts` compares sixteen screenshots against baselines rendered in `mcr.microsoft.com/playwright:v1.64.1-noble`. The baselines are platform-specific, so run the suite through Docker even on Linux; `pnpm test:visual` exits with an error off Linux and warns when it is not running in a container.

```bash
pnpm test:visual:docker --update   # regenerate baselines after an intentional UI change
pnpm test:visual:docker            # verify a change did not move anything else
```

The mock database is seeded and each test freezes the clock, so dates and chart series stay stable. Review the regenerated `.png` files before committing them — an unexpected diff is usually the bug.

The docs site has its own baseline set: `e2e-docs/visual.spec.ts` compares four routes (home, installation, button, pro-table) in light and dark against baselines from the same image, served on port 4175.

```bash
pnpm test:docs:visual:docker --update   # regenerate the docs baselines
pnpm test:docs:visual:docker            # verify a docs change did not move anything
```

Husky runs lint-staged on commit and commitlint on the commit message. Do not bypass the hooks with `--no-verify`; fix the underlying problem instead.

## Commit messages

The project uses [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(users): add CSV export for the current filter
fix(auth): retry refresh only once
docs(rbac): document wildcard permissions
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `perf`, `style`.

## Pull requests

1. Fork the repository and branch from `main` (`feat/user-import`, `fix/sidebar-focus`).
2. Keep the change focused. Separate refactors from behavior changes.
3. Add or update tests. A bug fix should include a regression test; a feature should cover its main path and one edge case.
4. Update documentation when behavior, configuration or the public API changes.
5. Fill in the pull request template: what changed, why, how it was tested, and screenshots for UI changes.
6. Make sure CI is green.

Reviewers may ask for changes or suggest splitting a large pull request. That is normal; it keeps the history useful.

## Code conventions

- TypeScript is strict. Avoid `any` and non-null assertions unless the reason is obvious.
- Use the `@/` alias for imports from `src`.
- `src/components/ui` contains shadcn/ui primitives. Do not hand-edit them; update them through the CLI or keep local changes minimal and documented.
- Put feature-specific code under `src/features/<feature>` — API calls, query options, schemas and components stay together.
- Do not call `fetch` from components. Go through `apiRequest` and TanStack Query.
- UI strings belong in `src/locales/{en,zh-CN}`; add both languages in the same pull request. The locale parity test enforces this.
- Permission checks must use the existing registry — see [docs/en/rbac.md](./docs/en/rbac.md). A new permission needs a registry entry, a navigation item when relevant, a route guard and role grants.
- Client-side permissions are for UX only. Any new write endpoint must also be authorized by the backend or mock handler.

## Adding a language

1. Copy `src/locales/en` to `src/locales/<locale>` and translate every namespace.
2. Register the locale in `src/lib/i18n.ts` and the language switcher.
3. Add the locale to the language names map and the `supportedLngs` list.
4. Run `pnpm test` — the locale test checks namespace and key parity.

## Documentation

- `README.md` is English; `README.zh-CN.md` is the Chinese mirror.
- `docs/en` and `docs/zh-CN` should stay structurally aligned. When you change one, update the other.
- Prefer short examples over long prose. Test commands and file paths before documenting them.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
