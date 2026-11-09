# FishAdmin Vue 3 移植地基 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在写第一行 Vue 代码之前，把 2.2.0 冻结成不可变的视觉/行为基线，把 mock、i18n、领域契约抽成框架无关的私有包，并交付一套跨框架组件合同与 parity 测试台，使未来的 Vue 3 移植可以用同一批基线验证。

**Architecture:** 三个阶段顺序落地。Phase A 先做一次完整的 2.2.0 复核，再用清单哈希冻结 198 张 Linux 截图、83 个组件的生成物、167 个 demo 和文档 DOM 钩子。Phase B 新建 `@fish-admin/contracts`、`@fish-admin/i18n`、`@fish-admin/mock` 三个私有 workspace 包，React 应用只保留薄适配层和渲染层，所有数据类型、权限、导航、演示数据、日期工具、语言资源与 MSW handler 移到共享包。Phase C 由现有 registry/api/demos 生成跨框架组件合同，新增 docs surface 合同、六个试点组件的行为 DSL，以及可切换 target 的 Playwright parity 套件；React target 复用冻结的 `*-linux.png`，未来的 Vue target 用同一份清单比对。

**Tech Stack:** React 19.3.1、Vue 3（尚未引入）、Vite 8.3.4、TypeScript 5.9.3、Vitest 5、Testing Library、Playwright 1.64.1、MSW 2.15、Faker 10、i18next 26、Rspress 2、pnpm 9.1.1、Docker `mcr.microsoft.com/playwright:v1.64.1-noble`。

**Spec:** 本文件（设计与可执行步骤合一）；背景与验收口径见 `docs/plans/2.2.0.md` 和 `docs/plans/component-library.md`。本计划不改变 2.2.0 的功能范围，只增加移植前的地基。

## Global Constraints

- 版本冻结：根 `package.json` 保持 `2.2.0`，`@fish-admin/react` 保持 `0.2.2`，`@fish-admin/tokens` 保持 `0.1.1`。本计划不发布、不升级这三个版本。
- 外部动作审批：`git push`、远端 tag、`npm publish`、GitHub Release、Vercel 项目设置或部署变更，每一项都需要单独、明确的批准。本计划只产生本地 commit 和本地 annotated tag。
- 视觉基线不可再生：198 张 `*-linux.png`（模板 18、文档布局 14、组件 166）是在 `mcr.microsoft.com/playwright:v1.64.1-noble` 中录制的参考。任何任务都不得运行 `--update-snapshots=all`、`test:visual:update` 或 `test:docs:visual:update`。若截图出现差异，先定位代码或环境原因，不得重录基线来“修好”测试。
- RBAC 仍然只是客户端 UX：所有 README、docs、界面文案中的“客户端权限不是安全边界”说明不得弱化或删除。
- 共享包必须框架无关：`packages/contracts`、`packages/i18n`、`packages/mock` 的 `src` 中不得出现 `react`、`react-dom`、`@fish-admin/react`、`@/` 别名或 Lucide 组件导入。React 绑定只留在根应用的 `src/lib/i18n.ts`、`src/config/nav.ts`、`src/main.tsx` 等适配层。
- 单一事实来源：应用侧 `src/types`、`src/config/{demo,permissions,integrations}.ts` 只能 re-export 共享包；`src/config/nav.ts` 必须从 `NAV_CONTRACT` 派生；`src/lib/permissions.ts` 必须使用共享的 `hasPermission`。不得在应用里保留第二份数据副本。
- 共享包先保持 `private: true`。是否发布、以什么版本发布，是本计划之外的独立决定。
- 文档双语同步：每改动一份 `docs/en/*.md`，必须同一提交内更新对应的 `docs/zh-CN/*.md`；README 的英文与 `README.zh-CN.md` 同理（本计划只改两份 README 中共有的路径/结构段落）。
- 工具链固定：Node >= 22、pnpm 9.1.1。所有命令在仓库根目录执行；Windows 上使用 Git Bash。
- 每个任务结束前至少运行 `pnpm exec prettier --check <changed files>`、`pnpm lint`、相关测试；任务声明“通过”之前必须附上真实命令输出。
- 提交粒度：每个任务一个本地 commit，使用 Conventional Commits。不得 `--amend` 已存在的提交，不得 `--no-verify`。

---

## 文件结构

新建/移动的主要文件：

```text
packages/contracts/                     # @fish-admin/contracts（private）
├─ package.json                         # source exports，无 build
├─ tsconfig.json
├─ vitest.config.ts
└─ src/
   ├─ index.ts                          # 仅导出 types
   ├─ types/{index,workspace}.ts        # 从 src/types 移入
   ├─ demo.ts                           # 从 src/config/demo.ts 移入
   ├─ permissions.ts                    # 从 src/config/permissions.ts 移入 + hasPermission
   ├─ integrations.ts                   # 从 src/config/integrations.ts 移入
   ├─ audit.ts                          # 审计动作/实体/色调数据（无 Lucide）
   ├─ navigation.ts                     # APP_PATHS、MENU_ICON_NAMES、NAV_CONTRACT、menu wire types
   ├─ date.ts                           # 与 packages/ui/src/lib/date.ts 同实现的框架无关副本
   └─ *.test.ts

packages/i18n/                          # @fish-admin/i18n（private）
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
├─ locales/{en,zh-CN}/*.json            # 从 src/locales 移入
└─ src/
   ├─ index.ts                          # setupI18n + current/next/change/ensure
   ├─ languages.ts                      # SUPPORTED_LANGUAGES
   ├─ resources.ts                      # eager common/nav/errors
   └─ index.test.ts

packages/mock/                          # @fish-admin/mock（private）
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
└─ src/                                # 从 src/mocks 移入并改写
   ├─ index.ts                          # 纯导出（buildMenuPayload + runtime）
   ├─ browser.ts                        # createMockWorker
   ├─ node.ts                           # createMockServer
   ├─ runtime.ts                        # configureMock/mockApiUrl/mockLatency
   ├─ handlers/*.ts                     # 14 个 handler，改用 runtime
   ├─ db/*.ts
   ├─ menu.ts / menu.test.ts
   └─ ...

parity/
├─ baseline/2.2.0/manifest.json         # 冻结哈希清单
├─ pilot.json                           # 六个试点组件
├─ contract/{components,docs-surface}.json
├─ scenarios/{accordion,date-range-picker,dialog,pro-table,select,tabs}.json
└─ targets/react.json                   # 未来增加 vue.json

scripts/
├─ parity-freeze.mjs / parity-freeze.test.mjs
├─ parity-contract.mjs / parity-contract.test.mjs
├─ parity-scenarios.mjs / parity-scenarios.test.mjs
└─ parity-docker.mjs

e2e-parity/
├─ helpers/{target,open,behavior}.ts
└─ specs/{contract,docs-surface,visual,behavior,axe}.spec.ts

playwright.parity.config.ts
docs/en/vue-port-foundation.md
docs/zh-CN/vue-port-foundation.md
```

被保留为薄适配层的应用文件：

```text
src/types/index.ts                     -> export * from '@fish-admin/contracts'
src/config/demo.ts                     -> export * from '@fish-admin/contracts/demo'
src/config/permissions.ts              -> export * from '@fish-admin/contracts/permissions'
src/config/integrations.ts             -> export * from '@fish-admin/contracts/integrations'
src/config/audit.ts                    -> 共享数据 + 应用侧 Lucide 图标/徽章类
src/config/nav.ts                      -> 从 NAV_CONTRACT 派生 NavGroup[]
src/lib/i18n.ts                        -> setupI18n({ plugins: [initReactI18next], storageKey })
src/lib/permissions.ts                 -> hasPermission + filterNavGroups
src/main.tsx                           -> createMockWorker()
```

---

## Phase A — 冻结 2.2.0 作为 parity 基线

### Task A1: 清理工作树并提交既有配置改动

**Files:**

- Modify: `.gitignore`
- Commit: `.prettierignore`、`eslint.config.js`、`.gitignore`、`docs/superpowers/plans/2026-11-09-vue-parity-foundation.md`（本计划文件，当前未跟踪）

**Interfaces:**

- Consumes: 无
- Produces: 干净的起点，后续每个任务都能用 `git status --short` 判断是否只有自己的改动。

- [ ] **Step 1: 把本机录屏目录加入忽略**

在 `.gitignore` 末尾追加：

```gitignore
video/
```

- [ ] **Step 2: 检查工作树**

Run:

```bash
git status --short
```

Expected: 三份配置修改 `.prettierignore`、`eslint.config.js`、`.gitignore`，外加唯一一个未跟踪文件 `docs/superpowers/plans/2026-11-09-vue-parity-foundation.md`（本计划）；没有未跟踪的 `video/`。

- [ ] **Step 3: 复核既有改动**

Run:

```bash
git diff -- .prettierignore eslint.config.js
```

Expected: 两份文件都只是在忽略列表中加入 `video`。如果出现其他内容，停止并先向维护者确认，不要顺手提交。

- [ ] **Step 4: 提交**

```bash
git add .gitignore .prettierignore eslint.config.js
git commit -m "chore: ignore local video captures"
git add docs/superpowers/plans/2026-11-09-vue-parity-foundation.md
git commit -m "docs(plan): add the Vue parity foundation plan"
```

The plan file is committed here so every later task can use `git status --short` to see only its own changes.

---

### Task A2: 完整复核 2.2.0 并记录证据

**Files:**

- Modify: `docs/plans/2.2.0.md`（追加复核记录）

**Interfaces:**

- Consumes: 2.2.0 的已提交状态。
- Produces: 一份可引用的复核记录；冻结清单只记录通过复核的提交。

- [ ] **Step 1: 确认干净起点**

Run:

```bash
git status --short
pnpm install --frozen-lockfile
```

Expected: `git status` 无输出；安装成功；`pnpm-lock.yaml` 未被修改。

- [ ] **Step 2: 静态门禁**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check:package
pnpm check:tokens
pnpm check:rtl
pnpm check:maturity
pnpm gen-api:check
```

Expected: 全部退出码 0。若 `check:maturity` 报过期，不要运行 `pnpm maturity` 覆盖；先检查 `apps/docs/generated/maturity.json` 是否在 2.2.0 提交中缺失。

- [ ] **Step 3: 单元测试与覆盖率**

Run:

```bash
pnpm test:coverage
pnpm test:tokens
pnpm --filter @fish-admin/react test:coverage
```

Expected（2.2.0 记录值，允许因本次新增测试而增加，不允许失败）：根套件 380 条、tokens 94 条、UI 303 条。记录实际条数和覆盖率四项数值。

- [ ] **Step 4: 模板 E2E**

Run:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Expected: 78 passed。若本机缺少系统依赖，先在 Docker 或 CI 中重跑，不要跳过。

- [ ] **Step 5: 包体积**

Run:

```bash
pnpm size
```

Expected: `firstPaintJs` ≤ 180 KB、`largestAsyncJs` ≤ 115 KB、`totalJs` ≤ 800 KB、`totalCss` ≤ 30 KB。记录四个实际值；不得提高预算。

- [ ] **Step 6: 文档与全量 axe**

Run:

```bash
pnpm test:docs
DOCS_FULL_AXE=1 pnpm test:docs
```

Expected: 第一条 106 passed / 166 skipped；第二条 272 passed。若测试数量因新增文件变化，记录实际值但必须 0 failed。

- [ ] **Step 7: Docker 视觉基线**

Run:

```bash
pnpm test:visual:docker
pnpm test:docs:visual:docker
```

Expected: 模板 18/18、文档 180/180（组件 166 + 布局 14）。只在 Linux 容器中比对，绝不带 `--update`。

- [ ] **Step 8: 记录复核结果**

在 `docs/plans/2.2.0.md` 末尾追加：

```markdown
### Vue 移植前的基线复核（2026-11-09）

- **静态门禁**：format、lint、typecheck、package、tokens、RTL、maturity、gen-api 全部通过。
- **单元测试**：根套件 380、tokens 94、UI 303；覆盖率保持 2.2.0 的 82.62 / 73.43 / 83.99 / 84.62（statements / branches / functions / lines）。
- **E2E**：模板 78 passed；`pnpm test:docs` 106 passed / 166 skipped；`DOCS_FULL_AXE=1` 272 passed。
- **视觉**：模板 18/18、文档 180/180，全部在 `mcr.microsoft.com/playwright:v1.64.1-noble` 中干净比对，未重录任何基线。
- **包体积**：四个预算全部守住（首屏 180 KB、最大异步 115 KB、总 JS 800 KB、总 CSS 30 KB）。
- **结论**：2.2.0 的代码、视觉与 axe 证据一致，可作为 parity 基线；下一步用哈希清单冻结。
```

如果任何实际数字与上面不同，按实际输出改写后再提交；不得删除预算或测试项。

- [ ] **Step 9: 提交**

```bash
git add docs/plans/2.2.0.md
git commit -m "docs(plan): record the 2.2.0 pre-port verification"
```

---

### Task A3: 冻结清单生成器、清单与本地 tag

**Files:**

- Create: `scripts/parity-freeze.mjs`
- Test: `scripts/parity-freeze.test.mjs`
- Create: `parity/baseline/2.2.0/manifest.json`（由脚本生成）
- Modify: `package.json`（新增两个 script）
- Modify: `.github/workflows/ci.yml`（quality job 新增冻结校验）
- Modify: `.prettierignore`（排除生成的 `parity/baseline`）
- Commit + tag: `parity-2.2.0`

**Interfaces:**

- Consumes: A2 通过的提交；`apps/docs/generated/*.json`、`packages/ui/registry.json`、`apps/docs/demos/**`、198 张 `*-linux.png`。
- Produces:
  - `node scripts/parity-freeze.mjs` → 写清单；
  - `node scripts/parity-freeze.mjs --check` → 重新计算并与清单逐文件、逐计数、逐包版本比对；
  - `diffManifests(expected, actual): string[]`（测试可导入）；
  - `sha256File(file): string`、`serializeManifest(manifest): string`。

- [ ] **Step 1: 写失败测试**

创建 `scripts/parity-freeze.test.mjs`：

```js
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { diffManifests, serializeManifest, sha256File } from './parity-freeze.mjs'

function manifest(files) {
  return {
    version: 1,
    release: '2.2.0',
    sourceCommit: 'abc123',
    verifiedAt: '2026-11-04',
    frozenOn: '2026-11-09',
    counts: {
      components: 83,
      demos: 167,
      componentVisual: 166,
      docsLayoutVisual: 14,
      templateVisual: 18,
      totalVisual: 198,
      axeRoutes: 166,
    },
    packages: {
      root: '2.2.0',
      '@fish-admin/react': '0.2.2',
      '@fish-admin/tokens': '0.1.1',
    },
    files,
  }
}

describe('parity freeze', () => {
  it('hashes file contents with sha256', () => {
    const directory = mkdtempSync(join(tmpdir(), 'parity-freeze-'))
    const empty = join(directory, 'empty.txt')
    writeFileSync(empty, '')

    expect(sha256File(empty)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('sorts file paths when serialising', () => {
    const text = serializeManifest(manifest({ 'b.png': '2', 'a.png': '1' }))

    expect(text.endsWith('\n')).toBe(true)
    expect(text.indexOf('"a.png"')).toBeLessThan(text.indexOf('"b.png"'))
  })

  it('reports changed, missing and unexpected files', () => {
    const expected = manifest({ 'a.png': '1', 'b.png': '2' })
    const actual = manifest({ 'a.png': 'changed', 'c.png': '3' })

    expect(diffManifests(expected, actual)).toEqual([
      'changed a.png',
      'missing b.png',
      'unexpected c.png',
    ])
  })

  it('reports count and package drift', () => {
    const expected = manifest({})
    const actual = manifest({})
    actual.counts.totalVisual = 197
    actual.packages['@fish-admin/react'] = '0.2.3'

    expect(diffManifests(expected, actual)).toEqual([
      'counts.totalVisual 197 !== 198',
      'package @fish-admin/react 0.2.3 !== 0.2.2',
    ])
  })
})
```

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
pnpm exec vitest run scripts/parity-freeze.test.mjs
```

Expected: FAIL，`Cannot find module './parity-freeze.mjs'`。

- [ ] **Step 3: 实现脚本**

创建 `scripts/parity-freeze.mjs`：

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const RELEASE = '2.2.0'
export const MANIFEST_PATH = 'parity/baseline/2.2.0/manifest.json'

const INPUT_FILES = [
  'apps/docs/generated/api.json',
  'apps/docs/generated/documented.json',
  'apps/docs/generated/maturity.json',
  'apps/docs/generated/registry.json',
  'apps/docs/generated/rtl-audit.json',
  'apps/docs/theme/ApiTable.tsx',
  'apps/docs/theme/Demo.tsx',
  'e2e-docs/component-visual.spec.ts',
  'packages/ui/registry.json',
]

const VISUAL_DIRECTORIES = [
  'e2e-docs/__screenshots__/component-visual.spec.ts',
  'e2e-docs/__screenshots__/visual.spec.ts',
  'e2e/visual/__screenshots__/pages.spec.ts',
]

const EXPECTED_COUNTS = {
  components: 83,
  demos: 167,
  componentVisual: 166,
  docsLayoutVisual: 14,
  templateVisual: 18,
  totalVisual: 198,
  axeRoutes: 166,
}

const EXPECTED_PACKAGES = {
  root: '2.2.0',
  '@fish-admin/react': '0.2.2',
  '@fish-admin/tokens': '0.1.1',
}

function fail(message) {
  throw new Error(`parity-freeze: ${message}`)
}

function readJson(root, relative) {
  const file = path.join(root, relative)
  if (!fs.existsSync(file)) fail(`${relative} is missing`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function sha256File(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

export function serializeManifest(manifest) {
  const files = Object.fromEntries(
    Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)),
  )
  return `${JSON.stringify({ ...manifest, files }, null, 2)}\n`
}

function walk(root, relativeDirectory) {
  const directory = path.join(root, relativeDirectory)
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${relativeDirectory}/${entry.name}`
    return entry.isDirectory() ? walk(root, relative) : [relative]
  })
}

export function listBaselines(root, relativeDirectory) {
  const directory = path.join(root, relativeDirectory)
  if (!fs.existsSync(directory)) fail(`${relativeDirectory} is missing`)

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('-linux.png'))
    .map((entry) => `${relativeDirectory}/${entry.name}`)
    .sort()
}

function countDemos(root) {
  const directory = path.join(root, 'apps/docs/demos')
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'meta.json')),
    )
    .reduce(
      (total, entry) => total + readJson(root, `apps/docs/demos/${entry.name}/meta.json`).length,
      0,
    )
}

function gitHead(root) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export function collectManifest(
  root,
  {
    verifiedAt = '2026-11-04',
    frozenOn = new Date().toISOString().slice(0, 10),
    sourceCommit = gitHead(root),
  } = {},
) {
  const docsRegistry = readJson(root, 'apps/docs/generated/registry.json')
  const documented = readJson(root, 'apps/docs/generated/documented.json')
  const componentFiles = listBaselines(root, VISUAL_DIRECTORIES[0])
  const docsLayoutFiles = listBaselines(root, VISUAL_DIRECTORIES[1])
  const templateFiles = listBaselines(root, VISUAL_DIRECTORIES[2])

  const counts = {
    components: docsRegistry.components.length,
    demos: countDemos(root),
    componentVisual: componentFiles.length,
    docsLayoutVisual: docsLayoutFiles.length,
    templateVisual: templateFiles.length,
    totalVisual: componentFiles.length + docsLayoutFiles.length + templateFiles.length,
    axeRoutes: documented.components.length * 2,
  }

  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[key] !== expected) {
      fail(`counts.${key} is ${counts[key]}, expected ${expected}`)
    }
  }

  const packages = {
    root: readJson(root, 'package.json').version,
    '@fish-admin/react': readJson(root, 'packages/ui/package.json').version,
    '@fish-admin/tokens': readJson(root, 'packages/tokens/package.json').version,
  }
  for (const [name, expected] of Object.entries(EXPECTED_PACKAGES)) {
    if (packages[name] !== expected)
      fail(`package ${name} is ${packages[name]}, expected ${expected}`)
  }

  const files = {}
  for (const relative of INPUT_FILES) files[relative] = sha256File(path.join(root, relative))
  for (const relative of walk(root, 'apps/docs/demos')) {
    if (/\.(tsx?|json)$/.test(relative)) files[relative] = sha256File(path.join(root, relative))
  }
  for (const relative of [...componentFiles, ...docsLayoutFiles, ...templateFiles]) {
    files[relative] = sha256File(path.join(root, relative))
  }

  return {
    version: 1,
    release: RELEASE,
    sourceCommit,
    verifiedAt,
    frozenOn,
    counts,
    packages,
    files,
  }
}

export function diffManifests(expected, actual) {
  const problems = []
  const expectedFiles = Object.keys(expected.files).sort()
  const actualFiles = Object.keys(actual.files).sort()

  for (const file of expectedFiles) {
    if (!(file in actual.files)) problems.push(`missing ${file}`)
    else if (actual.files[file] !== expected.files[file]) problems.push(`changed ${file}`)
  }
  for (const file of actualFiles) {
    if (!(file in expected.files)) problems.push(`unexpected ${file}`)
  }
  for (const key of Object.keys(actual.counts)) {
    if (expected.counts[key] !== actual.counts[key]) {
      problems.push(`counts.${key} ${actual.counts[key]} !== ${expected.counts[key]}`)
    }
  }
  for (const [name, version] of Object.entries(actual.packages)) {
    if (expected.packages[name] !== version) {
      problems.push(`package ${name} ${version} !== ${expected.packages[name]}`)
    }
  }

  return problems
}

const root = process.cwd()
const manifestPath = path.join(root, MANIFEST_PATH)

function main() {
  const check = process.argv.includes('--check')
  const force = process.argv.includes('--force')

  if (check) {
    if (!fs.existsSync(manifestPath))
      fail(`${MANIFEST_PATH} is missing — run node scripts/parity-freeze.mjs`)
    const frozen = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const current = collectManifest(root, {
      verifiedAt: frozen.verifiedAt,
      frozenOn: frozen.frozenOn,
      sourceCommit: frozen.sourceCommit,
    })
    const problems = diffManifests(frozen, current)
    if (problems.length > 0) {
      for (const problem of problems) console.error(`parity-freeze: ${problem}`)
      process.exitCode = 1
    } else {
      console.log(`parity-freeze: ${Object.keys(frozen.files).length} files match ${MANIFEST_PATH}`)
    }
  } else {
    if (fs.existsSync(manifestPath) && !force) {
      fail(
        `${MANIFEST_PATH} already exists; baselines are frozen (use --force only with an approved re-freeze)`,
      )
    }
    const manifest = collectManifest(root, {
      verifiedAt: '2026-11-04',
      frozenOn: process.env.PARITY_FROZEN_ON ?? new Date().toISOString().slice(0, 10),
    })
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
    fs.writeFileSync(manifestPath, serializeManifest(manifest))
    console.log(
      `parity-freeze: wrote ${MANIFEST_PATH} (${Object.keys(manifest.files).length} files)`,
    )
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
```

- [ ] **Step 4: 运行测试，确认通过**

Run:

```bash
pnpm exec vitest run scripts/parity-freeze.test.mjs
```

Expected: 4 passed。

- [ ] **Step 5: 生成清单**

Run:

```bash
PARITY_FROZEN_ON=2026-11-09 node scripts/parity-freeze.mjs
```

Expected: `parity-freeze: wrote parity/baseline/2.2.0/manifest.json (460 files)`；计数为 83 / 167 / 166 / 14 / 18 / 198 / 166。文件数 = 9 个输入文件 + 253 个 demo 文件 + 198 张基线。

- [ ] **Step 6: 校验清单幂等**

Run:

```bash
node scripts/parity-freeze.mjs --check
```

Expected: `parity-freeze: 460 files match parity/baseline/2.2.0/manifest.json`（文件数以实际清单为准，但必须是 460）。

- [ ] **Step 7: 接入 scripts 与 CI**

在根 `package.json` 的 `scripts` 中加入：

```json
"parity:freeze": "node scripts/parity-freeze.mjs",
"check:parity:freeze": "node scripts/parity-freeze.mjs --check",
```

在 `.github/workflows/ci.yml` 的 `quality` job 中，`Component maturity contract` 之后加入：

```yaml
- name: Parity baseline is unchanged
  run: pnpm check:parity:freeze
```

在 `.prettierignore` 末尾追加（与 `apps/docs/generated` 同理，生成物不按 Prettier 的数组换行规则重排）：

```text
# Written by scripts/parity-freeze.mjs; its manifest is not prettier's output.
parity/baseline
```

- [ ] **Step 8: 全量门禁**

Run:

```bash
pnpm exec prettier --check scripts/parity-freeze.mjs scripts/parity-freeze.test.mjs package.json .github/workflows/ci.yml .prettierignore
pnpm lint
pnpm test
```

Expected: 全部通过。

- [ ] **Step 9: 提交并打本地 tag**

```bash
git add scripts/parity-freeze.mjs scripts/parity-freeze.test.mjs parity/baseline/2.2.0/manifest.json package.json .github/workflows/ci.yml .prettierignore
git commit -m "chore(parity): freeze the 2.2.0 visual baseline"
git tag -a parity-2.2.0 -m "FishAdmin 2.2.0 parity baseline: 83 components, 167 demos, 198 Linux screenshots"
```

禁止 `git push` 与 `git push --tags`。tag 只存在于本地，直到收到单独批准。

## Phase B — 抽出框架无关的 contracts / i18n / mock 包

### Task B1: `@fish-admin/contracts` 与导航契约

**Files:**

- Create: `packages/contracts/package.json`、`packages/contracts/tsconfig.json`、`packages/contracts/vitest.config.ts`
- Create: `packages/contracts/src/index.ts`、`navigation.ts`、`audit.ts`、`date.ts`、`navigation.test.ts`、`permissions.test.ts`、`date.test.ts`
- Move: `src/types` → `packages/contracts/src/types`；`src/config/demo.ts`、`src/config/permissions.ts`、`src/config/integrations.ts` → `packages/contracts/src/`
- Modify: `src/types/index.ts`、`src/config/{demo,permissions,integrations,audit,nav}.ts`、`src/features/navigation/{api,menu-icons}.ts`、`src/lib/permissions.ts`
- Test: `src/lib/date-parity.test.ts`
- Modify: root `package.json`（dependency + scripts）

**Interfaces:**

- Consumes: 应用里现有的领域类型、权限注册表、demo 数据、导航树和日期工具。
- Produces:
  - `@fish-admin/contracts` → `export * from './types'`
  - `@fish-admin/contracts/{types,demo,permissions,integrations,audit,navigation,date}` 子路径；
  - `NAV_CONTRACT: NavGroupContract[]`、`APP_PATHS`、`MENU_ICON_NAMES`、`MenuIconName`、`AppPath`、`NavRouteContract`、`MenuPayload`/`MenuGroupPayload`/`MenuRoutePayload`；
  - `hasPermission(granted, required)`；
  - 与应用 `packages/ui/src/lib/date.ts` 行为一致的 `parseDay` / `formatDayValue` / `formatDayDisplay`。

- [ ] **Step 1: 创建 contracts 包骨架**

`packages/contracts/package.json`：

```json
{
  "name": "@fish-admin/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Framework-neutral FishAdmin contracts: domain types, permissions, navigation, demo data and date helpers.",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./demo": "./src/demo.ts",
    "./permissions": "./src/permissions.ts",
    "./integrations": "./src/integrations.ts",
    "./audit": "./src/audit.ts",
    "./navigation": "./src/navigation.ts",
    "./date": "./src/date.ts",
    "./package.json": "./package.json"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^5.0.5"
  }
}
```

`packages/contracts/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedSideEffectImports": true,
    "types": []
  },
  "include": ["src"]
}
```

`packages/contracts/vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
```

- [ ] **Step 2: 移动领域数据**

```bash
mkdir -p packages/contracts/src
git mv src/types packages/contracts/src/types
git mv src/config/demo.ts packages/contracts/src/demo.ts
git mv src/config/permissions.ts packages/contracts/src/permissions.ts
git mv src/config/integrations.ts packages/contracts/src/integrations.ts
```

创建 `packages/contracts/src/index.ts`：

```ts
export * from './types'
```

在 `packages/contracts/src/permissions.ts` 末尾追加（函数体从 `src/lib/permissions.ts` 原样移入）：

```ts
export function hasPermission(
  granted: readonly string[] | null | undefined,
  required?: string | null,
): boolean {
  if (!required) return true
  if (!granted || granted.length === 0) return false
  if (granted.includes('*') || granted.includes(required)) return true

  const [resource] = required.split(':')
  return Boolean(resource) && granted.includes(`${resource}:*`)
}
```

- [ ] **Step 3: 写应用侧 re-export 薄层**

`src/types/index.ts`：

```ts
export * from '@fish-admin/contracts'
```

`src/config/demo.ts`：

```ts
export * from '@fish-admin/contracts/demo'
```

`src/config/permissions.ts`：

```ts
export * from '@fish-admin/contracts/permissions'
```

`src/config/integrations.ts`：

```ts
export * from '@fish-admin/contracts/integrations'
```

- [ ] **Step 4: 拆分 audit 数据与 Lucide 视图映射**

创建 `packages/contracts/src/audit.ts`：从当前 `src/config/audit.ts` 原样移入 `AUDIT_ACTIONS`、`AUDIT_ENTITY_TYPES`、`AuditTone`、`AUDIT_ACTION_TONES` 四个声明，文件顶部只保留：

```ts
import type { AuditAction, AuditEntityType } from './types'
```

把 `src/config/audit.ts` 改写为：

```ts
import {
  Archive,
  BookMarked,
  Building,
  Building2,
  CheckCheck,
  CircleX,
  FileCog,
  FolderCog,
  FolderPlus,
  Forward,
  LogIn,
  Plug,
  PlugZap,
  ShieldCheck,
  ShieldMinus,
  ShieldPlus,
  Trash2,
  Unplug,
  Upload,
  UserCheck,
  UserCog,
  UserPlus,
  UserRound,
  UserX,
  type LucideIcon,
} from 'lucide-react'

import type { AuditAction, AuditTone } from '@fish-admin/contracts/audit'

export {
  AUDIT_ACTIONS,
  AUDIT_ACTION_TONES,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
  type AuditTone,
} from '@fish-admin/contracts/audit'

export const AUDIT_ACTION_ICONS: Record<AuditAction, LucideIcon> = {
  'user.created': UserPlus,
  'user.updated': UserCog,
  'user.deleted': UserX,
  'user.restored': UserCheck,
  'role.created': ShieldPlus,
  'role.updated': ShieldCheck,
  'role.deleted': ShieldMinus,
  'department.created': Building2,
  'department.updated': Building,
  'auth.login': LogIn,
  'profile.updated': UserRound,
  'project.created': FolderPlus,
  'project.updated': FolderCog,
  'project.archived': Archive,
  'file.uploaded': Upload,
  'file.updated': FileCog,
  'file.deleted': Trash2,
  'integration.created': Plug,
  'integration.updated': PlugZap,
  'integration.deleted': Unplug,
  'workflow.approved': CheckCheck,
  'workflow.rejected': CircleX,
  'workflow.transferred': Forward,
  'dictionary.created': BookMarked,
  'dictionary.updated': BookMarked,
  'dictionary.deleted': Trash2,
}

export const AUDIT_TONE_BADGE_CLASSES: Record<AuditTone, string> = {
  success: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  info: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
  warning: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
}
```

- [ ] **Step 5: 写导航契约**

创建 `packages/contracts/src/navigation.ts`：

```ts
import { PERMISSION_CODES, type PermissionCode } from './permissions'

export const APP_PATHS = [
  '/',
  '/projects',
  '/workflows',
  '/reports',
  '/files',
  '/notifications',
  '/users',
  '/departments',
  '/roles',
  '/permissions',
  '/dictionaries',
  '/audit-logs',
  '/integrations',
  '/profile',
  '/security',
  '/settings',
] as const

export type AppPath = (typeof APP_PATHS)[number]

export const MENU_ICON_NAMES = [
  'bar-chart-3',
  'bell',
  'book-marked',
  'boxes',
  'circle-dot',
  'folder-kanban',
  'folder-open',
  'key-round',
  'layout-dashboard',
  'lock-keyhole',
  'network',
  'palette',
  'plug',
  'scroll-text',
  'settings-2',
  'shield-check',
  'user-round',
  'users',
  'workflow',
] as const

export type MenuIconName = (typeof MENU_ICON_NAMES)[number]

export interface NavRouteContract {
  titleKey: string
  to: AppPath
  icon: MenuIconName
  permission?: PermissionCode
}

export interface NavGroupContract {
  titleKey: string
  items: NavRouteContract[]
}

export const NAV_CONTRACT: NavGroupContract[] = [
  {
    titleKey: 'nav:groups.overview',
    items: [
      {
        titleKey: 'nav:items.dashboard',
        to: '/',
        icon: 'layout-dashboard',
        permission: PERMISSION_CODES.dashboardRead,
      },
      {
        titleKey: 'nav:items.reports',
        to: '/reports',
        icon: 'bar-chart-3',
        permission: PERMISSION_CODES.reportRead,
      },
    ],
  },
  {
    titleKey: 'nav:groups.collaboration',
    items: [
      {
        titleKey: 'nav:items.projects',
        to: '/projects',
        icon: 'folder-kanban',
        permission: PERMISSION_CODES.projectRead,
      },
      {
        titleKey: 'nav:items.workflows',
        to: '/workflows',
        icon: 'workflow',
        permission: PERMISSION_CODES.workflowRead,
      },
      {
        titleKey: 'nav:items.files',
        to: '/files',
        icon: 'folder-open',
        permission: PERMISSION_CODES.fileRead,
      },
      {
        titleKey: 'nav:items.notifications',
        to: '/notifications',
        icon: 'bell',
      },
    ],
  },
  {
    titleKey: 'nav:groups.management',
    items: [
      {
        titleKey: 'nav:items.users',
        to: '/users',
        icon: 'users',
        permission: PERMISSION_CODES.userRead,
      },
      {
        titleKey: 'nav:items.departments',
        to: '/departments',
        icon: 'network',
        permission: PERMISSION_CODES.departmentRead,
      },
      {
        titleKey: 'nav:items.roles',
        to: '/roles',
        icon: 'shield-check',
        permission: PERMISSION_CODES.roleRead,
      },
      {
        titleKey: 'nav:items.permissions',
        to: '/permissions',
        icon: 'key-round',
        permission: PERMISSION_CODES.permissionRead,
      },
      {
        titleKey: 'nav:items.dictionaries',
        to: '/dictionaries',
        icon: 'book-marked',
        permission: PERMISSION_CODES.dictionaryRead,
      },
      {
        titleKey: 'nav:items.auditLogs',
        to: '/audit-logs',
        icon: 'scroll-text',
        permission: PERMISSION_CODES.auditRead,
      },
      {
        titleKey: 'nav:items.integrations',
        to: '/integrations',
        icon: 'plug',
        permission: PERMISSION_CODES.integrationRead,
      },
    ],
  },
  {
    titleKey: 'nav:groups.account',
    items: [
      {
        titleKey: 'nav:items.profile',
        to: '/profile',
        icon: 'user-round',
      },
      {
        titleKey: 'nav:items.security',
        to: '/security',
        icon: 'lock-keyhole',
      },
      {
        titleKey: 'nav:items.settings',
        to: '/settings',
        icon: 'settings-2',
      },
    ],
  },
]

export interface MenuRoutePayload {
  titleKey: string
  /** Must name a route this build ships; the resolver drops anything else. */
  path: string
  /** A key of `MENU_ICON_NAMES`. */
  icon: string
  permission?: string
  children?: MenuRoutePayload[]
}

export interface MenuGroupPayload {
  titleKey: string
  items: MenuRoutePayload[]
}

export interface MenuPayload {
  groups: MenuGroupPayload[]
}
```

- [ ] **Step 6: 应用导航改为从契约派生**

把 `src/config/nav.ts` 从文件头到 `ALL_NAV_ITEMS` 的声明替换为：

```ts
import { NAV_CONTRACT, type NavRouteContract } from '@fish-admin/contracts/navigation'
import type { PermissionCode } from '@fish-admin/contracts/permissions'
import type { LucideIcon } from 'lucide-react'

import { resolveMenuIcon } from '@/features/navigation/menu-icons'

export type AppPath = NavRouteContract['to']

interface NavItemBase {
  titleKey: string
  icon: LucideIcon
  permission?: PermissionCode
}

export interface InternalNavItem extends NavItemBase {
  to: AppPath
  // The discriminant: internal entries never carry the flag, so `item.external`
  // reads on the union and the guard narrows in both directions.
  external?: never
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
  return items.filter((item): item is InternalNavItem => !isExternalNavItem(item))
}

function toInternalNavItem(route: NavRouteContract): InternalNavItem {
  return {
    titleKey: route.titleKey,
    to: route.to,
    icon: resolveMenuIcon(route.icon),
    ...(route.permission ? { permission: route.permission } : {}),
  }
}

export const NAV_GROUPS: NavGroup[] = NAV_CONTRACT.map((group) => ({
  titleKey: group.titleKey,
  items: group.items.map(toInternalNavItem),
}))

export const ALL_NAV_ITEMS: InternalNavItem[] = internalNavItems(
  NAV_GROUPS.flatMap((group) => group.items),
)
```

从 `// Every entry, internal and external...` 开始到文件末尾的 helper 原样保留。

- [ ] **Step 7: 图标注册表改用契约名称**

`src/features/navigation/menu-icons.ts` 顶部改为：

```ts
import { MENU_ICON_NAMES, type MenuIconName } from '@fish-admin/contracts/navigation'
import {
  BarChart3,
  Bell,
  BookMarked,
  Boxes,
  CircleDot,
  FolderKanban,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Palette,
  Plug,
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
```

把 `MENU_ICONS` 的类型改为 `Record<MenuIconName, LucideIcon>`，删除 `export const MENU_ICON_NAMES = Object.keys(MENU_ICONS).sort()`，改为：

```ts
export { MENU_ICON_NAMES }
```

`ICON_NAMES`、`iconNameFor`、`resolveMenuIcon` 原样保留到 B3 再删除。

- [ ] **Step 8: 菜单 wire 类型移到契约**

`src/features/navigation/api.ts` 改为：

```ts
import type { MenuPayload } from '@fish-admin/contracts/navigation'

import { apiRequest } from '@/lib/api-client'

export type {
  MenuGroupPayload,
  MenuPayload,
  MenuRoutePayload,
} from '@fish-admin/contracts/navigation'

export function fetchMenu(signal?: AbortSignal, timeoutMs?: number) {
  return apiRequest<MenuPayload>('/menu', { signal, timeoutMs })
}
```

- [ ] **Step 9: 应用权限 helper 复用共享函数**

`src/lib/permissions.ts` 改为：

```ts
import { hasPermission } from '@fish-admin/contracts/permissions'

import { internalNavItems, isExternalNavItem, type NavGroup, type NavItem } from '@/config/nav'

export { hasPermission }

function filterItems(items: NavItem[], granted: readonly string[]): NavItem[] {
  return items
    .filter((item) => hasPermission(granted, item.permission))
    .map((item) =>
      !isExternalNavItem(item) && item.children
        ? // Children are internal by construction; the helper keeps that type.
          { ...item, children: internalNavItems(filterItems(item.children, granted)) }
        : item,
    )
}

export function filterNavGroups(groups: NavGroup[], granted: readonly string[]): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: filterItems(group.items, granted) }))
    .filter((group) => group.items.length > 0)
}
```

- [ ] **Step 10: 复制日期工具并锁定两份实现**

创建 `packages/contracts/src/date.ts`，内容与 `packages/ui/src/lib/date.ts` 逐字一致。

创建 `src/lib/date-parity.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import * as contractDate from '@fish-admin/contracts/date'
import * as uiDate from '@fish-admin/react/internal/date'

const VALUES = [undefined, '', '2024-02-29', '2024-13-01', '2024-02-30', '0000-01-01', '2026-10-27']
const DATE = new Date(2026, 9, 27)

describe('shared date helpers', () => {
  it('matches the component package implementation', () => {
    for (const value of VALUES) {
      expect(contractDate.parseDay(value)?.getTime(), String(value)).toBe(
        uiDate.parseDay(value)?.getTime(),
      )
      expect(contractDate.formatDayDisplay(value, 'en-US')).toBe(
        uiDate.formatDayDisplay(value, 'en-US'),
      )
      expect(contractDate.formatDayDisplay(value, 'zh-CN')).toBe(
        uiDate.formatDayDisplay(value, 'zh-CN'),
      )
    }

    expect(contractDate.formatDayValue(DATE)).toBe(uiDate.formatDayValue(DATE))
  })
})
```

- [ ] **Step 11: 写 contracts 单元测试**

`packages/contracts/src/navigation.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import { APP_PATHS, MENU_ICON_NAMES, NAV_CONTRACT } from './navigation'
import { ALL_PERMISSION_CODES } from './permissions'

const routes = NAV_CONTRACT.flatMap((group) => group.items)

describe('navigation contract', () => {
  it('declares every path once', () => {
    expect(new Set(routes.map((route) => route.to)).size).toBe(routes.length)
    expect(routes.map((route) => route.to).sort()).toEqual([...APP_PATHS].sort())
  })

  it('uses known icons and permissions', () => {
    for (const route of routes) {
      expect(MENU_ICON_NAMES, route.to).toContain(route.icon)
      if (route.permission) {
        expect(ALL_PERMISSION_CODES, route.to).toContain(route.permission)
      }
    }
  })

  it('leaves no group empty', () => {
    for (const group of NAV_CONTRACT) expect(group.items.length).toBeGreaterThan(0)
  })
})
```

`packages/contracts/src/permissions.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import { hasPermission, PERMISSION_CODES } from './permissions'

describe('hasPermission', () => {
  it('allows an unguarded action', () => {
    expect(hasPermission([], undefined)).toBe(true)
  })

  it('denies an empty session', () => {
    expect(hasPermission([], PERMISSION_CODES.userRead)).toBe(false)
    expect(hasPermission(null, PERMISSION_CODES.userRead)).toBe(false)
  })

  it('honours wildcards at both levels', () => {
    expect(hasPermission(['*'], PERMISSION_CODES.userDelete)).toBe(true)
    expect(hasPermission(['user:*'], PERMISSION_CODES.userDelete)).toBe(true)
    expect(hasPermission(['role:*'], PERMISSION_CODES.userDelete)).toBe(false)
  })
})
```

`packages/contracts/src/date.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import { formatDayDisplay, formatDayValue, parseDay } from './date'

describe('shared date helpers', () => {
  it('parses only well-formed day values', () => {
    expect(parseDay('2026-10-27')?.getTime()).toBe(new Date(2026, 9, 27).getTime())
    expect(parseDay('2026-1-1')).toBeUndefined()
    expect(parseDay('not-a-date')).toBeUndefined()
    expect(parseDay(undefined)).toBeUndefined()
  })

  it('serialises the local calendar day', () => {
    expect(formatDayValue(new Date(2026, 9, 27))).toBe('2026-10-27')
  })

  it('formats for both shipped languages', () => {
    expect(formatDayDisplay('2026-10-27', 'en-US')).toBe('Oct 27, 2026')
    expect(formatDayDisplay('2026-10-27', 'zh-CN')).toBe('2026年10月27日')
  })
})
```

- [ ] **Step 12: 接入根工作区**

在根 `package.json` 的 `dependencies` 首位加入：

```json
"@fish-admin/contracts": "workspace:*",
```

在 `scripts` 中加入：

```json
"test:contracts": "pnpm --filter @fish-admin/contracts test",
```

把 `typecheck` 改为：

```json
"typecheck": "tsc --noEmit && pnpm --filter @fish-admin/contracts typecheck && pnpm --filter @fish-admin/tokens typecheck && pnpm --filter @fish-admin/react typecheck && pnpm --filter @fish-admin/docs typecheck",
```

- [ ] **Step 13: 安装并运行**

```bash
pnpm install
pnpm --filter @fish-admin/contracts test
pnpm --filter @fish-admin/contracts typecheck
pnpm exec vitest run src/config/nav.test.ts src/features/navigation/resolve.test.ts src/lib/permissions.test.ts src/lib/date-parity.test.ts
pnpm typecheck
pnpm lint
```

Expected: contracts 3 个测试文件全绿；应用导航/权限/日期 parity 测试全绿；typecheck 无错误。

- [ ] **Step 14: 提交**

```bash
git add packages/contracts src/types src/config src/features/navigation src/lib package.json pnpm-lock.yaml
git commit -m "refactor(contracts): extract the framework-neutral domain contract"
```

---

### Task B2: `@fish-admin/i18n` 与 React 适配层

**Files:**

- Create: `packages/i18n/package.json`、`tsconfig.json`、`vitest.config.ts`
- Create: `packages/i18n/src/{index,languages,resources}.ts`、`index.test.ts`
- Move: `src/locales/{en,zh-CN}` → `packages/i18n/locales/{en,zh-CN}`
- Modify: `src/lib/i18n.ts`（改为适配层）、`src/lib/locales.test.ts`、`src/config/nav.test.ts`、`src/config/shell.test.ts`
- Modify: `scripts/scaffold.mjs`、`scripts/scaffold.test.mjs`（locale 路径）
- Modify: `scripts/extract-ui-messages.mjs`（读取路径 `src/locales` → `packages/i18n/locales`）
- Modify: root `package.json`

**Interfaces:**

- Consumes: 现有 21 个 namespace、`i18next`、`i18next-resources-to-backend`。
- Produces:
  - `@fish-admin/i18n` → `setupI18n({ plugins, storageKey })` 返回 `{ i18n, ready, initialLanguage, changeLanguage, ensureNamespaces, currentLanguage, nextLanguage }`；
  - `SUPPORTED_LANGUAGES`、`SupportedLanguage`、`EAGER_NAMESPACES`、`RESOURCES`；
  - `packages/i18n/locales/<locale>/*.json` 成为唯一语言资源目录。

- [ ] **Step 1: 创建 i18n 包骨架**

`packages/i18n/package.json`：

```json
{
  "name": "@fish-admin/i18n",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Framework-neutral FishAdmin i18n resources and i18next setup.",
  "exports": {
    ".": "./src/index.ts",
    "./locales/*": "./locales/*",
    "./package.json": "./package.json"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "i18next": "^26.5.3",
    "i18next-resources-to-backend": "^1.2.3"
  },
  "devDependencies": {
    "jsdom": "^30.1.3",
    "typescript": "^5.9.3",
    "vite": "^8.3.4",
    "vitest": "^5.0.5"
  }
}
```

`packages/i18n/tsconfig.json`：

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
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedSideEffectImports": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`packages/i18n/vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
  },
})
```

- [ ] **Step 2: 移动语言资源**

```bash
git mv src/locales packages/i18n/locales
```

Expected: `packages/i18n/locales/en` 与 `packages/i18n/locales/zh-CN` 各 21 个 JSON 文件。

- [ ] **Step 3: 写语言注册表与 eager 资源**

`packages/i18n/src/languages.ts`：

```ts
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']

/**
 * The other language the app ships, or `undefined` when only one is installed —
 * then the shell hides its language switches instead of switching to the current
 * one. `scripts/scaffold.mjs` removes locale entries, so this cannot be a
 * hard-coded pair.
 */
export function nextLanguage(current: string | undefined): SupportedLanguage | undefined {
  if (SUPPORTED_LANGUAGES.length < 2) return undefined
  return SUPPORTED_LANGUAGES.find((language) => language.code !== current)?.code
}
```

`packages/i18n/src/resources.ts`：

```ts
import enCommon from '../locales/en/common.json'
import enErrors from '../locales/en/errors.json'
import enNav from '../locales/en/nav.json'
import zhCommon from '../locales/zh-CN/common.json'
import zhErrors from '../locales/zh-CN/errors.json'
import zhNav from '../locales/zh-CN/nav.json'

export const EAGER_NAMESPACES = ['common', 'nav', 'errors'] as const

export const RESOURCES = {
  en: { common: enCommon, nav: enNav, errors: enErrors },
  'zh-CN': { common: zhCommon, nav: zhNav, errors: zhErrors },
}
```

- [ ] **Step 4: 写框架无关的 i18next 初始化**

`packages/i18n/src/index.ts`：

```ts
import i18n, { type Module } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

import { nextLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from './languages'
import { EAGER_NAMESPACES, RESOURCES } from './resources'

export { EAGER_NAMESPACES, nextLanguage, SUPPORTED_LANGUAGES }
export type { SupportedLanguage }

const lazyResources = import.meta.glob('../locales/*/*.json')
let storageKey = 'fish-admin:lang'

function resolveInitialLanguage(): SupportedLanguage {
  const codes = SUPPORTED_LANGUAGES.map((language) => language.code)
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
  if (stored && codes.includes(stored as SupportedLanguage)) return stored as SupportedLanguage

  // A browser asking for `zh-TW` still gets `zh-CN` if that is what the app
  // ships, so the match is on the primary subtag.
  const browser = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase()
  const match = SUPPORTED_LANGUAGES.find((language) =>
    browser.startsWith(language.code.toLowerCase().split('-')[0]),
  )

  return (match?.code ?? codes[0]) as SupportedLanguage
}

/** The language on screen, clamped to one this build actually ships. */
export function currentLanguage(): SupportedLanguage {
  const resolved = i18n.resolvedLanguage
  return (SUPPORTED_LANGUAGES.find((language) => language.code === resolved)?.code ??
    SUPPORTED_LANGUAGES[0].code) as SupportedLanguage
}

export function ensureNamespaces(namespaces: string | string[]) {
  return i18n.loadNamespaces(namespaces)
}

export async function changeLanguage(language: SupportedLanguage) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(storageKey, language)
  await i18n.changeLanguage(language)
}

export interface SetupI18nOptions {
  plugins?: Module[]
  storageKey: string
}

export function setupI18n({ plugins = [], storageKey: key }: SetupI18nOptions) {
  storageKey = key
  for (const plugin of plugins) i18n.use(plugin)

  i18n.use(
    resourcesToBackend((language: string, namespace: string) => {
      const loader = lazyResources[`../locales/${language}/${namespace}.json`]
      if (!loader) {
        return Promise.reject(new Error(`Missing locale resource: ${language}/${namespace}`))
      }
      return loader()
    }),
  )

  const initialLanguage = resolveInitialLanguage()
  const ready = i18n.init({
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((language) => language.code),
    ns: [...EAGER_NAMESPACES],
    defaultNS: 'common',
    resources: RESOURCES,
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
    returnNull: false,
  })

  i18n.on('languageChanged', (language) => {
    if (typeof document !== 'undefined') document.documentElement.lang = language
  })
  if (typeof document !== 'undefined') document.documentElement.lang = initialLanguage

  return {
    i18n,
    ready,
    initialLanguage,
    changeLanguage,
    ensureNamespaces,
    currentLanguage,
    nextLanguage,
  }
}
```

- [ ] **Step 5: 写包测试**

`packages/i18n/src/index.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import {
  changeLanguage,
  currentLanguage,
  EAGER_NAMESPACES,
  nextLanguage,
  setupI18n,
  SUPPORTED_LANGUAGES,
} from './index'
import { RESOURCES } from './resources'

describe('i18n resources', () => {
  it('ships every declared language', () => {
    expect(Object.keys(RESOURCES).sort()).toEqual(
      SUPPORTED_LANGUAGES.map((language) => language.code).sort(),
    )
  })

  it('ships every eager namespace', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      expect(Object.keys(RESOURCES[language.code]).sort()).toEqual([...EAGER_NAMESPACES].sort())
    }
  })

  it('picks the other installed language', () => {
    expect(nextLanguage('en')).toBe('zh-CN')
    expect(nextLanguage('zh-CN')).toBe('en')
  })
})

describe('setupI18n', () => {
  it('initialises from the storage key and switches language', async () => {
    localStorage.setItem('test:lang', 'zh-CN')
    const configured = setupI18n({ storageKey: 'test:lang' })
    await configured.ready

    expect(currentLanguage()).toBe('zh-CN')
    await changeLanguage('en')
    expect(currentLanguage()).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })
})
```

- [ ] **Step 6: 应用 i18n 改为薄适配层**

`src/lib/i18n.ts` 全文替换为：

```ts
import { initReactI18next } from 'react-i18next'

import {
  changeLanguage,
  currentLanguage,
  ensureNamespaces,
  nextLanguage,
  setupI18n,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@fish-admin/i18n'

const { ready } = setupI18n({
  plugins: [initReactI18next],
  storageKey: 'fish-admin:lang',
})

export const i18nReady = ready
export { changeLanguage, currentLanguage, ensureNamespaces, nextLanguage, SUPPORTED_LANGUAGES }
export type { SupportedLanguage }
```

- [ ] **Step 7: 更新 locale 测试的发现路径**

三处 `import.meta.glob` 改为包路径：

`src/config/nav.test.ts`：

```ts
import.meta.glob('../../packages/i18n/locales/*/nav.json', { eager: true, import: 'default' })
```

`src/config/shell.test.ts`：

```ts
import.meta.glob('../../packages/i18n/locales/*/settings.json', {
  eager: true,
  import: 'default',
})
```

`src/lib/locales.test.ts`：

```ts
const resources = import.meta.glob('../../packages/i18n/locales/*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, JsonObject>
```

并把该文件的路径解析正则改为：

```ts
const [, language, namespace] =
  path.match(/\.\.\/\.\.\/packages\/i18n\/locales\/([^/]+)\/([^/]+)\.json$/) ?? []
```

- [ ] **Step 8: 更新 scaffold 的 locale 锚点**

`scripts/scaffold.mjs`：

`discoverLocales` 中的：

```js
const directory = join(root, 'src', 'locales')
```

改为：

```js
const directory = join(root, 'packages', 'i18n', 'locales')
```

`brandStep` 中的：

```js
editor.json(`src/locales/${locale}/common.json`, (resource) => {
```

改为：

```js
editor.json(`packages/i18n/locales/${locale}/common.json`, (resource) => {
```

`localeStep` 替换为：

```js
function localeStep({ editor, options }) {
  for (const locale of options.droppedLocales) {
    editor.delete(`packages/i18n/locales/${locale}`)

    editor
      .subRegex(
        'packages/i18n/src/resources.ts',
        regex(`^import [A-Za-z]+ from '../locales/${escapeRegExp(locale)}/[a-z]+\\.json'\\n`),
        '',
        3,
      )
      .subRegex(
        'packages/i18n/src/languages.ts',
        regex(`^  \\{ code: '${escapeRegExp(locale)}',.*\\n`),
        '',
        1,
      )
      .subRegex(
        'packages/i18n/src/resources.ts',
        regex(`^  '${escapeRegExp(locale)}': \\{.*\\},\\n`),
        '',
        1,
      )

    editor.overwrite('e2e/i18n-theme.spec.ts', THEME_ONLY_SPEC, '简体中文')
    editor.block(
      'e2e/a11y.spec.ts',
      "  test('login page in Chinese', async ({ page }) => {",
      '  })',
    )
  }
}
```

`brandStep` 的 `renameToken` 文件列表加入：

```js
'packages/i18n/src/index.ts',
```

放在 `'src/lib/i18n.ts'` 之后。

- [ ] **Step 8b: 更新 UI 文案提取脚本**

`scripts/extract-ui-messages.mjs` 的 `read` 函数中：

```js
    fs.readFileSync(path.join(root, `src/locales/${locale}/common.json`), 'utf8'),
```

改为：

```js
    fs.readFileSync(path.join(root, `packages/i18n/locales/${locale}/common.json`), 'utf8'),
```

运行它确认引用仍能生成：

```bash
node scripts/extract-ui-messages.mjs
pnpm exec prettier --check packages/ui/src/locales/en.ts packages/ui/src/locales/zh-CN.ts
```

Expected: `locales: <n> keys`（与改动前相同的 key 数）；两个生成文件仍被 Prettier 接受，且 `git diff -- packages/ui/src/locales` 无输出。

- [ ] **Step 9: 接入根工作区**

根 `package.json` 的 `dependencies` 加入：

```json
"@fish-admin/i18n": "workspace:*",
```

`scripts` 加入：

```json
"test:i18n": "pnpm --filter @fish-admin/i18n test",
```

`typecheck` 改为：

```json
"typecheck": "tsc --noEmit && pnpm --filter @fish-admin/contracts typecheck && pnpm --filter @fish-admin/i18n typecheck && pnpm --filter @fish-admin/tokens typecheck && pnpm --filter @fish-admin/react typecheck && pnpm --filter @fish-admin/docs typecheck",
```

- [ ] **Step 10: 安装并运行**

```bash
pnpm install
pnpm --filter @fish-admin/i18n test
pnpm --filter @fish-admin/i18n typecheck
pnpm exec vitest run src/lib/locales.test.ts src/config/nav.test.ts src/config/shell.test.ts src/features/users/components/saved-views-menu.test.tsx
pnpm exec vitest run scripts/scaffold.test.mjs
pnpm typecheck
pnpm lint
```

Expected: i18n 4 passed（3 条 resources + 1 条 setup）；locale/nav/shell/namespace 测试全绿；scaffold 三个 variant 的 `checkPlan` 全部不抛错。

- [ ] **Step 11: 提交**

```bash
git add packages/i18n src/lib/i18n.ts src/lib/locales.test.ts src/config/nav.test.ts src/config/shell.test.ts scripts/scaffold.mjs scripts/scaffold.test.mjs scripts/extract-ui-messages.mjs package.json pnpm-lock.yaml
git commit -m "refactor(i18n): move locale resources into a shared package"
```

---

### Task B3: `@fish-admin/mock` 与运行时配置

**Files:**

- Create: `packages/mock/package.json`、`tsconfig.json`、`vitest.config.ts`
- Move: `src/mocks` → `packages/mock/src`
- Create: `packages/mock/src/{index,browser,node,runtime}.ts`
- Modify: `packages/mock/src/handlers/*.ts`、`http.ts`、`menu.ts`、`menu.test.ts`、`db/migrate.test.ts`
- Modify: `src/main.tsx`、`src/features/navigation/menu-icons.ts`、`src/features/navigation/resolve.test.ts`
- Modify: `scripts/scaffold.mjs`（mock/parity 清理与存储键路径）
- Modify: root `package.json`（dependency、移除 faker）

**Interfaces:**

- Consumes: `@fish-admin/contracts` 的类型、权限、demo 数据、审计数据、导航契约和日期工具。
- Produces:
  - `@fish-admin/mock/browser` → `createMockWorker({ apiBaseUrl, latency })`；
  - `@fish-admin/mock/node` → `createMockServer({ apiBaseUrl, latency })`；
  - `@fish-admin/mock` → `buildMenuPayload()` 与 `configureMock/mockApiUrl/mockLatency`；
  - 所有 handler 在模块求值后从 `mockApiUrl()` 读取 base URL。

- [ ] **Step 1: 创建 mock 包骨架**

`packages/mock/package.json`：

```json
{
  "name": "@fish-admin/mock",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "FishAdmin demo API: MSW handlers, seeded database and fake auth.",
  "exports": {
    ".": "./src/index.ts",
    "./browser": "./src/browser.ts",
    "./node": "./src/node.ts",
    "./runtime": "./src/runtime.ts",
    "./package.json": "./package.json"
  },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@faker-js/faker": "^10.6.0",
    "@fish-admin/contracts": "workspace:*",
    "msw": "^2.15.0"
  },
  "devDependencies": {
    "jsdom": "^30.1.3",
    "typescript": "^5.9.3",
    "vitest": "^5.0.5"
  }
}
```

`packages/mock/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "types": []
  },
  "include": ["src"]
}
```

`packages/mock/vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
  },
})
```

- [ ] **Step 2: 移动 mock 源码**

```bash
git mv src/mocks packages/mock/src
```

Expected: `packages/mock/src` 下有 15 个 handler 文件、`db/`、seed 文件、`browser.ts`、`node.ts`、`http.ts`、`menu.ts` 和三个测试文件。

- [ ] **Step 3: 写运行时配置与工厂**

`packages/mock/src/runtime.ts`：

```ts
let apiBaseUrl = '/api'
let latency = 0

export interface MockRuntimeOptions {
  apiBaseUrl: string
  latency?: number
}

export function configureMock(options: MockRuntimeOptions) {
  apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, '')
  latency = options.latency ?? 0
}

export function mockApiUrl() {
  return apiBaseUrl
}

export function mockLatency() {
  return latency
}
```

`packages/mock/src/browser.ts`：

```ts
import { setupWorker } from 'msw/browser'

import { configureMock, type MockRuntimeOptions } from './runtime'

/**
 * Handlers are imported after `configureMock` so their module-level
 * `const API = mockApiUrl()` sees the configured base URL.
 */
export async function createMockWorker(options: MockRuntimeOptions) {
  configureMock(options)
  const { handlers } = await import('./handlers')
  return setupWorker(...handlers)
}
```

`packages/mock/src/node.ts`：

```ts
import { setupServer } from 'msw/node'

import { configureMock, type MockRuntimeOptions } from './runtime'

export async function createMockServer(options: MockRuntimeOptions) {
  configureMock(options)
  const { handlers } = await import('./handlers')
  return setupServer(...handlers)
}
```

`packages/mock/src/index.ts`：

```ts
export { buildMenuPayload } from './menu'
export { configureMock, mockApiUrl, mockLatency, type MockRuntimeOptions } from './runtime'
```

- [ ] **Step 4: 改写 mock 内部导入**

在 `packages/mock/src` 执行：

```bash
grep -rl "@/types" packages/mock/src | xargs sed -i "s|@/types|@fish-admin/contracts|g"
grep -rl "@/config/permissions" packages/mock/src | xargs sed -i "s|@/config/permissions|@fish-admin/contracts/permissions|g"
grep -rl "@/config/demo" packages/mock/src | xargs sed -i "s|@/config/demo|@fish-admin/contracts/demo|g"
grep -rl "@/lib/permissions" packages/mock/src | xargs sed -i "s|@/lib/permissions|@fish-admin/contracts/permissions|g"
grep -rl "@/config/integrations" packages/mock/src | xargs sed -i "s|@/config/integrations|@fish-admin/contracts/integrations|g"
grep -rl "@/config/audit" packages/mock/src | xargs sed -i "s|@/config/audit|@fish-admin/contracts/audit|g"
grep -rl "@fish-admin/react/internal/date" packages/mock/src | xargs sed -i "s|@fish-admin/react/internal/date|@fish-admin/contracts/date|g"
```

`handlers/reports.ts` 与 `reports.ts` 中的日期导入因此改为 `@fish-admin/contracts/date`。

- [ ] **Step 5: handler 改用运行时 base URL**

在 `packages/mock/src/handlers` 执行：

```bash
grep -rl "const API = env.apiBaseUrl" packages/mock/src/handlers | xargs sed -i "s|const API = env.apiBaseUrl|const API = mockApiUrl()|"
grep -rl "import { env } from '@/config/env'" packages/mock/src/handlers | xargs sed -i "s|import { env } from '@/config/env'|import { mockApiUrl } from '../runtime'|"
```

`packages/mock/src/http.ts` 改为：

```ts
import { delay, HttpResponse, type JsonBodyType } from 'msw'

import { mockLatency } from './runtime'

export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return HttpResponse.json({ code: error.code, message: error.message }, { status: error.status })
  }

  console.error('[mock] Unhandled resolver error', error)
  return HttpResponse.json(
    { code: 'MOCK_ERROR', message: 'Unexpected mock server error.' },
    { status: 500 },
  )
}

async function wait() {
  const latency = mockLatency()
  if (latency > 0) await delay(latency)
}

export async function run<T>(resolver: () => T | Promise<T>): Promise<Response> {
  await wait()
  try {
    return HttpResponse.json((await resolver()) as unknown as JsonBodyType)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function runNoContent(resolver: () => void | Promise<void>): Promise<Response> {
  await wait()
  try {
    await resolver()
    return new HttpResponse(null, { status: 204 })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}
```

- [ ] **Step 6: mock 菜单直接序列化契约**

`packages/mock/src/menu.ts` 全文替换为：

```ts
import { NAV_CONTRACT, type MenuPayload } from '@fish-admin/contracts/navigation'

/**
 * Serialized from the shared navigation contract so the demo, the offline
 * fallback and the future framework ports cannot drift. Every entry carries its
 * permission code, so the client can re-check it against the session.
 */
export function buildMenuPayload(): MenuPayload {
  return {
    groups: NAV_CONTRACT.map((group) => ({
      titleKey: group.titleKey,
      items: group.items.map((item) => ({
        titleKey: item.titleKey,
        path: item.to,
        icon: item.icon,
        ...(item.permission ? { permission: item.permission } : {}),
      })),
    })),
  }
}
```

`packages/mock/src/menu.test.ts` 全文替换为：

```ts
import { NAV_CONTRACT, MENU_ICON_NAMES } from '@fish-admin/contracts/navigation'
import { describe, expect, it } from 'vitest'

import { buildMenuPayload } from './menu'

function pathsOf(payload: ReturnType<typeof buildMenuPayload>) {
  return payload.groups.flatMap((group) => group.items.map((item) => item.path))
}

describe('mock menu payload', () => {
  it('sends an icon name the client registry knows', () => {
    for (const item of buildMenuPayload().groups.flatMap((group) => group.items)) {
      expect(MENU_ICON_NAMES, item.path).toContain(item.icon)
    }
  })

  it('mirrors the shared navigation contract', () => {
    expect(pathsOf(buildMenuPayload())).toEqual(
      NAV_CONTRACT.flatMap((group) => group.items.map((item) => item.to)),
    )
    expect(buildMenuPayload().groups.map((group) => group.titleKey)).toEqual(
      NAV_CONTRACT.map((group) => group.titleKey),
    )
  })

  it('carries each entry permission so the client can re-check its session', () => {
    const items = buildMenuPayload().groups.flatMap((group) => group.items)

    expect(items.find((item) => item.path === '/users')?.permission).toBe('user:read')
    expect(items.find((item) => item.path === '/profile')?.permission).toBeUndefined()
  })

  it('leaves no group without an entry', () => {
    const payload = buildMenuPayload()
    expect(payload.groups.length).toBeGreaterThan(0)

    for (const group of payload.groups) {
      expect(group.items.length, group.titleKey).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 7: 修正迁移测试的相对导入**

`packages/mock/src/db/migrate.test.ts` 中的：

```ts
import { MOCK_DB_STORAGE_KEY, MOCK_DB_VERSION } from '@/mocks/db/types'
```

改为：

```ts
import { MOCK_DB_STORAGE_KEY, MOCK_DB_VERSION } from './types'
```

- [ ] **Step 8: 应用启动改用工厂**

`src/main.tsx` 顶部加入：

```ts
import { env } from '@/config/env'
```

把 mock 启动块改为：

```ts
if (mocksEnabled) {
  try {
    const { createMockWorker } = await import('@fish-admin/mock/browser')
    const worker = await createMockWorker({
      apiBaseUrl: env.apiBaseUrl,
      latency: env.mockLatency,
    })
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      },
    })
  } catch (error) {
    console.error('Mock API failed to start', error)
  }
}
```

保留块前面的两条注释与 `mockFlag` / `mocksEnabled` 计算；scaffold 的 block 起点仍是：

```ts
// Inlined instead of reading `env.enableMock` so the bundler can evaluate the
```

- [ ] **Step 9: 删除应用侧反向图标映射**

`src/features/navigation/menu-icons.ts` 删除 `ICON_NAMES` 与 `iconNameFor`。文件保留 `MENU_ICONS`、`export { MENU_ICON_NAMES }`、`resolveMenuIcon`。

`src/features/navigation/resolve.test.ts`：

- 导入改为 `import { MENU_ICON_NAMES, resolveMenuIcon } from './menu-icons'`；
- 删除 `iconNameFor` 那条断言，把第一个测试替换为：

```ts
it('derives the shipped nav from the shared contract', () => {
  expect(ALL_NAV_ITEMS.map((item) => item.to)).toEqual(
    NAV_CONTRACT.flatMap((group) => group.items.map((item) => item.to)),
  )
})
```

- 在该文件顶部加入：

```ts
import { NAV_CONTRACT } from '@fish-admin/contracts/navigation'
```

- [ ] **Step 10: 更新 scaffold 的 mock 清理**

`scripts/scaffold.mjs`：

`brandStep` 的 `renameToken` 列表中，把：

```js
'src/mocks/db/types.ts',
```

改为：

```js
'packages/mock/src/db/types.ts',
```

`mockStep` 的删除列表：

```js
editor.delete(
  'src/mocks',
  'public/mockServiceWorker.js',
  'src/features/settings/api.ts',
  'src/config/demo.ts',
)
```

改为：

```js
editor.delete(
  'packages/mock',
  'public/mockServiceWorker.js',
  'src/features/settings/api.ts',
  'src/config/demo.ts',
)
```

`mockStep` 的 `package.json` 变更中加入：

```js
delete pkg.dependencies['@fish-admin/mock']
```

`mockStep` 删除 main.tsx mock 块之后加入：

```js
editor.dropImport('src/main.tsx', '@/config/env')
```

`dropTestBrowsers` 的删除列表与 scripts 列表改为：

```js
editor.delete(
  'e2e',
  'playwright.config.ts',
  'playwright.visual.config.ts',
  'scripts/check-visual-platform.mjs',
  'scripts/visual-regression.mjs',
  'scripts/parity-freeze.mjs',
  'scripts/parity-freeze.test.mjs',
)

editor.json('package.json', (pkg) => {
  for (const script of [
    'test:e2e',
    'test:visual',
    'test:visual:update',
    'test:visual:docker',
    'perf',
    'check:parity:freeze',
    'parity:freeze',
  ]) {
    delete pkg.scripts[script]
  }
})
```

`dropTestBrowsers` 的 tsconfig 变换改为：

```js
editor.sub('tsconfig.json', text('    "src",', '    "e2e",'), text('    "src",'))
```

`scripts/scaffold.mjs` 的 `USAGE` 文案同步：

```js
  '  --mock=keep|drop         drop removes packages/mock, MSW, and the Playwright suite',
```

- [ ] **Step 11: 接入根工作区**

根 `package.json`：

- `dependencies` 加入 `"@fish-admin/mock": "workspace:*"`；
- 从 `devDependencies` 删除 `"@faker-js/faker": "^10.6.0"`（faker 现在只属于 `packages/mock`）；
- 保留 `"msw": "^2.15.0"`（`msw:init` 仍在根执行）与 `msw.workerDirectory`；
- `scripts` 加入 `"test:mock": "pnpm --filter @fish-admin/mock test"`；
- `typecheck` 改为：

```json
"typecheck": "tsc --noEmit && pnpm --filter @fish-admin/contracts typecheck && pnpm --filter @fish-admin/i18n typecheck && pnpm --filter @fish-admin/mock typecheck && pnpm --filter @fish-admin/tokens typecheck && pnpm --filter @fish-admin/react typecheck && pnpm --filter @fish-admin/docs typecheck",
```

- [ ] **Step 12: 安装并运行**

```bash
pnpm install
pnpm --filter @fish-admin/mock test
pnpm --filter @fish-admin/mock typecheck
pnpm exec vitest run src/features/navigation/resolve.test.ts
pnpm exec vitest run scripts/scaffold.test.mjs
pnpm test
pnpm typecheck
```

Expected: mock 3 个测试文件全绿；导航 resolve 测试全绿；scaffold 三个 variant 通过；根套件全绿。

- [ ] **Step 13: 提交**

```bash
git add packages/mock src/main.tsx src/features/navigation scripts/scaffold.mjs package.json pnpm-lock.yaml
git commit -m "refactor(mock): extract the demo API into a shared runtime package"
```

### Task B4: 文档路径迁移、工作区脚本与 CI 收口

**Files:**

- Modify: `README.md`、`README.zh-CN.md`、`CONTRIBUTING.md`
- Modify: `docs/en/*.md`、`docs/zh-CN/*.md`（架构、API、部署、脚手架、表格、工作流、字典、账号生命周期）
- Modify: root `package.json`、`.github/workflows/ci.yml`

**Interfaces:**

- Consumes: B1–B3 的包路径与脚本（`test:contracts`、`test:i18n`、`test:mock`）。
- Produces:
  - `pnpm test:shared` → 依次运行 contracts、i18n、mock 三个包的测试；
  - 仓库文档中不再出现 `src/mocks` 或 `src/locales`；
  - CI 的 quality job 运行共享包测试。

- [ ] **Step 1: 机械替换文档路径**

在仓库根目录执行：

```bash
grep -rl 'src/mocks\|src/locales' README.md README.zh-CN.md CONTRIBUTING.md docs/en docs/zh-CN \
  | xargs sed -i \
    -e 's|packages/ui/src/locales|@@UI_LOCALES@@|g' \
    -e 's|src/mocks|packages/mock/src|g' \
    -e 's|src/locales|packages/i18n/locales|g' \
    -e 's|@@UI_LOCALES@@|packages/ui/src/locales|g'
```

第一条替换先保护组件包自己的 `packages/ui/src/locales`，否则会被误改成
`packages/ui/packages/i18n/locales`。

再把“删除整个 mock 包”的句子从 `packages/mock/src` 改回包根：

```bash
grep -rl 'packages/mock/src' README.md README.zh-CN.md docs/en docs/zh-CN \
  | xargs sed -i \
    -e 's|delete `packages/mock/src`|delete `packages/mock`|g' \
    -e 's|Delete `packages/mock/src`|Delete `packages/mock`|g' \
    -e 's|deletes `packages/mock/src`|deletes `packages/mock`|g' \
    -e 's|删除 `packages/mock/src`|删除 `packages/mock`|g'
```

排除项：`CHANGELOG.md` 与 `docs/plans/**` 是历史记录，不改；`docs/superpowers/**` 是计划存档，不改。

- [ ] **Step 2: 修正叙述性段落**

机械替换后，以下句子仍需按新架构改写（英文与中文镜像同步改）：

| 文件                                                  | 旧内容                                                                               | 新内容                                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/en/architecture.md` Boot sequence 第 2 条       | “dynamically import `src/mocks/browser` and start the Service Worker”                | “dynamically import `@fish-admin/mock/browser`, call `createMockWorker({ apiBaseUrl, latency })` and start the Service Worker”                      |
| `docs/zh-CN/architecture.md` 对应段落                 | “动态 import `src/mocks/browser` 并启动 Service Worker”                              | “动态 import `@fish-admin/mock/browser`，调用 `createMockWorker({ apiBaseUrl, latency })` 并启动 Service Worker”                                    |
| `docs/en/architecture.md` Internationalization 第一条 | “Locale JSON lives in `packages/i18n/locales/{en,zh-CN}`”                            | “Locale JSON lives in `packages/i18n/locales/{en,zh-CN}`; `src/lib/i18n.ts` is only the React-i18next adapter over `setupI18n`”                     |
| `docs/zh-CN/architecture.md` 对应段落                 | “语言 JSON 位于 `packages/i18n/locales/{en,zh-CN}`”                                  | “语言 JSON 位于 `packages/i18n/locales/{en,zh-CN}`；`src/lib/i18n.ts` 只是 `setupI18n` 之上的 react-i18next 适配层”                                 |
| `docs/en/api-integration.md` 菜单图标行               | “One of the 17 names in `src/features/navigation/menu-icons.ts`”                     | “One of the 19 names in `MENU_ICON_NAMES` (`packages/contracts/src/navigation.ts`)”，并在列表补上 `book-marked`、`workflow`                         |
| `docs/zh-CN/api-integration.md` 对应行                | “`src/features/navigation/menu-icons.ts` 里的 17 个名字之一”                         | “`MENU_ICON_NAMES`（`packages/contracts/src/navigation.ts`）里的 19 个名字之一”，并补上 `book-marked`、`workflow`                                   |
| `docs/en/api-integration.md` 菜单 demo 条目           | “The demo serializes this endpoint from `NAV_GROUPS` (`packages/mock/src/menu.ts`)”  | “The demo serializes this endpoint from `NAV_CONTRACT` (`packages/mock/src/menu.ts`), the same contract the app derives `NAV_GROUPS` from”          |
| `docs/zh-CN/api-integration.md` 对应条目              | “演示环境里这个接口由 `NAV_GROUPS` 序列化而来（`packages/mock/src/menu.ts`）”        | “演示环境里这个接口由 `NAV_CONTRACT` 序列化而来（`packages/mock/src/menu.ts`），应用侧的 `NAV_GROUPS` 也由同一份契约派生”                           |
| `docs/en/scaffold.md` 的 `--locales` 段               | “its three imports … and its resource block in `src/lib/i18n.ts`”                    | “its three imports and resource block in `packages/i18n/src/resources.ts`, and its `SUPPORTED_LANGUAGES` entry in `packages/i18n/src/languages.ts`” |
| `docs/zh-CN/scaffold.md` 的 `--locales` 段            | “`src/lib/i18n.ts` 中对应的三个 import、`SUPPORTED_LANGUAGES` 条目与 resources 区块” | “`packages/i18n/src/resources.ts` 中对应的三个 import 与 resources 区块，以及 `packages/i18n/src/languages.ts` 中的 `SUPPORTED_LANGUAGES` 条目”     |
| `docs/en/scaffold.md` 的 `--mock=drop` 段             | “and the `msw` / `@faker-js/faker` dev dependencies”                                 | “the `@fish-admin/mock` workspace dependency, the root `msw` devDependency and its `msw` init config”                                               |
| `docs/zh-CN/scaffold.md` 的 `--mock=drop` 段          | “以及 `msw` / `@faker-js/faker` 两个 devDependency”                                  | “`@fish-admin/mock` workspace 依赖、根目录的 `msw` devDependency 与 `msw` init 配置”                                                                |
| `docs/en/architecture.md` Mock backend 标题下         | （无共享包说明）                                                                     | 在 “## Mock backend” 前新增 “## Shared packages” 小节，内容见 Step 3                                                                                |
| `docs/zh-CN/architecture.md` 对应位置                 | （无共享包说明）                                                                     | 在 “## Mock backend” 前新增 “## 共享包” 小节，内容见 Step 3                                                                                         |

- [ ] **Step 3: 在架构文档记录共享包**

`docs/en/architecture.md` 在 “## Mock backend” 之前插入：

```markdown
## Shared packages

Three private workspace packages hold everything a second renderer needs:

- `@fish-admin/contracts` — domain types, permission codes, `NAV_CONTRACT`, demo, integration and audit data, and the framework-neutral date helpers.
- `@fish-admin/i18n` — the 21 locale namespaces plus `setupI18n`; `src/lib/i18n.ts` only plugs react-i18next into it.
- `@fish-admin/mock` — the MSW handlers, the seeded database and `createMockWorker` / `createMockServer`.

None of them imports React, the `@/` alias or Lucide. `parity/` freezes the documented surface and runs the same scenarios against the React baseline and a future Vue target; see [Vue port foundation](vue-port-foundation.md).
```

`docs/zh-CN/architecture.md` 在 “## Mock backend” 之前插入：

```markdown
## 共享包

三个私有 workspace 包承载第二个渲染框架所需的一切：

- `@fish-admin/contracts` —— 领域类型、权限码、`NAV_CONTRACT`、演示/集成/审计数据，以及与框架无关的日期工具。
- `@fish-admin/i18n` —— 21 个语言 namespace 与 `setupI18n`；`src/lib/i18n.ts` 只负责把 react-i18next 接进来。
- `@fish-admin/mock` —— MSW handler、种子数据库，以及 `createMockWorker` / `createMockServer`。

三者都不导入 React、`@/` 别名或 Lucide。`parity/` 冻结文档表面，并用同一套场景同时跑 React 基线与未来的 Vue target；见 [Vue 移植地基](vue-port-foundation.md)。
```

- [ ] **Step 4: 更新 README 目录树与脚本表**

`README.md` 的 “## Project structure” 代码块替换为：

```text
packages/tokens/             # @fish-admin/tokens — JSON contract, generated CSS/manifest/editor helpers
├─ src/tokens.json           # the only place a token may be declared
├─ src/editor/               # sanitise, validate, contrast and serialise helpers
└─ scripts/                  # build + consistency check
packages/ui/                 # @fish-admin/react — the component library
├─ src/components/           # ui (47 primitives), enterprise (30), pro (6), data-table, common
├─ src/locales/              # en + zh-CN strings the components ship with
├─ src/styles/               # token import, utilities, preflight, a11y and the app-owned base
├─ registry.json             # the 83-entry inventory gen-api reads
└─ test/                     # package-level tests
packages/contracts/          # @fish-admin/contracts — framework-neutral domain contracts
├─ src/types/                # domain and API types shared with a future port
├─ src/navigation.ts         # APP_PATHS, MENU_ICON_NAMES, NAV_CONTRACT and menu wire types
├─ src/permissions.ts        # permission codes, role grants and hasPermission
└─ src/{demo,integrations,audit,date}.ts
packages/i18n/               # @fish-admin/i18n — locales without a framework
├─ locales/{en,zh-CN}/       # 21 lazy-loaded namespaces
└─ src/                      # languages, eager resources and setupI18n
packages/mock/               # @fish-admin/mock — the demo API without React
├─ src/handlers/             # 14 MSW handlers
├─ src/db/                   # seeded database and migrations
└─ src/{browser,node,runtime}.ts
apps/docs/                   # the Rspress documentation site
├─ docs/{en,zh}/             # 83 component pages, guides and the versions page
├─ demos/<component>/        # the live example each page renders
├─ theme/                    # token reference, theme editor and RTL audit views
├─ generated/                # registry.json, API tables and rtl-audit.json
└─ docs/public/screenshots/  # the README and docs hero shots
src/                         # the template
├─ routes/                   # File-based routes; routeTree.gen.ts is generated
├─ features/                 # auth, dashboard, users, roles, permissions, departments, audit, projects, files, reports, notifications, integrations, profile, security, settings
├─ components/
│  ├─ layout/                # AppShell, sidebar, header, notification bell, breadcrumbs, command menu, offline banner
│  └─ common/                # Can, EmptyState, StatusScreen, theme/language toggles
├─ config/                   # env, permissions, audit actions, navigation, theme presets
├─ lib/                      # API client, auth helpers, i18n adapter, formatting, CSV, online status
├─ stores/                   # Auth, theme and UI Zustand stores
└─ styles/index.css          # the only Tailwind entry
e2e/                         # Playwright specs
docs/{en,zh-CN}/             # Repository documentation (the site above is the product one)
```

`README.zh-CN.md` 的同一代码块替换为对应中文注释版本：

```text
packages/tokens/             # @fish-admin/tokens —— JSON 契约、生成的 CSS/manifest/编辑器辅助函数
├─ src/tokens.json           # 唯一声明令牌的地方
├─ src/editor/               # 清洗、校验、对比度与序列化辅助函数
└─ scripts/                  # 构建与一致性检查
packages/ui/                 # @fish-admin/react —— 组件库
├─ src/components/           # ui（47 个原语）、enterprise（30 个）、pro（6 个）、data-table、common
├─ src/locales/              # 组件自带的 en + zh-CN 文案
├─ src/styles/               # 令牌导入、工具类、preflight、a11y 与归应用的 base 样式
├─ registry.json             # 83 条登记项，gen-api 的输入
└─ test/                     # 包级测试
packages/contracts/          # @fish-admin/contracts —— 框架无关的领域契约
├─ src/types/                # 与未来移植共享的领域与 API 类型
├─ src/navigation.ts         # APP_PATHS、MENU_ICON_NAMES、NAV_CONTRACT 与菜单 wire 类型
├─ src/permissions.ts        # 权限码、角色授权与 hasPermission
└─ src/{demo,integrations,audit,date}.ts
packages/i18n/               # @fish-admin/i18n —— 不依赖框架的语言资源
├─ locales/{en,zh-CN}/       # 21 个懒加载 namespace
└─ src/                      # 语言列表、eager resources 与 setupI18n
packages/mock/               # @fish-admin/mock —— 不依赖 React 的演示 API
├─ src/handlers/             # 14 个 MSW handler
├─ src/db/                   # 种子数据库与迁移
└─ src/{browser,node,runtime}.ts
apps/docs/                   # Rspress 文档站点
├─ docs/{en,zh}/             # 83 个组件页、指南与版本页
├─ demos/<component>/        # 每个页面渲染的实时示例
├─ theme/                    # 令牌参考、主题编辑器与 RTL 审计视图
├─ generated/                # registry.json、API 表与 rtl-audit.json
└─ docs/public/screenshots/  # README 与文档首屏截图
src/                         # 模板
├─ routes/                   # 文件路由；routeTree.gen.ts 自动生成
├─ features/                 # auth、dashboard、users、roles、permissions、departments、audit、projects、files、reports、notifications、integrations、profile、security、settings
├─ components/
│  ├─ layout/                # AppShell、侧边栏、Header、通知铃铛、面包屑、命令面板、离线横幅
│  └─ common/                # Can、EmptyState、StatusScreen、主题/语言切换
├─ config/                   # env、权限、审计动作、导航、主题预设
├─ lib/                      # API 客户端、鉴权、i18n 适配层、格式化、CSV、在线状态
├─ stores/                   # 会话、主题、UI 状态
└─ styles/index.css          # 唯一的 Tailwind 入口
e2e/                         # Playwright 用例
docs/{en,zh-CN}/             # 仓库文档（上面那个站点才是产品文档）
```

两份 README 的 Scripts 表都新增：

```markdown
| `pnpm test:shared` | Test `contracts`, `i18n` and `mock` as one unit |
```

中文版：

```markdown
| `pnpm test:shared` | 一次运行 `contracts`、`i18n`、`mock` 三个包的测试 |
```

两份 README 的 “Connect your own backend” / “接入自己的后端” 第 2 条改为：

```markdown
2. Remove the mock bootstrap block in `src/main.tsx`, then delete `packages/mock` and `public/mockServiceWorker.js`.
```

```markdown
2. 删除 `src/main.tsx` 中的 Mock 启动块，然后删除 `packages/mock` 与 `public/mockServiceWorker.js`。
```

- [ ] **Step 5: 更新 CONTRIBUTING 的语言与包说明**

把：

```markdown
- Template UI strings belong in `src/locales/{en,zh-CN}`; component strings belong in `packages/ui/src/locales`. Add both languages in the same pull request. The locale parity tests enforce this.
```

改为：

```markdown
- Template UI strings belong in `packages/i18n/locales/{en,zh-CN}`; component strings belong in `packages/ui/src/locales`. Add both languages in the same pull request. The locale parity tests enforce this. `packages/contracts`, `packages/i18n` and `packages/mock` must stay framework-neutral: no React, no `@/` alias, no Lucide imports.
```

“## Adding a language” 的六步替换为：

```markdown
## Adding a language

1. Copy `packages/i18n/locales/en` to `packages/i18n/locales/<locale>` and translate every namespace.
2. Register the locale in `packages/i18n/src/languages.ts` and the language switcher.
3. Add the locale to the language names map and the `supportedLngs` list.
4. Regenerate the package strings: `node scripts/extract-ui-messages.mjs` writes `packages/ui/src/locales/{en,zh-CN}.ts` from the template's `packages/i18n/locales/en/common.json` and throws when a key is missing from a locale, so add the new locale's `read`/`write` pair there instead of hand-editing the generated files. Widen `UILocale` and the `BUILT_IN` map in `packages/ui/src/i18n.tsx` to match.
5. Add a matching language tree to the docs site — a directory under `apps/docs/docs/<locale>`, an entry in the multilingual config in `apps/docs/rspress.config.ts`, and the site's own UI strings in `apps/docs/site.ts`.
6. Run `pnpm test:shared` and `pnpm test` — `src/lib/locales.test.ts` checks namespace and key parity across the template locales, and the package locale parity is enforced by the extractor.
```

- [ ] **Step 6: 增加聚合脚本与 CI 步骤**

根 `package.json` 的 `scripts` 加入：

```json
"test:shared": "pnpm --filter @fish-admin/contracts test && pnpm --filter @fish-admin/i18n test && pnpm --filter @fish-admin/mock test",
```

`.github/workflows/ci.yml` 的 `quality` job 中，在 `Component tests with coverage floor` 之后加入：

```yaml
- name: Shared package tests
  run: pnpm test:shared
```

- [ ] **Step 7: 重新生成文档模板副本并做零引用检查**

Run:

```bash
pnpm --filter @fish-admin/docs sync:template
grep -rn 'src/mocks\|src/locales' README.md README.zh-CN.md CONTRIBUTING.md docs/en docs/zh-CN apps/docs/docs
grep -rn 'packages/ui/packages' README.md README.zh-CN.md CONTRIBUTING.md docs/en docs/zh-CN
```

Expected: 后两条命令均无输出（`apps/docs/docs` 下是刚同步的生成副本，已被 gitignore）。

再检查代码侧没有遗留别名：

```bash
grep -rn "@/mocks\|@/locales" src packages --include='*.ts' --include='*.tsx'
```

Expected: 无输出。

- [ ] **Step 8: 全量验证**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:shared
pnpm check:maturity
pnpm gen-api:check
pnpm docs:check
```

Expected: 全部退出码 0；根套件不少于 380 条，不得有 skipped 之外的失败；`test:shared` 覆盖三个包。

- [ ] **Step 9: 提交**

```bash
git add README.md README.zh-CN.md CONTRIBUTING.md docs/en docs/zh-CN package.json .github/workflows/ci.yml
git commit -m "docs: point the repository docs at the shared packages"
```

---

## Phase C — 跨框架组件合同与 parity 测试台

Phase C 不引入 Vue，也不改变任何组件。它把 2.2.0 已经存在的文档表面固化成机器可读的合同，再用一个可切换 target 的 Playwright 套件证明 React 目标能通过。未来新增 `parity/targets/vue.json` 后，同一套合同、场景和截图基线就能直接验证 Vue。

**Phase C 的硬约束：**

- 合同生成器只读 `apps/docs/generated/*.json`、`apps/docs/demos/registry.json` 和已冻结的 `*-linux.png`；不得写入这些文件。
- 场景 DSL 只使用可访问名称、角色、可见文本和状态，不写 CSS 选择器（`expectCount` 的表格行除外）；这样 Vue 只要实现同样的可访问表面就能复用。
- `contract.spec.ts` 在 React target 使用 `api.mode = "exact"`，逐行比对 API 表；未来 Vue target 可以设为 `"reference"`，但必须在该 target 的 `api.deviations` 中逐组件列出无法对齐的 prop。
- parity 视觉只读既有基线，`updateSnapshots: 'none'`，永不写入 `e2e-docs/__screenshots__`。

---

### Task C1: 生成组件合同与 docs surface 合同

**Files:**

- Create: `parity/pilot.json`
- Create: `scripts/parity-contract.mjs`
- Test: `scripts/parity-contract.test.mjs`
- Create: `parity/contract/components.json`（生成）
- Create: `parity/contract/docs-surface.json`（生成）
- Modify: `package.json`、`.github/workflows/ci.yml`、`.prettierignore`

**Interfaces:**

- Consumes: `apps/docs/generated/{registry,documented,api}.json`、`apps/docs/demos/registry.json`、`e2e-docs/__screenshots__/component-visual.spec.ts/*-linux.png`。
- Produces:
  - `buildContracts({ pilot, registry, documented, api, demos, baselines })` → `{ components, surface }`；
  - `components.json`：83 个组件的 id、name、category、status、since、exportName、source、docsPath、demos 和 API props/events；
  - `docs-surface.json`：83 条路由、每条路由的 demo anchor、preview/source/apiTable 选择器和 API 行数；
  - `node scripts/parity-contract.mjs --check`。

- [ ] **Step 1: 写试点清单**

`parity/pilot.json`：

```json
{
  "version": 1,
  "components": ["accordion", "date-range-picker", "dialog", "pro-table", "select", "tabs"]
}
```

六个试点覆盖：单项折叠（accordion）、日期弹层与格式化（date-range-picker）、portal 对话框（dialog）、数据表格（pro-table）、listbox（select）和键盘标签页（tabs）。

- [ ] **Step 2: 写失败测试**

创建 `scripts/parity-contract.test.mjs`：

```js
import { describe, expect, it } from 'vitest'

import { buildContracts, serialize } from './parity-contract.mjs'

function fixtures(overrides = {}) {
  return {
    pilot: { version: 1, components: ['button'] },
    registry: {
      components: [
        { id: 'button', name: 'Button', category: 'primitive', status: 'stable', since: '0.1.0' },
        { id: 'alert', name: 'Alert', category: 'primitive', status: 'stable', since: '0.1.0' },
      ],
    },
    documented: { components: ['button', 'alert'] },
    api: {
      components: {
        button: {
          exportName: 'Button',
          source: 'packages/ui/src/components/ui/button.tsx',
          props: [
            {
              name: 'variant',
              type: 'string',
              required: false,
              defaultValue: 'default',
              description: '',
            },
          ],
          events: [],
        },
        alert: {
          exportName: 'Alert',
          source: 'packages/ui/src/components/ui/alert.tsx',
          props: [],
          events: [],
        },
      },
    },
    demos: [
      { id: 'button/basic', component: 'button' },
      { id: 'alert/basic', component: 'alert' },
    ],
    baselines: new Set([
      'alert-dark-linux.png',
      'alert-light-linux.png',
      'button-dark-linux.png',
      'button-light-linux.png',
    ]),
    ...overrides,
  }
}

describe('parity contract', () => {
  it('sorts components and freezes the documented surface', () => {
    const { components, surface } = buildContracts(fixtures())

    expect(components.pilot).toEqual(['button'])
    expect(components.components.map((item) => item.id)).toEqual(['alert', 'button'])
    expect(surface.routes.map((route) => route.id)).toEqual(['alert', 'button'])

    const button = components.components[1]
    expect(button.api.props[0]).toEqual({
      name: 'variant',
      type: 'string',
      required: false,
      defaultValue: 'default',
    })
    expect(button.demos).toEqual(['button/basic'])

    const route = surface.routes[1]
    expect(route.paths).toEqual({ en: '/components/button', zh: '/zh/components/button' })
    expect(route.demos).toEqual([
      { id: 'button/basic', anchor: 'section[data-demo="button/basic"]' },
    ])
    expect(route.apiRows).toBe(1)
  })

  it('rejects a pilot that is not documented', () => {
    const input = fixtures()
    input.pilot = { version: 1, components: ['missing'] }

    expect(() => buildContracts(input)).toThrow(/missing is not documented/)
  })

  it('rejects a component without demos', () => {
    const input = fixtures()
    input.demos = input.demos.filter((demo) => demo.component !== 'button')

    expect(() => buildContracts(input)).toThrow(/button has no demos/)
  })

  it('rejects a missing visual baseline', () => {
    const input = fixtures()
    input.baselines.delete('button-dark-linux.png')

    expect(() => buildContracts(input)).toThrow(/button-dark-linux\.png is missing/)
  })

  it('serialises with a trailing newline', () => {
    expect(serialize({ version: 1 }).endsWith('\n')).toBe(true)
  })
})
```

- [ ] **Step 3: 运行测试确认失败**

```bash
pnpm exec vitest run scripts/parity-contract.test.mjs
```

Expected: FAIL，`Cannot find module './parity-contract.mjs'`。

- [ ] **Step 4: 实现生成器**

创建 `scripts/parity-contract.mjs`：

```js
#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const pilotPath = path.join(root, 'parity/pilot.json')
const registryPath = path.join(root, 'apps/docs/generated/registry.json')
const documentedPath = path.join(root, 'apps/docs/generated/documented.json')
const apiPath = path.join(root, 'apps/docs/generated/api.json')
const demosPath = path.join(root, 'apps/docs/demos/registry.json')
const visualRoot = path.join(root, 'e2e-docs/__screenshots__/component-visual.spec.ts')
const componentsOut = path.join(root, 'parity/contract/components.json')
const surfaceOut = path.join(root, 'parity/contract/docs-surface.json')

function fail(message) {
  throw new Error(`parity-contract: ${message}`)
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`${path.relative(root, file)} is missing`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function toApi(entry) {
  return {
    props: entry.props.map((prop) => ({
      name: prop.name,
      type: prop.type,
      required: Boolean(prop.required),
      defaultValue: prop.defaultValue ?? null,
    })),
    events: entry.events.map((event) => ({
      name: event.name,
      type: event.type,
      required: Boolean(event.required),
      defaultValue: event.defaultValue ?? null,
    })),
  }
}

export function buildContracts({ pilot, registry, documented, api, demos, baselines }) {
  if (pilot.version !== 1) fail('parity/pilot.json must use version 1')

  const pilotIds = [...pilot.components].sort()
  if (new Set(pilotIds).size !== pilotIds.length) fail('parity/pilot.json contains duplicates')

  const registryById = new Map(registry.components.map((entry) => [entry.id, entry]))
  const demoIds = new Set(demos.map((demo) => demo.id))

  const components = [...documented.components].sort().map((id) => {
    const entry = registryById.get(id)
    if (!entry) fail(`registry is missing documented component ${id}`)

    const apiEntry = api.components[id]
    if (!apiEntry) fail(`api.json is missing ${id}`)

    const demosFor = demos
      .filter((demo) => demo.component === id)
      .map((demo) => demo.id)
      .sort()
    if (demosFor.length === 0) fail(`${id} has no demos`)
    for (const demo of demosFor) {
      if (!demoIds.has(demo)) fail(`${id} references unknown demo ${demo}`)
    }

    const requiredBaselines = [`${id}-light-linux.png`, `${id}-dark-linux.png`]
    for (const file of requiredBaselines) {
      if (!baselines.has(file)) fail(`${file} is missing`)
    }

    return {
      id,
      name: entry.name,
      category: entry.category,
      status: entry.status,
      since: entry.since,
      exportName: apiEntry.exportName,
      source: apiEntry.source,
      docsPath: `/components/${id}`,
      demos: demosFor,
      api: toApi(apiEntry),
    }
  })

  for (const id of pilotIds) {
    const component = components.find((item) => item.id === id)
    if (!component) fail(`pilot ${id} is not documented`)
    if (component.status !== 'stable') fail(`pilot ${id} is ${component.status}, not stable`)
  }

  const surface = {
    version: 1,
    release: '2.2.0',
    routes: components.map((component) => ({
      id: component.id,
      paths: { en: component.docsPath, zh: `/zh${component.docsPath}` },
      demos: component.demos.map((id) => ({
        id,
        anchor: `section[data-demo="${id}"]`,
      })),
      selectors: {
        preview: '.fish-demo__preview',
        source: '.fish-demo__source',
        apiTable: 'table.fish-api',
      },
      apiRows: component.api.props.length + component.api.events.length,
    })),
  }

  return {
    components: {
      version: 1,
      release: '2.2.0',
      pilot: pilotIds,
      components,
    },
    surface,
  }
}

export function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function main() {
  const input = {
    pilot: readJson(pilotPath),
    registry: readJson(registryPath),
    documented: readJson(documentedPath),
    api: readJson(apiPath),
    demos: readJson(demosPath),
  }
  if (!fs.existsSync(visualRoot)) fail(`${path.relative(root, visualRoot)} is missing`)
  input.baselines = new Set(fs.readdirSync(visualRoot))

  const { components, surface } = buildContracts(input)
  const outputs = [
    [componentsOut, serialize(components)],
    [surfaceOut, serialize(surface)],
  ]
  const check = process.argv.includes('--check')
  let failed = false

  if (check) {
    for (const [file, content] of outputs) {
      if (!fs.existsSync(file)) {
        console.error(
          `parity-contract: ${path.relative(root, file)} is missing — run pnpm parity:contract`,
        )
        failed = true
      } else if (fs.readFileSync(file, 'utf8') !== content) {
        console.error(
          `parity-contract: ${path.relative(root, file)} is stale — run pnpm parity:contract`,
        )
        failed = true
      }
    }
  } else {
    fs.mkdirSync(path.dirname(componentsOut), { recursive: true })
    for (const [file, content] of outputs) fs.writeFileSync(file, content)
    console.log(
      `parity-contract: wrote ${components.components.length} components and ${surface.routes.length} routes`,
    )
  }

  process.exitCode = failed ? 1 : 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
```

- [ ] **Step 5: 运行测试并生成合同**

```bash
pnpm exec vitest run scripts/parity-contract.test.mjs
pnpm exec node scripts/parity-contract.mjs
pnpm exec node scripts/parity-contract.mjs --check
```

Expected: 5 passed；`parity-contract: wrote 83 components and 83 routes`；`--check` 无输出、退出码 0。

- [ ] **Step 6: 接入 scripts 与 CI**

根 `package.json` 的 `scripts` 加入：

```json
"parity:contract": "node scripts/parity-contract.mjs",
"check:parity:contract": "node scripts/parity-contract.mjs --check",
```

`.github/workflows/ci.yml` 的 `quality` job 中，在 `Parity baseline is unchanged` 之后加入：

```yaml
- name: Cross-framework contract is current
  run: pnpm check:parity:contract
```

在 `.prettierignore` 的 `parity/baseline` 之后追加：

```text
# Written by scripts/parity-contract.mjs; its JSON is not prettier's output.
parity/contract
```

- [ ] **Step 7: 提交**

```bash
git add parity/pilot.json parity/contract scripts/parity-contract.mjs scripts/parity-contract.test.mjs package.json .github/workflows/ci.yml .prettierignore
git commit -m "feat(parity): freeze the component and docs-surface contracts"
```

---

### Task C2: 行为场景 DSL 与六个试点场景

**Files:**

- Create: `scripts/parity-scenarios.mjs`
- Test: `scripts/parity-scenarios.test.mjs`
- Create: `parity/scenarios/{accordion,date-range-picker,dialog,pro-table,select,tabs}.json`
- Modify: `package.json`、`.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `parity/pilot.json`、`parity/contract/components.json`。
- Produces:
  - `validateScenario(scenario, component): string[]`；
  - `validateScenarioSet(pilot, components, scenarios): string[]`；
  - 场景 action 集合：`click`、`fill`、`press`、`pressKey`、`expectText`、`expectNotText`、`expectTargetText`、`expectVisible`、`expectHidden`、`expectCount`、`expectState`；
  - 状态集合：`expanded`、`selected`、`checked`、`disabled`。

- [ ] **Step 1: 写失败测试**

创建 `scripts/parity-scenarios.test.mjs`：

```js
import { describe, expect, it } from 'vitest'

import { validateScenario, validateScenarioSet } from './parity-scenarios.mjs'

const component = {
  id: 'button',
  demos: ['button/basic', 'button/disabled'],
}

function scenario(steps) {
  return {
    version: 1,
    component: 'button',
    demo: 'basic',
    appearance: 'light',
    steps,
  }
}

describe('parity scenarios', () => {
  it('accepts a scenario built from accessible names and states', () => {
    expect(
      validateScenario(
        scenario([
          { action: 'click', target: { role: 'button', name: 'Save' } },
          {
            action: 'expectState',
            target: { role: 'button', name: 'Save' },
            state: 'disabled',
            value: true,
          },
          { action: 'expectText', text: 'Saved' },
        ]),
        component,
      ),
    ).toEqual([])
  })

  it('rejects an unknown demo', () => {
    expect(validateScenario({ ...scenario([]), demo: 'missing' }, component)).toContain(
      'missing is not a demo of button',
    )
  })

  it('rejects an unknown action', () => {
    expect(validateScenario(scenario([{ action: 'hover' }]), component)).toContain(
      'steps[0]: unknown action hover',
    )
  })

  it('rejects a click without a target', () => {
    expect(validateScenario(scenario([{ action: 'click' }]), component)).toContain(
      'steps[0]: click needs a target',
    )
  })

  it('rejects a fill without a value', () => {
    expect(
      validateScenario(
        scenario([{ action: 'fill', target: { role: 'textbox', name: 'Email' } }]),
        component,
      ),
    ).toContain('steps[0]: fill needs a value')
  })

  it('rejects an unknown state', () => {
    expect(
      validateScenario(
        scenario([
          {
            action: 'expectState',
            target: { role: 'button', name: 'Save' },
            state: 'open',
            value: true,
          },
        ]),
        component,
      ),
    ).toContain('steps[0]: unknown state open')
  })

  it('requires exactly one scenario per pilot', () => {
    const pilot = { version: 1, components: ['button', 'alert'] }
    const components = [
      { id: 'button', demos: ['button/basic'] },
      { id: 'alert', demos: ['alert/basic'] },
    ]

    expect(
      validateScenarioSet(pilot, components, [scenario([{ action: 'expectText', text: 'Saved' }])]),
    ).toContain('alert: expected one scenario, found 0')
  })

  it('rejects a scenario for a component outside the pilot list', () => {
    const pilot = { version: 1, components: ['button'] }
    const components = [{ id: 'button', demos: ['button/basic'] }]

    expect(
      validateScenarioSet(pilot, components, [
        scenario([{ action: 'expectText', text: 'Saved' }]),
        { ...scenario([{ action: 'expectText', text: 'Alert' }]), component: 'alert' },
      ]),
    ).toContain('alert: not a pilot component')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm exec vitest run scripts/parity-scenarios.test.mjs
```

Expected: FAIL，`Cannot find module './parity-scenarios.mjs'`。

- [ ] **Step 3: 实现校验器**

创建 `scripts/parity-scenarios.mjs`：

```js
#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ACTIONS = new Set([
  'click',
  'fill',
  'press',
  'pressKey',
  'expectText',
  'expectNotText',
  'expectTargetText',
  'expectVisible',
  'expectHidden',
  'expectCount',
  'expectState',
])

const STATES = new Set(['expanded', 'selected', 'checked', 'disabled'])
const SCOPES = new Set(['demo', 'page'])

function validateTarget(target, label, action, problems) {
  if (!target || typeof target !== 'object') {
    problems.push(`${label}: ${action} needs a target`)
    return
  }
  if (target.css !== undefined) {
    if (typeof target.css !== 'string' || target.css.trim() === '') {
      problems.push(`${label}: css must be a non-empty string`)
    }
  } else if (typeof target.role !== 'string' || target.role.trim() === '') {
    problems.push(`${label}: target needs role or css`)
  }
  if (target.name !== undefined && typeof target.name !== 'string') {
    problems.push(`${label}: name must be a string`)
  }
  if (target.exact !== undefined && typeof target.exact !== 'boolean') {
    problems.push(`${label}: exact must be a boolean`)
  }
  if (target.scope !== undefined && !SCOPES.has(target.scope)) {
    problems.push(`${label}: unknown scope ${target.scope}`)
  }
}

export function validateScenario(scenario, component) {
  const problems = []

  if (scenario.version !== 1) problems.push('version must be 1')
  if (!component) {
    problems.push(`${scenario.component}: unknown component`)
    return problems
  }
  const demoId = typeof scenario.demo === 'string' ? `${component.id}/${scenario.demo}` : ''
  if (!demoId || !component.demos.includes(demoId)) {
    problems.push(`${scenario.demo} is not a demo of ${component.id}`)
  }
  if (!['light', 'dark'].includes(scenario.appearance)) {
    problems.push(`unknown appearance ${scenario.appearance}`)
  }
  if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) {
    problems.push('steps must be a non-empty array')
    return problems
  }

  scenario.steps.forEach((step, index) => {
    const label = `steps[${index}]`
    if (!step || typeof step !== 'object' || !ACTIONS.has(step.action)) {
      problems.push(`${label}: unknown action ${step?.action}`)
      return
    }

    switch (step.action) {
      case 'click':
      case 'fill':
      case 'press':
      case 'expectTargetText':
      case 'expectVisible':
      case 'expectHidden':
      case 'expectCount':
      case 'expectState':
        validateTarget(step.target, label, step.action, problems)
        break
      case 'pressKey':
        if (typeof step.key !== 'string' || step.key.trim() === '') {
          problems.push(`${label}: pressKey needs a key`)
        }
        break
      case 'expectText':
      case 'expectNotText':
        if (typeof step.text !== 'string' || step.text.trim() === '') {
          problems.push(`${label}: ${step.action} needs text`)
        }
        break
      default:
        break
    }

    if (step.action === 'fill' && typeof step.value !== 'string') {
      problems.push(`${label}: fill needs a value`)
    }
    if (step.action === 'press' && (typeof step.key !== 'string' || step.key.trim() === '')) {
      problems.push(`${label}: press needs a key`)
    }
    if (step.action === 'expectTargetText' && typeof step.text !== 'string') {
      problems.push(`${label}: expectTargetText needs text`)
    }
    if (step.action === 'expectCount' && (!Number.isInteger(step.count) || step.count < 0)) {
      problems.push(`${label}: expectCount needs a non-negative count`)
    }
    if (step.action === 'expectState') {
      if (!STATES.has(step.state)) problems.push(`${label}: unknown state ${step.state}`)
      if (typeof step.value !== 'boolean')
        problems.push(`${label}: expectState needs a boolean value`)
    }
  })

  return problems
}

export function validateScenarioSet(pilot, components, scenarios) {
  const problems = []
  const componentsById = new Map(components.map((component) => [component.id, component]))
  const pilotIds = new Set(pilot.components)

  for (const scenario of scenarios) {
    if (!pilotIds.has(scenario.component)) {
      problems.push(`${scenario.component}: not a pilot component`)
      continue
    }
    const component = componentsById.get(scenario.component)
    problems.push(
      ...validateScenario(scenario, component).map(
        (problem) => `${scenario.component}: ${problem}`,
      ),
    )
  }

  for (const id of pilot.components) {
    const count = scenarios.filter((scenario) => scenario.component === id).length
    if (count !== 1) problems.push(`${id}: expected one scenario, found ${count}`)
  }

  return problems
}

function readJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`parity-scenarios: ${path.relative(process.cwd(), file)} is missing`)
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function main() {
  const root = process.cwd()
  const pilot = readJson(path.join(root, 'parity/pilot.json'))
  const contract = readJson(path.join(root, 'parity/contract/components.json'))
  const directory = path.join(root, 'parity/scenarios')
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .sort()
  const scenarios = files.map((file) => readJson(path.join(directory, file)))

  const problems = validateScenarioSet(pilot, contract.components, scenarios)
  if (problems.length > 0) {
    for (const problem of problems) console.error(`parity-scenarios: ${problem}`)
    process.exitCode = 1
    return
  }

  console.log(
    `parity-scenarios: ${scenarios.length} scenarios match ${pilot.components.length} pilots`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm exec vitest run scripts/parity-scenarios.test.mjs
```

Expected: 8 passed。

- [ ] **Step 5: 写六个场景**

`parity/scenarios/accordion.json`：

```json
{
  "version": 1,
  "component": "accordion",
  "demo": "basic",
  "appearance": "light",
  "steps": [
    { "action": "expectText", "text": "How does per-seat billing work?" },
    {
      "action": "expectState",
      "target": { "role": "button", "name": "How does per-seat billing work?" },
      "state": "expanded",
      "value": true
    },
    {
      "action": "expectText",
      "text": "You are billed for active members at the end of each monthly cycle. Invited members are counted once they accept."
    },
    {
      "action": "click",
      "target": { "role": "button", "name": "Where is workspace data stored?" }
    },
    {
      "action": "expectState",
      "target": { "role": "button", "name": "Where is workspace data stored?" },
      "state": "expanded",
      "value": true
    },
    {
      "action": "expectState",
      "target": { "role": "button", "name": "How does per-seat billing work?" },
      "state": "expanded",
      "value": false
    },
    {
      "action": "expectText",
      "text": "Data stays in the region selected at creation time, and audit exports follow the same retention policy."
    },
    {
      "action": "click",
      "target": { "role": "button", "name": "Where is workspace data stored?" }
    },
    {
      "action": "expectState",
      "target": { "role": "button", "name": "Where is workspace data stored?" },
      "state": "expanded",
      "value": false
    },
    {
      "action": "expectNotText",
      "text": "Data stays in the region selected at creation time, and audit exports follow the same retention policy."
    }
  ]
}
```

`parity/scenarios/dialog.json`：

```json
{
  "version": 1,
  "component": "dialog",
  "demo": "basic",
  "appearance": "light",
  "steps": [
    { "action": "click", "target": { "role": "button", "name": "Invite member" } },
    {
      "action": "expectVisible",
      "target": { "role": "dialog", "name": "Invite a member", "scope": "page" }
    },
    {
      "action": "expectText",
      "text": "They receive an email with a link to join the Acme Operations workspace."
    },
    {
      "action": "expectState",
      "target": { "role": "button", "name": "Send invite", "scope": "page" },
      "state": "disabled",
      "value": true
    },
    {
      "action": "fill",
      "target": { "role": "textbox", "name": "Email address", "scope": "page" },
      "value": "ada@example.com"
    },
    { "action": "click", "target": { "role": "combobox", "name": "Role", "scope": "page" } },
    { "action": "click", "target": { "role": "option", "name": "Admin", "scope": "page" } },
    { "action": "click", "target": { "role": "button", "name": "Send invite", "scope": "page" } },
    {
      "action": "expectHidden",
      "target": { "role": "dialog", "name": "Invite a member", "scope": "page" }
    },
    { "action": "expectText", "text": "Invite sent to ada@example.com as admin." },
    { "action": "click", "target": { "role": "button", "name": "Invite member" } },
    {
      "action": "expectVisible",
      "target": { "role": "dialog", "name": "Invite a member", "scope": "page" }
    },
    { "action": "click", "target": { "role": "button", "name": "Cancel", "scope": "page" } },
    {
      "action": "expectHidden",
      "target": { "role": "dialog", "name": "Invite a member", "scope": "page" }
    }
  ]
}
```

`parity/scenarios/select.json`：

```json
{
  "version": 1,
  "component": "select",
  "demo": "basic",
  "appearance": "light",
  "steps": [
    {
      "action": "expectTargetText",
      "target": { "role": "combobox", "name": "Assign role" },
      "text": "Admin"
    },
    { "action": "expectText", "text": "Admin: Manage members, projects and integrations." },
    { "action": "click", "target": { "role": "combobox", "name": "Assign role" } },
    { "action": "expectVisible", "target": { "role": "listbox", "scope": "page" } },
    { "action": "click", "target": { "role": "option", "name": "Viewer", "scope": "page" } },
    {
      "action": "expectTargetText",
      "target": { "role": "combobox", "name": "Assign role" },
      "text": "Viewer"
    },
    { "action": "expectText", "text": "Viewer: Read-only access to shared projects." },
    { "action": "click", "target": { "role": "combobox", "name": "Assign role" } },
    { "action": "expectVisible", "target": { "role": "listbox", "scope": "page" } },
    { "action": "pressKey", "key": "Escape" },
    { "action": "expectHidden", "target": { "role": "listbox", "scope": "page" } }
  ]
}
```

`parity/scenarios/tabs.json`：

```json
{
  "version": 1,
  "component": "tabs",
  "demo": "basic",
  "appearance": "light",
  "steps": [
    {
      "action": "expectState",
      "target": { "role": "tab", "name": "Profile" },
      "state": "selected",
      "value": true
    },
    {
      "action": "fill",
      "target": { "role": "textbox", "name": "Display name" },
      "value": "Katherine G. Johnson"
    },
    { "action": "click", "target": { "role": "button", "name": "Save profile" } },
    { "action": "expectText", "text": "Shown as Katherine G. Johnson" },
    { "action": "press", "target": { "role": "tab", "name": "Profile" }, "key": "ArrowRight" },
    {
      "action": "expectState",
      "target": { "role": "tab", "name": "Notifications" },
      "state": "selected",
      "value": true
    },
    { "action": "expectText", "text": "Product update emails are on." },
    { "action": "click", "target": { "role": "switch", "name": "Product updates" } },
    { "action": "expectText", "text": "Product update emails are off." },
    { "action": "click", "target": { "role": "tab", "name": "Security" } },
    {
      "action": "expectState",
      "target": { "role": "switch", "name": "Two-factor authentication" },
      "state": "checked",
      "value": false
    },
    { "action": "click", "target": { "role": "switch", "name": "Two-factor authentication" } },
    { "action": "expectText", "text": "Two-factor authentication is on." }
  ]
}
```

`parity/scenarios/date-range-picker.json`：

```json
{
  "version": 1,
  "component": "date-range-picker",
  "demo": "presets",
  "appearance": "light",
  "steps": [
    {
      "action": "expectVisible",
      "target": { "role": "button", "name": "Audit log date range: Sep 28, 2026 – Oct 27, 2026" }
    },
    {
      "action": "click",
      "target": { "role": "button", "name": "Audit log date range: Sep 28, 2026 – Oct 27, 2026" }
    },
    { "action": "click", "target": { "role": "button", "name": "Last 7 days", "scope": "page" } },
    {
      "action": "expectVisible",
      "target": { "role": "button", "name": "Audit log date range: Oct 21, 2026 – Oct 27, 2026" }
    },
    { "action": "expectText", "text": "Selected 2026-10-21 – 2026-10-27" },
    {
      "action": "click",
      "target": { "role": "button", "name": "Audit log date range: Oct 21, 2026 – Oct 27, 2026" }
    },
    { "action": "click", "target": { "role": "button", "name": "This quarter", "scope": "page" } },
    {
      "action": "expectVisible",
      "target": { "role": "button", "name": "Audit log date range: Oct 1, 2026 – Oct 27, 2026" }
    },
    { "action": "expectText", "text": "Selected 2026-10-01 – 2026-10-27" }
  ]
}
```

`parity/scenarios/pro-table.json`：

```json
{
  "version": 1,
  "component": "pro-table",
  "demo": "basic",
  "appearance": "light",
  "steps": [
    { "action": "expectCount", "target": { "css": "tbody tr" }, "count": 5 },
    { "action": "expectText", "text": "Ada Lovelace" },
    { "action": "expectText", "text": "Edsger Dijkstra" },
    {
      "action": "fill",
      "target": { "role": "textbox", "name": "Search members" },
      "value": "grace"
    },
    { "action": "expectText", "text": "Grace Hopper" },
    { "action": "expectNotText", "text": "Ada Lovelace" },
    { "action": "expectCount", "target": { "css": "tbody tr" }, "count": 1 },
    { "action": "click", "target": { "role": "button", "name": "Clear search" } },
    { "action": "expectCount", "target": { "css": "tbody tr" }, "count": 5 },
    { "action": "expectText", "text": "Ada Lovelace" },
    { "action": "fill", "target": { "role": "textbox", "name": "Search members" }, "value": "zzz" },
    { "action": "expectText", "text": "No members match this search." }
  ]
}
```

- [ ] **Step 6: 校验场景集**

```bash
pnpm exec node scripts/parity-scenarios.mjs
```

Expected: `parity-scenarios: 6 scenarios match 6 pilots`。

- [ ] **Step 7: 接入 scripts 与 CI**

根 `package.json` 的 `scripts` 加入：

```json
"check:parity:scenarios": "node scripts/parity-scenarios.mjs",
```

`.github/workflows/ci.yml` 的 `quality` job 中，在 `Cross-framework contract is current` 之后加入：

```yaml
- name: Parity scenarios are valid
  run: pnpm check:parity:scenarios
```

- [ ] **Step 7b: 格式化场景文件**

```bash
pnpm exec prettier --write parity/scenarios
pnpm exec prettier --check scripts/parity-scenarios.mjs scripts/parity-scenarios.test.mjs parity/scenarios
pnpm exec node scripts/parity-scenarios.mjs
```

Expected: Prettier 通过；校验器仍输出 `parity-scenarios: 6 scenarios match 6 pilots`。

- [ ] **Step 8: 提交**

```bash
git add scripts/parity-scenarios.mjs scripts/parity-scenarios.test.mjs parity/scenarios package.json .github/workflows/ci.yml
git commit -m "feat(parity): add accessible behaviour scenarios for six pilots"
```

---

### Task C3: Playwright parity 套件、React target 与 Docker 入口

**Files:**

- Create: `parity/targets/react.json`
- Create: `playwright.parity.config.ts`
- Create: `e2e-parity/helpers/{target,open,behavior}.ts`
- Create: `e2e-parity/specs/{contract,docs-surface,visual,behavior,axe}.spec.ts`
- Create: `scripts/parity-docker.mjs`
- Modify: root `package.json`、`tsconfig.json`、`scripts/scaffold.mjs`、`.github/workflows/ci.yml`

**Interfaces:**

- Consumes: C1 合同、C2 场景、冻结的 `e2e-docs/__screenshots__/component-visual.spec.ts/*-linux.png`。
- Produces:
  - `parity/targets/react.json`：`baseURL`、`webServer`、`api.mode`、`api.deviations`；
  - `PARITY_TARGET=<name> pnpm test:parity` 加载 `parity/targets/<name>.json`；
  - `pnpm test:parity:docker` 在 Playwright 镜像中运行同一套用例；
  - 119 条 parity 测试（83 contract + 12 docs surface + 12 visual + 6 behaviour + 6 axe）。

- [ ] **Step 1: 写 React target**

`parity/targets/react.json`：

```json
{
  "name": "react",
  "baseURL": "http://localhost:4175",
  "webServer": {
    "command": "pnpm --filter @fish-admin/docs build && pnpm --filter @fish-admin/docs preview --port 4175",
    "timeout": 300000
  },
  "api": {
    "mode": "exact",
    "deviations": {}
  }
}
```

`api.mode` 的语义：

- `exact`：`contract.spec.ts` 逐行比对 API 表的名字、类型、顺序；React target 使用这个模式。
- `reference`：只校验路由、demo、preview/source 和可访问表面；未来 Vue target 使用这个模式，并必须在 `api.deviations` 中为六个试点各写一条记录，`[]` 表示没有差异。

- [ ] **Step 2: 写 target 加载器**

`e2e-parity/helpers/target.ts`：

```ts
import fs from 'node:fs'
import path from 'node:path'

export type ApiMode = 'exact' | 'reference'

export interface ParityTarget {
  name: string
  baseURL: string
  webServer: { command: string; timeout: number }
  api: { mode: ApiMode; deviations: Record<string, string[]> }
}

export const targetId = process.env.PARITY_TARGET ?? 'react'
const file = path.resolve(process.cwd(), 'parity/targets', `${targetId}.json`)

if (!fs.existsSync(file)) {
  throw new Error(`parity target ${targetId} is missing (${file})`)
}

export const target = JSON.parse(fs.readFileSync(file, 'utf8')) as ParityTarget

if (target.name !== targetId) {
  throw new Error(`parity target ${file} declares ${target.name}, expected ${targetId}`)
}
```

- [ ] **Step 3: 写打开组件的辅助函数**

`e2e-parity/helpers/open.ts`：

```ts
import { expect, type Locator, type Page } from '@playwright/test'

export type Appearance = 'light' | 'dark'

const FIXED_TIME = new Date('2024-06-15T12:00:00Z')

/**
 * Mirrors `e2e-docs/component-visual.spec.ts`: same fixed clock, same storage
 * keys, same viewport and the same settle window, so a parity screenshot can
 * be compared with the frozen docs baseline pixel for pixel.
 */
export async function openComponent(
  page: Page,
  component: string,
  appearance: Appearance = 'light',
): Promise<Locator> {
  await page.clock.setFixedTime(FIXED_TIME)
  await page.addInitScript((theme) => {
    window.localStorage.setItem('rspress-visited', '1')
    window.localStorage.setItem('rspress-theme-appearance', theme)
  }, appearance)
  await page.goto(`/components/${component}`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(appearance === 'dark')
  await page.waitForTimeout(250)
  const section = page.locator('section[data-demo]').first()
  await expect(section).toBeVisible()
  return section
}

export async function openDemo(
  page: Page,
  component: string,
  demo: string,
  appearance: Appearance = 'light',
): Promise<Locator> {
  await openComponent(page, component, appearance)
  const section = page.locator(`section[data-demo="${component}/${demo}"]`)
  await expect(section).toBeVisible()
  return section
}
```

- [ ] **Step 4: 写行为场景执行器**

`e2e-parity/helpers/behavior.ts`：

```ts
import { expect, type Locator, type Page } from '@playwright/test'

export type Target = {
  role?: string
  name?: string
  exact?: boolean
  css?: string
  scope?: 'demo' | 'page'
}

export type Step =
  | { action: 'click'; target: Target }
  | { action: 'fill'; target: Target; value: string }
  | { action: 'press'; target: Target; key: string }
  | { action: 'pressKey'; key: string }
  | { action: 'expectText'; text: string }
  | { action: 'expectNotText'; text: string }
  | { action: 'expectTargetText'; target: Target; text: string }
  | { action: 'expectVisible'; target: Target }
  | { action: 'expectHidden'; target: Target }
  | { action: 'expectCount'; target: Target; count: number }
  | {
      action: 'expectState'
      target: Target
      state: 'expanded' | 'selected' | 'checked' | 'disabled'
      value: boolean
    }

export interface Scenario {
  version: number
  component: string
  demo: string
  appearance: 'light' | 'dark'
  steps: Step[]
}

function resolve(page: Page, section: Locator, target: Target): Locator {
  const root = target.scope === 'page' ? page : section
  if (target.css) return root.locator(target.css)
  if (!target.role) throw new Error('parity step target needs role or css')

  const role = target.role as Parameters<Page['getByRole']>[0]
  const options =
    target.name === undefined ? {} : { name: target.name, exact: target.exact ?? true }
  return root.getByRole(role, options)
}

export async function runScenario(page: Page, section: Locator, scenario: Scenario) {
  for (const step of scenario.steps) {
    switch (step.action) {
      case 'click':
        await resolve(page, section, step.target).click()
        break
      case 'fill':
        await resolve(page, section, step.target).fill(step.value)
        break
      case 'press':
        await resolve(page, section, step.target).press(step.key)
        break
      case 'pressKey':
        await page.keyboard.press(step.key)
        break
      case 'expectText':
        await expect(page.getByText(step.text).filter({ visible: true }).first()).toBeVisible()
        break
      case 'expectNotText':
        await expect(page.getByText(step.text).filter({ visible: true })).toHaveCount(0)
        break
      case 'expectTargetText':
        await expect(resolve(page, section, step.target)).toContainText(step.text)
        break
      case 'expectVisible':
        await expect(resolve(page, section, step.target)).toBeVisible()
        break
      case 'expectHidden':
        await expect(resolve(page, section, step.target)).toBeHidden()
        break
      case 'expectCount':
        await expect(resolve(page, section, step.target)).toHaveCount(step.count)
        break
      case 'expectState': {
        const locator = resolve(page, section, step.target)
        const value = String(step.value)

        if (step.state === 'expanded') {
          await expect(locator).toHaveAttribute('aria-expanded', value)
        } else if (step.state === 'selected') {
          await expect(locator).toHaveAttribute('aria-selected', value)
        } else if (step.state === 'checked') {
          await expect(locator).toHaveAttribute('aria-checked', value)
        } else if (step.value) {
          await expect(locator).toBeDisabled()
        } else {
          await expect(locator).toBeEnabled()
        }
        break
      }
    }
  }
}
```

- [ ] **Step 5: 写 Playwright 配置**

`playwright.parity.config.ts`：

```ts
import { defineConfig, devices } from '@playwright/test'

import { target } from './e2e-parity/helpers/target'

export default defineConfig({
  testDir: './e2e-parity',
  testMatch: ['specs/*.spec.ts'],
  // Reuse the frozen component baselines instead of duplicating 5 MB of PNGs.
  snapshotPathTemplate: 'e2e-docs/__screenshots__/component-visual.spec.ts/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  updateSnapshots: 'none',
  outputDir: 'test-results/parity',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/parity' }]],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.0002,
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: target.baseURL,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: target.webServer.command,
    url: target.baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: target.webServer.timeout,
  },
})
```

- [ ] **Step 6: 写合同 spec**

`e2e-parity/specs/contract.spec.ts`：

```ts
import fs from 'node:fs'
import path from 'node:path'

import { expect, test, type Page } from '@playwright/test'

import { target } from '../helpers/target'

type ApiEntry = { name: string; type: string; required: boolean; defaultValue: string | null }

type ComponentContract = {
  id: string
  docsPath: string
  demos: string[]
  api: { props: ApiEntry[]; events: ApiEntry[] }
}

type RouteContract = {
  id: string
  paths: { en: string; zh: string }
  demos: Array<{ id: string; anchor: string }>
  selectors: { preview: string; source: string; apiTable: string }
  apiRows: number
}

const contract = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/components.json'), 'utf8'),
) as { components: ComponentContract[]; pilot: string[] }
const surface = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/docs-surface.json'), 'utf8'),
) as { routes: RouteContract[] }
const routes = new Map(surface.routes.map((route) => [route.id, route]))

if (target.api.mode === 'reference') {
  const missing = contract.pilot.filter((id) => !(id in target.api.deviations))
  if (missing.length > 0) {
    throw new Error(
      `parity target ${target.name} must record deviations for: ${missing.join(', ')}`,
    )
  }
}

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('rspress-visited', '1'))
})

for (const component of contract.components) {
  const route = routes.get(component.id)
  if (!route) throw new Error(`docs surface is missing ${component.id}`)

  test(`${component.id} matches the frozen component contract`, async ({ page }) => {
    const errors = watchConsole(page)
    await page.goto(route.paths.en)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('section[data-demo]')).toHaveCount(component.demos.length)
    for (const demo of route.demos) {
      const block = page.locator(demo.anchor)
      await expect(block).toHaveCount(1)
      await expect(block.locator(`${route.selectors.preview} > *`).first()).toBeVisible()
      await expect(block.locator(route.selectors.source)).toContainText('export default')
    }

    if (target.api.mode === 'exact') {
      if (route.apiRows > 0) {
        const rows = page.locator(`${route.selectors.apiTable} tbody tr`)
        await expect(rows).toHaveCount(route.apiRows)
        const entries = [...component.api.props, ...component.api.events]
        for (const [index, entry] of entries.entries()) {
          await expect(rows.nth(index)).toContainText(entry.name)
          await expect(rows.nth(index)).toContainText(entry.type)
        }
      } else {
        await expect(page.locator('.fish-demo__placeholder')).toContainText('No public props.')
      }
    }

    expect(errors, `console errors on ${route.paths.en}`).toEqual([])
  })
}
```

- [ ] **Step 7: 写 docs surface spec**

`e2e-parity/specs/docs-surface.spec.ts`：

```ts
import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

type ComponentContract = { id: string; demos: string[] }

type RouteContract = {
  id: string
  paths: { en: string; zh: string }
  demos: Array<{ id: string; anchor: string }>
  selectors: { preview: string; source: string; apiTable: string }
  apiRows: number
}

const contract = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/components.json'), 'utf8'),
) as { components: ComponentContract[]; pilot: string[] }
const surface = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/docs-surface.json'), 'utf8'),
) as { routes: RouteContract[] }
const routes = new Map(surface.routes.map((route) => [route.id, route]))

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('rspress-visited', '1'))
})

for (const id of contract.pilot) {
  const component = contract.components.find((entry) => entry.id === id)
  const route = routes.get(id)
  if (!component || !route) throw new Error(`pilot ${id} is missing from the contracts`)

  for (const locale of ['en', 'zh'] as const) {
    test(`${id} exposes the documented surface in ${locale}`, async ({ page }) => {
      await page.goto(route.paths[locale])
      await page.waitForLoadState('networkidle')

      await expect(page.locator('section[data-demo]')).toHaveCount(component.demos.length)
      for (const demo of route.demos) {
        const block = page.locator(demo.anchor)
        await expect(block).toHaveCount(1)
        await expect(block.locator(`${route.selectors.preview} > *`).first()).toBeVisible()
        await expect(block.locator(route.selectors.source)).toContainText('export default')
      }

      if (route.apiRows > 0) {
        await expect(page.locator(route.selectors.apiTable)).toBeVisible()
      } else {
        // Locale-neutral: English says "No public props." and Chinese says "没有公开属性。".
        await expect(page.locator('.fish-demo__placeholder')).toBeVisible()
      }
    })
  }
}
```

- [ ] **Step 8: 写行为、视觉与 axe spec**

`e2e-parity/specs/behavior.spec.ts`：

```ts
import fs from 'node:fs'
import path from 'node:path'

import { test } from '@playwright/test'

import { runScenario, type Scenario } from '../helpers/behavior'
import { openDemo } from '../helpers/open'

const directory = path.resolve(process.cwd(), 'parity/scenarios')
const scenarios = fs
  .readdirSync(directory)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) as Scenario)

for (const scenario of scenarios) {
  test(`${scenario.component} follows its frozen behaviour`, async ({ page }) => {
    const section = await openDemo(page, scenario.component, scenario.demo, scenario.appearance)
    await runScenario(page, section, scenario)
  })
}
```

`e2e-parity/specs/visual.spec.ts`：

```ts
import fs from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import { openComponent } from '../helpers/open'

const contract = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/components.json'), 'utf8'),
) as { components: Array<{ id: string }>; pilot: string[] }

const pilot = contract.components.filter((component) => contract.pilot.includes(component.id))

for (const component of pilot) {
  for (const appearance of ['light', 'dark'] as const) {
    test(`${component.id} ${appearance} matches the frozen baseline`, async ({ page }) => {
      const section = await openComponent(page, component.id, appearance)
      await expect(section).toHaveScreenshot(`${component.id}-${appearance}-linux.png`)
    })
  }
}
```

`e2e-parity/specs/axe.spec.ts`：

```ts
import fs from 'node:fs'
import path from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { openComponent } from '../helpers/open'

const contract = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'parity/contract/components.json'), 'utf8'),
) as { components: Array<{ id: string }>; pilot: string[] }

const pilot = contract.components.filter((component) => contract.pilot.includes(component.id))

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

for (const component of pilot) {
  test(`${component.id} has no axe violations`, async ({ page }) => {
    const errors = watchConsole(page)
    await openComponent(page, component.id, 'light')
    const results = await new AxeBuilder({ page }).include('section[data-demo]').analyze()
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.flatMap((node) => node.target),
    }))

    expect(violations, `axe violations in ${component.id}`).toEqual([])
    expect(errors, `console errors in ${component.id}`).toEqual([])
  })
}
```

- [ ] **Step 9: 写 Docker 入口**

`scripts/parity-docker.mjs`：

```js
#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const IMAGE = 'mcr.microsoft.com/playwright:v1.64.1-noble'
const target = process.env.PARITY_TARGET ?? 'react'

const steps = [
  'corepack enable',
  'pnpm install --frozen-lockfile --store-dir /root/.local/share/pnpm/store',
  'pnpm test:parity',
]

const args = [
  'run',
  '--rm',
  '--init',
  '--ipc=host',
  '-v',
  `${process.cwd()}:/work`,
  '-v',
  'fishadmin-parity-node-modules:/work/node_modules',
  '-v',
  'fishadmin-parity-pnpm-store:/root/.local/share/pnpm/store',
  '-w',
  '/work',
  '-e',
  'CI=1',
  '-e',
  `PARITY_TARGET=${target}`,
  IMAGE,
  'bash',
  '-lc',
  steps.join(' && '),
]

console.log(`Running parity target ${target} in ${IMAGE}`)
const { status, error } = spawnSync('docker', args, { stdio: 'inherit' })

if (error) {
  console.error(`Failed to start Docker: ${error.message}`)
  process.exit(1)
}

process.exit(status ?? 1)
```

- [ ] **Step 10: 接入根 scripts、tsconfig 与 CI**

根 `package.json` 的 `scripts` 加入：

```json
"test:parity": "playwright test -c playwright.parity.config.ts",
"test:parity:docker": "node scripts/parity-docker.mjs",
```

`tsconfig.json` 的 `include` 改为：

```json
  "include": [
    "src",
    "e2e",
    "e2e-docs",
    "e2e-parity",
    "vite.config.ts",
    "vite.shared.ts",
    "vitest.config.ts",
    "playwright.config.ts",
    "playwright.visual.config.ts",
    "playwright.docs.config.ts",
    "playwright.parity.config.ts"
  ]
```

`.github/workflows/ci.yml` 末尾新增 `parity` job：

```yaml
parity:
  name: Parity
  runs-on: ubuntu-latest
  container:
    image: mcr.microsoft.com/playwright:v1.64.1-noble
    options: --user 1001 --ipc=host
  steps:
    - uses: actions/checkout@v4

    - name: Enable pnpm
      run: |
        mkdir -p "$HOME/.local/bin"
        corepack enable --install-directory "$HOME/.local/bin"
        echo "$HOME/.local/bin" >> "$GITHUB_PATH"

    - name: Install dependencies
      run: pnpm install --frozen-lockfile --store-dir /tmp/pnpm-store

    - name: Run the parity suite
      run: pnpm test:parity

    - name: Upload parity report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: parity-report
        path: |
          playwright-report/parity
          test-results/parity
        retention-days: 7
```

- [ ] **Step 11: 更新 scaffold 的浏览器清理**

现在 `e2e-parity`、`parity` 和 `playwright.parity.config.ts` 已存在，`dropTestBrowsers` 的删除列表改为：

```js
editor.delete(
  'e2e',
  'e2e-parity',
  'parity',
  'playwright.config.ts',
  'playwright.visual.config.ts',
  'playwright.parity.config.ts',
  'scripts/check-visual-platform.mjs',
  'scripts/visual-regression.mjs',
  'scripts/parity-docker.mjs',
  'scripts/parity-freeze.mjs',
  'scripts/parity-freeze.test.mjs',
  'scripts/parity-contract.mjs',
  'scripts/parity-contract.test.mjs',
  'scripts/parity-scenarios.mjs',
  'scripts/parity-scenarios.test.mjs',
)
```

`scripts` 删除列表追加：

```js
      'test:parity',
      'test:parity:docker',
      'check:parity:freeze',
      'check:parity:contract',
      'check:parity:scenarios',
      'parity:freeze',
      'parity:contract',
```

`tsconfig.json` 变换追加：

```js
editor.sub('tsconfig.json', '    "e2e-parity",\n', '')
editor.sub('tsconfig.json', '    "playwright.parity.config.ts"\n', '')
```

最后一行能匹配，是因为 Step 10 把 `playwright.parity.config.ts` 放在 include 的最后一项。

- [ ] **Step 12: 在 Docker 中跑通**

```bash
pnpm exec prettier --check playwright.parity.config.ts e2e-parity scripts/parity-docker.mjs parity/targets/react.json
pnpm lint
pnpm typecheck
pnpm check:parity:contract
pnpm check:parity:scenarios
pnpm test:parity:docker
```

Expected: 静态检查全绿；Docker 中 119 passed（83 + 12 + 12 + 6 + 6），0 failed；没有任何 `*-linux.png` 被写入。

- [ ] **Step 13: 脚手架回归**

```bash
pnpm exec vitest run scripts/scaffold.test.mjs
```

Expected: 三个 variant 的 `checkPlan` 全部通过；`--mock=drop` 删除 parity 目录和脚本后仍能生成计划。

- [ ] **Step 14: 提交**

```bash
git add parity/targets/react.json playwright.parity.config.ts e2e-parity scripts/parity-docker.mjs package.json tsconfig.json scripts/scaffold.mjs .github/workflows/ci.yml
git commit -m "test(parity): add a target-agnostic Playwright harness"
```

---

### Task C4: 双语移植地基文档与门禁说明

**Files:**

- Create: `docs/en/vue-port-foundation.md`、`docs/zh-CN/vue-port-foundation.md`
- Create: `parity/README.md`
- Modify: `README.md`、`README.zh-CN.md`、`CONTRIBUTING.md`
- Modify: `docs/en/scaffold.md`、`docs/zh-CN/scaffold.md`

**Interfaces:**

- Consumes: A–C 的全部命令、`parity/` 目录与 target `api.mode` 语义。
- Produces:
  - 一篇双语页面，说明冻结范围、共享包、合同、场景、target 和限制；
  - README/CONTRIBUTING 中的 parity 命令与门禁说明；
  - scaffold 文档与新的 parity 清理行为一致。

- [ ] **Step 1: 写英文页面**

创建 `docs/en/vue-port-foundation.md`：

````markdown
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

`parity/targets/react.json` points at the Rspress docs site built from this repository. `playwright.parity.config.ts` reads `PARITY_TARGET` (default `react`), loads `parity/targets/<name>.json`, starts its web server and writes screenshots to the frozen baseline directory. `updateSnapshots` is `'none'`.

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
````

- [ ] **Step 2: 写中文页面**

创建 `docs/zh-CN/vue-port-foundation.md`：

````markdown
# Vue 移植地基

FishAdmin 2.2.0 是未来 Vue 3 移植的参考版本。本页说明冻结了什么、框架无关包如何分层，以及 parity 测试台如何工作。它不代表 Vue 版本已经存在。

## 冻结范围

`parity/baseline/2.2.0/manifest.json` 保存以下内容的 SHA-256：

- 198 张 Linux 截图：166 张组件基线（83 个组件 × 明暗两套）、14 张文档布局基线与 18 张模板基线。
- 文档生成物：`registry.json`、`documented.json`、`api.json`、`maturity.json` 与 `rtl-audit.json`。
- `packages/ui/registry.json`、文档主题钩子（`Demo.tsx`、`ApiTable.tsx`）、`e2e-docs/component-visual.spec.ts`、所有 demo 源码与 `meta.json`，以及每张 `*-linux.png`。

`pnpm check:parity:freeze` 会重新计算全部哈希、键集合、计数与包版本。它从不比较 `sourceCommit` 与当前 `HEAD`，因此后续提交不会让基线失效。日常开发不重新生成清单：新版本需要新的 `parity/baseline/<version>/` 目录并单独批准。基线只在 `mcr.microsoft.com/playwright:v1.64.1-noble` 中渲染。

## 共享包

| 包                      | 负责                                                                               | 禁止包含            |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------- |
| `@fish-admin/contracts` | 领域与 API 类型、权限码与授权、`NAV_CONTRACT`、演示/集成/审计数据、日期工具        | React、`@/`、Lucide |
| `@fish-admin/i18n`      | 21 个语言 namespace、`SUPPORTED_LANGUAGES`、eager resources 与 `setupI18n`         | React、`@/`、Lucide |
| `@fish-admin/mock`      | MSW handler、种子数据库与迁移、`createMockWorker` / `createMockServer`、运行时配置 | React、`@/`、Lucide |

React 应用只保留适配层：`src/types` re-export contracts，`src/config/nav.ts` 从 `NAV_CONTRACT` 派生 `NAV_GROUPS`，`src/lib/i18n.ts` 把 react-i18next 接入 `setupI18n`，`src/main.tsx` 调用 `createMockWorker`。Vue 应用可以消费同样的三个包，不需要导入 React。

## 组件合同

`pnpm parity:contract` 读取生成的 registry、API 表与 demo registry，写出：

- `parity/contract/components.json` —— 每个已文档化组件一条记录：`id`、`name`、`category`、`status`、`since`、`exportName`、`source`、`docsPath`、排序后的 demo ID，以及文档化 props/events。
- `parity/contract/docs-surface.json` —— 每个组件一条路由：英文与中文路径、每个 demo 的 anchor（`section[data-demo="<component>/<demo>"]`）、preview/source/API 选择器与预期 API 行数。

`pnpm check:parity:contract` 在任一文件过期时失败。试点组件写在 `parity/pilot.json`：accordion、date-range-picker、dialog、pro-table、select、tabs。

target 用 `api.mode` 声明遵循参考 API 的严格程度：

- `"api": { "mode": "exact" }` —— 每个 API 行按名字、类型与顺序完全一致；React target 使用它。
- `"api": { "mode": "reference" }` —— 路由、demo 与 DOM anchor 必须一致，但 target 需在 `api.deviations` 中记录每个试点的差异。Vue 使用它，因为 `asChild` 这类 React 专属 prop 没有直接对应物。

## 行为场景

`parity/scenarios/*.json` 用角色、可访问名称、可见文本与 ARIA 状态描述六个试点的交互。除了 `pro-table` 的表格行数，不使用组件 CSS 选择器。

每个步骤是 `click`、`fill`、`press`、`pressKey`、`expectText`、`expectNotText`、`expectTargetText`、`expectVisible`、`expectHidden`、`expectCount` 或 `expectState` 之一。`expectState` 覆盖 `expanded`、`selected`、`checked` 与 `disabled`。只要 target 暴露相同的可访问表面，同一份场景即可直接运行。

`pnpm check:parity:scenarios` 校验 schema、demo 引用与“每个试点恰好一个场景”。

## Target 与命令

`parity/targets/react.json` 指向本仓库构建的 Rspress 文档站。`playwright.parity.config.ts` 读取 `PARITY_TARGET`（默认 `react`），加载 `parity/targets/<name>.json`，启动对应 web server，并把截图写入冻结基线目录。`updateSnapshots` 固定为 `'none'`。

```bash
pnpm check:parity:freeze
pnpm check:parity:contract
pnpm check:parity:scenarios
pnpm test:parity:docker
```

`pnpm test:parity:docker` 在 Playwright 镜像中运行。套件共 119 条：83 条 API 合同、12 条 docs surface（六个试点 × 两种语言）、6 条行为场景、12 张截图（六个试点 × 明暗两套）与 6 条 axe 扫描。12 张截图复用文档站已有的 `*-linux.png`，不复制基线。

## 增加 Vue target

1. 构建一个 Vue 文档 target，提供相同的组件路由、demo ID 与 `section[data-demo]` anchor。保持相同的固定时钟与 storage key，截图才可比较。
2. 新增 `parity/targets/vue.json`，填写 `baseURL`、`webServer` 与 `"api": { "mode": "reference", "deviations": { ... } }`。六个试点都要有记录；没有差异时写 `[]`。
3. 运行 `PARITY_TARGET=vue pnpm test:parity:docker`。
4. 在 Vue 实现里修正行为、无障碍与像素差异。绝不能用更新参数让 parity 截图通过。

## Parity 不能证明什么

- **安全。** 权限仍然只是客户端 UX。每个写接口都必须由服务端授权；见 [RBAC](./rbac.md)。
- **API 兼容。** `reference` 模式记录差异，而不是假装 Vue 拥有 React 专属 prop。
- **文档措辞。** 合同检查 DOM 表面与 API 表，不检查指南文案。
- **SSR、移动端或跨浏览器。** 测试台只在 Chromium、1440×900、英文环境下运行，与视觉基线一致，不是响应式或跨浏览器测试。

## 验收

当 `pnpm check:parity:freeze`、`pnpm check:parity:contract`、`pnpm check:parity:scenarios`、`pnpm test:parity:docker`、现有 Docker 视觉任务与完整质量门禁全部通过，且没有修改任何 `*-linux.png` 时，地基才算完成。
````

- [ ] **Step 3: 写 parity 目录说明**

创建 `parity/README.md`：

````markdown
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
````

- [ ] **Step 4: 更新两份 README**

`README.md` 的 Scripts 表在 `pnpm test:visual:docker` 之后加入：

```markdown
| `pnpm check:parity:freeze` | Verify the frozen 2.2.0 parity manifest |
| `pnpm check:parity:contract` | Verify the generated component and docs-surface contracts |
| `pnpm check:parity:scenarios` | Validate the six pilot behaviour scenarios |
| `pnpm test:parity:docker` | Compare the React target against the frozen baselines |
```

`README.zh-CN.md` 的常用命令表加入：

```markdown
| `pnpm check:parity:freeze` | 校验冻结的 2.2.0 parity 清单 |
| `pnpm check:parity:contract` | 校验生成的组件契约与 docs surface 契约 |
| `pnpm check:parity:scenarios` | 校验六个试点的行为场景 |
| `pnpm test:parity:docker` | 在 Docker 中把 React target 与冻结基线比对 |
```

`README.md` 的 “## Quality gates” 在 Visual regression 之后加入：

```markdown
- **Cross-framework parity** — `parity/` freezes the 2.2.0 component contract, docs DOM surface and six accessible behaviour scenarios. `pnpm test:parity:docker` runs 119 checks against the same `*-linux.png` baselines the docs site uses: 83 API contracts, 12 docs-surface checks, six behaviour scenarios, 12 screenshots and six axe scans. React is the only target today; a Vue port adds `parity/targets/vue.json` and runs `PARITY_TARGET=vue pnpm test:parity:docker`. The harness runs with `updateSnapshots: 'none'`. See [docs/en/vue-port-foundation.md](docs/en/vue-port-foundation.md).
```

`README.zh-CN.md` 的 “## 质量门禁” 在视觉回归之后加入：

```markdown
- **跨框架 parity** —— `parity/` 冻结 2.2.0 的组件契约、文档 DOM 表面与六个可访问行为场景。`pnpm test:parity:docker` 使用文档站同一批 `*-linux.png` 基线运行 119 条检查：83 条 API 合同、12 条 docs surface、6 条行为场景、12 张截图与 6 条 axe 扫描。目前只有 React target；Vue 移植只需新增 `parity/targets/vue.json`，再运行 `PARITY_TARGET=vue pnpm test:parity:docker`。测试台的 `updateSnapshots` 固定为 `'none'`。详见 [docs/zh-CN/vue-port-foundation.md](docs/zh-CN/vue-port-foundation.md)。
```

两份 README 的 Baselines 段落末尾追加：

```markdown
`pnpm test:parity:docker` reuses the component baselines and never writes them.
```

```markdown
`pnpm test:parity:docker` 复用组件基线，且永不写入。
```

- [ ] **Step 4b: 把 parity 目录补进两份 README 的目录树**

`README.md` 的 “## Project structure” 代码块中，在 `e2e/` 之前插入：

```text
parity/                      # frozen cross-framework contract and scenarios
├─ baseline/2.2.0/           # SHA-256 manifest of the 2.2.0 surface
├─ contract/                 # generated component and docs-surface contracts
├─ scenarios/                # six behaviour scenarios
└─ targets/react.json        # the React target a Vue target will mirror
```

并在 `e2e/` 之后插入：

```text
e2e-parity/                  # target-agnostic parity specs
```

`README.zh-CN.md` 的同一代码块对应插入：

```text
parity/                      # 冻结的跨框架契约与场景
├─ baseline/2.2.0/           # 2.2.0 表面的 SHA-256 清单
├─ contract/                 # 生成的组件契约与 docs surface 契约
├─ scenarios/                # 六个行为场景
└─ targets/react.json        # Vue target 将对齐的 React target
```

```text
e2e-parity/                  # 与 target 无关的 parity 用例
```

这两段只在 C4 出现，因为 `parity/contract`、`parity/scenarios`、`parity/targets` 与 `e2e-parity/` 到 Phase C 才创建；B4 提前写进 README 会让目录树指向不存在的路径。

- [ ] **Step 5: 更新 CONTRIBUTING**

在 “## Documentation” 之前加入：

```markdown
## Parity harness

`parity/` freezes the documented surface of 2.2.0 for the future Vue port. Do not regenerate `parity/baseline/`, screenshots or generated contracts to make a failure disappear — find the code or environment change instead.

- A component that joins the pilot list needs `parity/pilot.json`, a contract regeneration, a behaviour scenario in `parity/scenarios/`, and both light/dark baselines.
- New targets live in `parity/targets/<name>.json`. A target that cannot match the reference API uses `"mode": "reference"` and records per-pilot differences under `api.deviations`.
- `pnpm check:parity:freeze`, `pnpm check:parity:contract` and `pnpm check:parity:scenarios` run in CI; the Playwright suite runs in the `parity` job inside the Playwright image.
- The shared packages must stay framework-neutral. `pnpm test:shared` covers them, and a `react`, `@/` or Lucide import in any package `src` is a review blocker.
```

- [ ] **Step 6: 更新 scaffold 文档**

`docs/en/scaffold.md` 的 `--mock=drop` 第二段：

```markdown
Because the Playwright suite drives the app through the demo backend, dropping the mock drops the whole browser subsystem: `e2e`, `e2e-parity`, `parity`, the template, visual and parity Playwright configs (`playwright.config.ts`, `playwright.visual.config.ts`, `playwright.parity.config.ts`), the visual and parity scripts, the `test:e2e` / `test:visual*` / `test:parity*` / `perf` scripts, and the `e2e`, `visual`, `docs-visual` and `parity` jobs at the end of `.github/workflows/ci.yml`. The docs-side configs (`playwright.docs.config.ts`, `playwright.docs-visual.config.ts`) and `e2e-docs` stay, because they do not depend on the mock. What is left — Vitest, the shared package tests, ESLint, typecheck, the build and the bundle budget — still runs.
```

`docs/zh-CN/scaffold.md` 对应段落：

```markdown
由于 Playwright 套件是驱动着演示后端跑的，去掉 mock 就必须连同整个浏览器子系统一起去掉：`e2e`、`e2e-parity`、`parity`、模板/视觉/parity 三个 Playwright 配置（`playwright.config.ts`、`playwright.visual.config.ts`、`playwright.parity.config.ts`）、视觉与 parity 脚本、`test:e2e` / `test:visual*` / `test:parity*` / `perf` 这些 script，以及 `.github/workflows/ci.yml` 末尾的 `e2e`、`visual`、`docs-visual` 与 `parity` 四个 job。文档侧配置（`playwright.docs.config.ts`、`playwright.docs-visual.config.ts`）与 `e2e-docs` 会保留，因为它们不依赖 mock。剩下的 Vitest、共享包测试、ESLint、typecheck、构建与体积预算仍会照常运行。
```

- [ ] **Step 7: 同步文档副本并检查**

```bash
pnpm --filter @fish-admin/docs sync:template
pnpm docs:check
```

Expected: 文档页包含新的 `vue-port-foundation` 路由；`docs:check` 退出码 0。

- [ ] **Step 8: 提交**

```bash
git add docs/en/vue-port-foundation.md docs/zh-CN/vue-port-foundation.md parity/README.md README.md README.zh-CN.md CONTRIBUTING.md docs/en/scaffold.md docs/zh-CN/scaffold.md
git commit -m "docs: explain the Vue port foundation and parity gate"
```

---

### Task C5: 全量验收与证据记录

**Files:**

- Modify: `docs/en/vue-port-foundation.md`、`docs/zh-CN/vue-port-foundation.md`（记录实际结果）
- No source changes unless a gate fails.

**Interfaces:**

- Consumes: A–C 的全部提交。
- Produces: 一份可复现的验收记录；不 push、不发布、不移动 tag。

- [ ] **Step 1: 静态与单元门禁**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:shared
pnpm test:tokens
pnpm --filter @fish-admin/react test
pnpm check:package
pnpm check:tokens
pnpm check:rtl
pnpm check:maturity
pnpm gen-api:check
pnpm check:parity:freeze
pnpm check:parity:contract
pnpm check:parity:scenarios
```

Expected: 全部退出码 0；根套件不少于 380 条；`test:shared` 三个包全绿；parity 清单 460 个文件全匹配。

- [ ] **Step 2: 模板与文档浏览器门禁**

Run:

```bash
pnpm test:e2e
pnpm test:docs
DOCS_FULL_AXE=1 pnpm test:docs
```

Expected: 模板 78 passed；文档 106 passed / 166 skipped；全量 axe 272 passed。任何数字变化只允许增加，且 0 failed。

- [ ] **Step 3: Docker 视觉与 parity**

Run:

```bash
pnpm test:visual:docker
pnpm test:docs:visual:docker
pnpm test:parity:docker
```

Expected: 模板 18/18、文档 180/180、parity 119/119；全部在 `mcr.microsoft.com/playwright:v1.64.1-noble` 中通过；没有任何截图被更新。

- [ ] **Step 4: 脚手架与体积**

```bash
pnpm exec vitest run scripts/scaffold.test.mjs
pnpm size
```

Expected: 三个 scaffold variant 全过；四个 bundle 预算全部守住（firstPaintJs ≤ 180 KB、largestAsyncJs ≤ 115 KB、totalJs ≤ 800 KB、totalCss ≤ 30 KB）。

- [ ] **Step 5: 确认基线零改动**

```bash
git diff --name-only -- '*.png'
git status --porcelain -- parity/baseline apps/docs/generated e2e-docs/__screenshots__ e2e/visual/__screenshots__
```

Expected: 两条命令都无输出。若出现 PNG 改动，停止并定位原因；不得提交任何重录的基线。

- [ ] **Step 6: 记录实际证据**

在两份 `vue-port-foundation.md` 的 “Verification” / “验收” 小节末尾追加复核记录。记录五类数据，每一类都必须填入 Step 1–4 命令刚刚打印的实际数字，不得沿用 2.2.0 的旧记录，也不得改写预算：

```markdown
### 2026-11-09 run

- Static gates: format, lint, typecheck, package, tokens, RTL, maturity, gen-api, parity contract, parity scenarios — all pass.
- Unit suites: root <root total>, tokens <tokens total>, UI <UI total>, shared <shared total>.
- Browser: template <template passed> passed; docs <docs passed> passed / <docs skipped> skipped; full axe <full axe passed> passed.
- Visual: template 18/18, docs 180/180, parity 119/119, zero baseline changes.
- Bundle: first paint <KB> KB, largest async <KB> KB, total JS <KB> KB, total CSS <KB> KB.
```

把每个尖括号占位符替换为命令输出的数字：`<root total>` 来自 `pnpm test`，`<tokens total>` 来自 `pnpm test:tokens`，`<UI total>` 来自 `pnpm --filter @fish-admin/react test`，`<shared total>` 来自 `pnpm test:shared` 三个包之和；`<template passed>` 来自 `pnpm test:e2e`，`<docs passed>` / `<docs skipped>` 来自 `pnpm test:docs`，`<full axe passed>` 来自 `DOCS_FULL_AXE=1 pnpm test:docs`；四个 `<KB>` 来自 `pnpm size`。中文页面写同样的数据。

- [ ] **Step 6b: 确认证据没有占位符**

```bash
sed -n '/^### 2026-11-09 run/,$p' docs/en/vue-port-foundation.md | grep -nE '<[^>]+>'
sed -n '/^### 2026-11-09 run/,$p' docs/zh-CN/vue-port-foundation.md | grep -nE '<[^>]+>'
```

Expected: 两条命令都无输出。页面正文里的 `parity/baseline/<version>/` 与 `section[data-demo="<component>/<demo>"]` 是合同说明，不在检查范围；只要复核记录里还剩任何尖括号占位符，就不算完成。

- [ ] **Step 7: 提交**

```bash
git add docs/en/vue-port-foundation.md docs/zh-CN/vue-port-foundation.md
git commit -m "docs(parity): record the foundation verification"
```

- [ ] **Step 8: 收尾状态**

```bash
git status --short
git log --oneline -12
git tag -n1 parity-2.2.0
```

Expected: 工作树干净；A3 的 `parity-2.2.0` 本地 annotated tag 仍在；没有 push、没有新远端 tag、没有发布。
