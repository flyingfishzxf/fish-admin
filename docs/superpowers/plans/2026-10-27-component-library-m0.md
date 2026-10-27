# M0 组件库抽包 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 FishAdmin 的 83 个注册组件及 5 个支撑模块抽成可独立构建、独立测试、可安装的 `@fish-admin/react` 0.1.0，模板原地成为第一个 consumer。

**Architecture:** 根目录继续作为模板应用（`src/`、`e2e/`、`Dockerfile`、`vercel.json` 不搬家）；新增最小 pnpm workspace（`packages/ui`），`git mv` 保留历史。包内以相对路径互相引用、用自带 `UIProvider` + 57 条文案替换 `react-i18next`，样式拆成 tokens/utilities/base 源文件并产出不含 preflight 的 `dist/styles.css`。模板通过 Vite/TS alias 直接吃包源码（保留 HMR），并用 codemod 把 245 个文件的深路径 import 合并成包名导入。

**Tech Stack:** React 19, TypeScript 5.9, Vite 8 lib mode（preserveModules）, tsc（仅 d.ts）, Tailwind CSS 4 CLI, Vitest + Testing Library, pnpm 9 workspace.

**Spec:** `docs/plans/component-library.md`（M0 章节）

## Global Constraints

- 包名 `@fish-admin/react`，版本 `0.1.0`，ESM-only；React/ReactDOM 为 peer（`^19.0.0`）。
- 包内禁止出现：`@/` 别名、`react-i18next`、`i18next`、`@tanstack/react-router`、`@/stores`、`@/features`。
- 运行时不进包：路由、store、mock、业务代码、zod。
- 包根导出 83 个注册组件 + 其子组件 + `cn` / `getInitials` / `useIsMobile` / `useIsCompact` / i18n API；`data-table`、`page-header`、`date`、`tree`、`csv` 只走 `@fish-admin/react/internal/*`。
- 文案：57 个 key（含 data-table 的 8 个 `table.*`）；en 为默认与回退语言；插值格式 `{{name}}`。
- CSS 产物名固定 `dist/styles.css` 与 `dist/preflight.css`；前者不含 preflight。
- 预算：`firstPaintJs` ≤ 173.4 KB、`largestAsyncJs` ≤ 115 KB、`totalJs` ≤ 800 KB、`totalCss` ≤ 30 KB。
- 基线：单测 86 文件 / 527 条；迁移后根 + 包合计不低于 527。
- 视觉：17 用例 / 19 张基线零 diff；e2e 85 条全绿。
- **不提交、不打 tag、不 publish、不建 Vercel 项目、不改仓库元数据**；本计划的验证点是命令与数字，commit 仅在用户明确要求时执行。
- 所有新增/修改文本文件保持 Prettier 干净（`pnpm format:check`）。

---

## File Structure

```
pnpm-workspace.yaml                     # 新增：. + packages/*（M1 再加 apps/*）
Dockerfile                              # 改：install 前拷 workspace 与子包 manifest
package.json                            # 改：build:ui / test:ui / check:package 脚本
tsconfig.json                           # 改：@fish-admin/react* paths
vite.config.ts                          # 改：包名 alias（精确正则）
vitest.config.ts                        # 不变（根测试只跑模板）
eslint.config.js                        # 改：**/dist 忽略、包内 react-refresh 例外
src/main.tsx                            # 改：包一层 AppUIProvider
src/styles/index.css                    # 改：tokens/utilities 改为引包源文件 + @source
src/components/common/app-ui-provider.tsx  # 新增：模板侧 provider 适配层
scripts/rewrite-ui-imports.mjs          # 新增：包内相对化 + 模板 codemod（一次性）
scripts/gen-ui-barrel.mjs               # 新增：生成包 barrel 与 internal barrel
scripts/extract-ui-messages.mjs         # 新增：从模板 locale 抽取 57 条到包内
scripts/migrate-ui-i18n.mjs             # 新增：组件与测试的 i18n 迁移（一次性）
scripts/check-package.mjs               # 新增：tarball 消费者冒烟
scripts/scaffold.mjs                    # 改：settings-page 的包导入锚点
packages/ui/package.json
packages/ui/tsconfig.json               # typecheck（含 tests）
packages/ui/tsconfig.build.json         # d.ts emit（排除 tests）
packages/ui/vite.config.ts              # lib 多入口 + preserveModules
packages/ui/vitest.config.ts
packages/ui/test/setup.ts
packages/ui/README.md
packages/ui/src/index.ts                # 生成
packages/ui/src/internal/data-table.ts  # 手写
packages/ui/src/internal/page-header.ts # 手写
packages/ui/src/internal/{date,tree,csv}.ts  # 手写 re-export
packages/ui/src/i18n.tsx                # UIProvider / useUITranslation / useUITheme
packages/ui/src/locales/{en,zh-CN}.ts   # 生成（TS 模块，避免 JSON import attribute）
packages/ui/src/styles/{tokens,utilities,base,index,preflight}.css
packages/ui/src/components/{ui,enterprise,pro,data-table,common}/...
packages/ui/src/lib/{utils,date,tree,csv}.ts
packages/ui/src/hooks/use-mobile.ts
```

---

### Task 1: 基线记录 + workspace 骨架

**Files:**

- Create: `pnpm-workspace.yaml`
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/tsconfig.build.json`
- Create: `packages/ui/vite.config.ts`
- Create: `packages/ui/vitest.config.ts`
- Create: `packages/ui/test/setup.ts`
- Modify: `Dockerfile:4-8`
- Modify: `package.json` (scripts)
- Modify: `eslint.config.js`
- Modify: `.gitignore`

**Interfaces:**

- Produces: workspace 能识别 `@fish-admin/react`，`pnpm --filter @fish-admin/react` 可用；后续任务的构建/测试命令入口。

- [ ] **Step 1: 记录基线（写进最终执行记录）**

Run: `pnpm test -- --reporter=dot 2>&1 | tail -12`
Expected: 记录 `Test Files` / `Tests` 数字（预期 86 / 527）。

Run: `pnpm size 2>&1 | tail -20`
Expected: 记录 `firstPaintJs` / `largestAsyncJs` / `totalJs` / `totalCss`（预期 172.4 / 95.6 / 776.0 / 23.0 KB）。

- [ ] **Step 2: 创建 workspace 文件**

`pnpm-workspace.yaml`:

```yaml
packages:
  - '.'
  - 'packages/*'
```

- [ ] **Step 3: 创建 `packages/ui/package.json`**

```json
{
  "name": "@fish-admin/react",
  "version": "0.1.0",
  "description": "FishAdmin UI — React components and design tokens for the FishAdmin admin template.",
  "license": "MIT",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "files": ["dist", "README.md"],
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./styles.css": "./dist/styles.css",
    "./preflight.css": "./dist/preflight.css",
    "./internal/*": { "types": "./dist/internal/*.d.ts", "import": "./dist/internal/*.js" },
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "pnpm build:js && pnpm build:types && pnpm build:css",
    "build:js": "vite build",
    "build:types": "tsc -p tsconfig.build.json",
    "build:css": "tailwindcss -i src/styles/index.css -o dist/styles.css --minify && tailwindcss -i src/styles/preflight.css -o dist/preflight.css --minify",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@tanstack/react-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.4.0",
    "input-otp": "^1.5.0",
    "lucide-react": "^1.60.0",
    "radix-ui": "^1.8.1",
    "react-day-picker": "^10.0.2",
    "react-hook-form": "^7.90.0",
    "react-resizable-panels": "^4.14.8",
    "recharts": "^3.8.0",
    "sonner": "^2.0.8",
    "tailwind-merge": "^3.7.0",
    "vaul": "^1.1.2"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4.3.3",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.8",
    "@types/node": "^22.20.5",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "jsdom": "^30.1.3",
    "tailwindcss": "^4.3.3",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5.9.3",
    "vite": "^8.3.4",
    "vitest": "^5.0.5"
  }
}
```

- [ ] **Step 4: 创建包内 TS/Vite/Vitest 配置**

`packages/ui/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "test", "vite.config.ts", "vitest.config.ts"]
}
```

`packages/ui/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/test"]
}
```

`packages/ui/vite.config.ts`:

```ts
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: {
        index: entry('./src/index.ts'),
        'internal/data-table': entry('./src/internal/data-table.ts'),
        'internal/page-header': entry('./src/internal/page-header.ts'),
        'internal/date': entry('./src/internal/date.ts'),
        'internal/tree': entry('./src/internal/tree.ts'),
        'internal/csv': entry('./src/internal/csv.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) =>
        !id.startsWith('.') &&
        !id.startsWith('/') &&
        !id.startsWith('\0') &&
        !/^[A-Za-z]:[\\/]/.test(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
  },
})
```

`packages/ui/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
```

`packages/ui/test/setup.ts`：逐字复制当前 `src/test/setup.ts` 的内容（jest-dom、cleanup、matchMedia、ResizeObserver、IntersectionObserver、scrollTo、pointer capture、scrollIntoView）。

- [ ] **Step 5: Dockerfile 在 install 前拷入 workspace manifest**

把：

```dockerfile
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

改为：

```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui/package.json ./packages/ui/package.json
RUN pnpm install --frozen-lockfile
```

- [ ] **Step 6: 根 scripts 与忽略规则**

根 `package.json` scripts 增加：

```json
"build:ui": "pnpm --filter @fish-admin/react build",
"test:ui": "pnpm --filter @fish-admin/react test",
"check:package": "node scripts/check-package.mjs"
```

`eslint.config.js` 的 `ignores` 增加 `'**/dist'`、`'scripts/.check-package'`；并把 react-refresh 例外块改为：

```js
{
  files: [
    'src/components/ui/**/*.tsx',
    'src/routes/**/*.tsx',
    'packages/ui/src/components/ui/**/*.tsx',
    'packages/ui/src/i18n.tsx',
  ],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
},
```

`.gitignore` 增加：

```
scripts/.check-package
```

- [ ] **Step 7: 安装并验证 workspace**

Run: `pnpm install`
Expected: lockfile 新增 `packages/ui` importer，无报错。

Run: `pnpm ls -r --depth -1`
Expected: 同时列出 `fish-admin@1.7.0` 与 `@fish-admin/react@0.1.0`。

---

### Task 2: 源码迁入 `packages/ui` + 包内相对化 + barrel

**Files:**

- Create: `scripts/rewrite-ui-imports.mjs`
- Create: `scripts/gen-ui-barrel.mjs`
- Create: `packages/ui/src/internal/data-table.ts`
- Create: `packages/ui/src/internal/page-header.ts`
- Create: `packages/ui/src/internal/{date,tree,csv}.ts`
- Move: `src/components/{ui,enterprise,pro,data-table}`、`src/components/common/page-header.tsx`、`src/lib/{utils,date,tree,csv}.ts`、`src/hooks/use-mobile.ts`

**Interfaces:**

- Consumes: Task 1 的包骨架。
- Produces: `packages/ui/src/index.ts`（全部命名导出，无重名）；`packages/ui/src/internal/*.ts`；包内零 `@/`（测试中的 `@/lib/i18n` 留到 Task 3）。

- [ ] **Step 1: 写 `scripts/rewrite-ui-imports.mjs`（两种模式）**

```js
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const PKG = path.join(root, 'packages/ui/src')
const scope = process.argv.includes('--app') ? 'app' : 'package'

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(file)
  }
  return out
}

function resolveFile(base) {
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  return undefined
}

function packageTarget(specifier) {
  let base
  if (specifier.startsWith('@/components/')) base = path.join(PKG, specifier.slice(2))
  else if (specifier.startsWith('@/lib/')) base = path.join(PKG, 'lib', specifier.slice(6))
  else if (specifier === '@/hooks/use-mobile') base = path.join(PKG, 'hooks/use-mobile')
  else return null
  return resolveFile(base)
}

function appTarget(specifier) {
  if (/^@\/components\/(ui|enterprise|pro)\//.test(specifier)) return '@fish-admin/react'
  if (/^@\/components\/data-table\//.test(specifier)) return '@fish-admin/react/internal/data-table'
  if (specifier === '@/components/common/page-header')
    return '@fish-admin/react/internal/page-header'
  if (specifier === '@/lib/utils' || specifier === '@/hooks/use-mobile') return '@fish-admin/react'
  if (/^@\/lib\/(date|tree|csv)$/.test(specifier))
    return `@fish-admin/react/internal/${specifier.slice(6)}`
  return null
}

function collect(dir) {
  const files = []
  for (const file of walk(dir)) {
    if (
      file.includes(`${path.sep}node_modules${path.sep}`) ||
      file.includes(`${path.sep}dist${path.sep}`)
    )
      continue
    files.push(file)
  }
  return files
}

let changed = 0
let unresolved = 0

for (const file of collect(path.join(root, scope === 'app' ? 'src' : 'packages/ui/src'))) {
  const source = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const imports = []
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const specifier = statement.moduleSpecifier.text
    const target = scope === 'app' ? appTarget(specifier) : packageTarget(specifier)
    if (target === null) {
      if (scope === 'package' && specifier.startsWith('@/')) {
        console.log(`UNRESOLVED ${path.relative(root, file)} -> ${specifier}`)
        unresolved += 1
      }
      continue
    }
    imports.push({ statement, specifier, target })
  }
  if (imports.length === 0) continue

  if (scope === 'package') {
    let next = source
    for (const { statement, target } of imports) {
      let rel = path.relative(path.dirname(file), target).replace(/\\/g, '/')
      if (!rel.startsWith('.')) rel = `./${rel}`
      rel = rel.replace(/\.(ts|tsx)$/, '')
      const specStart = statement.moduleSpecifier.getStart(sf) + 1
      const specEnd = statement.moduleSpecifier.getEnd() - 1
      next = next.slice(0, specStart) + rel + next.slice(specEnd)
    }
    if (next !== source) {
      fs.writeFileSync(file, next)
      changed += 1
    }
    continue
  }

  const first = new Map()
  for (const entry of imports) {
    if (!first.has(entry.target)) first.set(entry.target, entry)
  }
  const merged = new Map()
  for (const { statement, target } of imports) {
    const clause = statement.importClause
    if (
      !clause ||
      clause.name ||
      (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings))
    ) {
      throw new Error(`${file}: unsupported import shape from ${target}`)
    }
    const names = clause.namedBindings
      ? clause.namedBindings.elements.map((element) => element.getText(sf))
      : []
    if (clause.isTypeOnly) names.forEach((_, index) => (names[index] = `type ${names[index]}`))
    if (!merged.has(target)) merged.set(target, [])
    merged.get(target).push(...names)
  }

  const edits = imports
    .map(({ statement, target }, index) => {
      const isFirst = first.get(target).statement === statement
      const text = isFirst
        ? `import { ${[...new Set(merged.get(target))].join(', ')} } from '${target}'`
        : ''
      return { start: statement.getStart(sf), end: statement.getEnd(), text, index }
    })
    .sort((a, b) => b.start - a.start)

  let next = source
  for (const edit of edits) next = next.slice(0, edit.start) + edit.text + next.slice(edit.end)
  if (next !== source) {
    fs.writeFileSync(file, next)
    changed += 1
  }
}

console.log(`${scope}: rewrote ${changed} files; ${unresolved} unresolved aliases remain`)
if (scope === 'package' && unresolved > 0) process.exitCode = 1
```

- [ ] **Step 2: 移动源码（保留历史）**

Run:

```bash
mkdir -p packages/ui/src/components/common packages/ui/src/lib packages/ui/src/hooks
git mv src/components/ui packages/ui/src/components/ui
git mv src/components/enterprise packages/ui/src/components/enterprise
git mv src/components/pro packages/ui/src/components/pro
git mv src/components/data-table packages/ui/src/components/data-table
git mv src/components/common/page-header.tsx packages/ui/src/components/common/page-header.tsx
git mv src/lib/utils.ts packages/ui/src/lib/utils.ts
git mv src/lib/date.ts packages/ui/src/lib/date.ts
git mv src/lib/tree.ts packages/ui/src/lib/tree.ts
git mv src/lib/csv.ts packages/ui/src/lib/csv.ts
git mv src/hooks/use-mobile.ts packages/ui/src/hooks/use-mobile.ts
```

Expected: `src/components/{ui,enterprise,pro,data-table}` 不再存在；测试文件随目录一起迁移。

- [ ] **Step 3: 包内 alias 转相对路径**

Run: `node scripts/rewrite-ui-imports.mjs`
Expected: 输出 `rewrote N files`；`UNRESOLVED` 只允许 18 个 `@/lib/i18n`（测试文件）。

Run: `grep -rn "from '@/" packages/ui/src --include=*.ts --include=*.tsx | grep -v "@/lib/i18n"`
Expected: 无输出。

- [ ] **Step 4: 手写 internal 入口**

`packages/ui/src/internal/data-table.ts`:

```ts
export * from '../components/data-table/column-order'
export * from '../components/data-table/data-table'
export * from '../components/data-table/data-table-pagination'
export * from '../components/data-table/data-table-view-options'
export * from '../components/data-table/sortable-header'
```

`packages/ui/src/internal/page-header.ts`:

```ts
export * from '../components/common/page-header'
```

`packages/ui/src/internal/date.ts`:

```ts
export * from '../lib/date'
```

`packages/ui/src/internal/tree.ts`:

```ts
export * from '../lib/tree'
```

`packages/ui/src/internal/csv.ts`:

```ts
export * from '../lib/csv'
```

- [ ] **Step 5: 写 `scripts/gen-ui-barrel.mjs`**

```js
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const PKG = path.join(root, 'packages/ui/src')

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, out)
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(file)
  }
  return out
}

const modules = [
  ...walk(path.join(PKG, 'components/ui')),
  ...walk(path.join(PKG, 'components/enterprise')),
  ...walk(path.join(PKG, 'components/pro')),
  path.join(PKG, 'lib/utils.ts'),
  path.join(PKG, 'hooks/use-mobile.ts'),
]
  .map(
    (file) =>
      `./${path
        .relative(PKG, file)
        .replace(/\\/g, '/')
        .replace(/\.(ts|tsx)$/, '')}`,
  )
  .sort()

const lines = [
  '// Generated by scripts/gen-ui-barrel.mjs — do not edit by hand.',
  ...modules.map((module) => `export * from '${module}'`),
  "export * from './i18n'",
  '',
]
fs.writeFileSync(path.join(PKG, 'index.ts'), lines.join('\n'))
console.log(`index.ts: ${modules.length} modules`)
```

Run: `node scripts/gen-ui-barrel.mjs`
Expected: `index.ts: 113 modules` 左右（以实际文件数为准）。

- [ ] **Step 6: 包 typecheck（i18n 迁移前允许 `@/lib/i18n` 测试文件报错）**

Run: `pnpm --filter @fish-admin/react exec tsc -p tsconfig.json --noEmit 2>&1 | grep -v "@lib/i18n" | grep -v "@/lib/i18n"`
Expected: 除 18 个测试文件的 `@/lib/i18n` 外无错误。若还有别名错误，修 `rewrite-ui-imports.mjs` 后重跑。

---

### Task 3: `UIProvider` + 文案迁移 + 日期/主题缝 + 包测试

**Files:**

- Create: `scripts/extract-ui-messages.mjs`
- Create: `scripts/migrate-ui-i18n.mjs`
- Create: `packages/ui/src/i18n.tsx`
- Create: `packages/ui/src/i18n.test.tsx`
- Create: `packages/ui/src/locales/{en,zh-CN}.ts`（脚本生成）
- Modify: 28 个使用 `useTranslation('common')` 的组件（26 注册组件 + 2 data-table）
- Modify: 18 个测试（去掉 `@/lib/i18n`）
- Modify: `packages/ui/src/components/ui/sonner.tsx`

**Interfaces:**

- Produces:
  - `UIProvider({ locale?: 'en' | 'zh-CN'; messages?: Record<string, string>; theme?: 'light' | 'dark' | 'system'; children: ReactNode })`
  - `useUITranslation(): { t: (key: string, vars?: Record<string, string | number>) => string; locale: UILocale }`
  - `useUITheme(): 'light' | 'dark'`
  - `useUILocale(): UILocale`

- [ ] **Step 1: 写失败测试 `packages/ui/src/i18n.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { UIProvider, useUITranslation } from './i18n'

function Probe() {
  const { t } = useUITranslation()
  return <span>{t('enterprise.rateValue', { count: 3, max: 5 })}</span>
}

describe('UIProvider', () => {
  it('defaults to English without a provider', () => {
    render(<Probe />)
    expect(screen.getByText('3 of 5 stars')).toBeInTheDocument()
  })

  it('translates and interpolates for the provider locale', () => {
    render(
      <UIProvider locale="zh-CN">
        <Probe />
      </UIProvider>,
    )
    expect(screen.getByText('3 / 5 星')).toBeInTheDocument()
  })

  it('lets consumers override individual messages', () => {
    render(
      <UIProvider locale="zh-CN" messages={{ 'enterprise.rateValue': '{{count}} of {{max}}' }}>
        <Probe />
      </UIProvider>,
    )
    expect(screen.getByText('3 of 5')).toBeInTheDocument()
  })
})
```

Run: `pnpm --filter @fish-admin/react exec vitest run src/i18n.test.tsx`
Expected: FAIL — `Failed to resolve import "./i18n"`。

- [ ] **Step 2: 写 `scripts/extract-ui-messages.mjs`**

```js
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const PKG = path.join(root, 'packages/ui/src')
const sources = [
  'components/ui',
  'components/enterprise',
  'components/pro',
  'components/data-table',
]

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, out)
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(file)
  }
  return out
}

const keys = new Set()
for (const dir of sources) {
  for (const file of walk(path.join(PKG, dir))) {
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) keys.add(match[1])
  }
}

function read(locale) {
  const json = JSON.parse(
    fs.readFileSync(path.join(root, `src/locales/${locale}/common.json`), 'utf8'),
  )
  const flat = {}
  for (const key of [...keys].sort()) {
    const value = key.split('.').reduce((node, part) => node?.[part], json)
    if (typeof value !== 'string') throw new Error(`${locale}: missing key ${key}`)
    flat[key] = value
  }
  return flat
}

function write(name, messages) {
  const body = Object.entries(messages)
    .map(([key, value]) => `  '${key}': ${JSON.stringify(value)},`)
    .join('\n')
  fs.writeFileSync(
    path.join(PKG, `locales/${name}.ts`),
    `// Generated by scripts/extract-ui-messages.mjs — do not edit by hand.\nconst messages = {\n${body}\n} satisfies Record<string, string>\n\nexport default messages\n`,
  )
}

fs.mkdirSync(path.join(PKG, 'locales'), { recursive: true })
write('en', read('en'))
write('zh-CN', read('zh-CN'))
console.log(`locales: ${keys.size} keys`)
```

Run: `node scripts/extract-ui-messages.mjs`
Expected: `locales: 57 keys`；生成两份 TS 模块。

- [ ] **Step 3: 写 `packages/ui/src/i18n.tsx`**

```tsx
import * as React from 'react'

import en from './locales/en'
import zhCN from './locales/zh-CN'

export type UILocale = 'en' | 'zh-CN'
export type UITheme = 'light' | 'dark' | 'system'
export type UIMessages = Record<string, string>

const BUILT_IN: Record<UILocale, UIMessages> = { en, 'zh-CN': zhCN }

interface UIProviderProps {
  locale?: UILocale
  messages?: UIMessages
  theme?: UITheme
  children: React.ReactNode
}

interface UIContextValue {
  locale: UILocale
  messages: UIMessages
  resolvedTheme: 'light' | 'dark'
}

const DEFAULT_CONTEXT: UIContextValue = {
  locale: 'en',
  messages: en,
  resolvedTheme: 'light',
}

const UIContext = React.createContext<UIContextValue | null>(null)

export function UIProvider({
  locale = 'en',
  messages,
  theme = 'light',
  children,
}: UIProviderProps) {
  const [systemDark, setSystemDark] = React.useState(false)

  React.useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [theme])

  const value = React.useMemo<UIContextValue>(
    () => ({
      locale,
      messages: { ...BUILT_IN[locale], ...messages },
      resolvedTheme: theme === 'system' ? (systemDark ? 'dark' : 'light') : theme,
    }),
    [locale, messages, theme, systemDark],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

function useUIContext(): UIContextValue {
  return React.useContext(UIContext) ?? DEFAULT_CONTEXT
}

export function useUILocale(): UILocale {
  return useUIContext().locale
}

export function useUITheme(): 'light' | 'dark' {
  return useUIContext().resolvedTheme
}

export function useUITranslation(): {
  t: (key: string, vars?: Record<string, string | number>) => string
  locale: UILocale
} {
  const { locale, messages } = useUIContext()

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const template = messages[key] ?? en[key]
      if (template === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[@fish-admin/react] Missing UI message "${key}" for locale "${locale}".`)
        }
        return key
      }
      if (!vars) return template
      return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
        vars[name] === undefined ? match : String(vars[name]),
      )
    },
    [locale, messages],
  )

  return { t, locale }
}
```

- [ ] **Step 4: 跑 provider 测试**

Run: `pnpm --filter @fish-admin/react exec vitest run src/i18n.test.tsx`
Expected: 3 passed。

- [ ] **Step 5: 写 `scripts/migrate-ui-i18n.mjs` 并执行**

```js
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const PKG = path.join(root, 'packages/ui/src')

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, out)
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(file)
  }
  return out
}

const files = [
  ...walk(path.join(PKG, 'components')),
  ...walk(path.join(PKG, 'lib')),
  ...walk(path.join(PKG, 'hooks')),
]

let changed = 0
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8')
  const before = text

  if (!file.endsWith('.test.ts') && !file.endsWith('.test.tsx')) {
    if (text.includes("from 'react-i18next'")) {
      const rel = path
        .relative(path.dirname(file), path.join(PKG, 'i18n'))
        .replace(/\\/g, '/')
        .replace(/\.tsx$/, '')
      const prefix = rel.startsWith('.') ? rel : `./${rel}`
      text = text.replace(
        /import \{ useTranslation \} from 'react-i18next'\n/,
        `import { useUITranslation } from '${prefix}'\n`,
      )
      text = text.replace(
        /const \{ t, i18n \} = useTranslation\('common'\)/g,
        'const { t, locale } = useUITranslation()',
      )
      text = text.replace(
        /const \{ t \} = useTranslation\('common'\)/g,
        'const { t } = useUITranslation()',
      )
      text = text.replace(/i18n\.resolvedLanguage \?\? i18n\.language \?\? 'en'/g, 'locale')
      text = text.replace(
        /\(i18n\.resolvedLanguage \?\? i18n\.language\)\.startsWith\('zh'\) \? zhCN : enUS/g,
        "locale === 'zh-CN' ? zhCN : enUS",
      )
      text = text.replace(/\(i18n\.resolvedLanguage \?\? i18n\.language\)/g, 'locale')
      text = text.replace(/i18n\.language/g, 'locale')
    }
  } else {
    text = text.replace(/^import \{[^}]*\} from '@\/lib\/i18n'\n/m, '')
    text = text.replace(
      /^\s*await (?:i18nReady|changeLanguage\([^)]*\)|ensureNamespaces\([^)]*\))\s*\n/gm,
      '',
    )
  }

  if (text !== before) {
    fs.writeFileSync(file, text)
    changed += 1
  }
}
console.log(`migrated ${changed} files`)
```

Run: `node scripts/migrate-ui-i18n.mjs`
Expected: `migrated 46 files` 左右。

- [ ] **Step 6: sonner 改从 provider 取主题**

`packages/ui/src/components/ui/sonner.tsx`：

- `import { useResolvedTheme } from '@/lib/theme'` → `import { useUITheme } from '../../i18n'`
- `const theme = useResolvedTheme()` → `const theme = useUITheme()`

- [ ] **Step 7: 全包 i18n 静态检查**

Run:

```bash
grep -rn "react-i18next\|from 'i18next'\|@/lib/i18n\|@/" packages/ui/src --include=*.ts --include=*.tsx
```

Expected: 无输出。

Run: `node scripts/gen-ui-barrel.mjs`
Expected: 重新生成 `index.ts`（数量不变，已包含 `./i18n`）。

- [ ] **Step 8: 包 typecheck + 全量单测**

Run: `pnpm --filter @fish-admin/react typecheck`
Expected: 0 error。

Run: `pnpm --filter @fish-admin/react test 2>&1 | tail -12`
Expected: 37 个测试文件全绿；记录条数（加上 i18n.test.tsx 后应 ≥ 原组件测试数）。

- [ ] **Step 9: 包 JS + d.ts 构建**

Run: `pnpm --filter @fish-admin/react build:js`
Expected: `dist/index.js`、`dist/internal/*.js`、组件模块齐备。

Run: `pnpm --filter @fish-admin/react build:types`
Expected: `dist/index.d.ts`、`dist/internal/*.d.ts` 与 JS 同构；无 TS 报错。

Run:

```bash
grep -rl "@/lib/utils\|@/components\|react-i18next" packages/ui/dist
```

Expected: 无输出。

---

### Task 4: 模板接入（alias + provider + codemod）

**Files:**

- Create: `src/components/common/app-ui-provider.tsx`
- Modify: `src/main.tsx`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Modify: `scripts/scaffold.mjs:645-665`
- Modify: 245 个 app 文件（脚本改写 import）
- Delete: 空的 `src/components/{ui,enterprise,pro,data-table}` 目录（若 `git mv` 后仍存在）

**Interfaces:**

- Consumes: Task 3 的 `UIProvider` 与包源。
- Produces: 模板全部通过包名导入；`<AppUIProvider>` 把 app 语言与主题送进包。

- [ ] **Step 1: 写 `src/components/common/app-ui-provider.tsx`**

```tsx
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { UIProvider } from '@fish-admin/react'

import { useResolvedTheme } from '@/lib/theme'

export function AppUIProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const theme = useResolvedTheme()
  const locale = i18n.resolvedLanguage === 'zh-CN' ? 'zh-CN' : 'en'

  return (
    <UIProvider locale={locale} theme={theme}>
      {children}
    </UIProvider>
  )
}
```

- [ ] **Step 2: 包住整棵树**

`src/main.tsx` 在 `<StrictMode>` 内、`<QueryClientProvider>` 外增加：

```tsx
<AppUIProvider>
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Toaster position="top-right" richColors closeButton />
  </QueryClientProvider>
</AppUIProvider>
```

并新增 `import { AppUIProvider } from '@/components/common/app-ui-provider'`。`Toaster` 的 import 路径由 codemod 改写。

- [ ] **Step 3: Vite alias（精确正则，internal 在根之前）**

`vite.config.ts` 的 `resolve.alias` 改为数组：

```ts
const uiSource = (file: string) =>
  fileURLToPath(new URL(`./packages/ui/src/${file}`, import.meta.url))

resolve: {
  alias: [
    { find: /^@fish-admin\/react\/internal\/data-table$/, replacement: uiSource('internal/data-table.ts') },
    { find: /^@fish-admin\/react\/internal\/page-header$/, replacement: uiSource('internal/page-header.ts') },
    { find: /^@fish-admin\/react\/internal\/date$/, replacement: uiSource('internal/date.ts') },
    { find: /^@fish-admin\/react\/internal\/tree$/, replacement: uiSource('internal/tree.ts') },
    { find: /^@fish-admin\/react\/internal\/csv$/, replacement: uiSource('internal/csv.ts') },
    { find: /^@fish-admin\/react$/, replacement: uiSource('index.ts') },
    { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
  ],
},
```

- [ ] **Step 4: tsconfig paths 同步**

```json
"paths": {
  "@/*": ["./src/*"],
  "@fish-admin/react": ["./packages/ui/src/index.ts"],
  "@fish-admin/react/internal/data-table": ["./packages/ui/src/internal/data-table.ts"],
  "@fish-admin/react/internal/page-header": ["./packages/ui/src/internal/page-header.ts"],
  "@fish-admin/react/internal/date": ["./packages/ui/src/internal/date.ts"],
  "@fish-admin/react/internal/tree": ["./packages/ui/src/internal/tree.ts"],
  "@fish-admin/react/internal/csv": ["./packages/ui/src/internal/csv.ts"]
}
```

- [ ] **Step 5: 跑模板 codemod**

Run: `node scripts/rewrite-ui-imports.mjs --app`
Expected: `app: rewrote N files; 0 unresolved aliases remain`（N ≈ 245）。

Run:

```bash
grep -rn "@/components/ui/\|@/components/enterprise/\|@/components/pro/\|@/components/data-table/\|@/components/common/page-header\|@/lib/utils\|@/lib/date\|@/lib/tree\|@/lib/csv\|@/hooks/use-mobile" src e2e
```

Expected: 无输出。

- [ ] **Step 6: Prettier 统一改写结果**

Run: `pnpm exec prettier --write src packages/ui scripts`

Expected: 无解析错误（合并后的 import 会被格式化）。

- [ ] **Step 7: 更新 scaffold 锚点**

`scripts/scaffold.mjs`：

- 删除 `.dropImport('src/features/settings/components/settings-page.tsx', '@/components/ui/alert-dialog')`
- 改为 7 条 `dropNamedImport(..., '@fish-admin/react', 'AlertDialog' | 'AlertDialogCancel' | 'AlertDialogContent' | 'AlertDialogDescription' | 'AlertDialogFooter' | 'AlertDialogHeader' | 'AlertDialogTitle')`
- `.dropImport(..., '@/components/common/page-header')` → `'@fish-admin/react/internal/page-header'`

- [ ] **Step 8: 模板 typecheck + lint + 单测**

Run: `pnpm typecheck`
Expected: 0 error。

Run: `pnpm lint`
Expected: 0 error（warning 允许，但记录新增 warning）。

Run: `pnpm test -- --reporter=dot 2>&1 | tail -12`
Expected: 根测试文件数 = 86 − 37 = 49，全绿。（实际为 45：组件测试与 4 个 lib 测试一起迁出；
补覆盖率测试后为 46 / 377，见执行记录。）

- [ ] **Step 9: 构建 + 首屏预算**

Run: `pnpm size 2>&1 | tail -20`
Expected: `firstPaintJs` ≤ 173.4 KB、`largestAsyncJs` ≤ 115 KB、`totalJs` ≤ 800 KB、`totalCss` ≤ 30 KB。超标时先查 barrel 是否把 `recharts` 拖进首屏；用深路径或懒加载修复，不放宽预算。（实测 174.4 KB，增量来自 `UIProvider` 与内置 en/zh 文案，仍低于 180 KB 硬预算；见执行记录。）

---

### Task 5: 样式拆包（tokens / utilities / base / preflight）

**Files:**

- Create: `packages/ui/src/styles/tokens.css`
- Create: `packages/ui/src/styles/utilities.css`
- Create: `packages/ui/src/styles/base.css`
- Create: `packages/ui/src/styles/index.css`（包产物输入）
- Create: `packages/ui/src/styles/preflight.css`（包产物输入）
- Modify: `src/styles/index.css`

**Interfaces:**

- Produces: `packages/ui/dist/styles.css`（tokens + utilities + 最小 base，不含 preflight）、`packages/ui/dist/preflight.css`；模板 CSS 从包源码 import 并 `@source '../../packages/ui/src'`。

- [ ] **Step 1: 拆出 tokens**

把当前 `src/styles/index.css` 第 4–246 行（`@custom-variant dark`、`:root`、`.dark`、四个 accent 变体、`@theme inline`）原样移到 `packages/ui/src/styles/tokens.css`。

- [ ] **Step 2: 拆出 utilities 与最小 base**

`packages/ui/src/styles/utilities.css`：当前 `@layer utilities { ... }` 整块（`bg-brand`、`bg-brand-soft`、`text-brand`、`shadow-soft`、`shadow-glow`、`bg-grid`、`no-scrollbar`）。

`packages/ui/src/styles/base.css`：

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
}
```

- [ ] **Step 3: 写包产物输入**

`packages/ui/src/styles/index.css`:

```css
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
@import 'tw-animate-css';

@import './tokens.css';
@import './utilities.css';
@import './base.css';

@source '../components';
```

`packages/ui/src/styles/preflight.css`:

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
```

- [ ] **Step 4: 重写模板全局 CSS**

`src/styles/index.css` 开头改为：

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@import '../../packages/ui/src/styles/tokens.css';
@import '../../packages/ui/src/styles/utilities.css';

@source '../../packages/ui/src';
```

保留原有 `@layer base { * { @apply border-border outline-ring/50 } ... }`、density、scrollbar-gutter 段落；删除已迁移的 tokens/utilities 原文。

- [ ] **Step 5: 构建包 CSS 并检查产物**

Run: `pnpm --filter @fish-admin/react build:css`
Expected: 生成 `dist/styles.css`、`dist/preflight.css`。

Run:

```bash
node -e "const fs=require('fs');const css=fs.readFileSync('packages/ui/dist/styles.css','utf8');if(!css.includes('--primary:'))throw new Error('tokens missing');if(!css.includes('.shadow-soft'))throw new Error('utilities missing');if(css.includes('box-sizing:border-box'))throw new Error('preflight leaked');console.log('styles.css',(css.length/1024).toFixed(1),'KB')"
```

Expected: 输出 `styles.css … KB`。

Run:

```bash
node -e "const fs=require('fs');const css=fs.readFileSync('packages/ui/dist/preflight.css','utf8');if(!css.includes('box-sizing:border-box'))throw new Error('preflight missing');console.log('preflight.css',(css.length/1024).toFixed(1),'KB')"
```

Expected: 输出 `preflight.css … KB`。

- [ ] **Step 6: 模板构建 + 视觉相关检查**

Run: `pnpm build`
Expected: 成功；Tailwind 产物包含包内类名（抽查 `grep -c "shadow-soft" dist/assets/*.css` > 0）。

Run: `pnpm size 2>&1 | tail -20`
Expected: 四项仍在上限内，`totalCss` 与 23.0 KB 接近。

---

### Task 6: `check-package` + README + scaffold 测试 + 全量门禁

**Files:**

- Create: `scripts/check-package.mjs`
- Create: `packages/ui/README.md`
- Modify: `scripts/scaffold.test.mjs`（如需）
- Modify: `docs/plans/component-library.md`（执行记录）

**Interfaces:**

- Produces: `pnpm check:package` 的消费者级冒烟；M0 执行记录。

- [ ] **Step 1: 写 `scripts/check-package.mjs`**

```js
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checkDir = path.join(root, 'scripts/.check-package')
const pkgDir = path.join(root, 'packages/ui')

fs.rmSync(checkDir, { recursive: true, force: true })
fs.mkdirSync(path.join(checkDir, 'node_modules/@fish-admin/react'), { recursive: true })

execSync('pnpm --filter @fish-admin/react build', { stdio: 'inherit' })
const packOutput = execSync('pnpm --filter @fish-admin/react pack', {
  cwd: root,
  encoding: 'utf8',
})
const tarball = packOutput.trim().split('\n').filter(Boolean).at(-1)
execSync(
  `tar -xzf "${path.resolve(pkgDir, tarball)}" -C "${path.join(checkDir, 'node_modules/@fish-admin/react')}" --strip-components=1`,
  { stdio: 'inherit' },
)

// Registry ids -> export names; these four ids do not map by PascalCase.
const overrides = {
  chart: 'ChartContainer',
  'input-otp': 'InputOTP',
  resizable: 'ResizablePanelGroup',
  sonner: 'Toaster',
}
const registry = fs.readFileSync(path.join(root, 'src/config/components.ts'), 'utf8')
const ids = [...registry.matchAll(/^\s+id: '([^']+)'/gm)].map((match) => match[1])
const exportNames = ids.map(
  (id) =>
    overrides[id] ??
    id
      .split('-')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(''),
)

fs.writeFileSync(
  path.join(checkDir, 'entry.tsx'),
  `import { ${exportNames.join(', ')} } from '@fish-admin/react'\n\nexport const all = [${exportNames.map((name) => `Boolean(${name})`).join(', ')}]\n`,
)
fs.writeFileSync(
  path.join(checkDir, 'vite.config.ts'),
  `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  build: { lib: { entry: './entry.tsx', formats: ['es'], fileName: 'entry' }, rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] } },\n})\n`,
)
fs.writeFileSync(
  path.join(checkDir, 'package.json'),
  JSON.stringify({ name: 'check-package', private: true, type: 'module' }, null, 2),
)

execSync('pnpm exec vite build --config vite.config.ts', {
  cwd: checkDir,
  stdio: 'inherit',
})

const dist = path.join(pkgDir, 'dist')
for (const file of [
  'index.js',
  'index.d.ts',
  'internal/data-table.js',
  'internal/page-header.js',
  'styles.css',
  'preflight.css',
]) {
  if (!fs.existsSync(path.join(dist, file))) throw new Error(`missing dist/${file}`)
}
for (const file of ['index.js', 'internal/data-table.js']) {
  const text = fs.readFileSync(path.join(dist, file), 'utf8')
  for (const forbidden of ['@/components', '@/lib', 'react-i18next', '@tanstack/react-router']) {
    if (text.includes(forbidden)) throw new Error(`dist/${file} contains ${forbidden}`)
  }
}
const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
for (const dep of ['react-i18next', 'i18next', '@tanstack/react-router', 'zustand']) {
  if (pkg.dependencies?.[dep] || pkg.peerDependencies?.[dep])
    throw new Error(`package.json must not depend on ${dep}`)
}

fs.rmSync(checkDir, { recursive: true, force: true })
console.log(`check-package: ${ids.length} component exports verified`)
```

Run: `pnpm check:package`
Expected: `check-package: 83 component exports verified`，Vite build 成功。
（Windows 上 `tar` 需要 `--force-local` 与正斜杠路径；`pnpm --filter <pkg> pack` 在 pnpm 9
不支持 `--recursive`，改为在包目录执行 `pnpm pack`。实际脚本已按此实现。）

- [ ] **Step 2: 写 `packages/ui/README.md`**

至少包含：安装命令、React 19 peer 要求、`import { Button } from '@fish-admin/react'`、`import '@fish-admin/react/styles.css'`（默认）、可选 `preflight.css`、消费方 Tailwind 4 的 `@source 'node_modules/@fish-admin/react/dist'` 接法、`UIProvider` locale/theme/messages 示例、ESM-only 说明、`internal/*` 不承诺稳定。

- [ ] **Step 3: scaffold 验证**

Run: `pnpm scaffold --dry-run 2>&1 | tail -20`
Expected: 可读的 dry-run 输出，无异常。

Run: `pnpm exec vitest run scripts/scaffold.test.mjs 2>&1 | tail -12`
Expected: 全部通过；若断言文案依赖旧 import，按新锚点更新断言后重跑。

- [ ] **Step 4: 全量静态门禁**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm --filter @fish-admin/react test
pnpm test:coverage
```

Expected: 全绿；包测试条数 + 根测试条数 ≥ 527；覆盖率阈值不降。

- [ ] **Step 5: 构建与包冒烟**

Run:

```bash
pnpm --filter @fish-admin/react build
pnpm size
pnpm check:package
```

Expected: 四项预算通过，`check-package` 通过。

- [ ] **Step 6: 浏览器与视觉门禁**

Run: `pnpm test:e2e --workers=1 2>&1 | tail -20`
Expected: 85 条 e2e 全绿。

Run: `pnpm test:visual:docker 2>&1 | tail -20`
Expected: 17 用例 / 19 张基线零 diff。若出现像素差异，先排查 CSS 拆包是否漏掉 base/utilities，而不是更新基线。

- [ ] **Step 7: 真实浏览器抽查**

用 ego-browser 打开本地 preview（`VITE_ENABLE_MOCK=true pnpm build && pnpm preview`）：

- 三种角色登录（admin / manager / viewer）各一次；
- 切到中文，确认包内文案（表格分页、日历、侧边栏开关）跟随；
- 切到深色，确认 toaster 与 popover 主题正确；
- 打开 5 个高频业务页（Dashboard、users、workflows、roles、settings）。

Expected: 无 console error，无样式回退。

- [ ] **Step 8: 写执行记录**

把以下数字写回 `docs/plans/component-library.md` 的 M0「执行记录」：

- 构建工具取舍结论（Vite lib preserveModules + tsc d.ts + Tailwind CLI）；
- 包产物大小、`dist/styles.css` / `preflight.css` 大小、barrel 模块数；
- 四项预算实测与前后对比；
- 根/包单测文件与条数；
- `check-package` 结果；
- i18n 文案迁移是否有可见变化（逐条记录）；
- 未验证项（例如 Docker 镜像若未实际构建）。

---

## Self-Review

- **Spec coverage**：M0 的 7 条做法分别落在 Task 1（workspace/Docker/scaffold 入口）、Task 2（抽包/barrel/internal）、Task 3（UIProvider/文案/日期/主题/测试）、Task 4（模板 codemod/alias/预算）、Task 5（CSS/tokens/preflight）、Task 6（发布准备/check-package/README/全量门禁/执行记录）。scaffold 改造在 Task 4 Step 7 与 Task 6 Step 3。
- **Placeholder scan**：无 TBD/TODO；所有脚本与关键组件给出完整代码。
- **Type consistency**：`UILocale` / `UIMessages` / `useUITranslation` / `UIProvider` 在 Task 3 定义，Task 4 与 README 使用同一签名；`@fish-admin/react/internal/{data-table,page-header,date,tree,csv}` 在 Task 1 的 Vite/TS 配置、Task 2 的 internal 入口、Task 4 的 alias 与 README 中一致。
- **已知取舍**：包产物是 bundler-oriented ESM（相对导入不带扩展名），不承诺 Node ESM 直接 import；`check-package` 用 Vite 消费者验证，README 写明 ESM-only 与 bundler 前提。
