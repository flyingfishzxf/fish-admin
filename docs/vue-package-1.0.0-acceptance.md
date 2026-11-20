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

- **零新增运行时依赖**：sonner / resizable / react-hook-form / recharts / cmdk 五个在 React
  侧依赖第三方库的组件，全部用 Vue 响应式与 reka 原语自研（toast 队列、pointer 拖拽 + 钳制、
  受控表单、config 驱动图表 CSS 变量、自研搜索过滤）。
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
- parity-vue 的 3 个 chart demo（basic/area-legend）全部改为 unovis 组合，浏览器验证
  柱状/面积渲染、悬停 tooltip（"Jul Revenue 34800"）与图例均正常，无页面错误。
