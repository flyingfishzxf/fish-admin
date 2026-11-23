# @fish-admin/vue 1.0.0 — 验收报告

日期：2026-11-19
分支：`workbuddy/main-a7370c6a` @ `c7c7053`（已 ff 合并至 `/c/fish/Study/FishAdmin`）

## 结论

`@fish-admin/vue` 从 0.2.0（15 个不可安装组件）走到 **1.0.0（90 个可独立安装导出）**，
registry 中 React 的 83 个 id **全部有 Vue 对应实现**（差集为空），另多出 7 个 Vue 侧独有 id
（bulk-actions-bar、command-dialog、data-table、error-state、loading-overlay、page-header、
progress-bar）。**验收全部通过，无遗留项**——包括 Docker 中的 parity 冻结基线（见下表）。

## 覆盖与版本进度

| 版本      | 导出   | React id 覆盖        |
| --------- | ------ | -------------------- |
| 0.2.0     | 15     | 18%                  |
| 0.3.0     | 38     | 46%                  |
| 0.4.0     | 47     | 57%                  |
| 0.5.0     | 54     | 65%                  |
| 0.6.0     | 58     | 70%                  |
| 0.7.0     | 62     | 75%                  |
| 0.8.0     | 66     | 80%                  |
| 0.9.0     | 69     | 83%                  |
| 0.10.0    | 72     | 87%                  |
| 0.11.0    | 75     | 90%                  |
| 0.12.0    | 78     | 94%                  |
| 0.13.0    | 79     | 95%                  |
| 0.14.0    | 84     | 98%                  |
| 0.15.0    | 87     | —                    |
| 0.16.0    | 89     | —                    |
| **1.0.0** | **90** | **100%（差集为空）** |

registry 分类：primitive 45 / enterprise 37 / pro 8。

## 单测与门禁（全部通过）

| 项目                                            | 结果                                                    |
| ----------------------------------------------- | ------------------------------------------------------- |
| `test:vue`（Vue 包 + parity-vue 契约测试）      | 59 文件 / **206 测试**                                  |
| `test:ui`（React 包）                           | 2 文件 / 4 测试                                         |
| `test`（根项目）                                | 93 文件 / 303 测试                                      |
| `test:shared`（contracts/i18n/mock）            | 50 文件 / 383 + 9 + 4 + 18 测试                         |
| `test:vue-template`                             | **594 测试**                                            |
| `test:e2e:vue-template`                         | **67 通过**                                             |
| `test:parity:vue`（Docker 中的 vue parity）     | **42 通过**（含 8 组明暗视觉冻结基线）                  |
| `check:package`                                 | 83 react + **90 vue** 导出验证                          |
| `check:parity:contract`                         | 通过                                                    |
| `check:parity:freeze`                           | 460 文件匹配 2.2.0 基线                                 |
| `check:rtl`                                     | 0 未处理物理类名（14 定向 / 7 中性 / 13 豁免）          |
| `check:maturity`                                | 83 组件全部 stable；0 缺测试 / 0 缺 demo / 0 缺视觉基线 |
| `check:tokens`                                  | 48 token、41 色彩映射，生成文件最新                     |
| `lint`                                          | 0 error（1 个既有 react-refresh warning）               |
| `format:check`                                  | 全部符合 Prettier                                       |
| `typecheck`                                     | 10 个 target 全部通过                                   |
| `build:vue` / `build:ui` / `build:vue-template` | 全部构建成功                                            |

## 包外安装复验

- `pnpm pack` 产出 `fish-admin-vue-1.0.0.tgz`（315 KB，842 个文件）
- 在 `/tmp/vue-pack-verify/consumer` 用 `npm install file:…tgz` 全新安装（48 包）
- `node verify.mjs` 从已安装包导入 14 个组件/API 并用 `vue/server-renderer` SSR 渲染：
  **11 项检查全部 PASS**（组件导出、Table/Sidebar/Chart/Form/Toaster/toast 等关键 API、
  SSR 输出 `data-slot` 钩子与内容）。

## 补跑记录

2026-11-20：Docker Desktop 启动后补跑 `pnpm test:parity:vue`，42 项全部通过——
含 en/zh 双语文案 surface 比对，以及 accordion、date-range-picker、dialog、
pro-table、select、tabs 六组组件的明暗视觉冻结基线。至此报告无遗留项。

## 关键工程决策

- **运行时依赖克制**：sonner / resizable / react-hook-form / cmdk 四个在 React 侧依赖第三方库的
  组件，用 Vue 响应式与 reka 原语自研（toast 队列、pointer 拖拽 + 钳制、受控表单、自研搜索过滤）。
  Chart 起初同样只做容器与样式壳，2026-11-20 起改为绑定 `@unovis/vue` 提供图形渲染层（见下方
  追加记录）；这是全包唯一新增的运行时依赖，未引入 vue-router / pinia / vue-i18n。
- **ReactNode → Vue 插槽**：所有 ReactNode props 统一映射为具名/作用域插槽（cell、actions、
  extra、trigger 等），可选回调用 `useAttrs()` 检测 `onXxx` 是否存在。
- **纯函数库先行**：`lib/{date,tree,filter-utils,transfer-utils,import-wizard-utils,csv,toast}`
  从 React 侧直接迁移或等价实现，组件层只做薄壳。
- **模板上提**：Tour 从应用模板上提为包组件，仪表盘改为渲染期解析 i18n key → 字符串。

## 已知差异（有意）

- Breadcrumb 的链接条目渲染 `<a :href>` 而非 RouterLink——包边界保持零 vue-router 依赖；
- Combobox / Command 使用自研过滤而非 cmdk；
- Chart 提供容器、config 变量、tooltip/legend 内容组件；2026-11-20 起改为绑定 unovis（`@unovis/vue`，shadcn-vue 同款）提供图形渲染层，并以 `ChartCrosshair`/`ChartTooltip` 再导出 + `renderChartTooltip` 助手保持单一样式来源（见补跑记录）；
- Rate 以 `readOnly` 判定交互性（Vue emit 恒存在，不等价 React 的可选 onChange）。

## 2026-11-20 追加：Chart 绑定 unovis

- 经确认打破"不捆绑图形库"决策：`packages/vue` 新增 `@unovis/vue` + `@unovis/ts` 依赖；
- `ChartCrosshair`/`ChartTooltip` 直接再导出 unovis 的 VisCrosshair/VisTooltip（shadcn-vue 同款），
  并补齐 xy 原语（VisXYContainer/VisAxis/VisGroupedBar/VisStackedBar/VisArea/VisLine/VisScatter/VisDonut）再导出；
- 新增 `renderChartTooltip`：把 ChartTooltipContent（唯一 tooltip 样式来源）挂载为 detached 元素，
  供 unovis 的 `template` 回调返回（unovis 约定返回 HTML 字符串或 HTMLElement）；
- unovis 数据模型与 recharts 不同：GroupedBar 的 `y` 返回"每组数值数组"，Area 是点模型
  （datum = 一个点，多系列 = 每系列一个 VisArea，容器 data 为各行）——chart demo 已按此重写；
- parity-vue 的 2 个 chart demo（basic/area-legend）全部改为 unovis 组合，浏览器验证
  柱状/面积渲染、悬停 tooltip（"Jul Revenue 34800"）与图例均正常，无页面错误；
- ChartContainer 只保留 unovis 选择器，React 时代的 `recharts-*` 死样式已移除；
- 包外复验：`pnpm pack` 后在全新消费目录 npm 安装，Node SSR 成功导入 12 个 chart 导出
  并渲染 ChartContainer，确认 unovis 未破坏服务端渲染。

## 2026-11-23 追加：Vue 视觉基线扩展到全部组件

- 原有 parity 视觉基线只有 6 个 pilot 组件 × 明暗，且是**跨版本逐像素比对**（Vue demo 截图
  直接对 React 冻结基线），因此只能覆盖刻意对齐到像素级的那一小组；
- 新增独立的 Vue **自基线**套件：`playwright.vue-visual.config.ts` + `e2e-vue-visual/vue-visual.spec.ts`，
  遍历 registry 全部 90 个组件 × light/dark = **180 张基线**，存于
  `e2e-vue-visual/__screenshots__/vue-visual.spec.ts/`，与 React 的 2.2.0 冻结目录隔离；
- 复用 parity 的 `openComponent` helper：固定时钟、主题存储键与等待窗口一致，截图只依赖代码；
- 基线在 `mcr.microsoft.com/playwright:v1.64.1-noble` 容器中生成与校验，避免跨平台字体漂移；
  命令：`pnpm test:vue-visual:docker:update`（生成）/ `pnpm test:vue-visual:docker`（校验）；
- `parity/baseline/vue-visual-1.0.0/manifest.json` 对 180 张 PNG 做 sha256 冻结，
  `pnpm check:vue-visual:freeze` 校验数量与哈希，防止基线被静默改动；
- 门禁新增：`test:vue-visual`（本地比对）、`test:vue-visual:docker`（容器比对）、
  `check:vue-visual:freeze`（清单校验）；生成/更新入口为 `test:vue-visual:docker:update`
  与 `vue-visual:freeze`；
- 实测：180 项全部通过，基线总量 5.2 MB；原有 6 个 pilot 跨版本基线仍 42/42 通过，
  两套基线互不干扰。

## 2026-11-23 追加：Vue 接入主文档站

- 约束：主站是 Rspress（React/Webpack），CSP 为 `frame-ancestors 'none'` + `X-Frame-Options: DENY`，
  既不能 iframe 嵌 Vue 演示站，也无法在站内渲染 `.vue` SFC；且 14 张布局冻结基线是全页截图，
  改顶栏/页脚会漂移；
- 方案：新增 `/vue/` 专区（概览 + 组件清单，en/zh 共 4 页），只给它单独配侧栏；顶栏与页脚保持
  冻结态不动。入口放在组件索引页（不在冻结截图范围内）的跨版本链接；
- 数据：`apps/docs/scripts/build-vue-data.mjs` 从 `packages/vue/registry.json` + parity-vue 的
  demo meta 生成 `apps/docs/generated/vue-components.json`（90 组件 / 181 demo / 7 Vue-only），
  接入 docs 的 build/check 脚本，防止清单漂移；
- 组件清单页用 `apps/docs/theme/VueIndex.tsx` 展示三分类卡片、统计与 demo 源码链接；样式为
  独立的 `.fish-vue__*`，不影响 React 页面；
- 浏览器验证：概览页侧栏正确显示 Vue 3 分组；清单页渲染 90 张卡片 / 7 个 Vue-only 标签 /
  181 个 demo 链接；组件索引页跨链 `/vue/components` 可用；中文页正常。
- React 冻结面：`check:parity:freeze` 460 文件全匹配，docs visual 基线未改动。

## 2026-11-23 追加：Vue 契约校验扩展到全部组件

- `parity/targets/vue.json` 的 `contract.scope` 从 `pilot` 改为 `all`，Vue 侧契约测试从 6 个 pilot
  扩展到全部 83 个 React 对应组件：逐组件校验 demo 数量、每个 demo 的 preview/源码块与控制台无错；
- 前提：React 167 个 demo id 在 Vue 侧全部存在，Vue 另有 14 个 demo 来自 7 个自有组件，故 demo
  表面检查对 83 个组件逐一成立；API 表逐行比对仍只适用于 React（exact 模式），Vue 用 reference
  模式记录 6 个 pilot 的 API 差异，不假装存在；
- `api.deviations` 的完整性校验仍只针对 6 个 pilot，扩展 scope 不影响该检查；
- 结果：`pnpm test:parity:vue` 从 42 项增加到 **119 项全过**（83 契约、12 docs-surface、6 行为、
  12 跨版本视觉、6 axe）；其余 parity spec 各自独立读取 pilot，不受 scope 影响。
