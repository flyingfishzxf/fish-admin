# Component Library M1 — Docs Site Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the bilingual Rspress docs site in `apps/docs` with live demos, a generated API table, synced template documentation, and a three-component pilot, so M2 only has to add content.

**Architecture:** A private workspace package `@fish-admin/docs` consumes the built `@fish-admin/react` package from `dist` (dogfooding the artifact), renders MDX pages through Rspress 2, and hosts demo modules that import only React plus the package. A root Node script generates `api.json` and `registry.json` from the template registry; another script copies the ten root `docs/{en,zh-CN}` pages into the site with rewritten links. Playwright drives the built site for dead-link-adjacent checks, search, dark mode, 375 px layout and axe.

**Tech Stack:** Rspress 2.0.23 (React 19, rsbuild), TypeScript 5.9, pnpm 9 workspace, `react-docgen-typescript` 2.4, Playwright 1.64, `@axe-core/playwright`, Tailwind-free docs CSS built on the package's precompiled tokens.

**Spec:** `docs/plans/component-library.md` (M1 section, lines 246–323).

## Global Constraints

- Package `@fish-admin/react` is ESM-only; docs consume it via `workspace:*` and must import `@fish-admin/react/styles.css`, never Tailwind utilities compiled at docs build time.
- Docs language codes are `en` and `zh` (Rspress built-in i18n); the demo wrapper maps `zh` → package `UIProvider` locale `'zh-CN'`.
- MDX imports must appear before any Markdown content. The spike proved imports after prose render as literal text.
- Demo modules import only React, `@fish-admin/react`, `@tanstack/react-table` (ProTable demos) and docs helpers. No `@/`, no MSW, no template stores.
- Static analysis of the package source must stay clean: no `react-i18next`, no `@tanstack/react-router`, no `@/stores`, no `@/features`.
- Internal planning docs (`docs/plans/**`, `docs/superpowers/**`) and `docs/assets/**` never ship to the docs build.
- Client-side RBAC is a UX layer, not a security boundary. The docs site must carry that statement wherever it describes permissions.
- Never create a Vercel project, publish the package, tag a release or change repository metadata in this milestone. Deployment is a local build + documented config only.
- Existing template gates keep their thresholds: first paint ≤ 180 KB, total JS ≤ 800 KB, total CSS ≤ 30 KB; e2e 85/85; visual baselines zero diff.

---

## File Structure

```
apps/docs/
  package.json                     @fish-admin/docs, private, workspace dep
  tsconfig.json                    demos/theme/scripts/config typecheck
  rspress.config.ts                site config, locales, nav via files
  vercel.json                      docs project config (not applied)
  site.ts                          URLs, package name, docs UI strings
  i18n.json                        Rspress custom text (demo chrome)
  theme/
    Demo.tsx                       live preview + source + usedIn link
    ApiTable.tsx                   reads generated/api.json
    ComponentIndex.tsx             renders 83 registry entries
    styles/index.css               package CSS + docs-only classes
  demos/
    registry.json                  demo metadata, single source
    registry.ts                    typed accessor
    data/members.ts                shared demo rows
    button/basic.tsx
    button/states.tsx
    pro-table/basic.tsx
    pro-table/selection.tsx
    date-range-picker/basic.tsx
    date-range-picker/presets.tsx
  docs/
    en/_nav.json  en/_meta.json
    en/index.md
    en/guide/{_meta.json,installation.md,quick-start.md,theming.md}
    en/components/{_meta.json,index.md,button.md,pro-table.md,date-range-picker.md}
    en/template/…                  generated, gitignored
    en/versions.md
    zh/…                           mirrored
  generated/
    api.json                       committed, 83 entries
    registry.json                  committed, 83 entries
  template-index/{en,zh}.md        source of the template section index
  scripts/
    sync-template-docs.mjs
    check-docs.mjs

scripts/gen-api.mjs                registry + docgen -> generated/*.json
scripts/gen-api-floor.json         committed documented-props floor
playwright.docs.config.ts          docs e2e against doc_build
e2e-docs/docs.spec.ts              content, search, theme, locale, axe
e2e-docs/layout.spec.ts            375 px overflow checks
```

Root scripts added: `docs:dev`, `docs:build`, `docs:preview`, `docs:check`, `gen-api`, `gen-api:check`, `test:docs`.

---

### Task 1: Workspace package and Rspress skeleton

**Files:**

- Modify: `pnpm-workspace.yaml`
- Create: `apps/docs/package.json`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/rspress.config.ts`
- Create: `apps/docs/site.ts`
- Create: `apps/docs/theme/styles/index.css`
- Create: `apps/docs/docs/en/index.md`, `apps/docs/docs/zh/index.md`
- Create: `apps/docs/docs/en/_nav.json`, `apps/docs/docs/en/_meta.json`
- Create: `apps/docs/docs/zh/_nav.json`, `apps/docs/docs/zh/_meta.json`
- Modify: `package.json` (add `apps/*` scripts)
- Modify: `.gitignore`, `.prettierignore`, `eslint.config.js`, `Dockerfile`

**Interfaces:**

- Consumes: built `packages/ui/dist` (`index.js`, `index.d.ts`, `styles.css`).
- Produces: `@fish-admin/docs` package with `rspress dev|build|preview` scripts; `SITE` and `UI_TEXT` from `apps/docs/site.ts`.

- [ ] **Step 1: Add `apps/*` to the workspace and install Rspress**

`pnpm-workspace.yaml`:

```yaml
packages:
  - '.'
  - 'packages/*'
  - 'apps/*'
```

Create `apps/docs/package.json` exactly:

```json
{
  "name": "@fish-admin/docs",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "sync:template": "node scripts/sync-template-docs.mjs",
    "predev": "pnpm sync:template && pnpm --filter @fish-admin/react build",
    "dev": "rspress dev",
    "prebuild": "pnpm sync:template && pnpm --filter @fish-admin/react build",
    "build": "rspress build",
    "preview": "rspress preview",
    "pretypecheck": "pnpm --filter @fish-admin/react build",
    "typecheck": "tsc --noEmit",
    "check": "node scripts/check-docs.mjs"
  },
  "dependencies": {
    "@fish-admin/react": "workspace:*",
    "@tanstack/react-table": "^8.21.3",
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  },
  "devDependencies": {
    "@rspress/core": "2.0.23",
    "@types/node": "^22.20.5",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "typescript": "^5.9.3",
    "vite": "^8.3.4"
  }
}
```

Run `pnpm install`. Expected: lockfile gains `@rspress/core@2.0.23`, `@rspress/shared@2.0.23`, `flexsearch`; `apps/docs/node_modules/@fish-admin/react` is a symlink.

- [ ] **Step 2: Write the site config**

`apps/docs/rspress.config.ts`:

```ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from '@rspress/core'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.join(root, 'docs'),
  outDir: path.join(root, 'doc_build'),
  title: 'FishAdmin UI',
  description: '83 React components and a production-shaped admin template.',
  lang: 'en',
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'FishAdmin UI',
      description: '83 React components and a production-shaped admin template.',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'FishAdmin UI',
      description: '83 个 React 组件与一套可直接运行的中后台模板。',
    },
  ],
  themeConfig: {
    darkMode: true,
    search: true,
    socialLinks: [
      { icon: 'github', mode: 'link', content: 'https://github.com/flyingfishzxf/fish-admin' },
    ],
    footer: {
      message:
        'MIT Licensed · <a href="https://fish-admin.vercel.app" target="_blank" rel="noreferrer">Live demo</a> · Vue 3 planned',
    },
  },
  globalStyles: path.join(root, 'theme/styles/index.css'),
  markdown: {
    link: { checkDeadLinks: true, checkAnchors: false, autoPrefix: true },
  },
  ssg: true,
  builderConfig: {
    resolve: {
      alias: {
        '@docs': root,
      },
    },
  },
})
```

`builderConfig.resolve.alias` is Rsbuild's alias surface; verify with a build that `@docs/site` resolves. If Rsbuild rejects the shape, move the alias into `source.alias` and record it.

- [ ] **Step 3: Write `site.ts` and docs CSS**

`apps/docs/site.ts`:

```ts
export const SITE = {
  githubUrl: 'https://github.com/flyingfishzxf/fish-admin',
  demoUrl: 'https://fish-admin.vercel.app',
  packageName: '@fish-admin/react',
  repoBranch: 'main',
} as const

export type DocsLang = 'en' | 'zh'

export const UI_TEXT: Record<DocsLang, Record<string, string>> = {
  en: {
    demoPreview: 'Preview',
    demoSource: 'Source',
    demoUsedIn: 'Used in the template',
    demoViewSource: 'View source',
    docsPending: 'Documentation in progress',
    categoryPrimitive: 'Primitive',
    categoryEnterprise: 'Enterprise',
    categoryPro: 'Pro',
    componentCount: 'components',
    apiProps: 'Props',
    apiName: 'Name',
    apiType: 'Type',
    apiDefault: 'Default',
    apiRequired: 'Required',
    apiDescription: 'Description',
    apiUnresolved: 'Inherited or generated types',
    apiNone: 'No public props.',
    templatePathNote: 'The live template requires the demo account shown on the login page.',
  },
  zh: {
    demoPreview: '预览',
    demoSource: '源码',
    demoUsedIn: '在模板中的用法',
    demoViewSource: '查看源码',
    docsPending: '文档撰写中',
    categoryPrimitive: '基础组件',
    categoryEnterprise: '企业组件',
    categoryPro: 'Pro 组件',
    componentCount: '个组件',
    apiProps: '属性',
    apiName: '名称',
    apiType: '类型',
    apiDefault: '默认值',
    apiRequired: '必填',
    apiDescription: '说明',
    apiUnresolved: '继承或生成的类型',
    apiNone: '没有公开属性。',
    templatePathNote: '在线模板需要登录页提供的演示账号。',
  },
}

export function uiText(lang: string): Record<string, string> {
  return UI_TEXT[lang === 'zh' ? 'zh' : 'en']
}

export function templatePath(usedIn: string): string {
  return usedIn.replace(/\/\$id$/, '')
}

export function demoSourceUrl(filename: string): string {
  return `${SITE.githubUrl}/blob/${SITE.repoBranch}/apps/docs/${filename}`
}
```

`apps/docs/theme/styles/index.css`:

```css
@import '@fish-admin/react/styles.css';

.fish-demo {
  margin: 1.5rem 0 2.5rem;
}

.fish-demo__header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.fish-demo__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.fish-demo__links {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
}

.fish-demo__links a {
  color: var(--rp-c-link);
  text-decoration: none;
}

.fish-demo__links a:hover {
  text-decoration: underline;
}

.fish-demo__preview {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--card-foreground);
  overflow-x: auto;
}

.fish-demo__source {
  margin-top: 0.75rem;
}

.fish-demo__placeholder {
  color: var(--muted-foreground);
  font-size: 0.9rem;
}

.fish-demo-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 28rem;
}

.fish-demo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.fish-demo-label {
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.fish-demo-muted {
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.fish-demo-w-72 {
  width: 18rem;
  max-width: 100%;
}

.fish-index {
  display: grid;
  gap: 2rem;
}

.fish-index__group h2 {
  margin-bottom: 0.5rem;
}

.fish-index__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.5rem;
}

.fish-index__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--card-foreground);
  text-decoration: none;
}

.fish-index__item:hover {
  border-color: var(--primary);
}

.fish-index__item[data-pending='true'] {
  opacity: 0.65;
}

.fish-index__name {
  font-weight: 500;
}

.fish-index__note {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.fish-api {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.fish-api th,
.fish-api td {
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}

.fish-api th {
  font-weight: 600;
  white-space: nowrap;
}

.fish-api code {
  white-space: pre-wrap;
  word-break: break-word;
}

.fish-api-note {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

@media (max-width: 640px) {
  .fish-demo__preview {
    padding: 1rem;
  }
}
```

- [ ] **Step 4: Write the bilingual home pages and nav/sidebar files**

`apps/docs/docs/en/index.md`:

```md
---
pageType: home
hero:
  name: FishAdmin UI
  text: React components for enterprise admin apps
  tagline: npm install @fish-admin/react
  actions:
    - theme: brand
      text: Browse components
      link: /components
    - theme: alt
      text: Live template
      link: https://fish-admin.vercel.app
    - theme: alt
      text: GitHub
      link: https://github.com/flyingfishzxf/fish-admin
features:
  - title: 83 documented components
    details: 47 primitives, 30 enterprise patterns and 6 pro components, all exported from one barrel.
  - title: Built for admin work
    details: Tables, forms, filters and detail pages that already behave like the template's business screens.
  - title: Theme and locale aware
    details: One UIProvider drives light/dark, English and Chinese, including date formatting.
  - title: Template included
    details: Every component page links to a real screen in the public demo, so examples are not screenshots.
---
```

`apps/docs/docs/zh/index.md` mirrors it:

```md
---
pageType: home
hero:
  name: FishAdmin UI
  text: 面向企业级中后台的 React 组件库
  tagline: npm install @fish-admin/react
  actions:
    - theme: brand
      text: 浏览组件
      link: /components
    - theme: alt
      text: 在线模板
      link: https://fish-admin.vercel.app
    - theme: alt
      text: GitHub
      link: https://github.com/flyingfishzxf/fish-admin
features:
  - title: 83 个组件都有文档
    details: 47 个基础组件、30 个企业组件、6 个 Pro 组件，全部从一个入口导出。
  - title: 为中后台而生
    details: 表格、表单、筛选与详情页的行为和模板业务页一致，不是静态截图。
  - title: 主题与语言
    details: 一个 UIProvider 同时驱动深浅色、中英文和日期格式。
  - title: 附带完整模板
    details: 每个组件页都链到公开演示里的真实业务页，可直接对照。
---
```

`apps/docs/docs/en/_nav.json`:

```json
[
  { "text": "Guide", "link": "/guide/installation" },
  { "text": "Components", "link": "/components" },
  { "text": "Template", "link": "/template" },
  { "text": "Versions", "link": "/versions" }
]
```

`apps/docs/docs/zh/_nav.json`:

```json
[
  { "text": "指南", "link": "/guide/installation" },
  { "text": "组件", "link": "/components" },
  { "text": "模板", "link": "/template" },
  { "text": "版本", "link": "/versions" }
]
```

`apps/docs/docs/en/_meta.json`:

```json
[
  { "type": "dir", "name": "guide" },
  { "type": "dir", "name": "components" },
  { "type": "dir", "name": "template" },
  "versions"
]
```

`apps/docs/docs/zh/_meta.json` is identical; labels come from page frontmatter.

- [ ] **Step 5: Add ignores, Docker manifest copy and root scripts**

`.gitignore` append:

```
apps/docs/doc_build
apps/docs/.rspress
apps/docs/docs/en/template
apps/docs/docs/zh/template
```

`.prettierignore` append the same four lines plus `apps/docs/generated`.
`eslint.config.js` ignores append `'apps/docs/doc_build'`, `'apps/docs/generated'`, `'apps/docs/docs/*/template'`.

`Dockerfile` after the existing `COPY packages/ui/package.json` line:

```dockerfile
COPY apps/docs/package.json ./apps/docs/package.json
```

Root `package.json` scripts add:

```json
"docs:dev": "pnpm --filter @fish-admin/docs dev",
"docs:build": "pnpm --filter @fish-admin/docs build",
"docs:preview": "pnpm --filter @fish-admin/docs preview",
"docs:check": "pnpm --filter @fish-admin/docs check",
"gen-api": "node scripts/gen-api.mjs",
"gen-api:check": "node scripts/gen-api.mjs --check",
"test:docs": "pnpm docs:build && playwright test -c playwright.docs.config.ts"
```

- [ ] **Step 6: Build the skeleton and verify**

Run: `pnpm docs:build`
Expected: `apps/docs/doc_build/index.html`, `apps/docs/doc_build/zh/index.html`, `static/search_index.en.*.json`, `static/search_index.zh.*.json`; no dead-link errors; no literal import text.

Run: `node -e "const h=require('fs').readFileSync('apps/docs/doc_build/index.html','utf8');console.log(h.includes('FishAdmin UI'),h.includes('npm install @fish-admin/react'))"`
Expected: `true true`.

Run: `pnpm docs:preview --port 4173` then open `http://localhost:4173/` and `http://localhost:4173/zh/` in a real browser. Expected: hero renders, nav switches languages, dark toggle works, search button opens.

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/docs package.json Dockerfile .gitignore .prettierignore eslint.config.js
git commit -m "feat(docs): scaffold the bilingual Rspress site"
```

---

### Task 2: Registry generation, component index and guide pages

**Files:**

- Create: `scripts/gen-api.mjs`
- Create: `scripts/gen-api-floor.json`
- Create: `apps/docs/generated/registry.json`, `apps/docs/generated/api.json`
- Create: `apps/docs/demos/registry.json`, `apps/docs/demos/registry.ts`
- Create: `apps/docs/theme/ComponentIndex.tsx`, `apps/docs/theme/ApiTable.tsx`
- Create: `apps/docs/docs/{en,zh}/guide/{_meta.json,installation.md,quick-start.md,theming.md}`
- Create: `apps/docs/docs/{en,zh}/components/{_meta.json,index.md}`
- Create: `apps/docs/docs/{en,zh}/versions.md`
- Modify: `package.json` (root devDependency `react-docgen-typescript`)

**Interfaces:**

- Produces: `registry.json` entries `{ id, name, category, usedIn, isNew }`; `api.json` entries keyed by component id; `DEMOS: DemoMeta[]` typed from `demos/registry.json`.
- `ApiTable` prop: `{ component: string }`. `ComponentIndex` prop: none.

- [ ] **Step 1: Install the docgen dependency**

Run: `pnpm add -Dw react-docgen-typescript@^2.4.0`
Expected: root `package.json` devDependencies gains the entry; lockfile updates.

- [ ] **Step 2: Write `scripts/gen-api.mjs`**

The script has three jobs, all deterministic:

```js
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = path.join(repoRoot, 'src/config/components.ts')
const uiRoot = path.join(repoRoot, 'packages/ui/src')
const outDir = path.join(repoRoot, 'apps/docs/generated')

const MAIN_EXPORT = {
  chart: 'ChartContainer',
  'input-otp': 'InputOTP',
  resizable: 'ResizablePanelGroup',
  sonner: 'Toaster',
}

function readRegistry() {
  const source = fs.readFileSync(configPath, 'utf8')
  const start = source.indexOf('export const COMPONENTS')
  const end = source.indexOf('export const COMPONENT_COUNTS')
  if (start === -1 || end === -1) throw new Error('COMPONENTS block not found')
  const block = source.slice(start, end)
  return [...block.matchAll(/\{([^}]*)\}/g)].map((match) => {
    const body = match[1]
    const get = (key) => (body.match(new RegExp(`${key}: '([^']*)'`)) || [])[1]
    const id = get('id')
    const name = get('name')
    const category = get('category')
    const usedIn = get('usedIn')
    if (!id || !name || !category || !usedIn) throw new Error(`Bad entry: ${body}`)
    return {
      id,
      name,
      category,
      usedIn,
      isNew: /isNew: true/.test(body),
    }
  })
}

function componentFile(id) {
  const candidates = [
    path.join(uiRoot, 'components/ui', `${id}.tsx`),
    path.join(uiRoot, 'components/enterprise', id, `${id}.tsx`),
    path.join(uiRoot, 'components/pro', id, `${id}.tsx`),
  ]
  return candidates.find((candidate) => fs.existsSync(candidate))
}

const UNRESOLVED = {
  button: ['Inherits native button attributes (React.ButtonHTMLAttributes<HTMLButtonElement>).'],
  'pro-table': ['The table instance prop comes from @tanstack/react-table; see its Table API.'],
}

function buildApi() {
  const docgen = require('react-docgen-typescript')
  const registry = readRegistry()
  const docs = {}
  const parser = docgen.withCustomConfig(path.join(repoRoot, 'packages/ui/tsconfig.json'), {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    propFilter: (prop) =>
      !prop.parent || !String(prop.parent.fileName ?? '').includes('node_modules'),
  })

  for (const entry of registry) {
    const file = componentFile(entry.id)
    if (!file) throw new Error(`Missing source for ${entry.id}`)
    let parsed = []
    let extractError = null
    try {
      parsed = parser.parse(file)
    } catch (error) {
      extractError = error instanceof Error ? error.message : String(error)
    }
    const wanted = MAIN_EXPORT[entry.id] ?? entry.name.replace(/[^A-Za-z0-9]/g, '')
    const doc = parsed.find((item) => item.displayName === wanted) ?? parsed[0]
    const props = (doc?.props ?? []).map((prop) => ({
      name: prop.name,
      type: prop.type?.name ?? 'unknown',
      required: Boolean(prop.required),
      defaultValue: prop.defaultValue?.value ?? null,
      description: prop.description ?? '',
    }))
    const events = props.filter((prop) => /^on[A-Z]/.test(prop.name) && prop.type.includes('=>'))
    const slots = props.some((prop) => prop.name === 'children') ? ['children'] : []
    const unresolved = [...(UNRESOLVED[entry.id] ?? [])]
    if (extractError) unresolved.push(`Docgen could not parse this file: ${extractError}`)
    if (!doc) unresolved.push('The component declaration could not be resolved.')
    docs[entry.id] = {
      name: entry.name,
      exportName: doc?.displayName ?? wanted,
      source: path.relative(repoRoot, file).split(path.sep).join('/'),
      props: props.filter((prop) => !events.some((event) => event.name === prop.name)),
      events,
      slots,
      unresolved,
    }
  }
  return {
    version: 1,
    components: Object.fromEntries(registry.map((entry) => [entry.id, docs[entry.id]])),
  }
}

function coverage(api) {
  const all = Object.values(api.components).flatMap((component) => component.props)
  const documented = all.filter((prop) => prop.description.trim().length > 0)
  return all.length === 0 ? 0 : documented.length / all.length
}

function writeOrCheck(file, value) {
  const next = `${JSON.stringify(value, null, 2)}\n`
  if (process.argv.includes('--check')) {
    const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    if (previous !== next) {
      console.error(`::error::${path.relative(repoRoot, file)} is stale; run pnpm gen-api`)
      process.exit(1)
    }
    return
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, next)
}

const registry = readRegistry()
if (registry.length !== 83) throw new Error(`Expected 83 components, found ${registry.length}`)
writeOrCheck(path.join(outDir, 'registry.json'), { version: 1, components: registry })

const api = buildApi()
writeOrCheck(path.join(outDir, 'api.json'), api)

const ratio = coverage(api)
const floorFile = path.join(repoRoot, 'scripts/gen-api-floor.json')
const floor = JSON.parse(fs.readFileSync(floorFile, 'utf8')).propsDocumentedRatio
console.log(
  `API coverage: ${(ratio * 100).toFixed(2)}% of props have JSDoc (floor ${(floor * 100).toFixed(2)}%)`,
)
if (ratio + 1e-9 < floor) {
  console.error('::error::API documentation coverage fell below the committed floor')
  process.exit(1)
}
```

`scripts/gen-api-floor.json` starts at the measured value:

```json
{
  "propsDocumentedRatio": 0
}
```

Run: `pnpm gen-api`
Expected: two committed JSON files, 83 component entries in each, no crash. If a component file fails docgen, it still appears with an `unresolved` note.

Run: `pnpm gen-api:check`
Expected: exit 0.

- [ ] **Step 3: Write the demo registry skeleton**

`apps/docs/demos/registry.json` starts with the six pilot demos; each entry has:

```json
{
  "id": "button/basic",
  "component": "button",
  "file": "demos/button/basic.tsx",
  "title": { "en": "Basic usage", "zh": "基础用法" },
  "description": {
    "en": "The default button, plus the outline and ghost variants.",
    "zh": "默认按钮，以及描边和幽灵两种变体。"
  }
}
```

The six ids are `button/basic`, `button/states`, `pro-table/basic`, `pro-table/selection`, `date-range-picker/basic`, `date-range-picker/presets`.

`apps/docs/demos/registry.ts`:

```ts
import raw from './registry.json'

export interface DemoMeta {
  id: string
  component: string
  file: string
  title: { en: string; zh: string }
  description: { en: string; zh: string }
}

export const DEMOS = raw as DemoMeta[]

export function demoFor(filename: string): DemoMeta | undefined {
  return DEMOS.find((demo) => demo.file === filename)
}
```

- [ ] **Step 4: Write `ComponentIndex` and `ApiTable`**

`apps/docs/theme/ComponentIndex.tsx`:

```tsx
import { Link, useLang } from '@rspress/core/runtime'
import registry from '@docs/generated/registry.json'
import { uiText } from '@docs/site'

const DOCUMENTED = new Set(['button', 'pro-table', 'date-range-picker'])
const CATEGORY_ORDER = ['primitive', 'enterprise', 'pro'] as const

export default function ComponentIndex() {
  const lang = useLang()
  const text = uiText(lang)
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    label:
      category === 'primitive'
        ? text.categoryPrimitive
        : category === 'enterprise'
          ? text.categoryEnterprise
          : text.categoryPro,
    items: registry.components.filter((entry) => entry.category === category),
  }))

  return (
    <div className="fish-index">
      {groups.map((group) => (
        <section className="fish-index__group" key={group.category}>
          <h2>
            {group.label}{' '}
            <span className="fish-index__note">
              {group.items.length} {text.componentCount}
            </span>
          </h2>
          <div className="fish-index__grid">
            {group.items.map((entry) =>
              DOCUMENTED.has(entry.id) ? (
                <Link className="fish-index__item" href={`/components/${entry.id}`} key={entry.id}>
                  <span className="fish-index__name">{entry.name}</span>
                  {entry.isNew ? <span className="fish-index__note">new</span> : null}
                </Link>
              ) : (
                <span className="fish-index__item" data-pending="true" key={entry.id}>
                  <span className="fish-index__name">{entry.name}</span>
                  <span className="fish-index__note">{text.docsPending}</span>
                </span>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
```

`useLang` is exported from `@rspress/core/runtime`, not theme; import `Link` from `@rspress/core/runtime` as well if theme does not re-export it. Verify the import path at build time.

`apps/docs/theme/ApiTable.tsx`:

```tsx
import api from '@docs/generated/api.json'
import { useLang } from '@rspress/core/runtime'
import { uiText } from '@docs/site'

type ApiComponent = {
  name: string
  exportName: string
  props: Array<{
    name: string
    type: string
    required: boolean
    defaultValue: string | null
    description: string
  }>
  events: Array<{ name: string; type: string; description: string }>
  slots: string[]
  unresolved: string[]
}

export default function ApiTable({ component }: { component: string }) {
  const lang = useLang()
  const text = uiText(lang)
  const entry = (api.components as Record<string, ApiComponent>)[component]
  if (!entry) return <p className="fish-demo__placeholder">Unknown component: {component}</p>
  const rows = [...entry.props, ...entry.events]
  return (
    <div>
      <h3>
        {entry.name} <code>{entry.exportName}</code>
      </h3>
      {rows.length === 0 ? (
        <p className="fish-demo__placeholder">{text.apiNone}</p>
      ) : (
        <table className="fish-api">
          <thead>
            <tr>
              <th>{text.apiName}</th>
              <th>{text.apiType}</th>
              <th>{text.apiDefault}</th>
              <th>{text.apiRequired}</th>
              <th>{text.apiDescription}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((prop) => (
              <tr key={prop.name}>
                <td>
                  <code>{prop.name}</code>
                </td>
                <td>
                  <code>{prop.type}</code>
                </td>
                <td>
                  {'defaultValue' in prop && prop.defaultValue ? (
                    <code>{prop.defaultValue}</code>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{'required' in prop && prop.required ? 'yes' : '—'}</td>
                <td>{prop.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {entry.slots.length > 0 ? (
        <p className="fish-api-note">Slots: {entry.slots.join(', ')}</p>
      ) : null}
      {entry.unresolved.length > 0 ? (
        <div className="fish-api-note">
          <strong>{text.apiUnresolved}</strong>
          <ul>
            {entry.unresolved.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 5: Write the guide pages and component index pages**

Every page imports its components immediately after frontmatter, before the first heading.

`apps/docs/docs/en/guide/_meta.json`: `["installation", "quick-start", "theming"]`; zh identical.

`apps/docs/docs/en/components/_meta.json`:

```json
["index", "button", "pro-table", "date-range-picker"]
```

zh identical.

`apps/docs/docs/en/components/index.md`:

```md
---
title: Components
description: All 83 components in @fish-admin/react.
---

import ComponentIndex from '@docs/theme/ComponentIndex'

# Components

83 components ship from one barrel. Three pages are live in this milestone; the rest arrive in
the next waves. Every listed component can already be imported from `@fish-admin/react`.

<ComponentIndex />
```

`apps/docs/docs/zh/components/index.md` mirrors with a Chinese intro and `title: 组件`.

Guide pages required content:

- `installation.md` — install command, peer React 19, `import '@fish-admin/react/styles.css'`, `UIProvider` snippet, ESM-only note, Tailwind 4 `@source` note, browser support. Both languages.
- `quick-start.md` — a first page using `Button` and `Card`, with a runnable code block; note that `UIProvider` supplies locale and theme. Both languages.
- `theming.md` — tokens list (`--background`, `--primary`, `--radius`), `.dark` class, accent attribute (`data-accent="cyan"`), and the statement that tokens are the design contract. Both languages.
- `versions.md` — package `0.1.0` in development, template `1.7.0`, docs M1; links to GitHub releases and `/CHANGELOG.md` on GitHub. State clearly that no npm publish has happened yet. Both languages.

RBAC caveat: the quick-start or installation page includes one sentence: hiding UI is not access control; keep authorization on the server. Both languages.

- [ ] **Step 6: Build and verify the index**

Run: `pnpm gen-api && pnpm docs:build`
Expected: build succeeds; `doc_build/components/index.html` contains 83 entries and exactly 3 links; `doc_build/zh/components/index.html` is present.

Run: `node -e "const r=require('./apps/docs/generated/registry.json');const a=require('./apps/docs/generated/api.json');console.log(r.components.length,Object.keys(a.components).length)"`
Expected: `83 83`.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/gen-api.mjs scripts/gen-api-floor.json apps/docs
git commit -m "feat(docs): generate the component registry and API metadata"
```

---

### Task 3: Demo infrastructure and the three pilot pages

**Files:**

- Create: `apps/docs/theme/Demo.tsx`
- Create: `apps/docs/demos/data/members.ts`
- Create: six demo modules under `apps/docs/demos/{button,pro-table,date-range-picker}/`
- Create: `apps/docs/docs/{en,zh}/components/{button,pro-table,date-range-picker}.md`

**Interfaces:**

- `Demo` props: `{ title: string; source: string; filename: string; children: React.ReactNode }`.
- Demo files default-export a React component; raw source is imported by the page with `?raw`.
- Registry `file` values match the `filename` prop and the raw import path.

- [ ] **Step 1: Write `Demo.tsx`**

```tsx
import type { ReactNode } from 'react'

import { UIProvider } from '@fish-admin/react'
import { useLang } from '@rspress/core/runtime'
import { CodeBlockRuntime, useThemeState } from '@rspress/core/theme'

import { demoFor } from '@docs/demos/registry'
import registry from '@docs/generated/registry.json'
import { SITE, demoSourceUrl, templatePath, uiText } from '@docs/site'

export interface DemoProps {
  title: string
  source: string
  filename: string
  children: ReactNode
}

export default function Demo({ title, source, filename, children }: DemoProps) {
  const lang = useLang()
  const [theme] = useThemeState()
  const text = uiText(lang)
  const meta = demoFor(filename)
  const component = meta
    ? registry.components.find((entry) => entry.id === meta.component)
    : undefined

  return (
    <section className="fish-demo" data-demo={meta?.id ?? filename}>
      <header className="fish-demo__header">
        <h3 className="fish-demo__title">{title}</h3>
        <div className="fish-demo__links">
          {component ? (
            <a
              href={`${SITE.demoUrl}${templatePath(component.usedIn)}`}
              target="_blank"
              rel="noreferrer"
            >
              {text.demoUsedIn}
            </a>
          ) : null}
          <a href={demoSourceUrl(filename)} target="_blank" rel="noreferrer">
            {text.demoViewSource}
          </a>
        </div>
      </header>
      <div className="fish-demo__preview">
        <UIProvider locale={lang === 'zh' ? 'zh-CN' : 'en'} theme={theme}>
          {children}
        </UIProvider>
      </div>
      <div className="fish-demo__source">
        <CodeBlockRuntime lang="tsx" code={source} title={filename} />
      </div>
    </section>
  )
}
```

`useThemeState` returns `'light' | 'dark'` and satisfies the package's `UITheme` prop. If `CodeBlockRuntime` breaks SSG, replace it with `<pre><code>{source}</code></pre>` and record the deviation; do not set `ssg: false`.

- [ ] **Step 2: Write the six demos**

`apps/docs/demos/data/members.ts`:

```ts
export interface DemoMember {
  id: string
  name: string
  team: 'engineering' | 'design' | 'product'
  status: 'active' | 'invited'
  joined: string
}

export const MEMBERS: DemoMember[] = [
  { id: 'm-1', name: 'Ada Lovelace', team: 'engineering', status: 'active', joined: '2025-01-12' },
  { id: 'm-2', name: 'Grace Hopper', team: 'engineering', status: 'active', joined: '2024-11-03' },
  { id: 'm-3', name: 'Alan Turing', team: 'product', status: 'invited', joined: '2025-06-21' },
  { id: 'm-4', name: 'Katherine Johnson', team: 'design', status: 'active', joined: '2025-03-18' },
  {
    id: 'm-5',
    name: 'Edsger Dijkstra',
    team: 'engineering',
    status: 'invited',
    joined: '2025-05-30',
  },
]
```

`button/basic.tsx`:

```tsx
import { Button } from '@fish-admin/react'

export default function ButtonBasic() {
  return (
    <div className="fish-demo-row">
      <Button>Create project</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="outline">Export</Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  )
}
```

`button/states.tsx`:

```tsx
import { Button, Spinner } from '@fish-admin/react'

export default function ButtonStates() {
  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="fish-demo-row">
        <Button disabled>Disabled</Button>
        <Button>
          <Spinner className="size-4" />
          Loading
        </Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  )
}
```

`date-range-picker/basic.tsx`:

```tsx
import { useState } from 'react'

import { DateRangePicker, type DateRangeValue } from '@fish-admin/react'

export default function DateRangePickerBasic() {
  const [value, setValue] = useState<DateRangeValue>({})
  return (
    <div className="fish-demo-stack">
      <DateRangePicker
        value={value}
        onChange={setValue}
        placeholder="Filter by date"
        ariaLabel="Report date range"
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted">
        From {value.from ?? '—'} to {value.to ?? '—'}
      </p>
    </div>
  )
}
```

`date-range-picker/presets.tsx`:

```tsx
import { useState } from 'react'

import { DateRangePicker, type DateRangePreset, type DateRangeValue } from '@fish-admin/react'

const PRESETS: DateRangePreset[] = [
  { label: 'Last 7 days', from: '2026-10-21', to: '2026-10-27' },
  { label: 'Last 30 days', from: '2026-09-28', to: '2026-10-27' },
  { label: 'This quarter', from: '2026-10-01', to: '2026-10-27' },
]

export default function DateRangePickerPresets() {
  const [value, setValue] = useState<DateRangeValue>({ from: '2026-09-28', to: '2026-10-27' })
  return (
    <div className="fish-demo-stack">
      <DateRangePicker
        value={value}
        onChange={setValue}
        placeholder="Select a range"
        ariaLabel="Audit log date range"
        presets={PRESETS}
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted">
        Selected {value.from ?? '—'} – {value.to ?? '—'}
      </p>
    </div>
  )
}
```

`pro-table/basic.tsx`:

```tsx
import { useMemo, useState } from 'react'

import { ProTable } from '@fish-admin/react'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { MEMBERS, type DemoMember } from '../data/members'

const columnHelper = createColumnHelper<DemoMember>()

export default function ProTableBasic() {
  const [search, setSearch] = useState('')
  const rows = useMemo(
    () =>
      MEMBERS.filter((member) => member.name.toLowerCase().includes(search.trim().toLowerCase())),
    [search],
  )
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Member' }),
      columnHelper.accessor('team', { header: 'Team' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('joined', { header: 'Joined' }),
    ],
    [],
  )
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <ProTable
      table={table}
      empty={<p className="fish-demo-muted">No members match this search.</p>}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: 'Search members',
        ariaLabel: 'Search members',
        clearLabel: 'Clear search',
      }}
    />
  )
}
```

`pro-table/selection.tsx` adds `rowSelection` state, a select column with `Checkbox`, `enableRowSelection: true`, and a `selection` config showing the count. It must use `useReactTable` with `state: { rowSelection }` and `onRowSelectionChange`. Selection column:

```tsx
{
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
      aria-label="Select all rows"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(checked) => row.toggleSelected(checked === true)}
      aria-label={`Select ${row.original.name}`}
    />
  ),
  size: 36,
}
```

and:

```tsx
selection={{
  count: selectedCount,
  label: selectedCount === 1 ? 'row selected' : 'rows selected',
  clearLabel: 'Clear selection',
  onClear: () => setRowSelection({}),
}}
```

- [ ] **Step 3: Write the three bilingual pilot pages**

Each page has this structure (English; the Chinese page mirrors every heading):

```md
---
title: Button
description: Trigger an action with a button that matches the template's density and states.
---

import Demo from '@docs/theme/Demo'
import ApiTable from '@docs/theme/ApiTable'
import ButtonBasic from '@docs/demos/button/basic'
import basicSource from '@docs/demos/button/basic.tsx?raw'
import ButtonStates from '@docs/demos/button/states'
import statesSource from '@docs/demos/button/states.tsx?raw'

# Button

Buttons trigger an action. Use one primary button per region; secondary actions stay quieter.

## When to use

- Submitting a form or confirming a dialog.
- Moving to the next step of a wizard.
- Triggering an inline action in a table row or toolbar.

## When not to use

- Navigating between pages: use a link.
- Choosing among mutually exclusive options: use `Radio Group` or `Segmented`.
- Destructive actions that need confirmation: pair the button with `Alert Dialog`.

## Basic usage

<Demo title="Basic usage" filename="demos/button/basic.tsx" source={basicSource}>
  <ButtonBasic />
</Demo>

## Variants and states

<Demo title="Variants, sizes and disabled states" filename="demos/button/states.tsx" source={statesSource}>
  <ButtonStates />
</Demo>

## API

<ApiTable component="button" />

## Design guidance

- Default height is 36 px; `size="sm"` is 32 px and `size="lg"` is 40 px.
- Use `variant="destructive"` only for irreversible actions.
- Keep the label short and verb-first: "Create project", not "OK".
- Icon-only buttons need an accessible name.

## Accessibility

| Key           | Behavior                         |
| ------------- | -------------------------------- |
| Enter / Space | Activates the focused button.    |
| Tab           | Moves focus to the next control. |

The underlying element is a native `<button>` unless `asChild` is used. Disabled buttons are
removed from the tab order by the browser; do not rely on a disabled button to explain why an
action is unavailable — render the reason next to it.

Known gap: there is no built-in loading state; pass a spinner as the child and disable the button
yourself, as the second demo does.

## FAQ

**Can I render a link that looks like a button?** Yes — use `asChild` with an `<a>` child, so the
semantics stay a link.

**Why is there no `isLoading` prop?** Loading is usually a page-level concern; composing `Spinner`
keeps the button's layout under your control.

## Related

- `Spinner` for progress that is not tied to a button.
- `Alert Dialog` when the action needs confirmation.
- [Used in the template](https://fish-admin.vercel.app/)
```

`pro-table.md` uses `component="pro-table"` and two demos, with sections for when to use, API, design guidance, accessibility (table semantics, row selection checkboxes, keyboard scroll), FAQ (pagination is controlled by the parent; why ProTable needs a TanStack table), related. `date-range-picker.md` uses `component="date-range-picker"`, two demos, and documents the `YYYY-MM-DD` string contract, locale formatting, and the known gap that presets are not validated against each other.

The Chinese pages keep the same demo ids and section order. API prop names stay English.

- [ ] **Step 4: Build and inspect in a browser**

Run: `pnpm docs:build`
Expected: no MDX "literal import" text; `doc_build/components/button.html` contains `data-demo="button/basic"` and `data-demo="button/states"`.

Run: `pnpm docs:preview --port 4173`, then open `/components/button`, `/components/pro-table`, `/components/date-range-picker` and their `/zh/` twins. Expected: both demos render; the source block shows TSX; "Used in the template" opens the live demo; ProTable search filters rows; the date picker opens and selects a range; dark mode keeps the preview readable; Chinese pages format dates in Chinese.

- [ ] **Step 5: Commit**

```bash
git add apps/docs
git commit -m "feat(docs): add live demos and the first three component pages"
```

---

### Task 4: Template documentation sync

**Files:**

- Create: `apps/docs/scripts/sync-template-docs.mjs`
- Create: `apps/docs/template-index/en.md`, `apps/docs/template-index/zh.md`
- Generate: `apps/docs/docs/{en,zh}/template/*` (gitignored)

**Interfaces:**

- Reads `docs/{en,zh-CN}/*.md` (10 each), writes `apps/docs/docs/{en,zh}/template/<slug>.md` and `index.md`, plus `_meta.json`.
- Rewrites `../../<repo-path>` links to `https://github.com/flyingfishzxf/fish-admin/blob/main/<repo-path>`; keeps `./foo.md` links but strips `.md`; leaves absolute URLs untouched.

- [ ] **Step 1: Write the sync script**

````js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(docsRoot, '../..')
const github = 'https://github.com/flyingfishzxf/fish-admin/blob/main'
const sources = [
  { lang: 'en', dir: 'docs/en', index: 'template-index/en.md' },
  { lang: 'zh', dir: 'docs/zh-CN', index: 'template-index/zh.md' },
]
const exclusions = new Set(['plans', 'superpowers', 'assets'])

function rewriteLinks(markdown) {
  return markdown
    .replace(/\]\(\.\.\/\.\.\/([^)]+)\)/g, (_match, target) => `](${github}/${target})`)
    .replace(
      /\]\(\.\/([^).]+)\.md(#[^)]+)?\)/g,
      (_match, slug, anchor) => `](./${slug}${anchor ?? ''})`,
    )
}

function splitTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)\n+/)
  if (!match) return { title: null, body: markdown }
  return { title: match[1].trim(), body: markdown.slice(match[0].length) }
}

function descriptionOf(body) {
  const paragraph = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find(
      (block) =>
        block &&
        !block.startsWith('#') &&
        !block.startsWith('>') &&
        !block.startsWith('-') &&
        !block.startsWith('|') &&
        !block.startsWith('```'),
    )
  if (!paragraph) return ''
  const plain = paragraph.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '')
  return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain
}

for (const source of sources) {
  const targetDir = path.join(docsRoot, 'docs', source.lang, 'template')
  fs.rmSync(targetDir, { recursive: true, force: true })
  fs.mkdirSync(targetDir, { recursive: true })

  const files = fs
    .readdirSync(path.join(repoRoot, source.dir))
    .filter((file) => file.endsWith('.md'))
    .filter((file) => !exclusions.has(path.basename(file, '.md')))
    .sort()

  const slugs = []
  for (const file of files) {
    const slug = path.basename(file, '.md')
    const raw = fs.readFileSync(path.join(repoRoot, source.dir, file), 'utf8')
    const { title, body } = splitTitle(raw)
    if (!title) throw new Error(`${source.dir}/${file} has no H1`)
    const description = descriptionOf(body)
    const frontmatter = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `description: ${JSON.stringify(description)}`,
      '---',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(targetDir, `${slug}.md`), `${frontmatter}${rewriteLinks(body)}`)
    slugs.push(slug)
  }

  const index = fs.readFileSync(path.join(docsRoot, source.index), 'utf8')
  fs.writeFileSync(path.join(targetDir, 'index.md'), index)
  fs.writeFileSync(
    path.join(targetDir, '_meta.json'),
    `${JSON.stringify(['index', ...slugs], null, 2)}\n`,
  )
  console.log(`synced ${slugs.length} ${source.lang} template pages`)
}
````

The index source files are tracked and explain that these pages describe the template, not the
component library. `template-index/en.md` starts with frontmatter `title: Template` and a short
intro plus links to the live demo and login accounts. `zh.md` mirrors it.

- [ ] **Step 2: Run and verify**

Run: `pnpm --filter @fish-admin/docs sync:template`
Expected: `synced 10 en template pages` and `synced 10 zh template pages`.

Run: `pnpm docs:build`
Expected: `/template` and 10 child pages exist in both languages; no dead links.

Browser check: open `/template` and `/template/tables`; confirm the H1 is not duplicated, code blocks render, and repo links point at GitHub.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/scripts/sync-template-docs.mjs apps/docs/template-index
git commit -m "feat(docs): sync the template documentation into the site"
```

---

### Task 5: `docs:check` structural gate

**Files:**

- Create: `apps/docs/scripts/check-docs.mjs`

**Interfaces:**

- Reads `src/config/components.ts`, `apps/docs/generated/{registry,api}.json`, `apps/docs/demos/registry.json`, `docs/{en,zh-CN}`, and the docs tree.
- Exits non-zero with a list of failures.

- [ ] **Step 1: Write the checker**

Checks, in order:

1. **Registry sync.** Compare ids from `src/config/components.ts` with `generated/registry.json`; must be 83 and identical in order. Compare the id set with `Object.keys(api.components)`.
2. **Demo registry.** Every `file` exists; every demo file under `demos/` is registered; each registered demo's component id exists in the registry.
3. **Pilot pages.** For each of `button`, `pro-table`, `date-range-picker` and each language:
   - page file exists;
   - at least two imports from `@docs/demos/<id>/`;
   - every registered demo for that component is imported;
   - all `import` lines appear before the first line that is not blank, a comment, or an import after the frontmatter;
   - required headings exist (`When to use`/`何时使用`, `API`, `Design guidance`/`设计指引`, `Accessibility`/`无障碍`, `FAQ`, `Related`/`相关`);
   - `<ApiTable component="<id>" />` appears;
   - the number of `<Demo` elements equals the number of registered demos for that component.
4. **Component index.** `docs/{en,zh}/components/index.md` imports `ComponentIndex`; the generated registry has 83 items.
5. **Template pages.** `docs/{en,zh}/template` contains exactly the ten source slugs plus `index.md`, and `_meta.json` lists the same slugs. Titles in the generated pages match the source H1s (read source H1 directly).
6. **Generated files current.** Run the same registry extraction used by `gen-api` and compare `generated/registry.json`; print a hint to run `pnpm gen-api` on mismatch. Leave API comparison to `gen-api --check` in CI, but also fail if `api.json` has fewer than 83 entries or a pilot component is missing.

Implementation notes:

- Use helpers `fail(message)`, `readJson(file)`, `read(file)`, `headingPatterns`.
- Print a summary line `docs:check passed: 83 registry entries, 6 demos, 6 pilot pages, 20 template pages`.
- Exit 1 after printing all failures.

- [ ] **Step 2: Run the checker against the current tree**

Run: `pnpm docs:check`
Expected: exit 0 with the summary. Temporarily delete one demo import from `button.md`, run again, and confirm a precise failure; restore the file.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/scripts/check-docs.mjs
git commit -m "feat(docs): validate structure, demos and generated data"
```

---

### Task 6: Docs end-to-end and accessibility tests

**Files:**

- Create: `playwright.docs.config.ts`
- Create: `e2e-docs/docs.spec.ts`
- Create: `e2e-docs/layout.spec.ts`
- Modify: `package.json` (`test:docs` already added; ensure Playwright is a root devDependency — it is)

**Interfaces:**

- Config serves `apps/docs/doc_build` with `rspress preview --port 4174`.
- Tests run on Chromium; layout tests set 375 × 812.

- [ ] **Step 1: Write the Playwright config**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-docs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/docs' }]],
  use: {
    baseURL: 'http://localhost:4174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm --filter @fish-admin/docs preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
```

`rspress preview` accepts `--port` and `--strictPort`; if `--strictPort` is unsupported, drop it and rely on `url`.

- [ ] **Step 2: Write the content/a11y spec**

Tests:

1. Home renders hero name, the install command, and three hero actions; no console errors.
2. `/components` lists 83 entries and exactly 3 links; all 83 names appear.
3. `/components/button` renders two `[data-demo]` sections; each contains a `button`; source text contains `ButtonBasic`; the "Used in the template" link points at `https://fish-admin.vercel.app/`.
4. ProTable demo: typing in the search box reduces visible rows; selection demo updates the selected count.
5. Date range demo: clicking the trigger opens the calendar; selecting a preset updates the summary.
6. `/zh/components/button` shows Chinese headings and the Chinese demo title.
7. Dark mode: toggle via the appearance button; `<html>` gains the dark class and a preview's computed background changes.
8. Search: open search, type `Button`, expect a result linking to `/components/button`.
9. Axe: `AxeBuilder` on `/`, `/components/button`, `/components/pro-table`, `/components/date-range-picker`, and `/zh/components/button`; expect zero violations (serious and critical at minimum; aim for all).

Use `expect(page.locator('[data-demo="button/basic"]'))` and `page.getByRole('button', { name: ... })`. Rspress search selectors: open with the search button (aria-label or placeholder containing "Search"), then fill the dialog input.

- [ ] **Step 3: Write the layout spec**

For `/`, `/components/button`, `/components/pro-table`, `/components/date-range-picker`, `/zh/components/button`, at 375 × 812:

- `document.documentElement.scrollWidth <= window.innerWidth + 1`;
- no element with `[data-demo]` wider than the viewport;
- the nav opens (hamburger) and the component heading is visible.

- [ ] **Step 4: Run the tests**

Run: `pnpm test:docs`
Expected: all docs tests pass. If axe reports Rspress theme contrast issues, fix them in `theme/styles/index.css` with scoped overrides; do not silence rules.

- [ ] **Step 5: Commit**

```bash
git add playwright.docs.config.ts e2e-docs
git commit -m "test(docs): cover the pilot pages, search, theme and accessibility"
```

---

### Task 7: CI, Dependabot and deployment surface

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/dependabot.yml`
- Create: `apps/docs/vercel.json`
- Modify: `.gitignore` if the build leaves new artifacts

**Interfaces:**

- CI gains a `docs` job (build + check + gen-api check) and a `docs-e2e` job.
- `apps/docs/vercel.json` is deployment configuration only; no project is created.

- [ ] **Step 1: Add the docs CI jobs**

```yaml
docs:
  name: Docs
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 9.1.1
    - uses: actions/setup-node@v4
      with:
        node-version: 24
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm gen-api:check
    - run: pnpm docs:build
    - run: pnpm docs:check

docs-e2e:
  name: Docs E2E
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 9.1.1
    - uses: actions/setup-node@v4
      with:
        node-version: 24
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm exec playwright install --with-deps chromium
    - run: pnpm test:docs
    - if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: docs-playwright-report
        path: playwright-report/docs
        retention-days: 7
```

Also extend the `quality` job's typecheck (already `pnpm typecheck`, which now includes the docs package via Task 8's script change).

- [ ] **Step 2: Extend Dependabot**

```yaml
- package-ecosystem: npm
  directory: /packages/ui
  schedule:
    interval: weekly
    day: monday
    time: '05:00'
  labels:
    - dependencies

- package-ecosystem: npm
  directory: /apps/docs
  schedule:
    interval: weekly
    day: monday
    time: '05:00'
  labels:
    - dependencies
```

- [ ] **Step 3: Write `apps/docs/vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm docs:build",
  "outputDirectory": "doc_build",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

Root = `apps/docs` with “Include files outside of the Root Directory” enabled. The root `vercel.json` belongs to the demo project and must not be reused. Document in the execution record that the project was not created.

- [ ] **Step 4: Verify the local build from the docs directory**

Run: `cd apps/docs && pnpm build`
Expected: succeeds without relying on the root script; `doc_build` is produced.

Run: `pnpm --filter @fish-admin/docs preview --port 4174` and fetch `/`, `/zh/`, `/components/button`, `/static/search_index.en.*.json`.
Expected: 200s and a JSON search index.

- [ ] **Step 5: Commit**

```bash
git add .github apps/docs/vercel.json
git commit -m "ci(docs): build, check and test the documentation site"
```

---

### Task 8: Typecheck integration and full gate run

**Files:**

- Modify: `package.json` (`typecheck`, maybe `format` scope)
- Modify: `apps/docs/tsconfig.json`

**Interfaces:**

- Root `pnpm typecheck` covers the template, `packages/ui`, and `apps/docs`.
- `apps/docs/tsconfig.json` includes `theme`, `demos`, `rspress.config.ts`, `site.ts`, and uses `paths` for `@docs/*` and `resolveJsonModule`.

- [ ] **Step 1: Write the docs tsconfig**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@docs/*": ["./*"]
    },
    "types": ["vite/client", "node"]
  },
  "include": ["theme", "demos", "site.ts", "rspress.config.ts"]
}
```

- [ ] **Step 2: Wire root typecheck**

```json
"typecheck": "tsc --noEmit && pnpm --filter @fish-admin/react typecheck && pnpm --filter @fish-admin/docs typecheck"
```

Run: `pnpm typecheck`
Expected: all three pass. If `@docs/*` aliases fail in `tsc`, add matching `paths` entries (already present) and ensure `baseUrl` resolves from `apps/docs`.

- [ ] **Step 3: Run the full gate set**

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm --filter @fish-admin/react test
pnpm --filter @fish-admin/react build
pnpm check:package
pnpm size
pnpm gen-api:check
pnpm docs:build
pnpm docs:check
pnpm test:docs
```

Expected: all green. `pnpm size` numbers stay within the M0 budgets (firstPaintJs 174.4 → no regression expected; docs changes do not touch the template graph).

If `format:check` fails on generated markdown or builder output, add the directory to `.prettierignore` rather than formatting generated files.

- [ ] **Step 4: Commit**

```bash
git add package.json apps/docs/tsconfig.json
git commit -m "chore: typecheck the docs workspace with the rest of the repo"
```

---

### Task 9: M1 execution record

**Files:**

- Modify: `docs/plans/component-library.md` (M1 “执行记录” section only)

- [ ] **Step 1: Record the verified facts**

Fill the M1 execution record with:

- Rspress version, React version, build time (`time pnpm docs:build`), output size (`du -sh apps/docs/doc_build`), CSS and JS totals, search index sizes.
- Number of pages per language (home, 3 guide, component index, 3 pilots, 10 template, versions = 19 per language).
- Demo count (6) and API entries (83).
- `docs:check` summary and axe results.
- Deviations: docs locale `zh` vs plan's `zh-CN`; six demos instead of two per pilot (meets minimum); `@docs` alias; any Rspress behavior that differed.
- Deployment: local build verified; Vercel project not created (approval-gated); config and Root-directory plan documented; headers unverified until deployment.
- Unverified: real npm consumer install, Vercel preview, full 83-page coverage (M2).

- [ ] **Step 2: Commit**

```bash
git add docs/plans/component-library.md
git commit -m "docs: record the M1 docs-site verification"
```

---

## Self-Review

- **Spec coverage:** Rspress spike (Task 1), `apps/docs` skeleton and bilingual nav (Task 1), demo infrastructure + registry + three pilots (Tasks 2–3), API pipeline + 83 entries + `--check`/coverage floor (Task 2), template docs sync + exclusions (Task 4), structural `docs:check` (Task 5), search/375/axe/dead links (Tasks 5–6), CI/Dependabot/deployment surface (Task 7), typecheck (Task 8), execution record (Task 9).
- **Placeholders:** No “TBD” steps; page prose is authored in Task 3 with required headings and exact demo filenames.
- **Type consistency:** `DemoProps.filename` matches registry `file`; `ApiTable` expects `component` id; `registry.json` shape is used by `ComponentIndex`, `Demo`, and `gen-api`; `uiText(lang)` accepts Rspress `zh` and `en`.
- **Known risk:** Rspress may reject `builderConfig.resolve.alias`. The plan verifies it in Task 1 and records the fallback (`source.alias` or relative imports) if needed.
- **Known risk:** `CodeBlockRuntime` under SSG. The plan keeps `ssg: true` and falls back to a plain `<pre>` if the build fails.

---

## Execution Handoff

Saved to `docs/superpowers/plans/2026-10-27-component-library-m1.md`. Execute inline, one task at a time, verifying each gate before moving on. No commit, publish, tag or Vercel project creation beyond the milestones explicitly authorized.
