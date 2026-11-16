# 让 Vue 版组件库可独立安装、引入和使用 — 差异分析与改造清单

> 状态：清单已定，待实施。
> 目标：`@fish-admin/vue` 达到与 `@fish-admin/react` 一致的消费体验——包外项目
> `npm i` 之后 `import { Button } from '@fish-admin/vue'` + 一行样式引入即可用。
> 约束：**不改变 monorepo 内的现有用法**（vue-template / parity-vue / docs 的
> import 语句零改动）。

## 0. 现状差异分析（事实）

| 维度          | `@fish-admin/react` 0.2.2（已发布形态）                                                                                                                                                                                                                                                                                        | `@fish-admin/vue` 0.1.0（现状）                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对外入口      | `exports['.']` → `dist/index.js` + `dist/index.d.ts`；另有 `./styles.css`、`./preflight.css`、`./internal/*`                                                                                                                                                                                                                   | `exports['.']` → **`./src/index.ts` 源码**；仅多一个 `./styles/index.css` 源文件                                                                                                                                                             |
| 导出方式      | 单一 barrel：83 个组件 + internal 工具；`check-package` 守护（83 exports verified）                                                                                                                                                                                                                                            | 单一 barrel 已建立，但只有 ~15 个组件（50 个 .vue 文件）；无脚本级导出守护                                                                                                                                                                   |
| 依赖边界      | `peerDependencies: react/react-dom`；运行时依赖全在 `dependencies`；构建工具链全在 `devDependencies`；tokens 是 devDep（构建期内联进 CSS）                                                                                                                                                                                     | `peerDependencies: vue` ✓；但 `@fish-admin/tokens: workspace:*` 在 **dependencies**——workspace 协议使包不可发布；其余运行时依赖（reka-ui、@tanstack/vue-table、lucide-vue-next、cva、clsx、tailwind-merge、@internationalized/date）位置正确 |
| 样式加载      | **预编译 CSS 随包分发**：`build:css` 用 Tailwind CLI 把 `src/styles/index.css`（tokens + utilities + base + a11y + `@source '../components'` 类名扫描）编译成 minified 的 `dist/styles.css` + `dist/preflight.css`；`sideEffects: ['**/*.css']`。消费者一行 `import '@fish-admin/react/styles.css'`，**不需要自己的 Tailwind** | `./styles/index.css` 是 **Tailwind 4 源文件**（`@import 'tailwindcss/...'` + `@source`），必须由消费者的 Tailwind 构建编译；vue-template 用 `@tailwindcss/vite` 插件消化它。包外项目没有这套链路就用不了                                     |
| 构建产物      | `files: ['dist']` + `build:js`(vite) + `build:types`(tsc) + `build:css`(tailwind CLI)；`publishConfig.access: public`                                                                                                                                                                                                          | **无任何构建脚本**（只有 typecheck/test）；`private: true`；无 files/dist/types                                                                                                                                                              |
| monorepo 消费 | dev 期经 `vite.shared.ts` 的 alias 把包指向 `packages/ui/src`（源码热更），tsconfig paths 同步；包 exports 仍指向 dist                                                                                                                                                                                                         | vue-template / parity-vue 直接靠「exports 指向 src」消费，**无 alias、无 tsconfig paths**                                                                                                                                                    |
| 组件范围      | 83 个组件（167 demo），全部有文档页与 parity 场景                                                                                                                                                                                                                                                                              | 包级 15 个；模板另在应用层实现了 ~29 个等价物（PageHeader、Timeline、TagsInput 等）但不是包导出；未包级移植约 68 个                                                                                                                          |

**结论**：差距是四件事——①产物缺失（源码直发）；②样式未预编译；③tokens 依赖位置错误；④导出守护缺位。另有一个**范围决策**必须先做：Vue 包 v1 先按现有 15 个组件发布（推荐，可立即落地），83 个组件的对齐作为路线图分批补。

## 1. 对外入口

**改造（对齐 React 的 exports 形状）：**

```jsonc
// packages/vue/package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
    },
    "./styles.css": "./dist/styles.css",
    "./styles/index.css": "./src/styles/index.css", // 保留：自带 Tailwind 的项目可源码编译
    "./package.json": "./package.json",
  },
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "sideEffects": ["**/*.css"],
}
```

- 不设 `./internal/*`：React 的 internal 是 monorepo 内部约定，Vue 目前没有等价物；等真实需要时再加。
- **保留** `./styles/index.css` 源码条目（React 没有，但 Vue 已有两个消费者用它）——这是与 React 的一个有意差异：Vue 同时提供「预编译（包外）」与「源码（monorepo，可改 token）」两条样式链路。
- README.md：对齐 React 包的 README 结构（安装、样式引入、主题切换、组件清单、与 React 版的覆盖差异）。

## 2. 导出方式

- **保持单一 barrel**：`src/index.ts` 继续是唯一公共出口（与 React 一致，不做 per-component exports；tree-shaking 靠 ESM + `sideEffects`）。
- **导出守护接入 `check-package`**：扩展 `scripts/check-package.mjs` 同时校验两包——Vue 包的导出清单必须与 `packages/vue/src/index.ts` 一致，且每个导出组件在 `apps/docs/demos/registry.json` 有对应 demo（现有 15 个组件补 demo）或在该包 README 的「覆盖范围」表中登记。这样 83 组件式的「导出 ↔ 文档」契约从第一天就成立。
- **范围决策写进包 README**：v1 = 15 个组件；未移植组件列成表并指向 React 版文档。
- 类型导出：SFC 的 props/emits 类型经 vue-tsc 生成 `.d.ts`；`export type` 条目（如 `DateRangeValue`）保持在 barrel 中。

## 3. 依赖边界

| 变更                                                                                                                          | 理由                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@fish-admin/tokens`：`dependencies` → `devDependencies`                                                                      | tokens 的 CSS 在**构建期**被 Tailwind `@import` 内联进 `dist/styles.css`（React 同款做法）；运行时消费者不需要它。这是 workspace 协议消失的前提 |
| `vue` 保持 peerDependencies ✓                                                                                                 | 不变                                                                                                                                            |
| reka-ui / @tanstack/vue-table / lucide-vue-next / cva / clsx / tailwind-merge / @internationalized/date 维持 `dependencies` ✓ | React 把所有运行时依赖放 dependencies，Vue 对齐                                                                                                 |
| 新增 devDependencies：`@tailwindcss/cli`（build:css 用）                                                                      | 对齐 React 的 build:css 工具链                                                                                                                  |
| 确认零 `workspace:*` 残留于 dependencies                                                                                      | 发布的前置条件；`pnpm pack --dry-run` 的文件清单与依赖表做进验收                                                                                |

注意包内已自含 i18n（`useUITranslation` + UI 文案）与无 pinia/router 依赖——这两点已满足边界，不要引入。

## 4. 样式加载

**双链路，第一条与 React 完全一致：**

1. **预编译（对外主链路）**：新增 `build:css`——Tailwind CLI 编译 `src/styles/index.css`（其内 `@import '@fish-admin/tokens/theme.css'` 构建期内联）产出 `dist/styles.css` + `dist/preflight.css`（minify）。`@source '../components'` 的类名扫描在包内完成，因此**消费者零 Tailwind 配置、零 tokens 安装**。主题切换（浅/深 + 五强调色）依赖 CSS 变量，随 styles.css 内联，`data-theme`/`data-accent` 切换即可用。
2. **源码（monorepo 保留）**：vue-template / parity-vue 继续用自己的 `@tailwindcss/vite` 编译 `@fish-admin/vue/styles/index.css`——这条链路让模板可以覆盖 token、参与 tree-shaking 式按需 utilities。**现有用法零改动。**

风险与对策：Tailwind 4 的 `@source` 扫描 `.vue` 文件已验证可用（vue-template 现状即如此）；编译时需确认 CLI 解析 workspace 内 `@fish-admin/tokens/theme.css` 的方式与 React 包一致（React 用 `./tokens.css` 复制品——若 CLI 解析 workspace 路径有问题，照抄 React 的复制方案：build:css 前先把 tokens 产物复制进 `src/styles/tokens.css`，该文件加入 .gitignore）。

## 5. 构建产物

**新增 `build` 三段式（对齐 React）：**

```
build:js    → vite build（lib mode，外部化 vue / reka-ui / @tanstack/vue-table / lucide-vue-next 等 peer+deps）
build:types → vue-tsc -p tsconfig.build.json（emitDeclarationOnly；SFC 的 props/emits 类型必须产出）
build:css   → 见第 4 节
```

- 根脚本补 `build:vue` 并挂进相关 prebuild 链；CI 增加该 job。
- `private: true` 移除；`publishConfig.access: public`；版本 0.1.0 → 0.2.0（与 React 0.2.2 同代感，但明确是独立版本线）。
- `pnpm pack --dry-run` 的清单验收：`dist/`（js + d.ts + styles.css + preflight.css）+ README.md，**不含 src**（src 通过 exports 的 styles/index.css 条目除外——需确认 npm pack 会因 files 白名单排除 src；若被排除则把该条目改为指向 dist 内的源 CSS 副本）。
- SFC 编译注意：vite lib mode + `@vitejs/plugin-vue`；`vue` external 化；产物避免双包 Vue（external 而非 bundle）。

## 6. monorepo 兼容（不破坏现有使用）

- **vue-template / parity-vue 的 import 语句零改动**。包 exports 改指 dist 后，dev 期需要源码链路：**照抄 React 的方案**——在 vue-template 与 parity-vue 的 vite 配置加 alias（建议抽 `vite.vue-shared.ts`：`@fish-admin/vue` → `packages/vue/src/index.ts`），tsconfig paths 同步；styles 源码条目保持不变，所以两个应用的 CSS 引入也不用动。
- docs 的 6 个 Vue pilot demo 消费方式与 parity-vue 相同，同样经 alias 走源码。
- 回归门禁：`pnpm lint / format:check / typecheck / test:vue / test:vue-template / test:e2e:vue-template(67) / test:parity:vue(42)` 全绿；`parity/**` 与 `*-linux.png` 零差异；React 侧全部门禁不受影响。

## 7. 验收标准

**包外消费（决定性）：**

1. `pnpm pack` 产物在 monorepo 之外的空 Vue 项目 `npm i ./fish-admin-vue-0.2.0.tgz` 后，不装 Tailwind、不装 tokens，仅 `import { Button } from '@fish-admin/vue'` + `import '@fish-admin/vue/styles.css'` 即可渲染；浅/深色与五强调色经 `data-theme` / `data-accent` 可切换。
2. 消费项目 `vue-tsc --noEmit` 通过（包自带完整 .d.ts，SFC props/emits 可推导）。
3. Tree-shaking 生效：仅引入 Button 的构建产物不包含 reka-ui 的 Tabs/Select/Dialog 等未用模块。
4. DateRangePicker / ProTable 这两个「重组件」在包外渲染正常（reka-ui 与 vue-table 的依赖由 npm 自动安装）。

**monorepo 不回归（硬门禁）：** 5. `vue-template` 与 `parity-vue` 的源码、import 语句零 diff（vite/tsconfig 的 alias 增量除外）；67 条 e2e、42 条 parity-vue、644 条单测全绿。6. `parity/**`、`*-linux.png`、React 侧全部路径零差异；React 门禁矩阵复跑结果与验收报告一致。

**契约守护：** 7. `check-package` 双包校验通过：Vue 导出面 = index.ts = README 覆盖表 = registry demo（15 个组件逐一有 demo）。8. `pnpm pack --dry-run` 清单 = dist + README，无 src、无 workspace 协议残留。

**体验一致（定性验收）：** 9. 同一 demo（Button、Badge、Dialog、Select、Tabs、ProTable 的 basic）在 React 文档站与「包外 Vue 项目」中渲染出的 DOM 类名与视觉结果一致（人工比对该 6 个 pilot 的截图，不建新基线）。

## 8. 路线图（与 React 83 组件对齐）

- v0.2.0：15 个组件可安装（本清单）。
- v0.3+：按「模板已用 > 高频企业件 > 其余」顺序补齐——优先 PageHeader/EmptyState/ErrorState/Timeline/TagsInput/Dropzone/Segmented/Pagination/Card/AlertDialog（应用层上提为包导出，demo 与文档页同步），再补 chart、form、query-filter、carousel、cascader、transfer、editable-table、import-wizard 等大件。
- 每补一个组件：包导出 + demo + 中英文档页 + parity 场景 + check-package 增量，照 React 的 83 组件契约走。
