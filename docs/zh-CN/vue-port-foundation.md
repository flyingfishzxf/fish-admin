# Vue 移植地基

FishAdmin 2.3.1 是 Vue 3 移植的参考版本。本页说明冻结了什么、框架无关包如何分层，以及 parity 测试台如何工作。`@fish-admin/vue` 1.0.1 现已导出全部 90 个组件，`apps/parity-vue` 跑完整套契约：119 项检查、180 张自基线截图套件与 6 组跨版本试点比对。

## 冻结范围

`parity/baseline/2.3.1/manifest.json` 保存以下内容的 SHA-256：

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

`parity/targets/react.json` 指向本仓库构建的 Rspress 文档站。`playwright.parity.config.ts` 读取 `PARITY_TARGET`（默认 `react`），加载 `parity/targets/<name>.json`，启动对应 web server，并把截图与冻结基线目录比对，绝不写回基线。`updateSnapshots` 固定为 `'none'`。

```bash
pnpm check:parity:freeze
pnpm check:parity:contract
pnpm check:parity:scenarios
pnpm test:parity:docker
pnpm test:parity:vue
```

`pnpm test:parity:docker` 在 Playwright 镜像中运行。套件共 119 条：83 条 API 合同、12 条 docs surface（六个试点 × 两种语言）、6 条行为场景、12 张截图（六个试点 × 明暗两套）与 6 条 axe 扫描。12 张截图复用文档站已有的 `*-linux.png`，不复制基线。

Vue target 跑同一套 119 条检查，使用 `contract.scope: all` 与 `api.mode: reference`：83 条覆盖全部 React 组件 id 的 API 合同、12 条 docs surface、6 条行为场景、12 张跨版本试点截图与 6 条 axe 扫描。另有独立自基线套件冻结全部 90 个组件 × 明暗（`pnpm test:vue-visual:docker`），`pnpm check:vue-visual:freeze` 校验其 180 文件清单。

## 增加 Vue target

1. 构建一个 Vue 文档 target，提供相同的组件路由、demo ID 与 `section[data-demo]` anchor。保持相同的固定时钟与 storage key，截图才可比较。
2. 新增 `parity/targets/vue.json`，填写 `baseURL`、`webServer` 与 `"api": { "mode": "reference", "deviations": { ... } }`。六个试点都要有记录；没有差异时写 `[]`。
3. 运行 `pnpm test:parity:vue`，或 `PARITY_TARGET=vue pnpm test:parity:docker`。
4. 在 Vue 实现里修正行为、无障碍与像素差异。绝不能用更新参数让 parity 截图通过。

## Parity 不能证明什么

- **安全。** 权限仍然只是客户端 UX。每个写接口都必须由服务端授权；见 [RBAC](./rbac.md)。
- **API 兼容。** `reference` 模式记录差异，而不是假装 Vue 拥有 React 专属 prop。
- **文档措辞。** 合同检查 DOM 表面与 API 表，不检查指南文案。
- **SSR、移动端或跨浏览器。** 测试台只在 Chromium、1440×900、英文环境下运行，与视觉基线一致，不是响应式或跨浏览器测试。

## 验收

当 `pnpm check:parity:freeze`、`pnpm check:parity:contract`、`pnpm check:parity:scenarios`、`pnpm test:parity:docker`、`pnpm test:parity:vue`、`pnpm test:vue-visual:docker`、`pnpm check:vue-visual:freeze` 与完整质量门禁全部通过，且没有修改任何 `*-linux.png` 或 Vue 自基线时，地基才算完成。

### 2026-11-09 run

- Static gates: format, lint, typecheck, package, tokens, RTL, maturity, gen-api, parity contract, parity scenarios — all pass.
- Unit suites: root 383, tokens 94, UI 303, shared 31.
- Browser: template 78 passed; docs 106 passed / 166 skipped; full axe 272 passed.
- Visual: template 18/18, docs 180/180, parity 119/119, zero baseline changes.
- Bundle: first paint 174.2 KB, largest async 103.2 KB, total JS 711.6 KB, total CSS 23.8 KB.

### 2026-11-11 切片 1 运行

- 范围：Accordion、Tabs、Select、Dialog、DateRangePicker 与 ProTable 六个试点，位于私有 `@fish-admin/vue@0.1.0` 包与 `@fish-admin/parity-vue@0.1.0` target。
- 静态门禁：format、lint、typecheck、tokens、package、RTL、maturity、gen-api、parity freeze、parity contract 与 parity scenarios —— 全部通过。
- 单元测试：Vue 25、parity 应用 4；根、tokens、UI 与 shared 套件数量不变。
- 浏览器：React target 119/119；Vue target 42/42（6 条 API 合同、12 条 docs surface、6 条行为场景、12 张截图、6 条 axe 扫描）。
- 基线：198 张 `*-linux.png` 零改动；未运行任何截图更新命令。
- 体积：`pnpm size` 的四项预算全部通过；本切片没有改动模板的 JavaScript 或 CSS，模板包体积不变。
