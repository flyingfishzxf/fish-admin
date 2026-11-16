# Vue 模板项目页（Slice 11）设计

> 状态：范围已定，待实施。
> 基线：`main` @ `bf26050`（Slice 1–10 全部完成并已 `--ff-only` 合并）。
> 本 Spec 是实施计划的绑定权威；实施中的冲突以本文档为准。

## 1. 目标

补上 `/projects`：**作品集统计 + 精选项目 + 六个筛选 + 看板/列表两种视图 + 分页 + 新建项目**，以及 `/projects/:id` 详情：**四个页签（概览/任务/预算/复盘）+ 成员抽屉 + 设置抽屉 + 归档**。

**成功定义**：`project:manage` 用户能新建项目、在卡片与表格间切换、按状态/优先级/负责人/部门/归档筛选、改变排序、进详情改任务状态、勾选里程碑、编辑预算条目、打分写复盘、改成员与标签、归档；`project:read` 只读用户能看全部但不能写。全部门禁通过，`parity/**` 与 `*-linux.png` 零改动。

## 2. 背景

- React 侧 `features/projects` **3,427 行**，是本仓库最大的一块：列表页 800、详情壳 206、概览 459、任务 326、预算 168、复盘 145、新建弹窗 365、卡片 179、徽章 68、成员抽屉 100、设置抽屉 162，加 api/search/queries。
- **后端与文案全部就绪**：9 个端点（列表/详情/新建/更新/任务增改/里程碑勾选/附件上传删除），`projects` 命名空间 **237 个键**。不新增 locale 键，不改 mock。
- 可复用（Slice 8–10 已建）：`Timeline.vue`、`TagsInput.vue`、`Dropzone.vue`、`Card.vue`、`Segmented.vue`、`Pagination.vue`、`AlertDialog.vue`、`DetailDrawer.vue`、`EmptyState`、`ErrorState`、`PageHeader`、`useTransientMessage`、`features/audit/tones.ts`（时间线配色与图标）。
- `packages/vue` 缺少：`Carousel`、`Statistic`、`Trend`、`QueryFilter`、`Combobox`、`Cascader`、`Progress`、`Rate`、`Stepper`、`Transfer`、`EditableTable`、`Calendar`、`Descriptions`、`Collapsible`、`TimePicker`、`Textarea`、`Select`（有）、`DetailPage`。

## 3. 关键决策

### 3.1 缺少的原语，逐个替代

| React                                | 这里                                                                | 理由                                                                      |
| ------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Carousel`（精选项目轮播）           | 精选区渲染成横向两个卡片                                            | 轮播的核心是「一次看一个」，而精选通常只有 1–2 个；箭头与圆点不值这个成本 |
| `Statistic` + `Trend`                | 复用用户页/工作台的 KPI 卡片样式（`Card` + 数字 + 图标 + 小字后缀） | 视觉一致，代码更少                                                        |
| `QueryFilter`（可折叠筛选条）        | 一排 `Input` + 三个 `Select` + 归档开关                             | 六个字段一屏放得下，不需要「更多」折叠                                    |
| `Combobox` / `Cascader`              | `Select`（负责人用扁平用户列表，部门用 `flattenDepartments` 路径）  | 与文件页同一套取舍                                                        |
| `Progress`                           | 内联 `<div role="progressbar">` + 宽度百分比                        | 一个 8 行的组件不值得进包                                                 |
| `Rate`                               | 五个星形按钮，`aria-pressed` + `aria-label`                         | 原生按钮已经可键盘操作                                                    |
| `Stepper`                            | 三个步骤按钮 + `aria-current="step"`                                | 复盘三步不涉及复杂状态机                                                  |
| `Transfer`                           | 用户复选列表 + 搜索框（owner 禁用）                                 | 双栏穿梭的收益在「大量候选项」，这里一屏能放下                            |
| `EditableTable`                      | 每行两个受控输入 + 删除按钮 + 添行                                  | 只有两列                                                                  |
| `Calendar`（里程碑日历）             | 按日期分组的分组列表 + 复选框                                       | 月历是本切片最贵的一块，而里程碑列表信息更全                              |
| `Descriptions`                       | `<dl>`                                                              | 与用户详情页一致                                                          |
| `Collapsible`（已完成分组 / 危险区） | 「显示已完成」按钮 + 危险区直接展开                                 | 折叠是为了省空间，这两处空间都够                                          |
| `Textarea` / `TimePicker`            | 原生 `<textarea>` / `<input type="time">`，套同样的边框类           | 避免为两个控件造组件                                                      |
| `DetailPage`                         | 详情页头部内联（返回 / key 方块 / 标题 / 徽章 / 元信息 / 动作）     | 与用户详情页同一做法，只有一个消费者                                      |

### 3.2 列表：卡片是主视图，表格带排序

看板视图是 3 列卡片网格（`md:grid-cols-2 xl:grid-cols-3`），列表视图是 7 列表格，四个表头可点（名称/进度/截止/预算）。排序走服务端参数（`sort` + `order`），与用户页一致：点同一列翻转方向，换列则从 `asc` 开始。

### 3.3 详情：四个页签各自独立，页面只负责取数与失效

`ProjectDetailPage.vue` 持有查询与 `invalidate`，四个页签通过 `detail` + `canManage` 通信，各自发自己的变更请求。这与 React 的结构相同，避免把六种变更全塞进页面。

### 3.4 概览：里程碑按日期分组，放弃月历

React 用 `Calendar` 在日期格上打点，点一天切换当天所有里程碑。本页把「同一天的所有里程碑」渲染成一组，组头是日期 + 全选复选框，下面每条形一行。行为等价（点组头 = 切换当天全部），但不需要日历网格与日期解析。

### 3.5 任务：四组手风琴改为四个分组卡片

React 用 `Accordion`（默认展开 todo/doing）。这里四组全部展开、每组一个卡片：任务数不多，收起反而多一次点击。每行的状态下拉改状态，`canManage` 之外禁用。

### 3.6 预算与复盘：本地草稿 + 显式保存

预算表的每一行都是草稿（label/amount），点保存才 `PATCH budgetItems`；复盘同理（rating + retro）。两个页签都要在切换项目或数据刷新时重置草稿 —— 用 `watch(() => project.id)` 与 `watch(budgetItems)`。

### 3.7 档案与设置：抽屉，复用既有原语

成员抽屉用复选框列表 + 搜索 + 保存（owner 始终保留，保存时并入）。设置抽屉用 `TagsInput`（现成）+ 原生时间输入 + 危险区归档确认。两者都用 `DetailDrawer`。

## 4. 范围

**要做**

- `router.ts`：`/projects` 与 `/projects/:id`（`project:read`）；`IMPLEMENTED_PATHS` 加 `/projects`。
- `features/projects/search.ts`（照抄校验边界：pageSize 3–24）、`api.ts`、`queries.ts`。
- `features/projects/project-badges.vue` 等价物：`ProjectKeyMark.vue`、`ProjectStatusBadge.vue`、`ProjectPriorityBadge.vue`。
- 列表：`ProjectsPage.vue`、`ProjectCard.vue`、`ProjectCreateDialog.vue`。
- 详情：`ProjectDetailPage.vue`、`ProjectOverviewTab.vue`、`ProjectTasksTab.vue`、`ProjectBudgetTab.vue`、`ProjectReviewTab.vue`、`ProjectMembersDrawer.vue`、`ProjectSettingsDrawer.vue`、`ProgressBar.vue`（应用层小组件）。
- 测试：纯逻辑（search 校验、状态/优先级映射、进度与利用率计算、任务分组）、列表页（加载/空/筛选/视图/排序/分页/权限/归档）、新建弹窗、详情页（四页签内容与权限）、概览（里程碑切换、附件上传删除）、任务（新增与改状态）、预算（草稿保存）、复盘（打分与保存）、成员/设置抽屉。
- e2e：新建项目并出现在卡片里、筛选与列表视图、只读访客没有新建与写入、详情四页签走一遍。
- 文档：两份 `docs/*/vue-template.md`（功能、路由、偏离表、导航 15/16、计数）、README、CHANGELOG。

**不做**

- 精选项目轮播、里程碑月历、双栏穿梭、可编辑表格的富交互（行内取消/校验气泡）、趋势箭头组件。
- URL 承载筛选（与用户页/文件页一致）。
- 项目附件的图片轮播与预览大图（列表 + 上传 + 删除足够）。

## 5. 验收

1. `/projects` 可用；`project:read` 进页面，`project:manage` 才有新建、归档、任务与预算的写入口。
2. 四个 KPI（进行中/预算/已花+利用率/完成度）来自 `fetchProjects({pageSize:50})` 的聚合，与列表筛选无关。
3. 精选区只显示 `featured` 项目；没有则显示空文案；点「打开」进详情。
4. 看板与列表切换不重新请求；列表点表头改变 `sort`/`order` 并回到第 1 页。
5. 搜索 300ms 防抖；六个筛选任一变化都回到第 1 页；有筛选时的空态给「清除筛选」。
6. 新建项目必填名称/键/描述/负责人，提交后列表出现该项目；键重复显示服务端错误。
7. 详情：头部显示 key/名称/状态/优先级/负责人/部门/成员数/截止日；四个页签各自渲染内容。
8. 概览：里程碑组头可一键完成/取消当天全部；附件上传后出现在列表，可删除。
9. 任务：新增任务（标题/负责人/状态/截止日）后出现在对应分组；改状态下落正确。
10. 预算：改一行金额后「保存」发出 `budgetItems`；利用率按草稿实时计算。
11. 复盘：未打分时保存给出校验错误；打分 + 备注保存成功后显示提示。
12. 成员：保存时 owner 一定在 `memberIds` 里。设置：标签与提醒时间保存；归档后回到列表。
13. `pnpm test:vue-template` 全绿；e2e 44 条；`parity/**` 零差异；`packages/vue` 导出面与所有 `package.json` 未变。

## 6. 风险

1. **这块体量最大（React 3,427 行）**，一次提交会让 review 失去意义。按「数据层 + 列表」「详情 + 概览 + 任务」「预算/复盘/抽屉」拆三个提交，每个都能独立构建通过。
2. **进度与利用率两套算法**：项目自带 `progress` 字段，任务完成度与预算利用率是算出来的。三者不要混用：KPI 用 `progress` 平均值，任务页签用任务计数，预算页签用草稿求和。
3. **里程碑按天分组**依赖 `dayKey` 的本地时区行为；测试固定用 `2026-11-01T00:00:00.000Z` 这类整点，避免时区把日期推一天。
4. **预算草稿与刷新竞态**：保存后 `invalidate` 会带回新数据，`watch(budgetItems)` 会重置草稿——顺序正确，但如果用户在请求飞行中继续编辑，编辑会丢。保存按钮在飞行中禁用。
5. **成员保存要与 owner 合并**：只发 `selected` 会把 owner 踢出成员列表，服务端不会替你补。
