# Vue 模板图表与报表（Slice 6）设计

> 状态：范围已定，待实施。
> 基线：`main` @ `80856ae`（Slice 1–5 全部完成并已 `--ff-only` 合并）。
> 本 Spec 是实施计划的绑定权威；计划中的冲突以本文档为准。

## 1. 目标

补上 Vue 模板唯一的「整类能力空白」：**图表**。让 `/` 与 `/reports` 两页从「KPI + 列表」补成 React 版的完整形态，并把报表的 CSV 导出补齐，使这两个页面在功能上可判定为收口。

**成功定义**：`/` 出现收入面积图、访问分组柱图（带图例）、渠道环图，`/reports` 出现趋势面积图（可切收入/订单、带目标参考线）与渠道环图，两页的图表都随语言、主题、窗口宽度正确重绘；`/reports` 能把汇总与明细导出为 CSV；hover 有单点提示；全部门禁通过，`parity/**` 与 `*-linux.png` 零改动。

## 2. 背景

- Slice 5 spec §3.2 把「图表、CSV」明确排除在外，理由是它们依赖 `packages/vue` 未导出的 `ChartContainer`。本切片正面解决这个依赖。
- React 侧的图表全部基于 Recharts（`packages/ui/src/components/ui/chart.tsx`，346 行）：`ChartContainer` 把 `config` 里的 `color` 织成 `--color-<key>` CSS 变量，`ChartTooltipContent` / `ChartLegendContent` 是自绘的 HTML 浮层。实际用到的图形只有三种：**面积**、**分组柱**、**环**。
- Vue 侧 `features/dashboard` 只有 `KpiCards.vue` 与 `ActivityList.vue`，`DashboardPage.vue` 用一张「最近活动」卡填满原图表区；`features/reports` 只有 KPI 与明细表（`report-charts.tsx` 220 行、`csv.ts` 20 行在 Vue 侧完全没有对应物）。
- 数据层与格式化层**已经齐备**：`DashboardData` 的 `revenue[].{date,value}`、`traffic[].{date,visits,signups}`、`channels[].{name,value}`，`ReportData` 的 `series[].{date,revenue,orders,days}` 与 `channels[]`；`lib/format.ts` 与 React 侧函数签名逐字一致（`formatCurrency` / `formatCompactNumber` / `formatDate` / `formatPercent`）。配色变量 `--chart-1`…`--chart-5` 由 `@fish-admin/tokens` 提供，`theme.css` 已把它们注册为 `--color-chart-N`。
- i18n 键**已存在**：`dashboard:charts.{revenue,traffic,channels,activity}.{title,description}`、`dashboard:series.*`、`dashboard:channels.*`、`reports:trend.*`、`reports:channels.*`、`reports:actions.export*`。本切片不新增任何 locale 键。

## 3. 关键决策

### 3.1 自写 SVG 图表，不引入图表库

Recharts 只服务于 React；Vue 侧的等价物需要 `echarts`（约 1 MB）或 `chart.js`。三种图形、九处实例，不值得为此引入一个运行时依赖，也违背项目「不为单一调用点加依赖」的既有规则。自写 SVG 的额外好处是可以逐像素对齐 Recharts 的输出（Recharts 本身也是 SVG），并让测试直接断言 `path` 结构。

代价是必须自己实现四件事，本切片逐一落成纯函数并单测：

| 能力       | 实现                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Y 轴刻度   | `niceTicks(max, count)`：1/2/5×10ⁿ 步长向上取整，始终含 0                                                   |
| 平滑曲线   | `monotonePath(points)`：Fritsch–Carlson 单调三次插值，等价 Recharts `type="monotone"`，不会过冲产生负值下凹 |
| 环图扇区   | `arcPath(cx, cy, inner, outer, startAngle, endAngle)`：`A` 命令拼外弧 + 内弧反向，`strokeWidth=0`           |
| 自适应宽度 | `useChartSize()`：`ResizeObserver` 测容器宽，jsdom / 首帧回退 640                                           |

### 3.2 组件落 `apps/vue-template/src/components/ui/chart/`

`packages/vue` 的导出面仍然冻结（Slice 1 起的一贯约束），所以图表是应用级组件。四个文件：

```
components/ui/chart/
  chart.ts            工具：niceTicks / monotonePath / arcPath / 类型
  ChartShell.vue      容器：测量 + 网格 + 双轴 + hover 索引
  AreaChart.vue       面积图（渐变填充 + 可选目标参考线）
  BarChart.vue        分组柱图（圆角 3 + maxBarSize 18 + 图例）
  DonutChart.vue      环图（inner 62% / outer 92% / paddingAngle 3）
```

### 3.3 图表配色的传递方式

React 用 `config: ChartConfig` 把 `color` 织成 CSS 变量再让 Recharts 消费。Vue 侧不需要这层间接：`series` 直接带 `color`（CSS 值，如 `var(--chart-1)` 或用户选的 `#6366f1`），SVG 的 `fill` / `stroke` 直接绑它。图表内部只用 `var(--border)` 画网格、`var(--muted-foreground)` 画刻度文字，主题切换自动跟随。

用户可选颜色的来源是 `/reports` 的 `ColorPicker`，所以颜色必须是运行时可变的字符串，不能编译期常量。

### 3.4 与 React 的刻意差异

| 项            | React                     | Vue                                    | 理由                                          |
| ------------- | ------------------------- | -------------------------------------- | --------------------------------------------- |
| 图表实现      | Recharts                  | 自写 SVG                               | 见 §3.1                                       |
| 系列配置      | `ChartConfig` → CSS 变量  | `series[].color` 直传                  | 少一层运行时注入                              |
| 图表 tooltip  | Recharts `Tooltip`        | hover 索引 + 绝对定位浮层              | 只支持单点，够用                              |
| 懒加载        | `React.lazy` + `Suspense` | 直接静态导入                           | 图表组件合计不足 15 KB，分包没有收益          |
| `ColorPicker` | `packages/ui` 导出        | 应用级 `components/ui/ColorPicker.vue` | 导出面冻结；预设 8 色 + hex 输入 + 原生取色器 |

## 4. 范围

### 4.1 包含

| 能力         | 内容                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| 图表工具     | `chart.ts` 四个纯函数 + 单测                                                          |
| 面积图       | 渐变填充（4% 0.35 → 96% 0.02）、`strokeWidth 2.5`、`dot=false`、可选虚线参考线 + 角标 |
| 柱图         | 两组系列并排、`radius 3`、`maxBarSize 18`、底部图例                                   |
| 环图         | 环扇区 + `paddingAngle 3`、右侧图例列表（圆点 + 名称 + 数值 + 占比条）                |
| hover 提示   | 单列命中区、指示线、跟随浮层（日期 + 系列名 + 格式化值）                              |
| Dashboard    | 三张图按 `lg:grid-cols-3` 排布（收入 2 列 / 渠道 1 列 / 访问 2 列 / 活动 1 列）       |
| Reports 趋势 | metric 切换（收入/订单）、目标参考线、颜色选择、目标滑块 + 数字输入                   |
| CSV          | `toCsv` / `downloadCsv`（BOM + CRLF + 引号转义），汇总与明细两个按钮                  |
| 控件         | `RadioGroup`、`Slider`、`InputNumber`、`ColorPicker` 四个应用级组件 + 单测            |
| 测试与文档   | 每个新组件单测；两页 e2e；双语文档与 `CHANGELOG`；全量验收                            |

### 4.2 不包含

- `/projects`、`/workflows`、`/files`、`/users/:id` 四块页面（下一批）。
- 服务端菜单 `GET /menu`。
- 其余页面深度差价（users 列控件/保存视图/导入、roles 向导、audit JSON viewer、profile 裁剪、security 恢复码）。
- 像素级 parity 与任何新视觉基线。
- `packages/ui/**`、React `src/**`、`packages/vue/src/**` 的任何改动。

## 5. 验收

1. `pnpm test:vue-template` 全绿，新增测试覆盖四个工具函数、四个图表组件、四个控件、两页接线。
2. `pnpm test:e2e:vue-template` 全绿，新增 `charts-reports.spec.ts` 覆盖：Dashboard 三图渲染、切 7/30 天重绘、Reports 切 metric、拖目标滑块、导出 CSV 触发下载。
3. `git diff -- 'parity/**' '*-linux.png'` 为空。
4. 两棵树 `git status --short` 为空（SDD 目录除外）。

## 6. 风险

| 风险                           | 应对                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| 自写插值在断点处过冲           | Fritsch–Carlson 保单调；单测断言「无控制点超出相邻值区间」 |
| jsdom 无 `ResizeObserver`      | `useChartSize` 降级到固定宽度，测试断言不依赖具体像素      |
| 环图扇区角度累计误差致首尾缝隙 | `arcPath` 以累计角度计算，末段强制闭合到 `2π`              |
| 图表色在深色主题下对比不足     | 全部用 tokens 的 `--chart-N`，不写死品牌色                 |
