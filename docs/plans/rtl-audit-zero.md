# RTL audit zero — implementation plan

**Goal:** drive unhandled physical-direction utilities in the audited scopes to zero, without
changing LTR rendering.

**Scope:** `packages/ui/src/components`, `src/features`, and the template shell at `src/components`.
Tests and stories stay excluded.

## Decisions

- **Count direction-dependent utilities only.** Tailwind 4 compiles `space-x/y-*` to
  `margin-inline`/`margin-block`, so the previous 245 `space-y-*` findings were false positives.
  The rule is removed.
- **Three exempt classes, all visible in the report:**
  - `direction-scoped`: the utility carries an `rtl:`/`ltr:` variant, or a physical-placement
    variant such as `data-[side=left]` / `data-[vaul-drawer-direction=right]`.
  - `centering`: `left-1/2` (or `left-[50%]`) minus a compensating `translate-x` that centres the
    element in both directions.
  - `exempt`: a physical class that is intentional because a prop is physical (`Sheet`, `Drawer`,
    `Sidebar` `side`), annotated in source with `rtl-exempt:start … rtl-exempt:end`.
- **`pnpm check:rtl` fails on any unhandled occurrence**, not just on a stale JSON report.
- **Logical conversions:** `ml/mr → ms/me`, `pl/pr → ps/pe`, `left/right → start/end`,
  `border-l/r → border-s/e`, `rounded-l/r/tl/tr/bl/br → rounded-s/e/ss/se/es/ee`.
- **Transforms:** switch and sidebar sub-menu use paired `ltr:`/`rtl:` translates; carousel and
  calendar icons mirror with `rtl:rotate-180`; dialog/alert-dialog/bulk-actions replace
  `left-1/2 -translate-x-1/2` with `inset-x-0 mx-auto`; radio-group relies on its flex indicator.
- **Resizable centring** stays physical: `left-1/2` + `-translate-x-1/2` is direction-neutral and
  the report classifies it as `centering`.

## Tasks

1. Rewrite `scripts/audit-rtl.mjs` to schema v2 (unhandled / direction-scoped / centering /
   exemptions), add the `src/components` scope, and make `--check` fail on unhandled findings.
2. Run the audit and confirm the remaining unhandled set matches the known 178 occurrences.
3. Apply the mechanical codemod (margin, padding, border, radius, simple inset) with per-file
   exclusions for physical-side and centring files.
4. Hand-fix transforms and centring: dialog, alert-dialog, radio-group, bulk-actions, switch,
   sidebar, sheet, drawer, carousel.
5. Regenerate `apps/docs/generated/rtl-audit.json`; rewrite `apps/docs/theme/RtlAudit.tsx`,
   `apps/docs/theme/styles/rtl-audit.css` and both `guide/rtl-readiness.mdx` pages for the new
   report shape.
6. Strengthen the RTL smoke tests: dialog stays centred under `dir="rtl"`; the switch thumb moves
   to the inline end.
7. Verify: `pnpm check:rtl`, `pnpm lint`, `pnpm typecheck`, `pnpm test:ui`, `pnpm test:e2e`,
   `pnpm docs:build`, `pnpm docs:check`, `pnpm test:docs`, Docker visual suites.

## Acceptance

- `apps/docs/generated/rtl-audit.json` reports `occurrences: 0`.
- No unhandled physical utility in the three scopes; exemptions list only physical props and
  direction-neutral centring, each with a reason.
- LTR screenshots are unchanged; RTL smoke tests pass; axe has no new violations.

## Execution record (2026-11-02)

**Audit result:** 253 files across the three scopes; `occurrences: 0`. The classified matches are
14 direction-scoped, 7 centring/neutral and 13 annotated exemptions (15 inset, 13 translate and 6
border matches in total). `pnpm check:rtl` fails on any unhandled match and on a stale report.

**Conversion:** the codemod rewrote 62 files (`ml/mr → ms/me`, `pl/pr → ps/pe`,
`left/right → start/end`, `text-left/right → text-start/end`, `border-l/r → border-s/e`,
`rounded-* → rounded-s/e/ss/se/es/ee`). Hand edits covered the nine special-case files: dialog and
alert-dialog centring, radio-group indicator, bulk-actions bar, switch thumb, resizable separator,
sheet and sidebar physical-side exemptions, drawer direction variants and carousel chevrons. All
converted utilities were verified in `packages/ui/dist/styles.css`, including the negative logical
(`-ms-2`, `-end-0`) and `rtl:` variant selectors.

**Docs:** `RtlAudit.tsx` renders the v2 report with an explicit zero state and one table per
classification; both `guide/rtl-readiness.mdx` pages were rewritten. The docs visual baselines for
that page (light and dark) were re-recorded in Docker because the page content changed; every other
docs and template baseline stayed unchanged.

**Tests:** RTL smoke tests now also assert that the Dialog stays centred under `dir="rtl"` and that
the Switch thumb moves across the centre when the direction flips. Axe coverage already included
both RTL readiness pages.

**Verification:** `check:rtl`, `format:check`, `lint` (0 errors, one pre-existing warning),
`typecheck`, `test:ui` (167), `test:e2e` (78), `docs:build`, `docs:check`, `test:docs`
(106 passed, 166 skipped), `test:visual:docker` (16 passed, 4 skipped) and
`test:docs:visual:docker` (12 passed).

**Deviation:** no `space-x → gap` rewrite was needed. Tailwind CSS v4 compiles `space-x/y` to
`margin-inline`/`margin-block` (verified in the built CSS), so the audit no longer counts them and
the docs state that explicitly.

**Not done:** version bump, commit, push, deploy, npm publish and tag/Release all still require
separate approval.
