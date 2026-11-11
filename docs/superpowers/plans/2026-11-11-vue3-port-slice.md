# FishAdmin Vue 3 试点移植（Slice 1）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付私有 `@fish-admin/vue@0.1.0` 与最小 Vite 目标站 `apps/parity-vue`，让 6 个试点组件（Accordion、Tabs、Select、Dialog、DateRangePicker、ProTable）在冻结的 2.2.0 parity 基线上通过 42 条 Vue 检查，同时保持 React target 的 119 条检查不变、198 张 `*-linux.png` 零改动。

**Architecture:** 三层推进。第一层建立 Vue 包与工具链（`packages/vue`，源码导出、无构建产物、私有）；第二层给 parity harness 增加 `contract.scope`（React 仍为 `all`，Vue 为 `pilot`），新增 `parity/targets/vue.json` 与 CI job；第三层先搭 `apps/parity-vue` 的 876 px 文档外壳（与 `apps/docs/theme/Demo.tsx` 同 DOM、同文案、同 CSS），再按依赖顺序移植 primitives → Accordion → Tabs → Select → Dialog → DateRangePicker → ProTable，每个组件连同两个 demo 一起落地。Vue 只复用框架无关的 `@fish-admin/tokens` 与冻结合同，不修改 React 包。

**Tech Stack:** Vue 3.5.45、Reka UI 2.11.0、@tanstack/vue-table 8.21.3、vue-router 4.6.4、lucide-vue-next 1.0.0、@internationalized/date 3.12.4、cva 0.7.1、clsx 2.1.1、tailwind-merge 3.7.0、Vite 8.3.4、@vitejs/plugin-vue 6.0.10、vue-tsc 3.3.14、Vitest 5、@vue/test-utils 2.5.1、Tailwind 4.3.3、Playwright 1.64.1、pnpm 9.1.1、Docker `mcr.microsoft.com/playwright:v1.64.1-noble`。

**Spec:** 本文件（设计与可执行步骤合一）。上游口径见 `docs/en/vue-port-foundation.md`、`docs/zh-CN/vue-port-foundation.md` 与 `parity/README.md`；基线来源见 `parity/baseline/2.2.0/manifest.json` 和 tag `parity-2.2.0`（`e437413`）。本计划不新增公开 API、不发布任何包、不改 React 组件行为。

## Global Constraints

- 版本冻结：根 `package.json` 保持 `2.2.0`，`@fish-admin/react` 保持 `0.2.2`，`@fish-admin/tokens` 保持 `0.1.1`。新增的 `@fish-admin/vue` 固定 `0.1.0` 且 `private: true`；`@fish-admin/parity-vue` 固定 `0.1.0` 且 `private: true`。本计划不发布、不升级既有版本。
- 外部动作审批：`git push`、远端 tag、`npm publish`、GitHub Release、Vercel 项目设置或部署变更，每一项都需要单独、明确的批准。本计划只产生本地 commit。
- 视觉基线不可再生：198 张 `*-linux.png`（模板 18、文档布局 14、组件 166）是参考。任何任务都不得运行 `--update-snapshots=all`、`test:visual:update`、`test:docs:visual:update`，也不得改动 `playwright.parity.config.ts` 的 `updateSnapshots: 'none'`。Vue 截图若有差异，只修 Vue 的 DOM/CSS，不得重录基线。
- RBAC 仍然只是客户端 UX：所有 README、docs、界面文案中的“客户端权限不是安全边界”说明不得弱化或删除。本计划不改动这些段落。
- 共享包必须框架无关：`packages/contracts`、`packages/i18n`、`packages/mock` 的 `src` 中不得出现 `react`、`react-dom`、`@fish-admin/react`、`@/` 别名或 Lucide 组件导入。Vue 包不得被这些包反向依赖。
- 不修改 React 包：`packages/ui/**` 在本计划中只读。Vue 组件的 class 集合从 React 源码逐字复制；顺序允许被 Prettier 的 Tailwind 插件重排，渲染结果不变。
- 场景 DSL 边界：`parity/scenarios/*.json` 只使用可访问名称、角色、可见文本和状态，不写 CSS 选择器（`expectCount` 的表格行除外）。本计划不新增、不改写场景。
- harness 只增加 scope：React target 不写 `contract` 字段，默认 `all`，119 条检查不变；Vue target 写 `"contract": { "scope": "pilot" }`，只跑 6 个试点，共 42 条。
- 文档双语同步：每改动一份 `docs/en/*.md`，必须同一提交内更新对应的 `docs/zh-CN/*.md`；README 的英文与 `README.zh-CN.md` 同理。CHANGELOG 只写英文条目。
- 工具链固定：Node >= 22、pnpm 9.1.1。所有命令在仓库根目录执行；Windows 上使用 Git Bash。
- 每个任务结束前至少运行 `pnpm exec prettier --check <changed files>`、`pnpm lint`、相关测试；任务声明“通过”之前必须附上真实命令输出。
- 提交粒度：每个任务一个本地 commit，使用 Conventional Commits。不得 `--amend` 已存在的提交，不得 `--no-verify`。

---

## 文件结构

新建文件（`packages/vue` 与 `apps/parity-vue`），修改文件（harness、根配置、CI、文档）：

```text
packages/vue/                                   # @fish-admin/vue（private，source exports）
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
├─ test/setup.ts
└─ src/
   ├─ index.ts                                  # 只导出试点组件与类型
   ├─ i18n.ts                                   # provideUILocale / useUITranslation
   ├─ lib/{utils.ts,date.ts}                    # cn + 与 packages/ui/src/lib/date.ts 相同的日期工具
   ├─ lib/{utils,date}.test.ts
   ├─ styles/{index,utilities,base,a11y}.css    # index 自包含 Tailwind 入口，其余从 packages/ui 复制
   └─ components/
      ├─ ui/button/{Button.vue,variants.ts,index.ts}
      ├─ ui/input/Input.vue
      ├─ ui/label/Label.vue
      ├─ ui/switch/Switch.vue
      ├─ ui/checkbox/Checkbox.vue
      ├─ ui/badge/{Badge.vue,variants.ts}
      ├─ ui/skeleton/Skeleton.vue
      ├─ ui/accordion/{Accordion,AccordionHeader,AccordionItem,AccordionTrigger,AccordionContent}.vue + accordion.test.ts
      ├─ ui/tabs/{Tabs,TabsList,TabsTrigger,TabsContent}.vue + tabs.test.ts
      ├─ ui/select/{Select,SelectTrigger,SelectValue,SelectContent,SelectItem,SelectGroup,SelectLabel,SelectSeparator,SelectScrollUpButton,SelectScrollDownButton}.vue + select.test.ts
      ├─ ui/dialog/{Dialog,DialogTrigger,DialogPortal,DialogClose,DialogOverlay,DialogContent,DialogHeader,DialogFooter,DialogTitle,DialogDescription}.vue + dialog.test.ts
      ├─ enterprise/date-range-picker/{DateRangePicker.vue,RangeCalendar.vue,types.ts} + date-range-picker.test.ts
      └─ pro/{ProTable.vue,DataTable.vue,BulkActionsBar.vue,types.ts} + pro-table.test.ts

apps/parity-vue/                                # @fish-admin/parity-vue（private）
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ vitest.config.ts
├─ index.html
├─ test/{setup.ts,demo-block.test.ts,demos.test.ts}
└─ src/
   ├─ main.ts
   ├─ App.vue
   ├─ router.ts
   ├─ pages/ComponentPage.vue
   ├─ components/{DemoBlock.vue,ApiTable.vue}
   ├─ data/{types.ts,ui.ts,demos.ts,api.ts,registry.ts,members.ts}
   ├─ demos/accordion/{basic,controlled}.vue
   ├─ demos/tabs/{basic,vertical}.vue
   ├─ demos/select/{basic,groups}.vue
   ├─ demos/dialog/{basic,long-content}.vue
   ├─ demos/date-range-picker/{basic,presets}.vue
   ├─ demos/pro-table/{basic,selection}.vue
   └─ styles/{index.css,demo.css}

parity/targets/vue.json                         # baseURL 4176，reference 模式，pilot scope
e2e-parity/helpers/target.ts                    # + contract?: { scope }
e2e-parity/specs/contract.spec.ts               # scope=pilot 时只遍历试点
scripts/parity-docker.mjs                       # 不变，复用 PARITY_TARGET
package.json                                    # scripts、typecheck、devDependencies
eslint.config.js                                # + vue-eslint-parser / eslint-plugin-vue
.github/workflows/ci.yml                        # + Vue unit tests、Parity (Vue) job
parity/README.md                                # vue.json 与 scope 说明
README.md / README.zh-CN.md                     # parity 段落：React 119 / Vue 42
CHANGELOG.md                                    # [Unreleased] Added
docs/en/vue-port-foundation.md                  # Slice 1 结果与偏差
docs/zh-CN/vue-port-foundation.md               # 同上中文版
```

### 依赖与版本的单一来源

| 依赖                                                   | 版本                           | 用途                                                                                                            |
| ------------------------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `vue`                                                  | `^3.5.45`                      | 运行时；`useId` 来自 3.5                                                                                        |
| `reka-ui`                                              | `^2.11.0`                      | 无样式的 Accordion / Tabs / Select / Dialog / Popover / RangeCalendar；提供 `--reka-accordion-content-height`   |
| `@tanstack/vue-table`                                  | `^8.21.3`                      | 与 React 侧 `@tanstack/react-table` 同为 v8，列定义可逐项对应                                                   |
| `vue-router`                                           | `^4.6.4`                       | `/components/<id>` 与 `/zh/components/<id>` 路由；不使用尚未稳定的 v5                                           |
| `lucide-vue-next`                                      | `^1.0.0`                       | 与 React 侧 Lucide 同名图标                                                                                     |
| `class-variance-authority`                             | `^0.7.1`                       | Button / TabsList / Badge 变体，直接复用 React 源码里的 cva 配置                                                |
| `clsx` + `tailwind-merge`                              | `^2.1.1` / `^3.7.0`            | `cn`，与 React 侧同版本                                                                                         |
| `@internationalized/date`                              | `^3.12.4`                      | Reka RangeCalendar 的 `CalendarDate` 与 `parseDate`；`CalendarDate.toString()` 直接得到 `YYYY-MM-DD`            |
| `@fontsource-variable/inter`                           | `^5.3.0`                       | 与文档站同一字体文件，截图字宽一致                                                                              |
| `@vitejs/plugin-vue`                                   | `^6.0.10`                      | Vite 8 兼容                                                                                                     |
| `vue-tsc`                                              | `^3.3.14`                      | SFC 类型检查                                                                                                    |
| `@vue/test-utils`                                      | `^2.5.1`                       | 单元测试                                                                                                        |
| `vitest` / `jsdom`                                     | `^5.0.5` / `^30.1.3`           | 与仓库其余包一致                                                                                                |
| `tailwindcss` / `@tailwindcss/vite` / `tw-animate-css` | `^4.3.3` / `^4.3.3` / `^1.4.0` | 与 React 包同一套工具链；`tw-animate-css` 已包含 `accordion-down/up` 并回退到 `--reka-accordion-content-height` |
| `eslint-plugin-vue` / `vue-eslint-parser`              | `^10.12.1` / `^10.4.2`         | 根 ESLint flat config                                                                                           |

### 试点目标与检查数

| 目标                       | contract | docs-surface | behavior | visual | axe | 合计    |
| -------------------------- | -------- | ------------ | -------- | ------ | --- | ------- |
| React（默认，`scope=all`） | 83       | 12           | 6        | 12     | 6   | **119** |
| Vue（`scope=pilot`）       | 6        | 12           | 6        | 12     | 6   | **42**  |

---

## Phase A — 包、工具链与 parity 入口

### Task 1: `@fish-admin/vue` 骨架、依赖与 lint/typecheck 接线

**Files:**

- Create: `packages/vue/package.json`、`packages/vue/tsconfig.json`、`packages/vue/vitest.config.ts`
- Create: `packages/vue/test/setup.ts`、`packages/vue/src/index.ts`、`packages/vue/src/lib/utils.ts`、`packages/vue/src/lib/utils.test.ts`
- Create: `packages/vue/src/styles/index.css`、`utilities.css`、`base.css`、`a11y.css`
- Modify: `package.json`（devDependencies、`test:vue`、`typecheck`）
- Modify: `eslint.config.js`（Vue flat config）

**Interfaces:**

- Consumes: `packages/ui/src/styles/{utilities,base,a11y}.css`（逐字复制）、`packages/ui/src/lib/utils.ts`（逐字复制）。
- Produces:
  - workspace 包 `@fish-admin/vue`，其 `"."` 导出 `./src/index.ts`（本任务只导出 `cn`）；
  - `@fish-admin/vue/styles/index.css`，供 `apps/parity-vue` 通过包导出导入；
  - 根命令 `pnpm test:vue`；
  - 根 `typecheck` 覆盖 `@fish-admin/vue` 与 `@fish-admin/parity-vue`（后者在 Task 3 创建，届时才可用；本任务先把 `@fish-admin/vue` 加进链路）。

- [ ] **Step 1: 创建 Vue 包清单**

`packages/vue/package.json`：

```json
{
  "name": "@fish-admin/vue",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Private Vue 3 port of the six FishAdmin parity pilots.",
  "exports": {
    ".": "./src/index.ts",
    "./styles/index.css": "./src/styles/index.css",
    "./package.json": "./package.json"
  },
  "scripts": {
    "typecheck": "vue-tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "peerDependencies": {
    "vue": "^3.5.45"
  },
  "dependencies": {
    "@fish-admin/tokens": "workspace:*",
    "@internationalized/date": "^3.12.4",
    "@tanstack/vue-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-vue-next": "^1.0.0",
    "reka-ui": "^2.11.0",
    "tailwind-merge": "^3.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.10",
    "@vue/test-utils": "^2.5.1",
    "jsdom": "^30.1.3",
    "tailwindcss": "^4.3.3",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5.9.3",
    "vite": "^8.3.4",
    "vitest": "^5.0.5",
    "vue": "^3.5.45",
    "vue-tsc": "^3.3.14"
  }
}
```

- [ ] **Step 2: 创建 TypeScript 与 Vitest 配置**

`packages/vue/tsconfig.json`：

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
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "types": ["vite/client"]
  },
  "include": ["src", "test", "vitest.config.ts"]
}
```

`packages/vue/vitest.config.ts`：

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
```

`packages/vue/test/setup.ts`：

```ts
import { vi } from 'vitest'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

Element.prototype.scrollIntoView = vi.fn()
Element.prototype.hasPointerCapture = vi.fn(() => false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()
```

- [ ] **Step 3: 写失败的 `cn` 测试**

`packages/vue/src/lib/utils.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('keeps the last conflicting Tailwind utility', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4')
  })

  it('drops falsey values', () => {
    expect(cn('flex', false, undefined, null, { hidden: false })).toBe('flex')
  })
})
```

- [ ] **Step 4: 运行测试确认失败**

Run: `pnpm --filter @fish-admin/vue test`

Expected: FAIL，`Failed to resolve import "./utils"`（文件尚不存在）。

- [ ] **Step 5: 实现 `cn`、样式与入口**

`packages/vue/src/lib/utils.ts`（与 `packages/ui/src/lib/utils.ts` 的 `cn` 完全一致，只保留这一个函数）：

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

`packages/vue/src/index.ts`：

```ts
export { cn } from './lib/utils'
```

`packages/vue/src/styles/index.css`（自包含：主题、工具类、动画、tokens 与源码扫描都在包内，应用只负责 preflight 与页面级 CSS）：

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
@import 'tw-animate-css';

@import '@fish-admin/tokens/theme.css';
@import './utilities.css';
@import './base.css';
@import './a11y.css';

@source '../components';
```

`utilities.css`、`base.css`、`a11y.css` 从 `packages/ui/src/styles/` 逐字复制。`base.css` 里的 `@apply border-border outline-ring/50` 由同文件的 `@fish-admin/tokens/theme.css` 提供主题变量，应用无需再导入 tokens。

- [ ] **Step 6: 接入根脚本与 ESLint**

在根 `package.json` 的 `scripts` 中：

```json
"test:vue": "pnpm --filter @fish-admin/vue test",
```

把根 `typecheck` 改为：

```json
"typecheck": "tsc --noEmit && pnpm --filter @fish-admin/contracts typecheck && pnpm --filter @fish-admin/i18n typecheck && pnpm --filter @fish-admin/mock typecheck && pnpm --filter @fish-admin/tokens typecheck && pnpm --filter @fish-admin/react typecheck && pnpm --filter @fish-admin/vue typecheck && pnpm --filter @fish-admin/docs typecheck",
```

> Task 3 完成后，在 `@fish-admin/vue typecheck` 之后插入 `pnpm --filter @fish-admin/parity-vue typecheck`。

在根 `devDependencies` 中新增：

```json
"eslint-plugin-vue": "^10.12.1",
"vue-eslint-parser": "^10.4.2",
```

`eslint.config.js` 顶部新增：

```js
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
```

在 `ignores` 之后、现有 `**/*.{ts,tsx}` 配置之后追加：

```js
  {
    files: ['**/*.vue'],
    extends: [...tseslint.configs.recommended, ...pluginVue.configs['flat/essential']],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: { ...globals.browser },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
```

> 用 `flat/essential` 而不是 `flat/recommended`：后者的 `max-attributes-per-line`、`html-indent` 等格式规则会与 Prettier 冲突，属性换行与自闭合交给 Prettier。

- [ ] **Step 7: 安装依赖并验证**

Run: `pnpm install`

Expected: lockfile 更新，`@fish-admin/vue` 被链接。

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，2 个测试通过。

Run: `pnpm --filter @fish-admin/vue typecheck`

Expected: 无输出，退出码 0。

Run: `pnpm lint`

Expected: 通过。

- [ ] **Step 8: 提交**

```bash
git add packages/vue package.json pnpm-lock.yaml eslint.config.js
git commit -m "feat(vue): scaffold the private vue package and toolchain"
```

---

### Task 2: parity harness 的 `contract.scope`、Vue target 与 CI 入口

**Files:**

- Modify: `e2e-parity/helpers/target.ts`
- Modify: `e2e-parity/specs/contract.spec.ts`
- Create: `parity/targets/vue.json`
- Modify: `package.json`（`test:parity:vue`）
- Modify: `.github/workflows/ci.yml`（Vue unit tests、Parity (Vue)）
- Modify: `parity/README.md`

**Interfaces:**

- Consumes: 现有 `ParityTarget`、`targetId`（`PARITY_TARGET`，默认 `react`）、`scripts/parity-docker.mjs`。
- Produces:
  - `ParityTarget.contract?: { scope: 'all' | 'pilot' }`，缺省 `all`；
  - `contract.spec.ts` 在 `pilot` scope 下只遍历 `contract.pilot`；
  - `parity/targets/vue.json`（`name: "vue"`、`baseURL: "http://localhost:4176"`、`api.mode: "reference"`、六个 deviation key）；
  - 根命令 `pnpm test:parity:vue`；
  - CI job `parity-vue`。

- [ ] **Step 1: 扩展 target 类型**

`e2e-parity/helpers/target.ts` 改为：

```ts
import fs from 'node:fs'
import path from 'node:path'

export type ApiMode = 'exact' | 'reference'
export type ContractScope = 'all' | 'pilot'

export interface ParityTarget {
  name: string
  baseURL: string
  webServer: { command: string; timeout: number }
  contract?: { scope: ContractScope }
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

- [ ] **Step 2: 在 contract spec 中应用 scope**

`e2e-parity/specs/contract.spec.ts` 第 55 行上方加入：

```ts
const scope = target.contract?.scope ?? 'all'
const components =
  scope === 'pilot'
    ? contract.components.filter((component) => contract.pilot.includes(component.id))
    : contract.components
```

并把循环改为 `for (const component of components) {`。其余逻辑不动：`reference` 模式仍然只校验 `api.deviations` 覆盖六个试点，不比较 API 行。

- [ ] **Step 3: 新增 Vue target**

`parity/targets/vue.json`：

```json
{
  "name": "vue",
  "baseURL": "http://localhost:4176",
  "webServer": {
    "command": "pnpm --filter @fish-admin/tokens build && pnpm --filter @fish-admin/parity-vue build && pnpm --filter @fish-admin/parity-vue preview --port 4176",
    "timeout": 300000
  },
  "contract": { "scope": "pilot" },
  "api": {
    "mode": "reference",
    "deviations": {
      "accordion": ["`asChild` stays available on the Reka trigger under the same name."],
      "date-range-picker": [
        "`value` becomes `modelValue` with `v-model`.",
        "`onChange` becomes the `update:modelValue` event.",
        "`className` becomes the native `class` attribute."
      ],
      "dialog": [],
      "pro-table": [
        "`table` accepts a `@tanstack/vue-table` `Table<TData>` instead of the React instance.",
        "`empty`, `filters`, `actions`, `toolbar` and `selection-actions` are named slots.",
        "`onRowClick` becomes the `row-click` event.",
        "`pagination` is not ported in this slice.",
        "`rowContextMenu`, `virtualized`, `density` and `scrollLabel` are not ported in this slice."
      ],
      "select": [
        "`value` becomes `modelValue` with `v-model`.",
        "`onValueChange` becomes the `update:modelValue` event.",
        "`SelectValue` takes an explicit `label` because Reka cannot resolve the selected item text while the content is unmounted."
      ],
      "tabs": ["`asChild` stays available on the Reka trigger under the same name."]
    }
  }
}
```

- [ ] **Step 4: 增加根命令与 CI**

根 `package.json` 的 `scripts` 中，在 `test:parity:docker` 后加入：

```json
"test:parity:vue": "cross-env PARITY_TARGET=vue node scripts/parity-docker.mjs",
```

`.github/workflows/ci.yml` 的 `quality` job，在 “Shared package tests” 之后加入：

```yaml
- name: Vue package tests
  run: pnpm --filter @fish-admin/vue test
```

在文件末尾、现有 `parity` job 之后追加：

```yaml
parity-vue:
  name: Parity (Vue)
  runs-on: ubuntu-latest
  container:
    image: mcr.microsoft.com/playwright:v1.64.1-noble
    options: --user 1001 --ipc=host
  steps:
    - uses: actions/checkout@v4

    - name: Enable pnpm
      # The playwright image moved to Node 26, which no longer bundles corepack.
      run: |
        npm install -g --prefix /tmp/pnpm-home --no-fund --no-audit pnpm@9.1.1
        echo /tmp/pnpm-home/bin >> "$GITHUB_PATH"

    - name: Install dependencies
      run: pnpm install --frozen-lockfile --store-dir /tmp/pnpm-store

    - name: Run the Vue parity suite
      run: pnpm test:parity
      env:
        PARITY_TARGET: vue

    - name: Upload Vue parity report
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: parity-vue-report
        path: |
          playwright-report/parity
          test-results/parity
        retention-days: 7
```

- [ ] **Step 5: 更新 parity README**

`parity/README.md` 的表格把 `targets/react.json` 一行改为两行，并在 “What a target must match” 末尾加一段：

```markdown
| `targets/react.json` | The React reference target; `contract.scope` defaults to `all` |
| `targets/vue.json` | The Vue slice target; `contract.scope: "pilot"` limits it to six |
```

```markdown
A target may set `"contract": { "scope": "pilot" }` to run the 83-component contract for the six pilots only; the default is `"all"`. React keeps `all` (119 checks); Vue uses `pilot` (42 checks). Reference mode never compares API rows, so the Vue target can ship six pilots while the other 77 React routes stay unported.
```

- [ ] **Step 6: 验证检查数**

Run: `pnpm exec playwright test -c playwright.parity.config.ts --list`

Expected: 列出 119 个测试（83 + 12 + 6 + 12 + 6）。

Run: `cross-env PARITY_TARGET=vue pnpm exec playwright test -c playwright.parity.config.ts --list`

Expected: 列出 42 个测试（6 + 12 + 6 + 12 + 6）。此时 Vue 应用尚不存在，`--list` 不启动 webServer，因此不会失败。

- [ ] **Step 7: 提交**

```bash
git add e2e-parity/helpers/target.ts e2e-parity/specs/contract.spec.ts parity/targets/vue.json parity/README.md package.json .github/workflows/ci.yml
git commit -m "feat(parity): scope the contract for the vue pilot target"
```

---

## Phase B — Vue 目标应用

### Task 3: `apps/parity-vue` 外壳、DemoBlock 与 API 表

**Files:**

- Create: `apps/parity-vue/package.json`、`tsconfig.json`、`vite.config.ts`、`vitest.config.ts`、`index.html`
- Create: `apps/parity-vue/test/setup.ts`、`apps/parity-vue/test/demo-block.test.ts`
- Create: `apps/parity-vue/src/main.ts`、`App.vue`、`router.ts`
- Create: `apps/parity-vue/src/pages/ComponentPage.vue`
- Create: `apps/parity-vue/src/components/DemoBlock.vue`、`ApiTable.vue`
- Create: `apps/parity-vue/src/data/{types.ts,ui.ts,demos.ts,api.ts,registry.ts,members.ts}`
- Create: `apps/parity-vue/src/styles/index.css`、`demo.css`
- Create: `packages/vue/src/i18n.ts`；Modify: `packages/vue/src/index.ts`
- Modify: `package.json`、`.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `@fish-admin/vue/styles/index.css`（Task 1）、`@fish-admin/tokens`、`apps/docs/site.ts`、`apps/docs/generated/{api,registry}.json`、`apps/docs/demos/data/members.ts`、`apps/docs/theme/styles/index.css` 341–600 与 678–706 行。
- Produces:
  - `DemoEntry`、`ComponentEntry`、`DocsLang` 类型；
  - `DemoBlock.vue`（props：`demo`、`componentEntry`、`lang`）与 `ApiTable.vue`（props：`component`、`lang`）；
  - 路由 `/components/:id`、`/zh/components/:id`；
  - `data/demos.ts` 的 `DEMOS: DemoEntry[]`（本任务为空，后续任务逐项追加）；
  - 包导出 `provideUILocale`、`useUITranslation`、`UILocale`。

- [ ] **Step 1: 创建应用清单与工具链配置**

`apps/parity-vue/package.json`：

```json
{
  "name": "@fish-admin/parity-vue",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 4176 --strictPort",
    "build": "vue-tsc -p tsconfig.json --noEmit && vite build",
    "preview": "vite preview --port 4176 --strictPort",
    "test": "vitest run",
    "typecheck": "vue-tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@fish-admin/vue": "workspace:*",
    "@fontsource-variable/inter": "^5.3.0",
    "@tanstack/vue-table": "^8.21.3",
    "lucide-vue-next": "^1.0.0",
    "vue": "^3.5.45",
    "vue-router": "^4.6.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-vue": "^6.0.10",
    "@vue/test-utils": "^2.5.1",
    "jsdom": "^30.1.3",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.9.3",
    "vite": "^8.3.4",
    "vitest": "^5.0.5",
    "vue-tsc": "^3.3.14"
  }
}
```

`apps/parity-vue/tsconfig.json`：

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
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "types": ["vite/client"]
  },
  "include": ["src", "test", "vite.config.ts", "vitest.config.ts"]
}
```

`apps/parity-vue/vite.config.ts`：

```ts
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: { port: 4176, strictPort: true },
  preview: { port: 4176, strictPort: true },
})
```

`apps/parity-vue/vitest.config.ts`：

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
```

`apps/parity-vue/index.html`：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FishAdmin Vue parity</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`apps/parity-vue/test/setup.ts`（与包内 setup 相同，另加 `matchMedia` 已覆盖的桩）：

```ts
import { vi } from 'vitest'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

Element.prototype.scrollIntoView = vi.fn()
Element.prototype.hasPointerCapture = vi.fn(() => false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()
```

- [ ] **Step 2: 在 Vue 包中提供 locale 注入**

`packages/vue/src/i18n.ts`：

```ts
import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'

export type UILocale = 'en' | 'zh-CN'
type Messages = Record<string, string>

const BUILT_IN: Record<UILocale, Messages> = {
  en: {
    'actions.close': 'Close',
    'enterprise.clear': 'Clear',
  },
  'zh-CN': {
    'actions.close': '关闭',
    'enterprise.clear': '清除',
  },
}

const LOCALE_KEY: InjectionKey<Ref<UILocale>> = Symbol('fish-admin:locale')
const DEFAULT_LOCALE = ref<UILocale>('en')

export function provideUILocale(locale: Ref<UILocale>) {
  provide(LOCALE_KEY, locale)
}

export function useUITranslation() {
  const locale = inject(LOCALE_KEY, DEFAULT_LOCALE)
  const messages = computed(() => BUILT_IN[locale.value])
  const t = (key: string) => messages.value[key] ?? BUILT_IN.en[key] ?? key
  return { t, locale }
}
```

`packages/vue/src/index.ts` 改为：

```ts
export { cn } from './lib/utils'
export { provideUILocale, useUITranslation, type UILocale } from './i18n'
```

- [ ] **Step 3: 创建数据层**

`apps/parity-vue/src/data/types.ts`：

```ts
import type { Component } from 'vue'

export type DocsLang = 'en' | 'zh'

export interface ComponentEntry {
  id: string
  name: string
  category: 'primitive' | 'enterprise' | 'pro'
  status: 'stable' | 'beta'
  since: string
  usedIn: string
  isNew: boolean
}

export interface DemoEntry {
  id: string
  componentId: string
  title: Record<DocsLang, string>
  /** Frozen React source line count; the toolbar must keep showing it verbatim. */
  lines: number
  /** Original docs path, used only for the "View source" link. */
  filename: string
  /** Raw Vue SFC text, displayed in the Code tab. */
  source: string
  view: Component
}
```

`apps/parity-vue/src/data/ui.ts`：

```ts
// The docs site owns these strings; re-exporting keeps the parity app from drifting.
export { SITE, UI_TEXT, uiText, templatePath, demoSourceUrl } from '../../../docs/site'
```

`apps/parity-vue/src/data/api.ts`：

```ts
import api from '../../../docs/generated/api.json'

export type ApiProp = {
  name: string
  type: string
  required?: boolean
  defaultValue?: string | null
  description: string
}

export type ApiComponent = {
  name: string
  exportName: string
  props: ApiProp[]
  events: ApiProp[]
  slots: string[]
  unresolved: string[]
}

export const API = api as { components: Record<string, ApiComponent> }
```

`apps/parity-vue/src/data/registry.ts`：

```ts
import registry from '../../../docs/generated/registry.json'

import type { ComponentEntry } from './types'

export const COMPONENTS = registry.components as ComponentEntry[]
```

`apps/parity-vue/src/data/members.ts`：

```ts
export { MEMBERS, type DemoMember } from '../../../docs/demos/data/members'
```

`apps/parity-vue/src/data/demos.ts`：

```ts
import type { DemoEntry } from './types'

export const DEMOS: DemoEntry[] = []
```

> 所有 Vue demo SFC 都保留一个普通 `<script lang="ts">export default ...</script>` 块，与 `<script setup>` 并存。共享的 `docs-surface.spec.ts` 断言 `.fish-demo__source` 包含 `export default`，这条断言对 Vue target 同样生效；代码面板展示的是 `?raw` 的 Vue 源码，工具栏仍显示冻结的 React 行数。

- [ ] **Step 4: 创建 DemoBlock、API 表与页面**

`apps/parity-vue/src/components/DemoBlock.vue`：

```vue
<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import type { ComponentEntry, DemoEntry, DocsLang } from '../data/types'
import { SITE, demoSourceUrl, templatePath, uiText } from '../data/ui'

const props = defineProps<{
  demo: DemoEntry
  componentEntry: ComponentEntry
  lang: DocsLang
}>()

const text = computed(() => uiText(props.lang))
const view = ref<'preview' | 'code'>('preview')
const copied = ref(false)
const uid = useId()

function select(next: 'preview' | 'code') {
  view.value = next
  document.getElementById(`${uid}-${next}-tab`)?.focus()
}

function onTabKeyDown(event: KeyboardEvent) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  event.preventDefault()
  select(view.value === 'preview' ? 'code' : 'preview')
}

async function onCopy() {
  try {
    await navigator.clipboard.writeText(props.demo.source)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <section class="fish-demo" :data-demo="demo.id">
    <header class="fish-demo__header">
      <h3 class="fish-demo__title">{{ demo.title[lang] }}</h3>
      <div class="fish-demo__links">
        <a
          :href="`${SITE.demoUrl}${templatePath(componentEntry.usedIn)}`"
          target="_blank"
          rel="noreferrer"
        >
          {{ text.demoUsedIn }}
        </a>
        <a :href="demoSourceUrl(demo.filename)" target="_blank" rel="noreferrer">
          {{ text.demoViewSource }}
        </a>
      </div>
    </header>
    <div class="fish-demo__card">
      <div class="fish-demo__toolbar">
        <div class="fish-demo__tabs" role="tablist" :aria-label="demo.title[lang]">
          <button
            type="button"
            role="tab"
            :id="`${uid}-preview-tab`"
            :aria-selected="view === 'preview'"
            :aria-controls="`${uid}-preview`"
            :tabindex="view === 'preview' ? 0 : -1"
            class="fish-demo__tab"
            @click="select('preview')"
            @keydown="onTabKeyDown"
          >
            {{ text.demoPreview }}
          </button>
          <button
            type="button"
            role="tab"
            :id="`${uid}-code-tab`"
            :aria-selected="view === 'code'"
            :aria-controls="`${uid}-code`"
            :tabindex="view === 'code' ? 0 : -1"
            class="fish-demo__tab"
            @click="select('code')"
            @keydown="onTabKeyDown"
          >
            {{ text.demoSource }}
          </button>
        </div>
        <div class="fish-demo__tools">
          <span class="fish-demo__meta">TSX · {{ demo.lines }} {{ text.demoLines }}</span>
          <button
            type="button"
            class="fish-demo__copy"
            :aria-label="text.demoCopy"
            :title="copied ? text.demoCopied : text.demoCopy"
            :data-copied="copied || undefined"
            @click="onCopy"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
              <path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1" />
            </svg>
          </button>
          <span class="fish-visually-hidden" role="status">{{
            copied ? text.demoCopied : ''
          }}</span>
        </div>
      </div>
      <div
        :id="`${uid}-preview`"
        role="tabpanel"
        :aria-labelledby="`${uid}-preview-tab`"
        :hidden="view !== 'preview'"
        class="fish-demo__panel fish-demo__preview rp-not-doc"
      >
        <component :is="demo.view" />
      </div>
      <div
        :id="`${uid}-code`"
        role="tabpanel"
        :aria-labelledby="`${uid}-code-tab`"
        :hidden="view !== 'code'"
        class="fish-demo__panel fish-demo__source"
      >
        <pre class="fish-demo__code"><code>{{ demo.source }}</code></pre>
      </div>
    </div>
  </section>
</template>
```

`apps/parity-vue/src/components/ApiTable.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'

import { API } from '../data/api'
import type { DocsLang } from '../data/types'
import { uiText } from '../data/ui'

const props = defineProps<{ component: string; lang: DocsLang }>()

const text = computed(() => uiText(props.lang))
const entry = computed(() => API.components[props.component])
const rows = computed(() => (entry.value ? [...entry.value.props, ...entry.value.events] : []))
</script>

<template>
  <div>
    <template v-if="entry">
      <h3>
        {{ entry.name
        }}<template v-if="entry.exportName !== entry.name">
          <code>{{ entry.exportName }}</code></template
        >
      </h3>
      <p v-if="rows.length === 0" class="fish-demo__placeholder">{{ text.apiNone }}</p>
      <table v-else class="fish-api">
        <thead>
          <tr>
            <th>{{ text.apiName }}</th>
            <th>{{ text.apiType }}</th>
            <th>{{ text.apiDefault }}</th>
            <th>{{ text.apiRequired }}</th>
            <th>{{ text.apiDescription }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prop in rows" :key="prop.name">
            <td>
              <code>{{ prop.name }}</code>
            </td>
            <td>
              <code>{{ prop.type }}</code>
            </td>
            <td>
              <code v-if="prop.defaultValue">{{ prop.defaultValue }}</code>
              <template v-else>—</template>
            </td>
            <td>{{ prop.required ? 'yes' : '—' }}</td>
            <td>{{ prop.description || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="entry.slots.length > 0" class="fish-api-note">Slots: {{ entry.slots.join(', ') }}</p>
      <div v-if="entry.unresolved.length > 0" class="fish-api-note">
        <strong>{{ text.apiUnresolved }}</strong>
        <ul>
          <li v-for="note in entry.unresolved" :key="note">{{ note }}</li>
        </ul>
      </div>
    </template>
    <p v-else class="fish-demo__placeholder">Unknown component: {{ component }}</p>
  </div>
</template>
```

`apps/parity-vue/src/pages/ComponentPage.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { provideUILocale, type UILocale } from '@fish-admin/vue'

import ApiTable from '../components/ApiTable.vue'
import DemoBlock from '../components/DemoBlock.vue'
import { COMPONENTS } from '../data/registry'
import { DEMOS } from '../data/demos'
import type { DocsLang } from '../data/types'

const route = useRoute()
const lang = computed<DocsLang>(() => (route.path.startsWith('/zh/') ? 'zh' : 'en'))
const locale = computed<UILocale>(() => (lang.value === 'zh' ? 'zh-CN' : 'en'))
provideUILocale(locale)

const componentEntry = computed(() => COMPONENTS.find((entry) => entry.id === route.params.id))
const demos = computed(() => DEMOS.filter((demo) => demo.componentId === route.params.id))
</script>

<template>
  <main class="fish-page">
    <div class="rp-doc rspress-doc">
      <template v-if="componentEntry">
        <DemoBlock
          v-for="demo in demos"
          :key="demo.id"
          :demo="demo"
          :component-entry="componentEntry"
          :lang="lang"
        />
        <ApiTable :component="String(componentEntry.id)" :lang="lang" />
      </template>
      <p v-else class="fish-demo__placeholder">Unknown component: {{ route.params.id }}</p>
    </div>
  </main>
</template>
```

- [ ] **Step 5: 创建入口、路由与样式**

`apps/parity-vue/src/router.ts`：

```ts
import { createRouter, createWebHistory } from 'vue-router'

import ComponentPage from './pages/ComponentPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/components/accordion' },
    { path: '/components/:id', component: ComponentPage },
    { path: '/zh/components/:id', component: ComponentPage },
  ],
})
```

`apps/parity-vue/src/App.vue`：

```vue
<template>
  <RouterView />
</template>
```

`apps/parity-vue/src/main.ts`：

```ts
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import './styles/index.css'

// The parity helper seeds this key; the docs host reacts to the same storage contract.
if (window.localStorage.getItem('rspress-theme-appearance') === 'dark') {
  document.documentElement.classList.add('dark', 'rp-dark')
}

createApp(App).use(router).mount('#app')
```

`apps/parity-vue/src/styles/index.css`：

```css
@import '@fontsource-variable/inter';
@import '@fish-admin/vue/styles/index.css';
@import 'tailwindcss/preflight.css' layer(base);
@import './demo.css';

@source '../';
@source '../../../packages/vue/src';
```

> `@source '../../../packages/vue/src'` 是必需的：`packages/vue` 通过 workspace 软链进入 `node_modules`，Tailwind 的自动扫描不会读取它。只依赖包内 `styles/index.css` 的 `@source` 会在导入路径解析上产生歧义；应用入口显式指到仓库内的源目录，class 才会进入产物。

`apps/parity-vue/src/styles/demo.css` 由三部分组成：

1. 从 `apps/docs/theme/styles/index.css` 逐字复制 341–600 行（demo 外壳、preview、caption 与 `fish-demo-*` 工具类）。
2. 从同一文件逐字复制 678–706 行（`.fish-api`）。
3. 在文件开头追加页面级规则，在末尾追加重置与代码面板规则：

```css
html {
  font-size: 16px;
  line-height: 1.7;
  color-scheme: light;
}

html.dark {
  color-scheme: dark;
}

body {
  margin: 0;
  min-width: 320px;
  font-family:
    'Inter Variable',
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    sans-serif;
  font-size: 16px;
  color: var(--foreground);
  background: var(--background);
  font-synthesis: style;
  text-rendering: optimizelegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  --rp-c-link: color-mix(in oklch, var(--primary) 80%, black);
  --rp-radius-large: 16px;
  --rp-font-family-mono: Menlo, Monaco, Consolas, 'Courier New', monospace;
}

html.dark body {
  --rp-c-link: color-mix(in oklch, var(--primary) 72%, white);
}

.fish-page,
.rp-doc {
  width: 876px;
  max-width: 100%;
}

.fish-page {
  margin: 0 auto;
}

/* Rspress prose sizes the docs h3; these are the probed computed values for the demo title. */
.fish-demo__title {
  margin: 28px 0 20px;
  font-size: 17.28px;
  line-height: 29.376px;
  font-weight: 600;
  letter-spacing: -0.1728px;
}

.rp-not-doc h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 27.2px;
}

.fish-demo__code {
  margin: 0;
  padding: 16px;
  font-family: var(--rp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
}

@layer utilities {
  :where(body) :where(button, input, select, optgroup, textarea) {
    background-color: transparent;
  }

  :where(.fish-demo__preview) :where(ol, ul, menu) {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  :where(.fish-demo__preview) :where(code, kbd, samp, pre) {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
  }
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 999px;
  background: color-mix(in oklch, var(--foreground) 18%, transparent);
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: color-mix(in oklch, var(--foreground) 30%, transparent);
  background-clip: content-box;
}
```

- [ ] **Step 6: 写 DemoBlock 测试**

`apps/parity-vue/test/demo-block.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import DemoBlock from '../src/components/DemoBlock.vue'
import type { ComponentEntry, DemoEntry } from '../src/data/types'

const Preview = defineComponent({ render: () => h('p', 'Preview body') })

const demo: DemoEntry = {
  id: 'accordion/basic',
  componentId: 'accordion',
  title: { en: 'Basic usage', zh: '基础用法' },
  lines: 42,
  filename: 'demos/accordion/basic.tsx',
  source: "export default { name: 'AccordionBasic' }",
  view: Preview,
}

const componentEntry: ComponentEntry = {
  id: 'accordion',
  name: 'Accordion',
  category: 'primitive',
  status: 'stable',
  since: '0.1.0',
  usedIn: '/projects/$id',
  isNew: false,
}

describe('DemoBlock', () => {
  it('renders the preview, the frozen line count and the source text', () => {
    const wrapper = mount(DemoBlock, {
      props: { demo, componentEntry, lang: 'en' },
    })

    expect(wrapper.find('section[data-demo="accordion/basic"]').exists()).toBe(true)
    expect(wrapper.find('.fish-demo__meta').text()).toBe('TSX · 42 lines')
    expect(wrapper.find('.fish-demo__source').text()).toContain('export default')
    expect(wrapper.find('.fish-demo__preview').text()).toContain('Preview body')
  })

  it('switches between the preview and code panels', async () => {
    const wrapper = mount(DemoBlock, {
      props: { demo, componentEntry, lang: 'en' },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)

    await tabs[1].trigger('click')

    const panels = wrapper.findAll('[role="tabpanel"]')
    expect(panels[0].attributes('hidden')).toBeDefined()
    expect(panels[1].attributes('hidden')).toBeUndefined()
  })
})
```

- [ ] **Step 7: 接入根脚本、typecheck 与 CI**

根 `package.json`：

```json
"test:vue": "pnpm --filter @fish-admin/vue test && pnpm --filter @fish-admin/parity-vue test",
```

`typecheck` 在 `@fish-admin/vue typecheck` 之后插入：

```json
pnpm --filter @fish-admin/parity-vue typecheck &&
```

`.github/workflows/ci.yml` 的 `quality` job，在 “Vue package tests” 之后加入：

```yaml
- name: Vue parity app tests
  run: pnpm --filter @fish-admin/parity-vue test
```

- [ ] **Step 8: 安装并验证**

Run: `pnpm install`

Expected: `apps/parity-vue` 与 `packages/vue` 被链接，lockfile 更新。

Run: `pnpm --filter @fish-admin/parity-vue test`

Expected: PASS，2 个测试通过。

Run: `pnpm typecheck`

Expected: 全部包通过，退出码 0。

Run: `pnpm --filter @fish-admin/parity-vue build`

Expected: `dist/` 生成，无类型错误。

Run: `pnpm lint`

Expected: 通过。

- [ ] **Step 9: 提交**

```bash
git add apps/parity-vue packages/vue/src/i18n.ts packages/vue/src/index.ts package.json .github/workflows/ci.yml pnpm-lock.yaml
git commit -m "feat(parity-vue): scaffold the vue parity app shell and demo surface"
```

---

### Task 4: 基础组件 Button、Input、Label、Switch、Checkbox、Badge、Skeleton

**Files:**

- Create: `packages/vue/src/components/ui/button/{Button.vue,variants.ts,index.ts}`
- Create: `packages/vue/src/components/ui/input/Input.vue`
- Create: `packages/vue/src/components/ui/label/Label.vue`
- Create: `packages/vue/src/components/ui/switch/Switch.vue`
- Create: `packages/vue/src/components/ui/checkbox/Checkbox.vue`
- Create: `packages/vue/src/components/ui/badge/{Badge.vue,variants.ts}`
- Create: `packages/vue/src/components/ui/skeleton/Skeleton.vue`
- Create: `packages/vue/src/components/ui/primitives.test.ts`
- Modify: `packages/vue/src/index.ts`

**Interfaces:**

- Consumes: `cn`、Reka UI 的 `Primitive` / `Label` / `SwitchRoot` / `SwitchThumb` / `CheckboxRoot` / `CheckboxIndicator`、`lucide-vue-next` 的 `CheckIcon`。
- Produces: 带 `data-slot` / `data-variant` / `data-size` 的 Vue 基础组件；`buttonVariants` 供后续任务复用；所有组件的 class 集合与 React 源码一致（顺序可被 Prettier 重排）。

- [ ] **Step 1: 写失败的 primitives 测试**

`packages/vue/src/components/ui/primitives.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Badge from './badge/Badge.vue'
import Button from './button/Button.vue'
import Checkbox from './checkbox/Checkbox.vue'
import Input from './input/Input.vue'
import Label from './label/Label.vue'
import Switch from './switch/Switch.vue'

describe('primitives', () => {
  it('Button exposes its variant metadata and merges classes', () => {
    const wrapper = mount(Button, {
      props: { variant: 'outline', size: 'sm' },
      attrs: { class: 'extra' },
      slots: { default: 'Save' },
    })

    expect(wrapper.attributes('data-slot')).toBe('button')
    expect(wrapper.attributes('data-variant')).toBe('outline')
    expect(wrapper.attributes('data-size')).toBe('sm')
    expect(wrapper.classes()).toContain('extra')
  })

  it('Input emits the native value', async () => {
    const wrapper = mount(Input, { props: { modelValue: 'ada' } })

    await wrapper.get('input').setValue('grace')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['grace'])
  })

  it('Switch emits the next checked state', async () => {
    const wrapper = mount(Switch, { props: { modelValue: false } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('Checkbox emits the next checked state', async () => {
    const wrapper = mount(Checkbox, { props: { modelValue: false } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('Label renders a label element', () => {
    expect(mount(Label, { slots: { default: 'Email' } }).element.tagName).toBe('LABEL')
  })

  it('Badge renders its variant', () => {
    const wrapper = mount(Badge, { props: { variant: 'secondary' }, slots: { default: 'Beta' } })

    expect(wrapper.attributes('data-slot')).toBe('badge')
    expect(wrapper.attributes('data-variant')).toBe('secondary')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @fish-admin/vue test`

Expected: FAIL，无法解析 `./button/Button.vue` 等模块。

- [ ] **Step 3: 实现 Button 与 Badge**

`packages/vue/src/components/ui/button/variants.ts`（cva 配置从 `packages/ui/src/components/ui/button.tsx` 第 6–36 行逐字复制）：

```ts
import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
```

`packages/vue/src/components/ui/button/Button.vue`：

```vue
<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'
import { buttonVariants, type ButtonVariants } from './variants'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    asChild?: boolean
    class?: string
  }>(),
  { variant: 'default', size: 'default', asChild: false },
)

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
)
</script>

<template>
  <Primitive
    as="button"
    :as-child="asChild"
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :class="classes"
  >
    <slot />
  </Primitive>
</template>
```

`packages/vue/src/components/ui/button/index.ts`：

```ts
export { default as Button } from './Button.vue'
export { buttonVariants, type ButtonVariants } from './variants'
```

`packages/vue/src/components/ui/badge/variants.ts`（从 `packages/ui/src/components/ui/badge.tsx` 第 6–25 行逐字复制）：

```ts
import { cva, type VariantProps } from 'class-variance-authority'

export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
```

`packages/vue/src/components/ui/badge/Badge.vue`：

```vue
<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'
import { badgeVariants, type BadgeVariants } from './variants'

const props = withDefaults(
  defineProps<{ variant?: BadgeVariants['variant']; asChild?: boolean; class?: string }>(),
  { variant: 'default', asChild: false },
)

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class))
</script>

<template>
  <Primitive
    as="span"
    :as-child="asChild"
    data-slot="badge"
    :data-variant="variant"
    :class="classes"
  >
    <slot />
  </Primitive>
</template>
```

- [ ] **Step 4: 实现 Input、Label、Switch、Checkbox、Skeleton**

`packages/vue/src/components/ui/input/Input.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = defineProps<{ type?: string; class?: string }>()
const model = defineModel<string>({ default: '' })

const classes = computed(() =>
  cn(
    'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
    props.class,
  ),
)
</script>

<template>
  <input v-model="model" :type="type" data-slot="input" :class="classes" />
</template>
```

`packages/vue/src/components/ui/label/Label.vue`：

```vue
<script setup lang="ts">
import { Label as LabelPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'
</script>

<template>
  <LabelPrimitive
    data-slot="label"
    :class="
      cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      )
    "
  >
    <slot />
  </LabelPrimitive>
</template>
```

`packages/vue/src/components/ui/switch/Switch.vue`：

```vue
<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(defineProps<{ size?: 'sm' | 'default' }>(), { size: 'default' })
const model = defineModel<boolean>({ default: false })

const rootClass = computed(() =>
  cn(
    'peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
  ),
)

const thumbClass = cn(
  'pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=unchecked]:translate-x-0 ltr:data-[state=checked]:translate-x-[calc(100%-2px)] rtl:data-[state=checked]:-translate-x-[calc(100%-2px)] dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground',
)
</script>

<template>
  <SwitchRoot v-model="model" data-slot="switch" :data-size="props.size" :class="rootClass">
    <SwitchThumb data-slot="switch-thumb" :class="thumbClass" />
  </SwitchRoot>
</template>
```

`packages/vue/src/components/ui/checkbox/Checkbox.vue`：

```vue
<script setup lang="ts">
import { CheckIcon } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const model = defineModel<boolean | 'indeterminate'>({ default: false })

const classes = computed(() =>
  cn(
    'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary',
  ),
)
</script>

<template>
  <CheckboxRoot v-model="model" data-slot="checkbox" :class="classes">
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="grid place-content-center text-current transition-none"
    >
      <CheckIcon class="size-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
```

`packages/vue/src/components/ui/skeleton/Skeleton.vue`：

```vue
<script setup lang="ts">
import { cn } from '../../../lib/utils'
</script>

<template>
  <div data-slot="skeleton" aria-hidden="true" :class="cn('animate-pulse rounded-md bg-accent')" />
</template>
```

- [ ] **Step 5: 导出并运行测试**

`packages/vue/src/index.ts` 追加：

```ts
export { Button, buttonVariants, type ButtonVariants } from './components/ui/button'
export { Input } from './components/ui/input/Input.vue'
export { Label } from './components/ui/label/Label.vue'
export { Switch } from './components/ui/switch/Switch.vue'
export { Checkbox } from './components/ui/checkbox/Checkbox.vue'
export { Badge } from './components/ui/badge/Badge.vue'
export { Skeleton } from './components/ui/skeleton/Skeleton.vue'
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，8 个测试通过（`cn` 2 + primitives 6）。

Run: `pnpm --filter @fish-admin/vue typecheck`

Expected: 通过。

Run: `pnpm lint`

Expected: 通过。

- [ ] **Step 6: 提交**

```bash
git add packages/vue/src/components/ui packages/vue/src/index.ts
git commit -m "feat(vue): port the base ui primitives"
```

---

### Task 5: Accordion 包装层与两个 demo

**Files:**

- Create: `packages/vue/src/components/ui/accordion/{Accordion,AccordionHeader,AccordionItem,AccordionTrigger,AccordionContent}.vue`
- Create: `packages/vue/src/components/ui/accordion/accordion.test.ts`
- Create: `apps/parity-vue/src/demos/accordion/{basic,controlled}.vue`
- Create: `apps/parity-vue/test/demos.test.ts`
- Modify: `packages/vue/src/index.ts`
- Modify: `apps/parity-vue/src/data/demos.ts`

**Interfaces:**

- Consumes: Task 4 的 `Button`；Reka UI 的 `AccordionRoot`、`AccordionItem`、`AccordionHeader`、`AccordionTrigger`、`AccordionContent`；`lucide-vue-next` 的 `ChevronDownIcon`。
- Produces: `Accordion`（`type`、`collapsible`、`defaultValue`、`modelValue` / `update:modelValue`、`orientation`、`disabled`）、`AccordionHeader`、`AccordionItem`、`AccordionTrigger`、`AccordionContent`；`DEMOS` 中的 `accordion/basic`（42 行）与 `accordion/controlled`（69 行）。

- [ ] **Step 1: 实现 Accordion 包装层**

`packages/vue/src/components/ui/accordion/Accordion.vue`：

```vue
<script setup lang="ts">
import { AccordionRoot } from 'reka-ui'

withDefaults(
  defineProps<{
    type?: 'single' | 'multiple'
    collapsible?: boolean
    modelValue?: string | string[]
    defaultValue?: string | string[]
    orientation?: 'vertical' | 'horizontal'
    disabled?: boolean
  }>(),
  { type: 'single', collapsible: false, orientation: 'vertical', disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | undefined]
}>()
</script>

<template>
  <AccordionRoot
    data-slot="accordion"
    :type="type"
    :collapsible="collapsible"
    :model-value="modelValue"
    :default-value="defaultValue"
    :orientation="orientation"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </AccordionRoot>
</template>
```

`packages/vue/src/components/ui/accordion/AccordionHeader.vue`：

```vue
<script setup lang="ts">
import { AccordionHeader as AccordionHeaderPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <AccordionHeaderPrimitive :class="cn('flex', props.class)">
    <slot />
  </AccordionHeaderPrimitive>
</template>
```

`packages/vue/src/components/ui/accordion/AccordionItem.vue`：

```vue
<script setup lang="ts">
import { AccordionItem as AccordionItemPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ value: string; disabled?: boolean; class?: string }>()
</script>

<template>
  <AccordionItemPrimitive
    data-slot="accordion-item"
    :value="value"
    :disabled="disabled"
    :class="cn('border-b last:border-b-0', props.class)"
  >
    <slot />
  </AccordionItemPrimitive>
</template>
```

`packages/vue/src/components/ui/accordion/AccordionTrigger.vue`：

```vue
<script setup lang="ts">
import { ChevronDownIcon } from 'lucide-vue-next'
import { AccordionTrigger as AccordionTriggerPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

import AccordionHeader from './AccordionHeader.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ disabled?: boolean; class?: string }>()
</script>

<template>
  <AccordionHeader>
    <AccordionTriggerPrimitive
      v-bind="$attrs"
      data-slot="accordion-trigger"
      :disabled="disabled"
      :class="
        cn(
          'flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-start text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none! [&[data-state=open]>svg]:rotate-180',
          props.class,
        )
      "
    >
      <slot />
      <ChevronDownIcon
        class="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-(--motion-duration-base) ease-(--motion-ease-standard) motion-reduce:transition-none!"
      />
    </AccordionTriggerPrimitive>
  </AccordionHeader>
</template>
```

`packages/vue/src/components/ui/accordion/AccordionContent.vue`：

```vue
<script setup lang="ts">
import { AccordionContent as AccordionContentPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <AccordionContentPrimitive
    data-slot="accordion-content"
    class="overflow-hidden text-sm duration-(--motion-duration-base) ease-(--motion-ease-standard) data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none!"
  >
    <div :class="cn('pt-0 pb-4', props.class)">
      <slot />
    </div>
  </AccordionContentPrimitive>
</template>
```

- [ ] **Step 2: 写 Accordion 测试**

`packages/vue/src/components/ui/accordion/accordion.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import Accordion from './Accordion.vue'
import AccordionContent from './AccordionContent.vue'
import AccordionItem from './AccordionItem.vue'
import AccordionTrigger from './AccordionTrigger.vue'

function mountAccordion() {
  return mount(Accordion, {
    props: { type: 'single', collapsible: true, defaultValue: 'billing' },
    slots: {
      default: () => [
        h(
          AccordionItem,
          { value: 'billing' },
          {
            default: () => [
              h(AccordionTrigger, null, { default: () => 'Billing' }),
              h(AccordionContent, null, { default: () => 'Billing answer' }),
            ],
          },
        ),
        h(
          AccordionItem,
          { value: 'security' },
          {
            default: () => [
              h(AccordionTrigger, null, { default: () => 'Security' }),
              h(AccordionContent, null, { default: () => 'Security answer' }),
            ],
          },
        ),
      ],
    },
  })
}

describe('Accordion', () => {
  it('opens the default panel and moves the open state on click', async () => {
    const wrapper = mountAccordion()
    await nextTick()

    const triggers = wrapper.findAll('[data-slot="accordion-trigger"]')
    expect(triggers).toHaveLength(2)
    expect(triggers[0].attributes('data-state')).toBe('open')
    expect(wrapper.text()).toContain('Billing answer')

    await triggers[1].trigger('click')
    await nextTick()

    const nextTriggers = wrapper.findAll('[data-slot="accordion-trigger"]')
    expect(nextTriggers[1].attributes('data-state')).toBe('open')
    expect(nextTriggers[0].attributes('data-state')).toBe('closed')
    expect(wrapper.text()).toContain('Security answer')
    expect(wrapper.text()).not.toContain('Billing answer')
  })

  it('wraps every trigger in an h3 header', () => {
    const wrapper = mountAccordion()
    expect(wrapper.findAll('h3')).toHaveLength(2)
  })
})
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: FAIL，`Failed to resolve import "./Accordion.vue"`（组件尚不存在）。

- [ ] **Step 3: 创建两个 demo**

`apps/parity-vue/src/demos/accordion/basic.vue`：

```vue
<script lang="ts">
export default { name: 'AccordionBasic' }
</script>

<script setup lang="ts">
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@fish-admin/vue'

const PANEL_STYLE = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  padding: '0 1rem',
}
</script>

<template>
  <div class="fish-demo-stack fish-demo-stack--wide">
    <Accordion type="single" collapsible default-value="billing" :style="PANEL_STYLE">
      <AccordionItem value="billing">
        <AccordionTrigger>How does per-seat billing work?</AccordionTrigger>
        <AccordionContent>
          You are billed for active members at the end of each monthly cycle. Invited members are
          counted once they accept.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger>Where is workspace data stored?</AccordionTrigger>
        <AccordionContent>
          Data stays in the region selected at creation time, and audit exports follow the same
          retention policy.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="sso">
        <AccordionTrigger>Can owners enforce SSO for everyone?</AccordionTrigger>
        <AccordionContent>
          Yes. Owners can require single sign-on under Security, which disables password sign-in
          workspace-wide.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    <p class="fish-demo-muted">
      Single mode with <code>collapsible</code> lets you close the open panel; opening another
      question replaces it.
    </p>
  </div>
</template>
```

`apps/parity-vue/src/demos/accordion/controlled.vue`：

```vue
<script lang="ts">
export default { name: 'AccordionControlled' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from '@fish-admin/vue'

const PANEL_STYLE = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  padding: '0 1rem',
}

const QUESTIONS = {
  notifications: 'Which notifications can members mute?',
  audit: 'How long are audit entries retained?',
  scim: 'Does SCIM provisioning remove deprovisioned members?',
}

const openItems = ref<string[]>(['notifications', 'audit'])
</script>

<template>
  <div class="fish-demo-stack fish-demo-stack--wide">
    <Accordion v-model="openItems" type="multiple" :style="PANEL_STYLE">
      <AccordionItem value="notifications">
        <AccordionTrigger>{{ QUESTIONS.notifications }}</AccordionTrigger>
        <AccordionContent>
          Members can mute release, comment and mention notifications per workspace; billing and
          security notices always stay on.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="audit">
        <AccordionTrigger>{{ QUESTIONS.audit }}</AccordionTrigger>
        <AccordionContent>
          Audit entries are kept for 18 months on Team and 36 months on Enterprise; exports use the
          same window.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="scim">
        <AccordionTrigger>{{ QUESTIONS.scim }}</AccordionTrigger>
        <AccordionContent>
          Yes. Once a member is deprovisioned in the identity provider, the next SCIM sync suspends
          the account and transfers owned projects to the workspace.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    <div class="fish-demo-row">
      <span class="fish-demo-muted" aria-live="polite">
        {{
          openItems.length === 0
            ? 'All panels are closed.'
            : `${openItems.length} of 3 panels open.`
        }}
      </span>
      <Button
        variant="outline"
        size="sm"
        :disabled="openItems.length === 0"
        @click="openItems = []"
      >
        Collapse all
      </Button>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 注册 demo 并导出组件**

`apps/parity-vue/src/data/demos.ts` 改为：

```ts
import type { DemoEntry } from './types'

import AccordionBasic from '../demos/accordion/basic.vue'
import accordionBasicSource from '../demos/accordion/basic.vue?raw'
import AccordionControlled from '../demos/accordion/controlled.vue'
import accordionControlledSource from '../demos/accordion/controlled.vue?raw'

export const DEMOS: DemoEntry[] = [
  {
    id: 'accordion/basic',
    componentId: 'accordion',
    title: { en: 'Basic usage', zh: '基础用法' },
    lines: 42,
    filename: 'demos/accordion/basic.tsx',
    source: accordionBasicSource,
    view: AccordionBasic,
  },
  {
    id: 'accordion/controlled',
    componentId: 'accordion',
    title: { en: 'Controlled with multiple open panels', zh: '受控与多项展开' },
    lines: 69,
    filename: 'demos/accordion/controlled.tsx',
    source: accordionControlledSource,
    view: AccordionControlled,
  },
]
```

`apps/parity-vue/test/demos.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import { DEMOS } from '../src/data/demos'

describe('demo registry', () => {
  it('keeps every demo well formed', () => {
    for (const demo of DEMOS) {
      expect(demo.id.startsWith(`${demo.componentId}/`)).toBe(true)
      expect(demo.title.en.length).toBeGreaterThan(0)
      expect(demo.title.zh.length).toBeGreaterThan(0)
      expect(demo.lines).toBeGreaterThan(0)
      expect(demo.filename.endsWith('.tsx')).toBe(true)
      expect(demo.source).toContain('export default')
      expect(demo.view).toBeTruthy()
    }
  })

  it('keeps demo ids unique', () => {
    const ids = DEMOS.map((demo) => demo.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

`packages/vue/src/index.ts` 追加：

```ts
export { default as Accordion } from './components/ui/accordion/Accordion.vue'
export { default as AccordionHeader } from './components/ui/accordion/AccordionHeader.vue'
export { default as AccordionItem } from './components/ui/accordion/AccordionItem.vue'
export { default as AccordionTrigger } from './components/ui/accordion/AccordionTrigger.vue'
export { default as AccordionContent } from './components/ui/accordion/AccordionContent.vue'
```

- [ ] **Step 5: 验证**

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，10 个测试通过（`cn` 2 + primitives 6 + accordion 2）。

Run: `pnpm --filter @fish-admin/parity-vue test`

Expected: PASS，4 个测试通过（DemoBlock 2 + demo registry 2）。

Run: `pnpm typecheck`

Expected: 通过。

Run: `pnpm lint`

Expected: 通过。

Run: `pnpm exec prettier --check packages/vue/src/components/ui/accordion apps/parity-vue/src/demos/accordion apps/parity-vue/src/data/demos.ts apps/parity-vue/test/demos.test.ts packages/vue/src/index.ts`

Expected: 通过。

- [ ] **Step 6: 提交**

```bash
git add packages/vue/src/components/ui/accordion packages/vue/src/index.ts apps/parity-vue/src/demos/accordion apps/parity-vue/src/data/demos.ts apps/parity-vue/test/demos.test.ts
git commit -m "feat(vue): port accordion and its two demos"
```

---

### Task 6: Tabs 包装层与两个 demo

**Files:**

- Create: `packages/vue/src/components/ui/tabs/{Tabs,TabsList,TabsTrigger,TabsContent}.vue`
- Create: `packages/vue/src/components/ui/tabs/tabs.test.ts`
- Create: `apps/parity-vue/src/demos/tabs/{basic,vertical}.vue`
- Modify: `packages/vue/src/index.ts`
- Modify: `apps/parity-vue/src/data/demos.ts`

**Interfaces:**

- Consumes: Task 4 的 `Button`、`Input`、`Label`、`Switch`；Reka UI 的 `TabsRoot`、`TabsList`、`TabsTrigger`、`TabsContent`。
- Produces: `Tabs`（`modelValue` / `update:modelValue`、`defaultValue`、`orientation`、`activationMode`、`disabled`）、`TabsList`（`variant: 'default' | 'line'`）、`TabsTrigger`、`TabsContent`；`DEMOS` 中的 `tabs/basic`（108 行）与 `tabs/vertical`（57 行）。

- [ ] **Step 1: 实现 Tabs 包装层**

`packages/vue/src/components/ui/tabs/Tabs.vue`：

```vue
<script setup lang="ts">
import { TabsRoot } from 'reka-ui'

import { cn } from '../../../lib/utils'

withDefaults(
  defineProps<{
    modelValue?: string
    defaultValue?: string
    orientation?: 'horizontal' | 'vertical'
    activationMode?: 'automatic' | 'manual'
    disabled?: boolean
  }>(),
  { orientation: 'horizontal' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <TabsRoot
    data-slot="tabs"
    :data-orientation="orientation"
    :orientation="orientation"
    :model-value="modelValue"
    :default-value="defaultValue"
    :activation-mode="activationMode"
    :disabled="disabled"
    :class="cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </TabsRoot>
</template>
```

`packages/vue/src/components/ui/tabs/TabsList.vue`：

```vue
<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { TabsList as TabsListPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type TabsListVariants = VariantProps<typeof tabsListVariants>

const props = withDefaults(
  defineProps<{ variant?: TabsListVariants['variant']; class?: string }>(),
  { variant: 'default' },
)
</script>

<template>
  <TabsListPrimitive
    data-slot="tabs-list"
    :data-variant="variant"
    :class="cn(tabsListVariants({ variant }), props.class)"
  >
    <slot />
  </TabsListPrimitive>
</template>
```

`packages/vue/src/components/ui/tabs/TabsTrigger.vue`：

```vue
<script setup lang="ts">
import { TabsTrigger as TabsTriggerPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ value: string; disabled?: boolean; class?: string }>()
</script>

<template>
  <TabsTriggerPrimitive
    v-bind="$attrs"
    data-slot="tabs-trigger"
    :value="value"
    :disabled="disabled"
    :class="
      cn(
        'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
        'data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground',
        'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-end-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        props.class,
      )
    "
  >
    <slot />
  </TabsTriggerPrimitive>
</template>
```

`packages/vue/src/components/ui/tabs/TabsContent.vue`：

```vue
<script setup lang="ts">
import { TabsContent as TabsContentPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ value: string; class?: string }>()
</script>

<template>
  <TabsContentPrimitive
    v-bind="$attrs"
    data-slot="tabs-content"
    :value="value"
    :class="cn('flex-1 outline-none', props.class)"
  >
    <slot />
  </TabsContentPrimitive>
</template>
```

- [ ] **Step 2: 写 Tabs 测试**

`packages/vue/src/components/ui/tabs/tabs.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import Tabs from './Tabs.vue'
import TabsContent from './TabsContent.vue'
import TabsList from './TabsList.vue'
import TabsTrigger from './TabsTrigger.vue'

function mountTabs(orientation: 'horizontal' | 'vertical' = 'horizontal') {
  return mount(Tabs, {
    props: { defaultValue: 'profile', orientation },
    slots: {
      default: () => [
        h(TabsList, null, {
          default: () => [
            h(TabsTrigger, { value: 'profile' }, { default: () => 'Profile' }),
            h(TabsTrigger, { value: 'notifications' }, { default: () => 'Notifications' }),
          ],
        }),
        h(TabsContent, { value: 'profile' }, { default: () => 'Profile panel' }),
        h(TabsContent, { value: 'notifications' }, { default: () => 'Notifications panel' }),
      ],
    },
  })
}

describe('Tabs', () => {
  it('activates the default tab and switches on click', async () => {
    const wrapper = mountTabs()
    await nextTick()

    const triggers = wrapper.findAll('[role="tab"]')
    expect(triggers).toHaveLength(2)
    expect(triggers[0].attributes('data-state')).toBe('active')
    expect(triggers[0].attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('Profile panel')

    await triggers[1].trigger('click')
    await nextTick()

    const nextTriggers = wrapper.findAll('[role="tab"]')
    expect(nextTriggers[1].attributes('data-state')).toBe('active')
    expect(nextTriggers[1].attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('Notifications panel')
  })

  it('exposes the vertical orientation', () => {
    const wrapper = mountTabs('vertical')
    expect(wrapper.attributes('data-orientation')).toBe('vertical')
  })
})
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: FAIL，`Failed to resolve import "./Tabs.vue"`。

- [ ] **Step 3: 创建两个 demo**

`apps/parity-vue/src/demos/tabs/basic.vue`：

```vue
<script lang="ts">
export default { name: 'TabsBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import {
  Button,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@fish-admin/vue'

const PANEL_STYLE = { paddingTop: '0.75rem', minHeight: '8.5rem' }

const tab = ref('profile')
const name = ref('Katherine Johnson')
const savedName = ref('Katherine Johnson')
const productUpdates = ref(true)
const twoFactor = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <Tabs v-model="tab">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" :style="PANEL_STYLE">
        <div style="display: grid; gap: 0.75rem">
          <div style="display: grid; gap: 0.375rem">
            <Label for="demo-tabs-display-name">Display name</Label>
            <Input id="demo-tabs-display-name" v-model="name" />
          </div>
          <div class="fish-demo-row">
            <Button size="sm" :disabled="!name.trim()" @click="savedName = name.trim()">
              Save profile
            </Button>
            <span class="fish-demo-muted" aria-live="polite">Shown as {{ savedName }}</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="notifications" :style="PANEL_STYLE">
        <div style="display: grid; gap: 0.75rem">
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.75rem;
            "
          >
            <div>
              <Label for="demo-tabs-product-updates">Product updates</Label>
              <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
                Release notes about once a month.
              </p>
            </div>
            <Switch id="demo-tabs-product-updates" v-model="productUpdates" />
          </div>
          <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
            {{
              productUpdates ? 'Product update emails are on.' : 'Product update emails are off.'
            }}
          </p>
        </div>
      </TabsContent>
      <TabsContent value="security" :style="PANEL_STYLE">
        <div style="display: grid; gap: 0.75rem">
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.75rem;
            "
          >
            <div>
              <Label for="demo-tabs-two-factor">Two-factor authentication</Label>
              <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
                Required for workspace owners.
              </p>
            </div>
            <Switch id="demo-tabs-two-factor" v-model="twoFactor" />
          </div>
          <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
            {{
              twoFactor ? 'Two-factor authentication is on.' : 'Two-factor authentication is off.'
            }}
          </p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
```

`apps/parity-vue/src/demos/tabs/vertical.vue`：

```vue
<script lang="ts">
export default { name: 'TabsVertical' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@fish-admin/vue'

const PANEL_STYLE = {
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  padding: '0.75rem',
  fontSize: '0.875rem',
  minHeight: '6.5rem',
}

const isOwner = ref(false)
const tab = ref('general')

function handleOwnerChange(next: boolean) {
  isOwner.value = next
  if (!next && tab.value === 'billing') tab.value = 'general'
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Switch id="demo-tabs-owner" :model-value="isOwner" @update:model-value="handleOwnerChange" />
      <Label for="demo-tabs-owner">View as workspace owner</Label>
    </div>
    <Tabs v-model="tab" orientation="vertical">
      <TabsList variant="line">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="billing" :disabled="!isOwner">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="general" :style="PANEL_STYLE">
        <p style="margin: 0">Workspace name: Acme Design</p>
        <p class="fish-demo-muted" style="margin: 0.375rem 0 0">Region eu-central-1 · Plan Team</p>
      </TabsContent>
      <TabsContent value="members" :style="PANEL_STYLE">
        <p style="margin: 0">5 members, 2 invitations pending.</p>
        <p class="fish-demo-muted" style="margin: 0.375rem 0 0">
          Owners can invite or remove members.
        </p>
      </TabsContent>
      <TabsContent value="billing" :style="PANEL_STYLE">
        <p style="margin: 0">Card ending 4242 · renews 2026-11-01</p>
      </TabsContent>
    </Tabs>
    <p class="fish-demo-muted" aria-live="polite">
      {{ isOwner ? 'Owner view: billing is enabled.' : 'Viewer view: billing stays disabled.' }}
    </p>
  </div>
</template>
```

- [ ] **Step 4: 注册 demo 并导出组件**

在 `apps/parity-vue/src/data/demos.ts` 的 import 区追加：

```ts
import TabsBasic from '../demos/tabs/basic.vue'
import tabsBasicSource from '../demos/tabs/basic.vue?raw'
import TabsVertical from '../demos/tabs/vertical.vue'
import tabsVerticalSource from '../demos/tabs/vertical.vue?raw'
```

在 `DEMOS` 数组末尾追加：

```ts
  {
    id: 'tabs/basic',
    componentId: 'tabs',
    title: { en: 'Basic usage', zh: '基础用法' },
    lines: 108,
    filename: 'demos/tabs/basic.tsx',
    source: tabsBasicSource,
    view: TabsBasic,
  },
  {
    id: 'tabs/vertical',
    componentId: 'tabs',
    title: { en: 'Vertical with a disabled tab', zh: '垂直布局与禁用标签' },
    lines: 57,
    filename: 'demos/tabs/vertical.tsx',
    source: tabsVerticalSource,
    view: TabsVertical,
  },
```

`packages/vue/src/index.ts` 追加：

```ts
export { default as Tabs } from './components/ui/tabs/Tabs.vue'
export { default as TabsList } from './components/ui/tabs/TabsList.vue'
export { default as TabsTrigger } from './components/ui/tabs/TabsTrigger.vue'
export { default as TabsContent } from './components/ui/tabs/TabsContent.vue'
```

- [ ] **Step 5: 验证**

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，12 个测试通过（`cn` 2 + primitives 6 + accordion 2 + tabs 2）。

Run: `pnpm --filter @fish-admin/parity-vue test`

Expected: PASS，4 个测试通过。

Run: `pnpm typecheck`

Expected: 通过。

Run: `pnpm lint`

Expected: 通过。

Run: `pnpm exec prettier --check packages/vue/src/components/ui/tabs apps/parity-vue/src/demos/tabs apps/parity-vue/src/data/demos.ts packages/vue/src/index.ts`

Expected: 通过。

- [ ] **Step 6: 提交**

```bash
git add packages/vue/src/components/ui/tabs packages/vue/src/index.ts apps/parity-vue/src/demos/tabs apps/parity-vue/src/data/demos.ts
git commit -m "feat(vue): port tabs and its two demos"
```

---

### Task 7: Select 包装层与两个 demo

**Files:**

- Create: `packages/vue/src/components/ui/select/{Select,SelectGroup,SelectValue,SelectTrigger,SelectContent,SelectLabel,SelectItem,SelectSeparator,SelectScrollUpButton,SelectScrollDownButton}.vue`
- Create: `packages/vue/src/components/ui/select/select.test.ts`
- Create: `apps/parity-vue/src/demos/select/{basic,groups}.vue`
- Modify: `packages/vue/src/index.ts`
- Modify: `apps/parity-vue/src/data/demos.ts`

**Interfaces:**

- Consumes: Reka UI 的 `SelectRoot`、`SelectGroup`、`SelectTrigger`、`SelectIcon`、`SelectPortal`、`SelectContent`、`SelectViewport`、`SelectLabel`、`SelectItem`、`SelectItemText`、`SelectItemIndicator`、`SelectSeparator`、`SelectScrollUpButton`、`SelectScrollDownButton`；`lucide-vue-next` 的 `CheckIcon`、`ChevronDownIcon`、`ChevronUpIcon`。
- Produces: `Select`（`modelValue` / `update:modelValue`、`defaultValue`、`disabled`）、`SelectValue`（显式 `label`、`placeholder`）、`SelectTrigger`（`size`）、`SelectContent`（`position`、`align`）、`SelectItem`、`SelectGroup`、`SelectLabel`、`SelectSeparator`、两个滚动按钮；`DEMOS` 中的 `select/basic`（45 行）与 `select/groups`（74 行）。

- [ ] **Step 1: 实现 Select 包装层**

`packages/vue/src/components/ui/select/Select.vue`：

```vue
<script setup lang="ts">
import { SelectRoot } from 'reka-ui'

defineProps<{
  modelValue?: string
  defaultValue?: string
  disabled?: boolean
  name?: string
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onValueChange(value: unknown) {
  emit('update:modelValue', String(value))
}
</script>

<template>
  <SelectRoot
    data-slot="select"
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="disabled"
    :name="name"
    :required="required"
    @update:model-value="onValueChange"
  >
    <slot />
  </SelectRoot>
</template>
```

`packages/vue/src/components/ui/select/SelectGroup.vue`：

```vue
<script setup lang="ts">
import { SelectGroup as SelectGroupPrimitive } from 'reka-ui'
</script>

<template>
  <SelectGroupPrimitive data-slot="select-group">
    <slot />
  </SelectGroupPrimitive>
</template>
```

`packages/vue/src/components/ui/select/SelectValue.vue`：

```vue
<script setup lang="ts">
defineProps<{ label?: string; placeholder?: string }>()
</script>

<template>
  <span data-slot="select-value">{{ label ?? placeholder }}</span>
</template>
```

`packages/vue/src/components/ui/select/SelectTrigger.vue`：

```vue
<script setup lang="ts">
import { ChevronDownIcon } from 'lucide-vue-next'
import { SelectIcon, SelectTrigger as SelectTriggerPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{ size?: 'sm' | 'default'; disabled?: boolean; class?: string }>(),
  { size: 'default' },
)

const classes = computed(() =>
  cn(
    "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
    props.class,
  ),
)
</script>

<template>
  <SelectTriggerPrimitive
    v-bind="$attrs"
    data-slot="select-trigger"
    :data-size="size"
    :disabled="disabled"
    :class="classes"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDownIcon class="size-4 opacity-50" />
    </SelectIcon>
  </SelectTriggerPrimitive>
</template>
```

`packages/vue/src/components/ui/select/SelectContent.vue`：

```vue
<script setup lang="ts">
import { SelectContent as SelectContentPrimitive, SelectPortal, SelectViewport } from 'reka-ui'

import { cn } from '../../../lib/utils'

import SelectScrollDownButton from './SelectScrollDownButton.vue'
import SelectScrollUpButton from './SelectScrollUpButton.vue'

const props = withDefaults(
  defineProps<{
    position?: 'item-aligned' | 'popper'
    align?: 'start' | 'center' | 'end'
    class?: string
  }>(),
  { position: 'item-aligned', align: 'center' },
)

const base = cn(
  'relative z-50 max-h-(--reka-select-content-available-height) min-w-[8rem] origin-(--reka-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
  props.position === 'popper' &&
    'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
  props.class,
)
</script>

<template>
  <SelectPortal>
    <SelectContentPrimitive
      data-slot="select-content"
      :position="position"
      :align="align"
      :class="base"
    >
      <SelectScrollUpButton />
      <SelectViewport
        :class="
          cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--reka-select-trigger-height)] w-full min-w-[var(--reka-select-trigger-width)] scroll-my-1',
          )
        "
      >
        <slot />
      </SelectViewport>
      <SelectScrollDownButton />
    </SelectContentPrimitive>
  </SelectPortal>
</template>
```

`packages/vue/src/components/ui/select/SelectLabel.vue`：

```vue
<script setup lang="ts">
import { SelectLabel as SelectLabelPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <SelectLabelPrimitive
    data-slot="select-label"
    :class="cn('px-2 py-1.5 text-xs text-muted-foreground', props.class)"
  >
    <slot />
  </SelectLabelPrimitive>
</template>
```

`packages/vue/src/components/ui/select/SelectItem.vue`：

```vue
<script setup lang="ts">
import { CheckIcon } from 'lucide-vue-next'
import {
  SelectItem as SelectItemPrimitive,
  SelectItemIndicator,
  SelectItemText,
} from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ value: string; disabled?: boolean; class?: string }>()
</script>

<template>
  <SelectItemPrimitive
    data-slot="select-item"
    :value="value"
    :disabled="disabled"
    :class="
      cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        props.class,
      )
    "
  >
    <span
      data-slot="select-item-indicator"
      class="absolute end-2 flex size-3.5 items-center justify-center"
    >
      <SelectItemIndicator>
        <CheckIcon class="size-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItemPrimitive>
</template>
```

`packages/vue/src/components/ui/select/SelectSeparator.vue`：

```vue
<script setup lang="ts">
import { SelectSeparator as SelectSeparatorPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <SelectSeparatorPrimitive
    data-slot="select-separator"
    :class="cn('pointer-events-none -mx-1 my-1 h-px bg-border', props.class)"
  />
</template>
```

`packages/vue/src/components/ui/select/SelectScrollUpButton.vue`：

```vue
<script setup lang="ts">
import { ChevronUpIcon } from 'lucide-vue-next'
import { SelectScrollUpButton as SelectScrollUpButtonPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <SelectScrollUpButtonPrimitive
    data-slot="select-scroll-up-button"
    :class="cn('flex cursor-default items-center justify-center py-1', props.class)"
  >
    <ChevronUpIcon class="size-4" />
  </SelectScrollUpButtonPrimitive>
</template>
```

`packages/vue/src/components/ui/select/SelectScrollDownButton.vue`：

```vue
<script setup lang="ts">
import { ChevronDownIcon } from 'lucide-vue-next'
import { SelectScrollDownButton as SelectScrollDownButtonPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <SelectScrollDownButtonPrimitive
    data-slot="select-scroll-down-button"
    :class="cn('flex cursor-default items-center justify-center py-1', props.class)"
  >
    <ChevronDownIcon class="size-4" />
  </SelectScrollDownButtonPrimitive>
</template>
```

- [ ] **Step 2: 写 Select 测试**

`packages/vue/src/components/ui/select/select.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import Select from './Select.vue'
import SelectTrigger from './SelectTrigger.vue'
import SelectValue from './SelectValue.vue'

describe('Select', () => {
  it('renders an explicit label without mounting the listbox', () => {
    const wrapper = mount(SelectValue, { props: { label: 'Admin' } })

    expect(wrapper.attributes('data-slot')).toBe('select-value')
    expect(wrapper.text()).toBe('Admin')
  })

  it('falls back to the placeholder', () => {
    const wrapper = mount(SelectValue, { props: { placeholder: 'Choose a role' } })

    expect(wrapper.text()).toBe('Choose a role')
  })

  it('renders the trigger as a combobox with its data-size and label', () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'admin' },
      slots: {
        default: () =>
          h(
            SelectTrigger,
            { 'aria-label': 'Assign role' },
            { default: () => h(SelectValue, { label: 'Admin' }) },
          ),
      },
    })

    const trigger = wrapper.get('[role="combobox"]')
    expect(trigger.attributes('data-size')).toBe('default')
    expect(trigger.text()).toContain('Admin')
  })
})
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: FAIL，`Failed to resolve import "./Select.vue"`。

- [ ] **Step 3: 创建两个 demo**

`apps/parity-vue/src/demos/select/basic.vue`：

```vue
<script lang="ts">
export default { name: 'SelectBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'

const ROLES = [
  { value: 'owner', label: 'Owner', scope: 'Full access, including billing.' },
  { value: 'admin', label: 'Admin', scope: 'Manage members, projects and integrations.' },
  { value: 'member', label: 'Member', scope: 'Work on projects, no workspace settings.' },
  { value: 'viewer', label: 'Viewer', scope: 'Read-only access to shared projects.' },
]

const role = ref('admin')
const current = computed(() => ROLES.find((option) => option.value === role.value))
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-select-role">Assign role</Label>
      <Select v-model="role">
        <SelectTrigger id="demo-select-role" class="fish-demo-w-72">
          <SelectValue :label="current?.label" placeholder="Choose a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in ROLES" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{ current ? `${current.label}: ${current.scope}` : 'No role selected.' }}
    </p>
  </div>
</template>
```

`apps/parity-vue/src/demos/select/groups.vue`：

```vue
<script lang="ts">
export default { name: 'SelectGroups' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'

const PERMISSION_LABELS: Record<string, string> = {
  none: 'No access',
  read: 'Can view',
  write: 'Can edit',
  manage: 'Can manage',
}

const permission = ref('write')
const permissionLabel = computed(() => PERMISSION_LABELS[permission.value] ?? permission.value)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-select-groups-permission">Default permission</Label>
      <Select v-model="permission">
        <SelectTrigger id="demo-select-groups-permission" class="fish-demo-w-72">
          <SelectValue :label="permissionLabel" placeholder="Choose a permission" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Inherited from the folder</SelectLabel>
            <SelectItem value="none">No access</SelectItem>
            <SelectItem value="read">Can view</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Set explicitly</SelectLabel>
            <SelectItem value="write">Can edit</SelectItem>
            <SelectItem value="manage">Can manage</SelectItem>
            <SelectItem value="audit" disabled>Audit export — Enterprise only</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      New members get “{{ permissionLabel }}” unless a folder overrides it.
    </p>

    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-select-groups-locked" style="opacity: 0.5">Team default</Label>
      <Select model-value="team-default" disabled>
        <SelectTrigger id="demo-select-groups-locked" class="fish-demo-w-72">
          <SelectValue label="Team default" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="team-default">Team default</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <p class="fish-demo-muted">
      The disabled select mirrors a value set by the team owner; there is nothing to change here.
    </p>
  </div>
</template>
```

- [ ] **Step 4: 注册 demo 并导出组件**

在 `apps/parity-vue/src/data/demos.ts` 的 import 区追加：

```ts
import SelectBasic from '../demos/select/basic.vue'
import selectBasicSource from '../demos/select/basic.vue?raw'
import SelectGroups from '../demos/select/groups.vue'
import selectGroupsSource from '../demos/select/groups.vue?raw'
```

在 `DEMOS` 数组末尾追加：

```ts
  {
    id: 'select/basic',
    componentId: 'select',
    title: { en: 'Basic usage', zh: '基础用法' },
    lines: 45,
    filename: 'demos/select/basic.tsx',
    source: selectBasicSource,
    view: SelectBasic,
  },
  {
    id: 'select/groups',
    componentId: 'select',
    title: { en: 'Groups and disabled options', zh: '分组与禁用选项' },
    lines: 74,
    filename: 'demos/select/groups.tsx',
    source: selectGroupsSource,
    view: SelectGroups,
  },
```

`packages/vue/src/index.ts` 追加：

```ts
export { default as Select } from './components/ui/select/Select.vue'
export { default as SelectGroup } from './components/ui/select/SelectGroup.vue'
export { default as SelectValue } from './components/ui/select/SelectValue.vue'
export { default as SelectTrigger } from './components/ui/select/SelectTrigger.vue'
export { default as SelectContent } from './components/ui/select/SelectContent.vue'
export { default as SelectLabel } from './components/ui/select/SelectLabel.vue'
export { default as SelectItem } from './components/ui/select/SelectItem.vue'
export { default as SelectSeparator } from './components/ui/select/SelectSeparator.vue'
export { default as SelectScrollUpButton } from './components/ui/select/SelectScrollUpButton.vue'
export { default as SelectScrollDownButton } from './components/ui/select/SelectScrollDownButton.vue'
```

- [ ] **Step 5: 验证**

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，15 个测试通过（`cn` 2 + primitives 6 + accordion 2 + tabs 2 + select 3）。

Run: `pnpm --filter @fish-admin/parity-vue test`

Expected: PASS，4 个测试通过。

Run: `pnpm typecheck`

Expected: 通过。

Run: `pnpm lint`

Expected: 通过。

Run: `pnpm exec prettier --check packages/vue/src/components/ui/select apps/parity-vue/src/demos/select apps/parity-vue/src/data/demos.ts packages/vue/src/index.ts`

Expected: 通过。

- [ ] **Step 6: 提交**

```bash
git add packages/vue/src/components/ui/select packages/vue/src/index.ts apps/parity-vue/src/demos/select apps/parity-vue/src/data/demos.ts
git commit -m "feat(vue): port select and its two demos"
```

---

### Task 8: Dialog 包装层与两个 demo

**Files:**

- Create: `packages/vue/src/components/ui/dialog/{Dialog,DialogTrigger,DialogPortal,DialogClose,DialogOverlay,DialogContent,DialogHeader,DialogFooter,DialogTitle,DialogDescription}.vue`
- Create: `packages/vue/src/components/ui/dialog/dialog.test.ts`
- Create: `apps/parity-vue/src/demos/dialog/{basic,long-content}.vue`
- Modify: `packages/vue/src/index.ts`
- Modify: `apps/parity-vue/src/data/demos.ts`

**Interfaces:**

- Consumes: Task 4 的 `Button`、`Input`、`Label`、`Select*`；Reka UI 的 `DialogRoot`、`DialogTrigger`、`DialogPortal`、`DialogClose`、`DialogOverlay`、`DialogContent`、`DialogTitle`、`DialogDescription`；`lucide-vue-next` 的 `XIcon`、`UserPlus`；`useUITranslation`。
- Produces: `Dialog`（`open` / `update:open`、`defaultOpen`、`modal`）、`DialogTrigger` / `DialogClose`（`asChild`）、`DialogContent`（`showCloseButton`）、`DialogHeader`、`DialogFooter`（`showCloseButton`）、`DialogTitle`、`DialogDescription`、`DialogOverlay`、`DialogPortal`；`DEMOS` 中的 `dialog/basic`（101 行）与 `dialog/long-content`（76 行）。

- [ ] **Step 1: 实现 Dialog 包装层**

`packages/vue/src/components/ui/dialog/Dialog.vue`：

```vue
<script setup lang="ts">
import { DialogRoot } from 'reka-ui'

defineProps<{ open?: boolean; defaultOpen?: boolean; modal?: boolean }>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <DialogRoot
    data-slot="dialog"
    :open="open"
    :default-open="defaultOpen"
    :modal="modal"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </DialogRoot>
</template>
```

`packages/vue/src/components/ui/dialog/DialogTrigger.vue`：

```vue
<script setup lang="ts">
import { DialogTrigger as DialogTriggerPrimitive } from 'reka-ui'

defineProps<{ asChild?: boolean }>()
</script>

<template>
  <DialogTriggerPrimitive data-slot="dialog-trigger" :as-child="asChild">
    <slot />
  </DialogTriggerPrimitive>
</template>
```

`packages/vue/src/components/ui/dialog/DialogPortal.vue`：

```vue
<script setup lang="ts">
import { DialogPortal as DialogPortalPrimitive } from 'reka-ui'

defineProps<{ to?: string | HTMLElement }>()
</script>

<template>
  <DialogPortalPrimitive data-slot="dialog-portal" :to="to">
    <slot />
  </DialogPortalPrimitive>
</template>
```

`packages/vue/src/components/ui/dialog/DialogClose.vue`：

```vue
<script setup lang="ts">
import { DialogClose as DialogClosePrimitive } from 'reka-ui'

defineProps<{ asChild?: boolean }>()
</script>

<template>
  <DialogClosePrimitive data-slot="dialog-close" :as-child="asChild">
    <slot />
  </DialogClosePrimitive>
</template>
```

`packages/vue/src/components/ui/dialog/DialogOverlay.vue`：

```vue
<script setup lang="ts">
import { DialogOverlay as DialogOverlayPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <DialogOverlayPrimitive
    data-slot="dialog-overlay"
    :class="
      cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none!',
        props.class,
      )
    "
  />
</template>
```

`packages/vue/src/components/ui/dialog/DialogContent.vue`：

```vue
<script setup lang="ts">
import { XIcon } from 'lucide-vue-next'
import { DialogContent as DialogContentPrimitive } from 'reka-ui'

import { useUITranslation } from '../../../i18n'
import { cn } from '../../../lib/utils'

import DialogClose from './DialogClose.vue'
import DialogOverlay from './DialogOverlay.vue'
import DialogPortal from './DialogPortal.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{ showCloseButton?: boolean; class?: string }>(), {
  showCloseButton: true,
})

const { t } = useUITranslation()
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContentPrimitive
      v-bind="$attrs"
      data-slot="dialog-content"
      :class="
        cn(
          'fixed inset-x-0 top-1/2 z-50 mx-auto grid w-full max-w-[calc(100%-2rem)] -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg duration-(--motion-duration-base) ease-(--motion-ease-standard) outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none! motion-reduce:transition-none! sm:max-w-lg',
          props.class,
        )
      "
    >
      <slot />
      <DialogClose
        v-if="showCloseButton"
        class="absolute end-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <XIcon />
        <span class="sr-only">{{ t('actions.close') }}</span>
      </DialogClose>
    </DialogContentPrimitive>
  </DialogPortal>
</template>
```

`packages/vue/src/components/ui/dialog/DialogHeader.vue`：

```vue
<script setup lang="ts">
import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div
    data-slot="dialog-header"
    :class="cn('flex flex-col gap-2 text-center sm:text-start', props.class)"
  >
    <slot />
  </div>
</template>
```

`packages/vue/src/components/ui/dialog/DialogFooter.vue`：

```vue
<script setup lang="ts">
import { useUITranslation } from '../../../i18n'
import { cn } from '../../../lib/utils'

import { Button } from '../button'
import DialogClose from './DialogClose.vue'

const props = withDefaults(defineProps<{ showCloseButton?: boolean; class?: string }>(), {
  showCloseButton: false,
})

const { t } = useUITranslation()
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', props.class)"
  >
    <slot />
    <DialogClose v-if="showCloseButton" as-child>
      <Button variant="outline">{{ t('actions.close') }}</Button>
    </DialogClose>
  </div>
</template>
```

`packages/vue/src/components/ui/dialog/DialogTitle.vue`：

```vue
<script setup lang="ts">
import { DialogTitle as DialogTitlePrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <DialogTitlePrimitive
    data-slot="dialog-title"
    :class="cn('text-lg leading-none font-semibold', props.class)"
  >
    <slot />
  </DialogTitlePrimitive>
</template>
```

`packages/vue/src/components/ui/dialog/DialogDescription.vue`：

```vue
<script setup lang="ts">
import { DialogDescription as DialogDescriptionPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <DialogDescriptionPrimitive
    data-slot="dialog-description"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescriptionPrimitive>
</template>
```

- [ ] **Step 2: 写 Dialog 测试**

`packages/vue/src/components/ui/dialog/dialog.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import Dialog from './Dialog.vue'
import DialogContent from './DialogContent.vue'
import DialogDescription from './DialogDescription.vue'
import DialogHeader from './DialogHeader.vue'
import DialogTitle from './DialogTitle.vue'

describe('Dialog', () => {
  it('renders its title, description and close button when open', async () => {
    const wrapper = mount(Dialog, {
      props: { open: true },
      slots: {
        default: () =>
          h(DialogContent, null, {
            default: () =>
              h(DialogHeader, null, {
                default: () => [
                  h(DialogTitle, null, { default: () => 'Invite a member' }),
                  h(DialogDescription, null, { default: () => 'They receive an email.' }),
                ],
              }),
          }),
      },
      attachTo: document.body,
    })
    await nextTick()

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.textContent).toContain('Invite a member')
    expect(dialog?.textContent).toContain('They receive an email.')
    expect(dialog?.querySelector('[data-slot="dialog-close"]')).toBeTruthy()

    wrapper.unmount()
  })
})
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: FAIL，`Failed to resolve import "./Dialog.vue"`。

- [ ] **Step 3: 创建两个 demo**

`apps/parity-vue/src/demos/dialog/basic.vue`：

```vue
<script lang="ts">
export default { name: 'DialogBasic' }
</script>

<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { ref } from 'vue'

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'

const ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer',
  member: 'Member',
  admin: 'Admin',
}

const email = ref('')
const role = ref('member')
const sent = ref<{ email: string; role: string } | null>(null)

function sendInvite() {
  sent.value = { email: email.value.trim(), role: role.value }
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Dialog>
        <DialogTrigger as-child>
          <Button variant="outline" size="sm">
            <UserPlus aria-hidden="true" style="width: 1rem; height: 1rem" />
            Invite member
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              They receive an email with a link to join the Acme Operations workspace.
            </DialogDescription>
          </DialogHeader>
          <div class="fish-demo-stack" style="max-width: 100%; gap: 0.85rem">
            <div>
              <Label for="demo-dialog-email">Email address</Label>
              <Input
                id="demo-dialog-email"
                v-model="email"
                type="email"
                placeholder="name@company.com"
                style="margin-top: 0.5rem"
              />
            </div>
            <div>
              <Label for="demo-dialog-role">Role</Label>
              <Select v-model="role">
                <SelectTrigger id="demo-dialog-role" style="margin-top: 0.5rem; width: 100%">
                  <SelectValue :label="ROLE_LABELS[role]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <DialogClose as-child>
              <Button size="sm" :disabled="email.trim() === ''" @click="sendInvite">
                Send invite
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p class="fish-demo-muted" role="status">
        {{ sent ? `Invite sent to ${sent.email} as ${sent.role}.` : 'No invite sent yet.' }}
      </p>
    </div>
    <p class="fish-demo-muted">
      The send button stays disabled until an address is typed; the page keeps the last result.
    </p>
  </div>
</template>
```

`apps/parity-vue/src/demos/dialog/long-content.vue`：

```vue
<script lang="ts">
export default { name: 'DialogLongContent' }
</script>

<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@fish-admin/vue'

const SECTIONS = [
  {
    title: 'Saved views in Pro Table',
    body: 'Column layouts, filters and sort order can now be stored as a named view. Views are private by default and can be shared with a team from the view menu. The active view is restored when you return to the page.',
  },
  {
    title: 'Faster query filters',
    body: 'Filter chips are debounced at 250 ms instead of 400 ms, and the filter bar no longer remounts when a row is selected. On large tables this removes the flicker that appeared while typing a search term.',
  },
  {
    title: 'Breaking change: Date Picker',
    body: 'Date Picker now returns a YYYY-MM-DD string instead of a Date object. Projects that compared Date instances need to switch to string comparison, or convert at the data boundary before passing values in.',
  },
  {
    title: 'Accessibility fixes',
    body: 'Dialog and Alert Dialog now return focus to the element that opened them after Escape. Icon-only buttons in the table toolbar gained accessible names, and the sidebar toggle announces its expanded state.',
  },
  {
    title: 'Upgrade notes',
    body: 'Update the package, run the codemod, then check any custom Date Picker wrappers. The migration guide lists every renamed prop. No database or API changes are required for this release.',
  },
]
</script>

<template>
  <div class="fish-demo-stack">
    <Dialog>
      <DialogTrigger as-child>
        <Button variant="outline" size="sm">View release notes</Button>
      </DialogTrigger>
      <DialogContent style="max-height: 20rem; overflow-y: auto">
        <DialogHeader>
          <DialogTitle>Release 0.2.0</DialogTitle>
          <DialogDescription>
            Five changes shipped on 2026-10-14. The content scrolls inside the dialog instead of
            stretching it down the page.
          </DialogDescription>
        </DialogHeader>
        <div class="fish-demo-stack" style="max-width: 100%; gap: 1rem">
          <section v-for="section in SECTIONS" :key="section.title">
            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600">{{ section.title }}</h3>
            <p class="fish-demo-muted" style="margin: 0.35rem 0 0">{{ section.body }}</p>
          </section>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button size="sm">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <p class="fish-demo-muted">
      The dialog body has a max-height of 20rem; longer content scrolls instead of growing past the
      viewport.
    </p>
  </div>
</template>
```

- [ ] **Step 4: 注册 demo 并导出组件**

在 `apps/parity-vue/src/data/demos.ts` 的 import 区追加：

```ts
import DialogBasic from '../demos/dialog/basic.vue'
import dialogBasicSource from '../demos/dialog/basic.vue?raw'
import DialogLongContent from '../demos/dialog/long-content.vue'
import dialogLongContentSource from '../demos/dialog/long-content.vue?raw'
```

在 `DEMOS` 数组末尾追加：

```ts
  {
    id: 'dialog/basic',
    componentId: 'dialog',
    title: { en: 'Basic usage', zh: '基础用法' },
    lines: 101,
    filename: 'demos/dialog/basic.tsx',
    source: dialogBasicSource,
    view: DialogBasic,
  },
  {
    id: 'dialog/long-content',
    componentId: 'dialog',
    title: { en: 'Long, scrollable content', zh: '长内容滚动' },
    lines: 76,
    filename: 'demos/dialog/long-content.tsx',
    source: dialogLongContentSource,
    view: DialogLongContent,
  },
```

`packages/vue/src/index.ts` 追加：

```ts
export { default as Dialog } from './components/ui/dialog/Dialog.vue'
export { default as DialogTrigger } from './components/ui/dialog/DialogTrigger.vue'
export { default as DialogPortal } from './components/ui/dialog/DialogPortal.vue'
export { default as DialogClose } from './components/ui/dialog/DialogClose.vue'
export { default as DialogOverlay } from './components/ui/dialog/DialogOverlay.vue'
export { default as DialogContent } from './components/ui/dialog/DialogContent.vue'
export { default as DialogHeader } from './components/ui/dialog/DialogHeader.vue'
export { default as DialogFooter } from './components/ui/dialog/DialogFooter.vue'
export { default as DialogTitle } from './components/ui/dialog/DialogTitle.vue'
export { default as DialogDescription } from './components/ui/dialog/DialogDescription.vue'
```

- [ ] **Step 5: 验证**

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，16 个测试通过（`cn` 2 + primitives 6 + accordion 2 + tabs 2 + select 3 + dialog 1）。

Run: `pnpm --filter @fish-admin/parity-vue test`

Expected: PASS，4 个测试通过。

Run: `pnpm typecheck`

Expected: 通过。

Run: `pnpm lint`

Expected: 通过。

Run: `pnpm exec prettier --check packages/vue/src/components/ui/dialog apps/parity-vue/src/demos/dialog apps/parity-vue/src/data/demos.ts packages/vue/src/index.ts`

Expected: 通过。

- [ ] **Step 6: 提交**

```bash
git add packages/vue/src/components/ui/dialog packages/vue/src/index.ts apps/parity-vue/src/demos/dialog apps/parity-vue/src/data/demos.ts
git commit -m "feat(vue): port dialog and its two demos"
```

---

### Task 9: DateRangePicker、RangeCalendar 与两个 demo

**Files:**

- Create: `packages/vue/src/lib/date.ts`、`packages/vue/src/lib/date.test.ts`
- Create: `packages/vue/src/components/enterprise/date-range-picker/types.ts`
- Create: `packages/vue/src/components/enterprise/date-range-picker/RangeCalendar.vue`
- Create: `packages/vue/src/components/enterprise/date-range-picker/DateRangePicker.vue`
- Create: `packages/vue/src/components/enterprise/date-range-picker/date-range-picker.test.ts`
- Create: `apps/parity-vue/src/demos/date-range-picker/{basic,presets}.vue`
- Modify: `packages/vue/src/i18n.ts`（日历导航文案）
- Modify: `packages/vue/src/index.ts`
- Modify: `apps/parity-vue/src/data/demos.ts`
- Modify: `docs/superpowers/plans/2026-11-11-vue3-port-slice.md` 顶部的文件树（补上 `lib/date.test.ts` 与 `date-range-picker.test.ts`）

**Interfaces:**

- Consumes: Task 4 的 `Button`；Reka UI 的 `PopoverRoot`、`PopoverTrigger`、`PopoverPortal`、`PopoverContent`、`RangeCalendarRoot`、`RangeCalendarHeader`、`RangeCalendarPrev`、`RangeCalendarHeading`、`RangeCalendarNext`、`RangeCalendarGrid`、`RangeCalendarGridHead`、`RangeCalendarGridBody`、`RangeCalendarGridRow`、`RangeCalendarHeadCell`、`RangeCalendarCell`、`RangeCalendarCellTrigger`；`@internationalized/date` 的 `parseDate`、`CalendarDate`、`DateRange`；`lucide-vue-next` 的 `CalendarDays`、`ChevronLeftIcon`、`ChevronRightIcon`；`useUITranslation`。
- Produces: `DateRangePicker`（`modelValue` / `update:modelValue`、`placeholder`、`ariaLabel`、`presets`、`disabled`、`class`）、`RangeCalendar`（内部组件，`modelValue` / `update:modelValue`、`locale`、`class`）、`DateRangeValue`、`DateRangePreset`；`DEMOS` 中的 `date-range-picker/basic`（21 行）与 `date-range-picker/presets`（28 行）。触发器可访问名称与 React 一致：`` `${ariaLabel}: ${display ?? placeholder}` ``，`display` 用 `Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })` 生成，区间分隔符是 en dash `–`。

- [ ] **Step 1: 复制日期工具并写测试**

`packages/vue/src/lib/date.ts` 从 `packages/ui/src/lib/date.ts` 逐字复制（`DAY_VALUE_PATTERN`、`parseDay`、`formatDayValue`、`formatDayDisplay` 与 `DEFAULT_DISPLAY_OPTIONS`），不做任何改写。

`packages/vue/src/lib/date.test.ts`：

```ts
import { describe, expect, it } from 'vitest'

import { formatDayDisplay, formatDayValue, parseDay } from './date'

describe('date helpers', () => {
  it('parses only strict YYYY-MM-DD values', () => {
    expect(parseDay('2026-09-28')?.getFullYear()).toBe(2026)
    expect(parseDay('2026-9-28')).toBeUndefined()
    expect(parseDay('28/09/2026')).toBeUndefined()
    expect(parseDay(undefined)).toBeUndefined()
  })

  it('serializes a local date without a timezone shift', () => {
    expect(formatDayValue(new Date(2026, 8, 28))).toBe('2026-09-28')
  })

  it('formats a value for the given language', () => {
    expect(formatDayDisplay('2026-09-28', 'en')).toBe('Sep 28, 2026')
    expect(formatDayDisplay('not-a-date', 'en')).toBeUndefined()
  })
})
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，19 个测试通过（`cn` 2 + primitives 6 + accordion 2 + tabs 2 + select 3 + dialog 1 + date 3）。

- [ ] **Step 2: 写失败的 DateRangePicker 测试**

`packages/vue/src/components/enterprise/date-range-picker/date-range-picker.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import DateRangePicker from './DateRangePicker.vue'

const PRESETS = [
  { label: 'Last 7 days', from: '2026-10-21', to: '2026-10-27' },
  { label: 'Last 30 days', from: '2026-09-28', to: '2026-10-27' },
]

describe('DateRangePicker', () => {
  it('announces the placeholder and then the formatted range', async () => {
    const wrapper = mount(DateRangePicker, {
      props: {
        modelValue: {},
        placeholder: 'Filter by date',
        ariaLabel: 'Report date range',
      },
      attachTo: document.body,
    })

    const trigger = wrapper.get('button')
    expect(trigger.attributes('aria-label')).toBe('Report date range: Filter by date')
    expect(trigger.classes()).toContain('text-muted-foreground')

    await wrapper.setProps({ modelValue: { from: '2026-09-28', to: '2026-10-27' } })

    expect(trigger.attributes('aria-label')).toBe('Report date range: Sep 28, 2026 – Oct 27, 2026')
    expect(trigger.text()).toContain('Sep 28, 2026 – Oct 27, 2026')
    expect(trigger.classes()).not.toContain('text-muted-foreground')

    wrapper.unmount()
  })

  it('emits the preset range when a preset is chosen', async () => {
    const wrapper = mount(DateRangePicker, {
      props: {
        modelValue: {},
        placeholder: 'Filter by date',
        ariaLabel: 'Report date range',
        presets: PRESETS,
      },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    await nextTick()

    const preset = [...document.body.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Last 7 days',
    )
    expect(preset).toBeTruthy()
    preset?.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      { from: '2026-10-21', to: '2026-10-27' },
    ])

    wrapper.unmount()
  })
})
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: FAIL，`Failed to resolve import "./DateRangePicker.vue"`。

- [ ] **Step 3: 实现类型与 RangeCalendar**

`packages/vue/src/components/enterprise/date-range-picker/types.ts`：

```ts
export interface DateRangeValue {
  from?: string
  to?: string
}

export interface DateRangePreset extends DateRangeValue {
  label: string
}
```

在 `packages/vue/src/i18n.ts` 的 `BUILT_IN.en` 与 `BUILT_IN['zh-CN']` 中各补三个 key：

```ts
    'calendar.previousMonth': 'Previous month',
    'calendar.nextMonth': 'Next month',
    'calendar.label': 'Calendar',
```

```ts
    'calendar.previousMonth': '上个月',
    'calendar.nextMonth': '下个月',
    'calendar.label': '日历',
```

`packages/vue/src/components/enterprise/date-range-picker/RangeCalendar.vue`：

```vue
<script setup lang="ts">
import { parseDate, type DateRange } from '@internationalized/date'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import {
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
} from 'reka-ui'
import { computed } from 'vue'

import { useUITranslation } from '../../../i18n'
import { cn } from '../../../lib/utils'

import type { DateRangeValue } from './types'

const props = defineProps<{ modelValue: DateRangeValue; locale: string; class?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: DateRangeValue] }>()

const { t } = useUITranslation()

const range = computed<DateRange | null>(() => {
  const start = props.modelValue.from ? parseDate(props.modelValue.from) : undefined
  const end = props.modelValue.to ? parseDate(props.modelValue.to) : undefined
  return start || end ? { start, end } : null
})

function onUpdate(next: DateRange | null) {
  emit('update:modelValue', {
    from: next?.start?.toString(),
    to: next?.end?.toString(),
  })
}

const navClass =
  'inline-flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none'

const cellClass = cn(
  'size-8 rounded-md p-0 text-center text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selection-start]:rounded-s-md data-[selection-end]:rounded-e-md data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-50 data-[today]:bg-accent data-[today]:text-accent-foreground',
)
</script>

<template>
  <RangeCalendarRoot
    :model-value="range"
    :locale="locale"
    :calendar-label="t('calendar.label')"
    initial-focus
    :class="cn('w-fit bg-background p-3', props.class)"
    @update:model-value="onUpdate"
  >
    <template #default="{ weekDays, grid }">
      <RangeCalendarHeader class="relative flex w-full items-center justify-between gap-1">
        <RangeCalendarPrev :aria-label="t('calendar.previousMonth')" :class="navClass">
          <ChevronLeftIcon class="size-4" />
        </RangeCalendarPrev>
        <RangeCalendarHeading class="text-sm font-medium select-none" />
        <RangeCalendarNext :aria-label="t('calendar.nextMonth')" :class="navClass">
          <ChevronRightIcon class="size-4" />
        </RangeCalendarNext>
      </RangeCalendarHeader>
      <RangeCalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        class="mt-2 w-full border-collapse select-none"
      >
        <RangeCalendarGridHead>
          <RangeCalendarGridRow class="flex">
            <RangeCalendarHeadCell
              v-for="weekDay in weekDays"
              :key="weekDay"
              class="w-8 flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none"
            >
              {{ weekDay }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="index"
            class="mt-2 flex w-full"
          >
            <RangeCalendarCell
              v-for="day in weekDates"
              :key="day.toString()"
              :date="day"
              class="relative h-8 w-8 p-0 text-center text-sm"
            >
              <RangeCalendarCellTrigger :day="day" :month="month.value" :class="cellClass" />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </template>
  </RangeCalendarRoot>
</template>
```

- [ ] **Step 4: 实现 DateRangePicker**

`packages/vue/src/components/enterprise/date-range-picker/DateRangePicker.vue`：

```vue
<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, ref } from 'vue'

import { useUITranslation } from '../../../i18n'
import { formatDayDisplay } from '../../../lib/date'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/button'

import RangeCalendar from './RangeCalendar.vue'
import type { DateRangePreset, DateRangeValue } from './types'

const props = defineProps<{
  placeholder: string
  ariaLabel: string
  presets?: DateRangePreset[]
  disabled?: boolean
  class?: string
}>()

const value = defineModel<DateRangeValue>({ required: true })

const open = ref(false)
const { t, locale } = useUITranslation()

const fromDisplay = computed(() => formatDayDisplay(value.value.from, locale.value))
const toDisplay = computed(() => formatDayDisplay(value.value.to, locale.value))
const display = computed(() => {
  if (fromDisplay.value) {
    return toDisplay.value
      ? `${fromDisplay.value} – ${toDisplay.value}`
      : `${fromDisplay.value} – …`
  }
  return toDisplay.value ? `… – ${toDisplay.value}` : undefined
})
const hasValue = computed(() => Boolean(value.value.from || value.value.to))

const triggerClass = computed(() =>
  cn('justify-start gap-2 font-normal', !display.value && 'text-muted-foreground', props.class),
)

const contentClass = cn(
  'z-50 w-72 origin-(--reka-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden duration-(--motion-duration-fast) ease-(--motion-ease-standard) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none!',
  'w-auto max-w-[calc(100vw-2rem)] p-3',
)

function chooseRange(next: DateRangeValue) {
  value.value = next
  open.value = false
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        :aria-label="`${ariaLabel}: ${display ?? placeholder}`"
        :disabled="disabled"
        :class="triggerClass"
      >
        <CalendarDays class="size-4 shrink-0" />
        <span class="truncate">{{ display ?? placeholder }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent align="start" :side-offset="4" :class="contentClass">
        <div class="flex flex-col gap-3 sm:flex-row">
          <div
            v-if="presets && presets.length > 0"
            class="flex shrink-0 flex-row gap-1 overflow-x-auto sm:w-36 sm:flex-col sm:overflow-visible sm:border-e sm:pe-3"
          >
            <Button
              v-for="preset in presets"
              :key="preset.label"
              type="button"
              :variant="
                preset.from === value.from && preset.to === value.to ? 'secondary' : 'ghost'
              "
              size="sm"
              class="justify-start whitespace-nowrap"
              @click="chooseRange({ from: preset.from, to: preset.to })"
            >
              {{ preset.label }}
            </Button>
          </div>
          <div class="min-w-0">
            <RangeCalendar v-model="value" :locale="locale" class="p-0" />
            <div class="mt-2 flex justify-end border-t pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :disabled="!hasValue"
                @click="chooseRange({})"
              >
                {{ t('enterprise.clear') }}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，21 个测试通过（19 + DateRangePicker 2）。

- [ ] **Step 5: 创建两个 demo 并注册**

`apps/parity-vue/src/demos/date-range-picker/basic.vue`：

```vue
<script lang="ts">
export default { name: 'DateRangePickerBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { DateRangePicker, type DateRangeValue } from '@fish-admin/vue'

const value = ref<DateRangeValue>({})
</script>

<template>
  <div class="fish-demo-stack">
    <DateRangePicker
      v-model="value"
      placeholder="Filter by date"
      ariaLabel="Report date range"
      class="fish-demo-w-72"
    />
    <p class="fish-demo-muted">From {{ value.from ?? '—' }} to {{ value.to ?? '—' }}</p>
  </div>
</template>
```

`apps/parity-vue/src/demos/date-range-picker/presets.vue`：

```vue
<script lang="ts">
export default { name: 'DateRangePickerPresets' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { DateRangePicker, type DateRangePreset, type DateRangeValue } from '@fish-admin/vue'

const PRESETS: DateRangePreset[] = [
  { label: 'Last 7 days', from: '2026-10-21', to: '2026-10-27' },
  { label: 'Last 30 days', from: '2026-09-28', to: '2026-10-27' },
  { label: 'This quarter', from: '2026-10-01', to: '2026-10-27' },
]

const value = ref<DateRangeValue>({ from: '2026-09-28', to: '2026-10-27' })
</script>

<template>
  <div class="fish-demo-stack">
    <DateRangePicker
      v-model="value"
      placeholder="Select a range"
      ariaLabel="Audit log date range"
      :presets="PRESETS"
      class="fish-demo-w-72"
    />
    <p class="fish-demo-muted">Selected {{ value.from ?? '—' }} – {{ value.to ?? '—' }}</p>
  </div>
</template>
```

在 `apps/parity-vue/src/data/demos.ts` 的 import 区追加：

```ts
import DateRangePickerBasic from '../demos/date-range-picker/basic.vue'
import dateRangePickerBasicSource from '../demos/date-range-picker/basic.vue?raw'
import DateRangePickerPresets from '../demos/date-range-picker/presets.vue'
import dateRangePickerPresetsSource from '../demos/date-range-picker/presets.vue?raw'
```

在 `DEMOS` 数组末尾追加：

```ts
  {
    id: 'date-range-picker/basic',
    componentId: 'date-range-picker',
    title: { en: 'Basic range', zh: '基础范围选择' },
    lines: 21,
    filename: 'demos/date-range-picker/basic.tsx',
    source: dateRangePickerBasicSource,
    view: DateRangePickerBasic,
  },
  {
    id: 'date-range-picker/presets',
    componentId: 'date-range-picker',
    title: { en: 'Presets', zh: '预设范围' },
    lines: 28,
    filename: 'demos/date-range-picker/presets.tsx',
    source: dateRangePickerPresetsSource,
    view: DateRangePickerPresets,
  },
```

`packages/vue/src/index.ts` 追加：

```ts
export { default as DateRangePicker } from './components/enterprise/date-range-picker/DateRangePicker.vue'
export type {
  DateRangePreset,
  DateRangeValue,
} from './components/enterprise/date-range-picker/types'
```

- [ ] **Step 6: 验证**

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，21 个测试通过。

Run: `pnpm --filter @fish-admin/parity-vue test`

Expected: PASS，4 个测试通过（demo registry 现在覆盖 10 个 demo）。

Run: `pnpm typecheck`

Expected: 通过。

Run: `pnpm lint`

Expected: 通过。

Run: `pnpm exec prettier --check packages/vue/src/lib/date.ts packages/vue/src/lib/date.test.ts packages/vue/src/components/enterprise/date-range-picker apps/parity-vue/src/demos/date-range-picker apps/parity-vue/src/data/demos.ts packages/vue/src/index.ts packages/vue/src/i18n.ts`

Expected: 通过。

- [ ] **Step 7: 提交**

```bash
git add packages/vue/src/lib/date.ts packages/vue/src/lib/date.test.ts packages/vue/src/components/enterprise/date-range-picker packages/vue/src/i18n.ts packages/vue/src/index.ts apps/parity-vue/src/demos/date-range-picker apps/parity-vue/src/data/demos.ts docs/superpowers/plans/2026-11-11-vue3-port-slice.md
git commit -m "feat(vue): port the date range picker and its two demos"
```

---

### Task 10: ProTable、DataTable、BulkActionsBar 与两个 demo

**Files:**

- Create: `packages/vue/src/components/pro/types.ts`
- Create: `packages/vue/src/components/pro/{ProTable,DataTable,BulkActionsBar}.vue`
- Create: `packages/vue/src/components/pro/pro-table.test.ts`
- Create: `apps/parity-vue/src/demos/pro-table/{basic,selection}.vue`
- Modify: `packages/vue/src/index.ts`
- Modify: `apps/parity-vue/src/data/demos.ts`

**Interfaces:**

- Consumes: Task 4 的 `Button`、`Input`、`Checkbox`、`Badge`、`Skeleton`；`@tanstack/vue-table` 的 `FlexRender`、`Table<TData>`；`lucide-vue-next` 的 `Loader2`、`Search`、`X`；`MEMBERS` 与 `DemoMember`。
- Produces: `ProTable`（泛型 `<TData>`；props `table`、`loading`、`search`、`selection`、`fetching`、`fetchingLabel`；slots `empty`、`filters`、`actions`、`toolbar`、`selection-actions`；event `row-click`）、`DataTable`（泛型 `<TData>`；props `table`、`loading`、`skeletonRows`；slots `toolbar`、`empty`；event `row-click`）、`BulkActionsBar`（props `label`、`regionLabel`、`clearLabel`；event `clear`）、`ProTableSearchConfig`、`ProTableSelectionConfig`；`DEMOS` 中的 `pro-table/basic`（41 行）与 `pro-table/selection`（68 行）。

> 本切片不迁移 `pagination`、`rowContextMenu`、`virtualized`、`density` 与 `scrollLabel`，与 `parity/targets/vue.json` 的 deviations 一致。表格行始终可聚焦并发出 `row-click`；两个 demo 不监听该事件，冻结截图不渲染光标或焦点环，因此默认状态不受影响。

- [ ] **Step 1: 写失败的 BulkActionsBar 测试**

`packages/vue/src/components/pro/pro-table.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BulkActionsBar from './BulkActionsBar.vue'

describe('BulkActionsBar', () => {
  it('names its region and emits clear', async () => {
    const wrapper = mount(BulkActionsBar, {
      props: { label: '2 rows selected', clearLabel: 'Clear selection' },
      slots: { default: '<button type="button">Archive</button>' },
    })

    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('aria-label')).toBe('2 rows selected')

    await wrapper.get('button[aria-label="Clear selection"]').trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})
```

Run: `pnpm --filter @fish-admin/vue test`

Expected: FAIL，`Failed to resolve import "./BulkActionsBar.vue"`。

- [ ] **Step 2: 创建类型与 BulkActionsBar**

`packages/vue/src/components/pro/types.ts`：

```ts
import type { Table } from '@tanstack/vue-table'

export type ProTableSearchConfig = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
  clearLabel: string
}

export type ProTableSelectionConfig = {
  count: number
  label: string
  regionLabel?: string
  clearLabel: string
  onClear: () => void
}

export type ProTableProps<TData> = {
  table: Table<TData>
  loading?: boolean
  search?: ProTableSearchConfig
  selection?: ProTableSelectionConfig
  fetching?: boolean
  fetchingLabel?: string
}
```

`packages/vue/src/components/pro/BulkActionsBar.vue`：

```vue
<script setup lang="ts">
import { X } from 'lucide-vue-next'

import { cn } from '../../lib/utils'
import Badge from '../ui/badge/Badge.vue'
import { Button } from '../ui/button'

defineProps<{ label: string; regionLabel?: string; clearLabel: string }>()
const emit = defineEmits<{ clear: [] }>()

const barClass = cn(
  'fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2 rounded-2xl border bg-background/95 px-3 py-2 shadow-xl backdrop-blur sm:rounded-full',
)
</script>

<template>
  <div
    data-slot="bulk-actions-bar"
    role="region"
    :aria-label="regionLabel ?? label"
    :class="barClass"
  >
    <Badge variant="secondary" class="rounded-full px-2.5 font-normal">{{ label }}</Badge>
    <slot />
    <Button variant="ghost" size="icon-sm" :aria-label="clearLabel" @click="emit('clear')">
      <X class="size-4" />
    </Button>
  </div>
</template>
```

- [ ] **Step 3: 实现 DataTable**

`packages/vue/src/components/pro/DataTable.vue`：

```vue
<script setup lang="ts" generic="TData">
import { FlexRender, type Table } from '@tanstack/vue-table'
import { computed } from 'vue'

import { cn } from '../../lib/utils'
import Skeleton from '../ui/skeleton/Skeleton.vue'

const props = withDefaults(
  defineProps<{ table: Table<TData>; loading?: boolean; skeletonRows?: number }>(),
  { loading: false, skeletonRows: 6 },
)

const emit = defineEmits<{ 'row-click': [row: TData] }>()

const rows = computed(() => props.table.getRowModel().rows)
const columnCount = computed(() => props.table.getVisibleLeafColumns().length)

const cardClass = 'shadow-soft overflow-hidden rounded-2xl border bg-card'
const scrollClass =
  'overflow-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'
const headBase =
  'h-10 px-2 text-start align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]'
const headClass = cn(
  headBase,
  'relative text-[11px] font-semibold tracking-wide text-muted-foreground uppercase',
  'bg-muted/35',
)
const cellBase =
  'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]'
const cellClass = cn(cellBase, 'py-3 overflow-hidden')
const skeletonCellClass = cn(cellBase, 'py-3.5')
const emptyCellClass = cn(cellBase, 'p-0')
const rowClass =
  'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted'
const headerRowClass = cn(rowClass, 'hover:bg-transparent')
const clickableRowClass =
  'cursor-pointer focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'

function onRowKeydown(event: KeyboardEvent, row: TData) {
  if (event.target !== event.currentTarget) return
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  emit('row-click', row)
}
</script>

<template>
  <div :class="cardClass">
    <div v-if="$slots.toolbar" class="border-b p-4">
      <slot name="toolbar" />
    </div>
    <div tabindex="0" :class="scrollClass">
      <table data-slot="table" class="w-full caption-bottom text-sm">
        <thead data-slot="table-header" class="[&_tr]:border-b">
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            data-slot="table-row"
            :class="headerRowClass"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              data-slot="table-head"
              :style="{ width: `${header.getSize()}px` }"
              :class="headClass"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </th>
          </tr>
        </thead>
        <tbody data-slot="table-body" class="[&_tr:last-child]:border-0">
          <template v-if="loading">
            <tr
              v-for="rowIndex in skeletonRows"
              :key="`skeleton-${rowIndex}`"
              data-slot="table-row"
              :class="headerRowClass"
            >
              <td
                v-for="cellIndex in columnCount"
                :key="cellIndex"
                data-slot="table-cell"
                :class="skeletonCellClass"
              >
                <Skeleton :class="cellIndex === 1 ? 'h-4 w-32' : 'h-4 w-20'" />
              </td>
            </tr>
          </template>
          <template v-else-if="rows.length > 0">
            <tr
              v-for="row in rows"
              :key="row.id"
              data-slot="table-row"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              tabindex="0"
              :class="cn(rowClass, row.getIsSelected() && 'bg-muted/60', clickableRowClass)"
              @click="emit('row-click', row.original)"
              @keydown="onRowKeydown($event, row.original)"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                data-slot="table-cell"
                :style="{ width: `${cell.column.getSize()}px` }"
                :class="cellClass"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
          </template>
          <tr v-else data-slot="table-row" :class="headerRowClass">
            <td data-slot="table-cell" :colspan="columnCount" :class="emptyCellClass">
              <slot name="empty" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 实现 ProTable**

`packages/vue/src/components/pro/ProTable.vue`：

```vue
<script setup lang="ts" generic="TData">
import { Loader2, Search, X } from 'lucide-vue-next'
import { computed, useSlots } from 'vue'

import { Button } from '../ui/button'
import Input from '../ui/input/Input.vue'

import BulkActionsBar from './BulkActionsBar.vue'
import DataTable from './DataTable.vue'
import type { ProTableProps } from './types'

const props = defineProps<ProTableProps<TData>>()
const emit = defineEmits<{ 'row-click': [row: TData] }>()
const slots = useSlots()

const hasDefaultToolbar = computed(() =>
  Boolean(props.search || props.fetching || slots.filters || slots.actions),
)
const showBulk = computed(() => Boolean(props.selection && props.selection.count > 0))
const bulkLabel = computed(() => props.selection?.label ?? '')
const bulkRegionLabel = computed(() => props.selection?.regionLabel)
const bulkClearLabel = computed(() => props.selection?.clearLabel ?? '')

function clearSelection() {
  props.selection?.onClear()
}
</script>

<template>
  <div data-slot="pro-table">
    <DataTable :table="table" :loading="loading" @row-click="emit('row-click', $event)">
      <template v-if="slots.toolbar" #toolbar>
        <slot name="toolbar" />
      </template>
      <template v-else-if="hasDefaultToolbar" #toolbar>
        <div
          data-slot="pro-table-toolbar"
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div v-if="search" class="relative w-full min-w-0 sm:w-auto sm:max-w-xs sm:flex-1">
              <Search
                aria-hidden="true"
                class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                :model-value="search.value"
                :placeholder="search.placeholder"
                :aria-label="search.ariaLabel"
                class="h-9 ps-9"
                @update:model-value="search.onChange"
              />
              <Button
                v-if="search.value"
                type="button"
                variant="ghost"
                size="icon-xs"
                class="absolute end-2 top-1/2 -translate-y-1/2"
                :aria-label="search.clearLabel"
                @click="search.onChange('')"
              >
                <X aria-hidden="true" class="size-3.5" />
              </Button>
            </div>
            <slot name="filters" />
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span v-if="fetching" role="status" class="inline-flex items-center">
              <Loader2 aria-hidden="true" class="size-4 animate-spin text-muted-foreground" />
              <span class="sr-only">{{ fetchingLabel ?? 'Loading' }}</span>
            </span>
            <slot name="actions" />
          </div>
        </div>
      </template>
      <template #empty>
        <slot name="empty" />
      </template>
    </DataTable>

    <BulkActionsBar
      v-if="showBulk"
      :label="bulkLabel"
      :region-label="bulkRegionLabel"
      :clear-label="bulkClearLabel"
      @clear="clearSelection"
    >
      <slot name="selection-actions" />
    </BulkActionsBar>
  </div>
</template>
```

- [ ] **Step 5: 创建两个 demo 并注册**

`apps/parity-vue/src/demos/pro-table/basic.vue`：

```vue
<script lang="ts">
export default { name: 'ProTableBasic' }
</script>

<script setup lang="ts">
import { createColumnHelper, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { computed, ref } from 'vue'

import { ProTable } from '@fish-admin/vue'

import { MEMBERS, type DemoMember } from '../../data/members'

const columnHelper = createColumnHelper<DemoMember>()
const columns = [
  columnHelper.accessor('name', { header: 'Member' }),
  columnHelper.accessor('team', { header: 'Team' }),
  columnHelper.accessor('status', { header: 'Status' }),
  columnHelper.accessor('joined', { header: 'Joined' }),
]

const search = ref('')
const rows = computed(() =>
  MEMBERS.filter((member) => member.name.toLowerCase().includes(search.value.trim().toLowerCase())),
)
const table = useVueTable({
  get data() {
    return rows.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
})
const searchConfig = computed(() => ({
  value: search.value,
  onChange: (value: string) => {
    search.value = value
  },
  placeholder: 'Search members',
  ariaLabel: 'Search members',
  clearLabel: 'Clear search',
}))
</script>

<template>
  <ProTable :table="table" :search="searchConfig">
    <template #empty>
      <p class="fish-demo-muted">No members match this search.</p>
    </template>
  </ProTable>
</template>
```

`apps/parity-vue/src/demos/pro-table/selection.vue`：

```vue
<script lang="ts">
export default { name: 'ProTableSelection' }
</script>

<script setup lang="ts">
import { createColumnHelper, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import type { CellContext, HeaderContext, RowSelectionState } from '@tanstack/vue-table'
import { computed, h, ref } from 'vue'

import { Checkbox, ProTable } from '@fish-admin/vue'

import { MEMBERS, type DemoMember } from '../../data/members'

const columnHelper = createColumnHelper<DemoMember>()
const rowSelection = ref<RowSelectionState>({})

const columns = [
  {
    id: 'select',
    header: ({ table }: HeaderContext<DemoMember, unknown>) =>
      h(Checkbox, {
        modelValue: table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (checked: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(checked === true),
        'aria-label': 'Select all rows',
      }),
    cell: ({ row }: CellContext<DemoMember, unknown>) =>
      h(Checkbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (checked: boolean | 'indeterminate') =>
          row.toggleSelected(checked === true),
        'aria-label': `Select ${row.original.name}`,
      }),
    size: 36,
  },
  columnHelper.accessor('name', { header: 'Member' }),
  columnHelper.accessor('team', { header: 'Team' }),
  columnHelper.accessor('status', { header: 'Status' }),
  columnHelper.accessor('joined', { header: 'Joined' }),
]

const table = useVueTable({
  data: MEMBERS,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true,
  state: {
    get rowSelection() {
      return rowSelection.value
    },
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === 'function' ? updater(rowSelection.value) : updater
  },
})

const selectedCount = computed(() => Object.keys(rowSelection.value).length)
const selection = computed(() => ({
  count: selectedCount.value,
  label: `${selectedCount.value} ${selectedCount.value === 1 ? 'row' : 'rows'} selected`,
  clearLabel: 'Clear selection',
  onClear: () => {
    rowSelection.value = {}
  },
}))
</script>

<template>
  <ProTable :table="table" :selection="selection">
    <template #empty>
      <p class="fish-demo-muted">No members.</p>
    </template>
  </ProTable>
</template>
```

在 `apps/parity-vue/src/data/demos.ts` 的 import 区追加：

```ts
import ProTableBasic from '../demos/pro-table/basic.vue'
import proTableBasicSource from '../demos/pro-table/basic.vue?raw'
import ProTableSelection from '../demos/pro-table/selection.vue'
import proTableSelectionSource from '../demos/pro-table/selection.vue?raw'
```

在 `DEMOS` 数组末尾追加：

```ts
  {
    id: 'pro-table/basic',
    componentId: 'pro-table',
    title: { en: 'Basic table with search', zh: '带搜索的基础表格' },
    lines: 41,
    filename: 'demos/pro-table/basic.tsx',
    source: proTableBasicSource,
    view: ProTableBasic,
  },
  {
    id: 'pro-table/selection',
    componentId: 'pro-table',
    title: { en: 'Row selection', zh: '行选择' },
    lines: 68,
    filename: 'demos/pro-table/selection.tsx',
    source: proTableSelectionSource,
    view: ProTableSelection,
  },
```

`packages/vue/src/index.ts` 追加：

```ts
export { default as ProTable } from './components/pro/ProTable.vue'
export { default as DataTable } from './components/pro/DataTable.vue'
export { default as BulkActionsBar } from './components/pro/BulkActionsBar.vue'
export type { ProTableSearchConfig, ProTableSelectionConfig } from './components/pro/types'
```

- [ ] **Step 6: 验证**

Run: `pnpm --filter @fish-admin/vue test`

Expected: PASS，22 个测试通过。

Run: `pnpm --filter @fish-admin/parity-vue test`

Expected: PASS，4 个测试通过（demo registry 现在覆盖 12 个 demo）。

Run: `pnpm typecheck`

Expected: 通过。

Run: `pnpm lint`

Expected: 通过。

Run: `pnpm exec prettier --check packages/vue/src/components/pro apps/parity-vue/src/demos/pro-table apps/parity-vue/src/data/demos.ts packages/vue/src/index.ts`

Expected: 通过。

- [ ] **Step 7: 提交**

```bash
git add packages/vue/src/components/pro packages/vue/src/index.ts apps/parity-vue/src/demos/pro-table apps/parity-vue/src/data/demos.ts docs/superpowers/plans/2026-11-11-vue3-port-slice.md
git commit -m "feat(vue): port pro table and its two demos"
```

---

### Task 11: 全量验收、双语记录与本地提交

**Files:**

- Modify: `docs/en/vue-port-foundation.md`
- Modify: `docs/zh-CN/vue-port-foundation.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/superpowers/plans/2026-11-11-vue3-port-slice.md`

**Interfaces:**

- Consumes: Task 1–10 的全部产物（`@fish-admin/vue@0.1.0`、`@fish-admin/parity-vue@0.1.0`、`parity/targets/vue.json`、根脚本 `test:vue` / `test:parity:vue`、22 个 Vue 包测试与 4 个应用测试）。
- Produces: 冻结基线的零改动证据、React 119 / Vue 42 的 Docker 结果、双语文档与 CHANGELOG 记录、一个本地 `docs(vue)` 提交。**不 push、不打 tag、不 publish。**

**失败处理规则（本任务全程适用）：**

- 截图或 DOM 不一致时，只改 Vue 实现（`packages/vue`、`apps/parity-vue` 的 DOM 与 CSS），然后重跑；不得改 `parity/baseline/**`、`e2e-parity/**` 的断言、`parity/scenarios/*.json` 或 `parity/contract/*.json`。
- `parity/targets/vue.json` 的 `api.deviations` 只在文案事实错误时修改，不能用来掩盖真实 API 或 DOM 差异。改动必须在提交信息里说明原因。
- 任何情况下都不运行 `--update-snapshots=all`、`test:visual:update`、`test:docs:visual:update`。
- 同一处截图差异连续修 3 轮仍失败时停止，把 `test-results/` 里的 diff 路径和已尝试的改动报告给用户，不得用更新基线收场。
- Docker 不可用时停止并报告，不得改用本机截图比对。

- [ ] **Step 1: 确认起点干净、基线零改动**

```bash
git status --porcelain
git diff --name-only -- '*.png'
git status --porcelain -- 'parity/baseline/**/*-linux.png'
git ls-files -- '*.png' | grep -c -- '-linux\.png'
```

Expected: 第一条只列出本任务将要修改的文档与计划文件（Task 1–10 已提交）；第二、三条为空；最后一条输出 `198`。

- [ ] **Step 2: 根静态门禁**

```bash
pnpm lint
pnpm format:check
pnpm check:tokens
pnpm check:rtl
pnpm check:maturity
pnpm gen-api:check
pnpm check:parity:freeze
pnpm check:parity:contract
pnpm check:parity:scenarios
```

Expected: 全部退出码 0。`check:parity:freeze` 仍然校验 198 张 PNG 与 2.2.0 版本三元组；`gen-api:check` 仍然只认 83 个 React 组件；`check:rtl`、`check:maturity` 的扫描范围不含 `packages/vue` 与 `apps/parity-vue`。任一命令失败时先修实现，不放宽脚本。

- [ ] **Step 3: 单元测试、类型检查与三个构建**

```bash
pnpm test:shared
pnpm test:ui
pnpm test:vue
pnpm typecheck
pnpm build
pnpm check:package
pnpm size
pnpm --filter @fish-admin/parity-vue build
```

Expected:

- `test:shared`：31 个测试通过（contracts + i18n + mock）。
- `test:ui`：303 个测试通过，React 包未改动。
- `test:vue`：Vue 包 22 个 + parity 应用 4 个，共 26 个通过。
- `typecheck`：根、contracts、i18n、mock、tokens、react、vue、parity-vue、docs 全部通过。
- `build`：模板构建成功，`tsc --noEmit` 无错误。
- `check:package`：`@fish-admin/react` 的 83 个导出仍全部存在。
- `size`：四项 gzip 预算全部通过；与 2026-11-09 的记录相比，first paint、最大异步块、JS 总量与 CSS 总量不增长（Vue 代码不进入模板 bundle）。
- `parity-vue build`：`apps/parity-vue/dist/` 生成，无类型错误。

- [ ] **Step 4: React target 的冻结基线比对**

```bash
pnpm test:parity:docker
```

Expected: `119 passed`（83 API 合同 + 12 docs surface + 6 行为场景 + 12 截图 + 6 axe），0 failed，且运行结束后 `git status --porcelain` 不出现任何 PNG。测试台 `updateSnapshots: 'none'`，不会写基线。

- [ ] **Step 5: Vue target 的 42 条比对**

```bash
pnpm test:parity:vue
```

Expected: `42 passed`（6 API 合同 + 12 docs surface + 6 行为场景 + 12 截图 + 6 axe），0 failed，同样不产生 PNG 改动。截图差异只按上面的失败处理规则修 Vue 实现。

- [ ] **Step 6: 复核零基线改动**

```bash
git diff --name-only -- 'parity/baseline/**/*-linux.png'
git status --porcelain -- '*.png'
git diff --stat parity/baseline/2.2.0/manifest.json
```

Expected: 三条全部为空输出。若 `manifest.json` 或任何 PNG 变化，停止并回退该变化，不得提交。

- [ ] **Step 7: 更新双语移植地基文档**

在 `docs/en/vue-port-foundation.md` 中：

1. 把开头第三行替换为：

```markdown
FishAdmin 2.2.0 is the reference release for the Vue 3 port. This page documents what is frozen, how the framework-neutral packages are laid out, and how the parity harness works. A private six-component pilot slice in `apps/parity-vue` now runs the harness end to end; it is not published and does not change the React package.
```

2. 在 “Targets and commands” 的代码块末尾补一行 `pnpm test:parity:vue`，并在该代码块后的段落追加一句：

```markdown
The private Vue target runs 42 checks: six API contracts, 12 docs-surface checks (six pilots × two locales), six behaviour scenarios, 12 screenshots and six axe scans.
```

3. 把 “Adding a Vue target” 的第 3 步替换为：

```markdown
3. Run `pnpm test:parity:vue`, or `PARITY_TARGET=vue pnpm test:parity:docker`.
```

4. 在已有的 `### 2026-11-09 run` 之后追加：

```markdown
### 2026-11-11 slice 1 run

- Scope: six pilots — Accordion, Tabs, Select, Dialog, DateRangePicker and ProTable — in the private `@fish-admin/vue@0.1.0` package and the `@fish-admin/parity-vue@0.1.0` target.
- Static gates: format, lint, typecheck, tokens, package, RTL, maturity, gen-api, parity freeze, parity contract and parity scenarios — all pass.
- Unit suites: Vue 22 and the parity app 4; the root, token, UI and shared suites are unchanged.
- Browser: React target 119/119; Vue target 42/42 (six API contracts, 12 docs-surface checks, six behaviour scenarios, 12 screenshots and six axe scans).
- Baselines: all 198 `*-linux.png` files unchanged; no snapshot update command was run.
- Bundle: all four `pnpm size` budgets pass and the template bundle does not grow.
```

在 `docs/zh-CN/vue-port-foundation.md` 中做同样的四处修改，文本为：

1. 开头：

```markdown
FishAdmin 2.2.0 是 Vue 3 移植的参考版本。本页说明冻结了什么、框架无关包如何分层，以及 parity 测试台如何工作。`apps/parity-vue` 中的私有六组件试点切片已经端到端跑通测试台；它尚未发布，也不改动 React 包。
```

2. 代码块末尾同样补 `pnpm test:parity:vue`，并在段落后追加：

```markdown
私有 Vue target 运行 42 条检查：6 条 API 合同、12 条 docs surface（六个试点 × 两种语言）、6 条行为场景、12 张截图与 6 条 axe 扫描。
```

3. 第 3 步：

```markdown
3. 运行 `pnpm test:parity:vue`，或 `PARITY_TARGET=vue pnpm test:parity:docker`。
```

4. 运行记录：

```markdown
### 2026-11-11 切片 1 运行

- 范围：Accordion、Tabs、Select、Dialog、DateRangePicker 与 ProTable 六个试点，位于私有 `@fish-admin/vue@0.1.0` 包与 `@fish-admin/parity-vue@0.1.0` target。
- 静态门禁：format、lint、typecheck、tokens、package、RTL、maturity、gen-api、parity freeze、parity contract 与 parity scenarios —— 全部通过。
- 单元测试：Vue 22、parity 应用 4；根、tokens、UI 与 shared 套件数量不变。
- 浏览器：React target 119/119；Vue target 42/42（6 条 API 合同、12 条 docs surface、6 条行为场景、12 张截图、6 条 axe 扫描）。
- 基线：198 张 `*-linux.png` 零改动；未运行任何截图更新命令。
- 体积：`pnpm size` 的四项预算全部通过，模板包体积不增长。
```

- [ ] **Step 8: 更新双语 README**

`README.md` 的 “Project structure”：在 `packages/mock/` 段之后插入：

```text
packages/vue/                # @fish-admin/vue — private Vue 3 pilot components (not published)
├─ src/components/           # accordion, tabs, select, dialog, date-range-picker and pro
├─ src/lib/                  # cn and the shared date helpers
└─ src/styles/index.css      # the self-contained Tailwind entry
```

在 `apps/docs/` 段之后插入：

```text
apps/parity-vue/             # @fish-admin/parity-vue — private Vite target for the Vue parity suite
├─ src/demos/                # the six pilot demos, one folder per component
└─ src/data/demos.ts         # the demo registry the target routes render
```

在命令表中 `pnpm build:ui / pnpm test:ui` 之后插入：

```markdown
| `pnpm test:vue` | Test `@fish-admin/vue` and the Vue parity app |
```

在 `pnpm test:parity:docker` 之后插入：

```markdown
| `pnpm test:parity:vue` | Compare the Vue target against the frozen baselines |
```

把 “Cross-framework parity” 门禁里的这一句：

```markdown
React is the only target today; a Vue port adds `parity/targets/vue.json` and runs `PARITY_TARGET=vue pnpm test:parity:docker`.
```

替换为：

```markdown
The private Vue target adds `parity/targets/vue.json` and `pnpm test:parity:vue`: 42 checks — six API contracts, 12 docs-surface checks, six behaviour scenarios, 12 screenshots and six axe scans — against the same baselines.
```

`README.zh-CN.md` 做对应修改：

- `packages/mock/` 段之后：

```text
packages/vue/                # @fish-admin/vue —— 私有的 Vue 3 试点组件（不发布）
├─ src/components/           # accordion、tabs、select、dialog、date-range-picker 与 pro
├─ src/lib/                  # cn 与共享日期辅助函数
└─ src/styles/index.css      # 自包含的 Tailwind 入口
```

- `apps/docs/` 段之后：

```text
apps/parity-vue/             # @fish-admin/parity-vue —— Vue parity 测试台的私有 Vite target
├─ src/demos/                # 六个试点 demo，每个组件一个目录
└─ src/data/demos.ts         # target 路由渲染的 demo 登记表
```

- 命令表 `pnpm build:ui / pnpm test:ui` 之后：

```markdown
| `pnpm test:vue` | 测试 `@fish-admin/vue` 与 Vue parity 应用 |
```

- 命令表 `pnpm test:parity:docker` 之后：

```markdown
| `pnpm test:parity:vue` | 在 Docker 中把 Vue target 与冻结基线比对 |
```

- 把 “跨框架 parity” 门禁里的：

```markdown
目前只有 React target；Vue 移植只需新增 `parity/targets/vue.json`，再运行 `PARITY_TARGET=vue pnpm test:parity:docker`。
```

替换为：

```markdown
私有 Vue target 新增 `parity/targets/vue.json` 与 `pnpm test:parity:vue`：42 条检查——6 条 API 合同、12 条 docs surface、6 条行为场景、12 张截图与 6 条 axe 扫描——同样比对这批基线。
```

- [ ] **Step 9: 写入 CHANGELOG 的 `[Unreleased]`**

在 `CHANGELOG.md` 的 `## [2.2.0] - 2026-11-10` 之前插入：

```markdown
## [Unreleased]

### Added

- **Private Vue 3 pilot slice.** `@fish-admin/vue@0.1.0` and the private `@fish-admin/parity-vue@0.1.0`
  target port Accordion, Tabs, Select, Dialog, DateRangePicker and ProTable to Vue 3 with Reka UI and
  TanStack Table. The Vue target passes 42 frozen parity checks, the React target still passes 119,
  and every `*-linux.png` baseline is untouched. Neither package is published.
```

- [ ] **Step 10: 在计划末尾记录执行证据**

在本计划文件末尾追加（数字必须来自 Step 2–5 的真实输出；任何一项未通过就不得写通过）：

```markdown
## Slice 1 execution evidence (2026-11-11)

| Gate            | Command                                                                                                                                                                                                       | Result             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Static gates    | `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:rtl`, `pnpm check:maturity`, `pnpm gen-api:check`, `pnpm check:parity:freeze`, `pnpm check:parity:contract`, `pnpm check:parity:scenarios` | all pass           |
| Unit suites     | `pnpm test:shared`, `pnpm test:ui`, `pnpm test:vue`                                                                                                                                                           | 31 + 303 + 26 pass |
| Type and builds | `pnpm typecheck`, `pnpm build`, `pnpm check:package`, `pnpm size`, `pnpm --filter @fish-admin/parity-vue build`                                                                                               | all pass           |
| React parity    | `pnpm test:parity:docker`                                                                                                                                                                                     | 119/119            |
| Vue parity      | `pnpm test:parity:vue`                                                                                                                                                                                        | 42/42              |
| Baselines       | `git diff --name-only -- 'parity/baseline/**/*-linux.png'`                                                                                                                                                    | empty              |
```

- [ ] **Step 11: 格式化、复查差异并提交**

```bash
pnpm exec prettier --write README.md README.zh-CN.md CHANGELOG.md docs/en/vue-port-foundation.md docs/zh-CN/vue-port-foundation.md docs/superpowers/plans/2026-11-11-vue3-port-slice.md
pnpm exec prettier --check .
git diff --stat
git diff -- '*.png' 'parity/baseline/**'
```

Expected: `prettier --check .` 通过；`git diff --stat` 只包含上述六个文档与计划文件；最后一条命令输出为空。随后：

```bash
git add README.md README.zh-CN.md CHANGELOG.md docs/en/vue-port-foundation.md docs/zh-CN/vue-port-foundation.md docs/superpowers/plans/2026-11-11-vue3-port-slice.md
git commit -m "docs(vue): record the slice 1 parity results"
git status --short
```

Expected: 提交成功，工作区干净。不 push、不打 tag、不执行 `npm publish`；push、tag、Release 与 Vercel 变更都需要用户单独批准。

- [ ] **Step 12: 汇报**

向用户报告：React 119/119、Vue 42/42、198 张基线零改动、`test:vue` 29 个测试、双语文档与 CHANGELOG 已更新、提交哈希。明确说明没有 push、没有发布，`@fish-admin/vue` 与 `@fish-admin/parity-vue` 仍是私有包。

---

## Slice 1 execution evidence (2026-11-11)

| Gate            | Command                                                                                                                                                                                                       | Result             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Static gates    | `pnpm lint`, `pnpm format:check`, `pnpm check:tokens`, `pnpm check:rtl`, `pnpm check:maturity`, `pnpm gen-api:check`, `pnpm check:parity:freeze`, `pnpm check:parity:contract`, `pnpm check:parity:scenarios` | all pass           |
| Unit suites     | `pnpm test:shared`, `pnpm test:ui`, `pnpm test:vue`                                                                                                                                                           | 31 + 303 + 29 pass |
| Type and builds | `pnpm typecheck`, `pnpm build`, `pnpm check:package`, `pnpm size`, `pnpm --filter @fish-admin/parity-vue build`                                                                                               | all pass           |
| React parity    | `pnpm test:parity:docker`                                                                                                                                                                                     | 119/119            |
| Vue parity      | `pnpm test:parity:vue`                                                                                                                                                                                        | 42/42              |
| Baselines       | `git diff --name-only -- 'parity/baseline/**/*-linux.png'`                                                                                                                                                    | empty              |

The Vue package ships 25 unit tests and the parity app 4 (29 total); fix rounds in Tasks 8–10 added the difference from this plan's original 22. The first Vue parity run exposed four presentation gaps — demo titles, the docs page's fractional top offset, the Tailwind preflight border colour and ProTable's header separators — fixed in `fix(vue): match the react demo titles and table chrome` before the 42/42 run. No baseline was regenerated.
