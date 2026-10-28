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

`e2e/visual/pages.spec.ts` compares eighteen screenshots across sixteen tests — the dashboard and reports tests each shoot both themes — against baselines rendered in `mcr.microsoft.com/playwright:v1.64.1-noble`. The baselines are platform-specific, so run the suite through Docker even on Linux; `pnpm test:visual` exits with an error off Linux and warns when it is not running in a container.

`e2e/visual/readme-shots.spec.ts` joins that run but compares nothing: with `README_SHOTS=1` it writes the four PNGs the READMEs embed into `apps/docs/docs/public/screenshots/`, and without the flag all four tests skip. Re-capture them only from the Docker image, so the fonts match the baselines, and look at each file before committing — a half-drawn chart or a stray toast is exactly what the 2-second settle is there to prevent.

```bash
pnpm test:visual:docker --update   # regenerate baselines after an intentional UI change
pnpm test:visual:docker            # verify a change did not move anything else
```

The mock database is seeded and each test freezes the clock, so dates and chart series stay stable. Review the regenerated `.png` files before committing them — an unexpected diff is usually the bug.

The docs site has its own baseline set: `e2e-docs/visual.spec.ts` compares four routes (home, installation, button, pro-table) in light and dark — eight baselines, stored under `e2e-docs/__screenshots__/visual.spec.ts/` — against images from the same container, served on port 4175.

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
- `packages/ui/src/components/ui` contains the shadcn/ui primitives the package builds on. Do not hand-edit them; update them through the CLI or keep local changes minimal and documented.
- The components live in `packages/ui` (`@fish-admin/react`), not in `src`. A new component needs a `packages/ui/registry.json` entry, an export from `packages/ui/src/index.ts`, a page under `apps/docs/docs/{en,zh}/components/`, and at least two demos in `apps/docs/demos/<id>/` with its own `meta.json`; run `pnpm gen-api` after changing props so the generated tables match.
- Put feature-specific code under `src/features/<feature>` — API calls, query options, schemas and components stay together.
- Do not call `fetch` from components. Go through `apiRequest` and TanStack Query.
- Template UI strings belong in `src/locales/{en,zh-CN}`; component strings belong in `packages/ui/src/locales`. Add both languages in the same pull request. The locale parity tests enforce this.
- Permission checks must use the existing registry — see [docs/en/rbac.md](./docs/en/rbac.md). A new permission needs a registry entry, a navigation item when relevant, a route guard and role grants.
- Client-side permissions are for UX only. Any new write endpoint must also be authorized by the backend or mock handler.

## Adding a language

1. Copy `src/locales/en` to `src/locales/<locale>` and translate every namespace.
2. Register the locale in `src/lib/i18n.ts` and the language switcher.
3. Add the locale to the language names map and the `supportedLngs` list.
4. Regenerate the package strings: `node scripts/extract-ui-messages.mjs` writes `packages/ui/src/locales/{en,zh-CN}.ts` from the template's `common.json` and throws when a key is missing from a locale, so add the new locale's `read`/`write` pair there instead of hand-editing the generated files. Widen `UILocale` and the `BUILT_IN` map in `packages/ui/src/i18n.tsx` to match.
5. Add a matching language tree to the docs site — a directory under `apps/docs/docs/<locale>`, an entry in the multilingual config in `apps/docs/rspress.config.ts`, and the site's own UI strings in `apps/docs/site.ts`.
6. Run `pnpm test` — `src/lib/locales.test.ts` checks namespace and key parity across the template locales, and the package locale parity is enforced by the extractor.

## Documentation

- `README.md` is English; `README.zh-CN.md` is the Chinese mirror.
- `docs/en` and `docs/zh-CN` should stay structurally aligned. When you change one, update the other.
- `docs/{en,zh-CN}` describe the template. `pnpm docs:build` copies them into the Rspress site under `apps/docs/docs/{en,zh}/template`; those copies are generated and gitignored, so never edit them directly.
- The component reference is written in the site itself, under `apps/docs/docs/{en,zh}/components/<id>.mdx` with its demos in `apps/docs/demos/<id>/`. `pnpm gen-api` regenerates the props tables from `packages/ui`, and `pnpm docs:check` fails when a registry entry has no page, no demo or no translation.
- Prefer short examples over long prose. Test commands and file paths before documenting them.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
