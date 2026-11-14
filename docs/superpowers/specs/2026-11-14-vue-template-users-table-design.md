# Vue 模板用户表格深化（Slice 7）设计

> 状态：范围已定，待实施。
> 基线：`main` @ `337bdd1`（Slice 1–6 全部完成并已 `--ff-only` 合并）。
> 本 Spec 是实施计划的绑定权威；计划中的冲突以本文档为准。

## 1. 目标

把 `/users` 从「能查能改的列表」补成 React 版的完整表格：**角色筛选、行选择与批量操作（改状态 / 删除 / 撤销）、CSV 导出、密度切换、列显示控制、保存视图、每页条数**。

**成功定义**：管理员能在 5 步内完成「筛出某角色的停用用户 → 全选 → 批量删除 → 撤销」；能导出当前筛选下的全部用户（不止当前页）；能把「我的常用视图」存下来一键回到同样的筛选与排序；刷新页面后密度、列显示、保存视图都还在。全部门禁通过，`parity/**` 与 `*-linux.png` 零改动。

## 2. 背景

- Vue 侧 `features/users` 现有 1,351 行（含 5 个测试文件），`UsersPage.vue` 301 行：搜索、状态筛选、排序、上一页/下一页、建/改/删。
- React 侧 `features/users` 2,887 行：`users-page.tsx` 864 行，另外还有列定义 307 行、导入向导接入、保存视图菜单 167 行、行右键菜单 104 行、详情页 194 行 + 概览 110 行 + 动态 111 行。
- 双语文档的偏离表已把这页的缺口逐项写死：**列控制、密度、保存视图、CSV、批量、导入、详情、动态**。本切片收掉其中 6 项，剩「导入」（Slice 9）与「详情 / 动态」（Slice 8）。
- 基础设施**已经在位**，不需要新建：
  - `packages/vue` 已导出 `ProTable` / `DataTable` / `BulkActionsBar` 与 `ProTableSelectionConfig`；`ProTable` 有 `selection` prop、`selection-actions` 插槽、`actions` 插槽；`DataTable` 已渲染 `data-state="selected"` 与选中底色，行点击 / 键盘 Enter 也已接好。
  - `roles/options` 已经在拉（`userOptionsQueryOptions`），角色下拉不需要新请求。
  - `lib/format.ts` 的 `formatRelativeTime` 已存在（`lastActiveAt` 列要用）。
- i18n 键**全部已存在**：`users:views.*`（title/saveHint/namePlaceholder/save/empty/saved/deleted/delete）、`users:density.*`、`users:bulk.*`（含 `selected_one/_other`、`deleteTitle_*`、`statusSuccess_*`、`undo`、`restoreSuccess_*`）、`users:columnGroups.*`、`users:filters.{role,allRoles}`、`users:actions.{exportCsv,columns}`、`common:table.{rowsPerPage,pageOf}`。本切片不新增任何 locale 键。

## 3. 关键决策

### 3.1 行选择用 tanstack 的 `rowSelection`，不用自建复选框列

`DataTable` 已经按 `row.getIsSelected()` 渲染底色与 `data-state`，`ProTable` 已经按 `selection.count > 0` 显示批量条。所以选择能力 = 在应用级 `columns.ts` 里加一个 `select` 列（表头全选、行内单项），把 `rowSelection` 交给 `useVueTable` 的 state，再把 `selection` prop 填上。**`packages/vue` 一行不用改。**

全选语义取「当前页全选」（`getIsAllPageRowsSelected` / `toggleAllPageRowsSelected`），与 React 一致：服务端分页下全选全库是另一种承诺，需要额外的「选中 N 条结果」交互。

### 3.2 密度需要给 `DataTable` 加一个可选 prop

行高差异是类名（`py-3` vs `py-1.5`），渲染在 `packages/vue` 内部，应用侧改不了。方案：`DataTable` 与 `ProTable` 各加 `density?: 'comfortable' | 'compact'`，默认 `comfortable`。

这是本切片**唯一**触碰 `packages/vue` 的地方，且**不新增导出**（只是既有组件的可选 prop）。默认值保持原样，`apps/parity-vue` 的六个场景没有传这个 prop，视觉基线不受影响。

### 3.3 CSV 帮手从 `features/reports` 提到 `lib/`

`features/reports/csv.ts` 已经有 `toCsv`（BOM + CRLF + 引号转义）与 `downloadCsv`（及时 `revokeObjectURL`），测试 6 条。用户导出是第二个调用点，按项目既有惯例（`lib/format.ts`、`lib/list-page.ts`）提到 `lib/csv.ts`，`reports` 改为从 `lib` 导入。移动而不是复制：两个 `toCsv` 迟早会漂移。

导出范围是**当前筛选下的全部用户**，不是当前页：小数据集按 `pageSize=100` 循环到 `pageCount`，`dataset=large` 时一次性取 5000（与 React 同策略）。导出期间按钮进 loading 且禁用。

### 3.4 列显示控制：只做可见性，不做列宽与列序

React 用 `DataTableViewOptions` 支持可见性 + 拖拽列序 + 拖拽列宽。Vue 的 `DataTable` 没有列宽拖拽（`headClass` 注释已说明「resizing is not ported」），做列序拖拽要动表头结构。

所以只做**可见性**：应用级 `ColumnOptions.vue`，读 `table.getAllLeafColumns()` 过滤 `getCanHide()`，标签取列的 `meta.label`。持久化到 `localStorage` 的 `fish-admin:users-table-layout`，值形如 `{ "visibility": { "department": false } }`。`select` 与 `actions` 列 `enableHiding: false`，不出现在菜单里。

### 3.5 保存视图：照搬 React 的存储形状，键按用户隔离

`fish-admin:users-views:<userId>`，数组、新的在前、上限 10 条、名称截断 40 字符、解析失败返回空数组。视图保存 `{ q, roleId, status, sort, order, pageSize }`——**不存 page**，应用视图等于「回到这个筛选的第一页」。

两个应用不同端口（5173 / 4177）即不同 origin，localStorage 不互通，所以键名与 React 相同不构成耦合。

### 3.6 批量删除的撤销用页内通知，不引入 toast 库

React 用 sonner 的 `toast.success(..., { action: { label: undo } })`。Vue 模板没有 toast，现有惯例是 `UsersPage` 里的 `feedback` 行 + `useTransientMessage`（通知页用过）。

做法：批量删除成功后显示一行通知，带「撤销」按钮；撤销调用 `POST /users/restore`，成功后再次失效 `['users']` 与 `['roles']`。通知自动消失，撤销只在通知可见期间可用——这与 toast 的行为一致。

### 3.7 与 React 的刻意差异

| 项           | React                                   | Vue                                | 理由                                           |
| ------------ | --------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| 密度控件     | 两个图标按钮（`List` / `AlignJustify`） | `Segmented` + 文本标签             | 文本标签无需 `aria-label` 猜测图标含义         |
| 列控制       | 可见性 + 列序 + 列宽                    | 仅可见性                           | 见 §3.4                                        |
| 批量结果提示 | sonner toast（含 action）               | 页内 `role="status"` 行 + 撤销按钮 | 不为一处调用引入 toast 运行时                  |
| 行右键菜单   | `ContextMenu` 子菜单                    | 不实现                             | `packages/vue` 无 ContextMenu 原语，导出面冻结 |
| 大数据集     | `dataset=large` 虚拟滚动 + 不分页       | 不实现                             | 该参数只在开发用，导出仍走 5000 分支           |

## 4. 范围

### 4.1 包含

| 能力       | 内容                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| 角色筛选   | `roleId` 进 `UsersSearch` 与 `UserListParams`，下拉取 `roles/options`    |
| 行选择     | `select` 列（全选 / 单选）、选中计数、切换筛选或翻页即清空               |
| 批量改状态 | 下拉选 active/invited/inactive，成功/失败/无变化三种提示                 |
| 批量删除   | 确认弹窗 → 删除 → 通知带撤销 → `POST /users/restore`                     |
| CSV 导出   | 当前筛选全量导出，含姓名/邮箱/角色/状态/部门/加入日期                    |
| 密度       | `comfortable` / `compact`，持久化到 `fish-admin:users-density`           |
| 列显示控制 | 可见性菜单 + 持久化；`users:columnGroups` 分组标题                       |
| 保存视图   | 保存 / 应用 / 删除，上限 10，按用户隔离                                  |
| 每页条数   | 25 / 50 / 100，进 `UsersSearch.pageSize`                                 |
| 测试与文档 | 单测覆盖新组件与新接线；e2e 覆盖批量删除撤销与导出；双语文档与 CHANGELOG |

### 4.2 不包含

- `/users/:id` 详情页与 `user-activity-tab`（Slice 8）。
- 导入向导 `ImportWizard`（Slice 9）。
- 行右键菜单、列序拖拽、列宽拖拽、虚拟滚动（见 §3.7）。
- 搜索状态同步到 URL（现状即内存态，改动会牵动整页数据流，另行评估）。
- 像素级 parity 与任何新视觉基线。

## 5. 验收

1. `pnpm test:vue-template` 全绿；新增测试覆盖：选择列全选/单选、批量删除后撤销、导出 CSV 的分页收集、密度持久化、列隐藏持久化、保存视图的存取与上限、角色筛选进 query key。
2. `pnpm test:e2e:vue-template` 全绿；新增 `users-bulk.spec.ts`：勾选两行 → 批量删除 → 通知 → 撤销 → 行回来；导出触发真实下载且文件名匹配 `users-YYYY-MM-DD.csv`。
3. `pnpm test:vue` 与 `pnpm test:parity:vue`（42）全绿，`packages/vue` 无新增导出。
4. `git diff -- 'parity/**' '*-linux.png'` 为空。
5. 两棵树 `git status --short` 为空（SDD 目录除外）。

## 6. 风险

| 风险                                  | 应对                                                           |
| ------------------------------------- | -------------------------------------------------------------- |
| 全选语义被误解为「全库」              | 批量条文案用 `users:bulk.selected`，并只在当前页全选时显示计数 |
| 导出中途失败留下半截文件              | 先收集全部数据再 `toCsv`，失败时不调用 `downloadCsv`           |
| 撤销窗口与列表刷新竞态                | 撤销按钮调用 restore 后再次 invalidate，页面数据以服务端为准   |
| 密度 prop 改变 `apps/parity-vue` 渲染 | 默认值 `comfortable` 与现渲染逐类名一致，parity 42 条兜底      |
| 保存视图与本页内存态不同步            | 应用视图一次性覆盖 6 个字段并回到第 1 页，不合并旧值           |
