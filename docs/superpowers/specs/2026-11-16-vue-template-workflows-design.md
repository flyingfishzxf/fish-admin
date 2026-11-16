# Vue 模板审批流页面（Slice 12）设计

> 状态：范围已定，待实施。
> 基线：`main` @ `12c1b5d`（Slice 1–11 全部完成并已 `--ff-only` 合并）。
> 本 Spec 是实施计划的绑定权威；实施中的冲突以本文档为准。

## 1. 目标

补上最后一个导航页 `/workflows`：**三个视图页签（我发起 / 待我审批 / 全部）+ 五个筛选 + 表格 + 分页**，以及 `/workflows/:id` 详情：**表单快照、审批动作（通过/驳回/转交）、评论、步骤时间线、原始快照**。

**成功定义**：`workflow:read` 用户能按视图与筛选翻看审批单；当前审批人打开待办单能补一句话并通过/驳回/转交；任何人能给单据留言；已结束的单据不显示动作面板；非当前审批人也不显示。全部门禁通过，`parity/**` 与 `*-linux.png` 零改动。

## 2. 背景

- React 侧 `features/workflows` **1,239 行**：列表 203、筛选 145、列定义 167、详情 438、徽章 62，加 api/queries/search（76/60/88）。是本仓库除工作台外最小的一块。
- **后端与文案就绪**：5 个端点（列表 / 详情 / 审批人 / 决策 / 评论），`workflows` 命名空间 94 个键。不新增 locale 键，不改 mock。
- **`packages/vue` 这次给出的比缺的多**：`Tabs`、`Select`、`DateRangePicker`（含区间预设与日历）、`Badge`、`Dialog` 都有；缺的是 `ProTable`、`Descriptions`、`JsonViewer`、`Popconfirm`、`Textarea`、`DetailPage`。
- 可复用：`Timeline.vue`、`Card.vue`、`AlertDialog.vue`、`Pagination.vue`、`EmptyState`、`ErrorState`、`PageHeader`、`useTransientMessage`。

## 3. 关键决策

### 3.1 日期区间直接用包里的 `DateRangePicker`

`DateRangeValue` 就是 `{ from?: string; to?: string }`（`YYYY-MM-DD`），与 `WorkflowSearch` 一一对应；组件自带预设按钮与日历弹层。这是本仓库第一个**不需要替代**的企业级原语，五个预设直接映射 `workflowRangePreset()` 的区间。

### 3.2 表格用原生 `<table>`，不用 `DataTable`

React 用 `ProTable` 是为了虚拟滚动与列固定，但本页 10–50 行、七列、无排序、无列控制。用 `<DataTable>` 会为了 `getCoreRowModel` 引入一层 tanstack 状态却不使用它的任何能力。直接表格 + 行点击进详情，与文件页/项目页保持同一写法。

### 3.3 三个确认合并成一个对话框

通过、驳回、转交各需要一个确认，但三者的标题、描述、确认文案不同。用 `pendingDecision: 'approve' | 'reject' | 'transfer' | null` 驱动**一个** `AlertDialog`，而不是三个常驻实例；确认按钮的 `variant` 随 decision 变化（驳回为 destructive）。

### 3.4 动作面板的显示条件写死在一处

`status === 'pending' && currentApproverId === me` 且拥有 `workflow:approve`。三者缺一不可，所以放在一个 `actionable` computed 里，模板只判它。React 用 `Can` 包一层并在内部再判；这里把权限并进同一个判断，少一层嵌套。

### 3.5 评论与决策分别是独立变更

两个 mutation 各自失效 `['workflows']` + `['audit-events']`。评论提交后清空输入但**不**跳转；决策提交后详情会重新取数，面板自然消失（状态不再是 pending）。

### 3.6 快照用 `<dl>` 而不是 JSON 查看器

React 用 `JsonViewer` 展示 `code/type/status/initiator/amount/form/approvers/createdAt/completedAt`。这里用两列 `<dl>`，键名保持原始字段名（`createdAt` 等），与项目概览的元数据同一约定。

### 3.7 视图切换是 URL 之外的本地状态

`mine | pending | all` 存在 `reactive` 的 `search.view` 里，切换时回到第 1 页。与用户/文件/项目页一致，不写 URL。

## 4. 范围

**要做**

- `router.ts`：`/workflows` 与 `/workflows/:id`（`workflow:read`）；`IMPLEMENTED_PATHS` 加 `/workflows`。
- `lib/i18n.ts`：`workflows` 加进 `REQUIRED_NAMESPACES`（前两个切片各漏过一次）。
- `features/workflows/search.ts`（含 `isValidDay`、`workflowRangePreset`、校验）、`api.ts`、`queries.ts`。
- `WorkflowBadges.ts` + `WorkflowStatusBadge.vue` / `WorkflowTypeBadge.vue` / `WorkflowCodeMark.vue`。
- 列表：`WorkflowsPage.vue`、`WorkflowFilters.vue`、`WorkflowTable.vue`。
- 详情：`WorkflowDetailPage.vue`、`WorkflowDecisionPanel.vue`、`WorkflowComments.vue`。
- 测试：纯逻辑（区间预设、日期校验、搜索校验）、列表页（视图页签、筛选、分页、空态、权限）、详情页（页头、表单、时间线、动作面板条件、评论提交）。
- e2e：待办视图看到单据并进详情、通过一单后状态变化、筛选与视图切换、只读访客没有动作面板。
- 文档：两份 `docs/*/vue-template.md`（功能、路由、偏离表、导航 16/16、计数）、README、CHANGELOG。

**不做**

- 虚拟滚动、列固定（React 的 `ProTable` 能力，本页用不上）。
- 新建审批单（React 也没有：单据由 mock 种子产生）。
- 批量操作、导出。

## 5. 验收

1. `/workflows` 可用；`workflow:read` 进页面；导航出现 Workflows，**16/16** 齐了。
2. 三个视图页签切换视图并回到第 1 页；空态文案随视图变化（`mine`/`pending`/`all` 各一组）。
3. 搜索 300ms 防抖；状态/类型/发起人/日期区间任一变化回到第 1 页；有筛选时出现「清除」。
4. 表格七列 + 打开按钮；点行或点按钮都进详情；`amount` 为空显示 `—`；已结束单据的「当前审批人」列显示 `closed`。
5. 分页支持 10/20/50 页大小。
6. 详情：页头显示编号/发起人/创建时间/金额/等待谁；表单按字段渲染；时间线按步骤渲染图标与色调。
7. 仅当「pending 且当前审批人是我且拥有 workflow:approve」时出现动作面板；通过/驳回/转交都要先确认；转交必须选人才能点。
8. 决策成功后提示并刷新；评论提交后出现在列表且输入清空。
9. `pnpm test:vue-template` 全绿；e2e 48 条；`parity/**` 零差异；`packages/vue` 导出面与所有 `package.json` 未变。

## 6. 风险

1. **`DateRangePicker` 是第一次使用**：它是 `defineModel` 组件，`v-model` 必须给一个对象；预设数组要每次语言变化重新构造。
2. **动作面板依赖「我是当前审批人」**：种子里 `pending` 单据的审批人不一定是登录用户，e2e 要挑一个确实待当前用户处理的单，否则面板永远不出现。测试里用 mock 数据显式指定 `currentApproverId`。
3. **三个确认共用一个对话框**时，`pendingDecision` 必须在关闭时清空，否则下一次打开会带着上一次的文案。
4. **分页页大小**：`Pagination.vue` 只处理页码；页大小要单独一个 `Select`，且切换后页码回 1。
5. **时间线的 `description`** 只在有评论时有内容，空串会让行高塌陷——渲染前过滤空值。
