# Vue 模板外壳与通知域（Slice 5）设计

> 状态：范围已定，待复核本文档。
> 基线：`workbuddy/main-a7370c6a` @ `9512527`（Slice 1–4 全部完成并已 `--ff-only` 合并回 `main`；未 push、未发布）。
> 本 Spec 是实施计划的绑定权威；计划中的冲突以本文档为准。

## 1. 目标

把 Vue 模板从「只有 sidebar 一种布局」补成「三种布局 + 可配置密度与内容宽度 + 命令面板 + 页签工作台 + 离线提示 + 产品导览」，并把通知域（铃铛、`/notifications` 页、投递偏好）整域交付，让 `NAV_CONTRACT` 的 16 个导航项中 **13 项**可达。

**成功定义**：`/settings` 的 Shell 卡片真实生效——切 `header` / `mixed` 布局立刻换骨架且刷新后保持；密度与内容宽度同样落 DOM 且持久化；`Ctrl/Cmd+K` 打开命令面板能跳转任意可达页面并执行主题/语言/退出动作；页签能开、关、固定、重开当前页，刷新后保持；`mixed` 布局下出现分组 Subnav；断网出现琥珀色横幅、恢复后提示；Dashboard 的四步导览能走完；通知铃铛显示服务端未读数，`/notifications` 能筛选、单条已读、全部已读、批量已读、打开详情抽屉、保存投递偏好；全部门禁与 parity 零改动。

## 2. 背景

- Slice 4 收口后 `IMPLEMENTED_PATHS` 为 12 项。剩余 4 项全在协作组：`/projects`、`/workflows`、`/files`、`/notifications`。
- Slice 4 spec §3.2 明确把「三布局、密度、内容宽度、命令面板、通知铃、App Tabs、Subnav、离线 banner、tour」整体延后到本切片，并因此让 `/settings` **不出 Shell 卡片**；本切片要反过来把那句话兑现，把 Shell 卡片补上。
- React 侧的壳层状态集中在 `src/stores/ui-store.ts`（zustand persist，key `fish-admin:ui`，`version: 1`，只持久化 `layout` / `density` / `contentWidth` / `tabs`，`commandOpen` 故意不落盘）。Vue 侧 `stores/ui.ts` 目前只有 `collapsed` / `mobileOpen`，**且完全不持久化**。
- Vue 侧壳层组件只有手写的 `AppSidebar.vue` + `AppHeader.vue`；`AppShell.vue` 硬编码 sidebar 布局、`main` 硬编码 `max-w-7xl`。`packages/vue` 没有 `Sidebar*` / `Popover` / `cmdk` 封装 / `Tour`。
- 通知域的 mock 端点齐全（`packages/mock/src/handlers/notifications.ts`）：列表、详情、单条已读、批量已读、全部已读、偏好读/写。`/notifications` 在契约里**不带权限键**，任何登录会话可见——这与 React 一致，是本切片不得引入权限门控的地方。
- `packages/i18n` 已有 `notifications.json`，`common:tabs.*`、`common:command.*`、`errors:offline.*`、`dashboard:tour.*`、`settings:shell.*` 也全部已存在且 en / zh-CN 键集合一致。**本切片不新增任何 locale 键。**

## 3. 范围

### 3.1 包含

| 能力         | 内容                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 三布局       | `sidebar`（现状）、`header`（顶部横行导航，无侧栏）、`mixed`（图标栏起步 + 分组 Subnav）；布局选择落在 `/settings` 的 Shell 卡片                                                                              |
| 密度         | `default` / `compact`，写 `html[data-density]`，`compact` 压缩 Tailwind `--spacing` 与侧栏宽度                                                                                                                |
| 内容宽度     | `contained`（`max-w-7xl`）/ `wide`（`max-w-[1600px]`）/ `full`（`max-w-none`），只作用于 `main`                                                                                                               |
| Shell 设置卡 | `/settings` 新增一张卡片，含布局三选、密度二选、宽度三选；**替换 Slice 4「不出 Shell 卡片」的决定**                                                                                                           |
| 命令面板     | `Ctrl/Cmd+K` 与页头搜索按钮；分组列出可达导航项 + 动作组（切主题、切语言、去 Profile、退出）                                                                                                                  |
| App Tabs     | 打开/关闭/固定/重开/关其它/关右侧/全关；持久化；角色变化后剔除不可达页签                                                                                                                                      |
| Subnav       | 仅 `mixed` 布局渲染，按当前页所属分组出胶囊 chips                                                                                                                                                             |
| 离线横幅     | 监听 `online` / `offline`，离线出琥珀色 `role="status"` 横幅，恢复后提示一次                                                                                                                                  |
| 产品导览     | 手写四步 Tour（sidebar / search / notifications / account），由 Dashboard 页头按钮触发，不持久化                                                                                                              |
| 通知域       | 页头铃铛（未读数 / 9+ / 全部已读）、`/notifications` 页（筛选、分页、批量已读、单条已读、详情抽屉）、投递偏好卡                                                                                               |
| 导航         | `IMPLEMENTED_PATHS` 由 12 项扩到 13 项（新增 `/notifications`）                                                                                                                                               |
| 应用级组件   | `Popover`、`Segmented`、`Pagination`、`CommandPalette`、`AppTopNav`、`AppTabs`、`AppSubnav`、`OfflineBanner`、`Tour`、`NotificationBell`，全部放 `apps/vue-template/src/components/`，**不进 `packages/vue`** |
| 测试与文档   | 每个新组件与通知页单测、壳层与通知 Playwright e2e、双语文档与 `CHANGELOG`、全量验收、机器走查                                                                                                                 |

### 3.2 不包含

- 协作组余下三页：`/projects`、`/projects/:id`、`/workflows`、`/workflows/:id`、`/files`（React 侧生产代码合计 **6258 行**，且依赖 `Segmented`/`QueryFilter`/`ProTable` 虚拟滚动/`Tree`/`Upload`/`Carousel`/`Cascader`/`ResizablePanel` 等约 50 个 `packages/vue` 未导出的原语）。它们整体后移到 Slice 6 及以后，理由见 §14.1。
- 服务端菜单 `GET /menu`（继续由静态 `NAV_CONTRACT` 派生；React 的 `enforceMenuAccess` 不做）。
- 通知的 `HoverCard` 悬停预览（改为行内直接展示摘要，见 §12）。
- 图表、CSV、保存视图、列控制、Users 详情页、虚拟滚动。
- 像素级 parity、新视觉基线、任何 `parity/**` 或 `*-linux.png` 改动。
- `packages/ui/**`、React `src/**` 的任何改动。

## 4. 全局约束

1. `packages/ui/**` 与 React `src/**` 只读；不改 React 行为。
2. 共享包 `packages/{contracts,i18n,mock}/src` 不出现 `react`、`@fish-admin/react`、`@/` 别名或 Lucide 组件导入；本切片**不改这三个包的 `src`，不新增 locale 键**。
3. 版本冻结：根 `2.2.0`、`@fish-admin/react` `0.2.2`、`@fish-admin/tokens` `0.1.1` 不变；`@fish-admin/vue`、`@fish-admin/vue-template`、`@fish-admin/parity-vue` 保持 `private: true` / `0.1.0`。
4. **`packages/vue` 的导出面不得扩大**（Slice 1 冻结的 parity 契约）；所有新组件落在应用层。
5. 「客户端权限不是安全边界」说明不得弱化或删除；`/otp` 的固定演示验证码提示必须保留。
6. 视觉基线不可再生：`parity/**` 与 198 张 `*-linux.png` 零改动；禁止 `--update-snapshots=all`、`test:visual:update`、`test:docs:visual:update`。
7. 双语同步：改一份 `docs/en/*.md` 同一提交更新对应 `docs/zh-CN/*.md`；`CHANGELOG.md` 只写英文；内部 spec / plan 不受此约束。
8. 每个任务结束前至少运行 `pnpm exec prettier --check <changed>`、`pnpm lint`、相关测试；声明「通过」必须附真实输出。
9. 每个任务一个本地 Conventional Commit；不得 `--amend`、不得 `--no-verify`；`push` / tag / publish 各需单独批准。

## 5. 架构

### 5.1 依赖

- 新增运行时依赖只有 `reka-ui` 的 `Popover` 用法（已是直接依赖，无需改 `package.json`）。
- **不引入** `cmdk`、`driver.js`、`floating-ui` 等新包：命令面板用「输入框 + 过滤数组 + Dialog」实现，导览用绝对定位 + Portal 实现，两者合计不到 300 行，比引一个只在一个地方用的库更容易审。
- 通知域复用 `@tanstack/vue-query`（已在用）与 `lib/api-client.ts`。

### 5.2 目录结构

```
apps/vue-template/src/
├─ components/
│  ├─ layout/
│  │  ├─ AppShell.vue            # 改：按 layout 分支
│  │  ├─ AppSidebar.vue          # 改：加 data-tour、rail 收起、Ctrl+B
│  │  ├─ AppTopNav.vue           # 新：header 布局的横行导航
│  │  ├─ AppTabs.vue             # 新：页签工作台
│  │  ├─ AppSubnav.vue           # 新：mixed 布局的分组 chips
│  │  ├─ AppHeader.vue           # 改：加搜索按钮与铃铛
│  │  ├─ HeaderActions.vue       # 新：搜索 + 铃铛 + 主题 + 语言 + 用户菜单
│  │  ├─ CommandPalette.vue      # 新
│  │  ├─ NotificationBell.vue    # 新
│  │  ├─ OfflineBanner.vue       # 新
│  │  └─ Tour.vue                # 新
│  └─ ui/
│     ├─ Popover.vue             # 新（reka-ui）
│     ├─ Segmented.vue           # 新
│     └─ Pagination.vue          # 新
├─ config/shell.ts               # 新：SHELL_LAYOUTS / SHELL_DENSITIES / SHELL_CONTENT_WIDTHS + 选项表 + contentWidthClass
├─ features/notifications/       # 新
│  ├─ api.ts  queries.ts  search.ts  notification-meta.ts
│  └─ NotificationsPage.vue  NotificationDetailDrawer.vue  NotificationPreferencesCard.vue
└─ lib/online.ts                 # 新：useOnlineStatus
```

### 5.3 `ui` store 与持久化

`stores/ui.ts` 扩为与 React **同键同形状**：

```ts
export interface ShellTab {
  to: string
  search?: Record<string, string>
  pinned: boolean
}
// state: layout | density | contentWidth | tabs | collapsed | mobileOpen | commandOpen
// 持久化 key: fish-admin:ui，{ state: { layout, density, contentWidth, tabs }, version: 1 }
```

- `collapsed` / `mobileOpen` / `commandOpen` **不落盘**（与 React 的 `partialize` 一致）；`collapsed` 由 `mixed` 布局的 `defaultOpen=false` 初始化。
- 读取时逐字段校验：`layout` / `density` / `contentWidth` 非法或缺失一律回落默认值，`tabs` 非数组或单项形状不对则丢弃该项。**不升 version** —— `fish-admin:theme` 已是这个先例，升版本会让已有会话整块失效。
- 页签语义必须与 React 一致且写进测试：
  - `closeOtherTabs(to)` 保留 `pinned`；
  - `closeTabsToRight(to)` 是**纯位置切片**，会把右侧 pinned 页签一并关掉；
  - `closeAllTabs()` 只留 `pinned`；
  - `keepOnlyTabs(reachable)` 在可达集合变化（角色切换）时剔除失效页签，**空集合时跳过**（避免冷启动清空）。

### 5.4 布局切换

`AppShell.vue` 保持「外壳渲染默认插槽」的既有约定，只把骨架按 `layout` 分支：

| layout    | 骨架                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| `sidebar` | 现状：`AppSidebar` + 右列（Header → OfflineBanner → Tabs → main → footer）            |
| `header`  | 无侧栏；顶部 `AppTopNav`（品牌 + 按分组的下拉 + `HeaderActions`），其余同             |
| `mixed`   | 同 sidebar，但侧栏初始收起（图标栏），并在 OfflineBanner 与 Tabs 之间插入 `AppSubnav` |

- 密度与宽度：`AppShell` 用 `watchEffect` 把 `density` 写到 `document.documentElement.dataset.density`，把 `contentWidth` 映射为 `main` 的 class（`contentWidthClass()`）。
- `Ctrl/Cmd+B` 收起/展开侧栏：在 `AppShell` 统一注册，`header` 布局下不生效（没有侧栏）。
- 布局切换**不动路由结构**，`ShellLayout` 仍是单一路由包装器。

### 5.5 页签与 URL

- 页签只收**可达的内部导航路径**（`filterNavGroups` 的结果），详情页、`/401` 等不进页签。
- `route.path` 属于可达集时 `openTab({ to, search: normalizeQuery(route.query), pinned: false })`，已存在则只更新 `search`。
- 关掉当前页签后跳「剩余的最后一个页签」并带上它的 `search`；没有则去 `/`。
- 页签的 `search` 用 `Record<string, string>`（Vue Router 的 query 天然是字符串或字符串数组）；数组值取第一项，空值丢弃。**不做** React 那样的 number/bool 序列化——本切片页签只承载导航，筛选状态仍由各页自己管。

### 5.6 通知数据层

- `features/notifications/api.ts` 七个端点，与 mock 一一对应：`GET /notifications`、`GET /notifications/:id`、`PATCH /notifications/:id`、`POST /notifications/read`、`POST /notifications/read-all`、`GET|PUT /notifications/preferences`。
- 查询键：列表 `['notifications','list',params]`、摘要 `['notifications','summary']`（`pageSize: 5`）、详情 `['notifications','detail',id]`、偏好 `['notifications','preferences']`。任何写操作后失效 `['notifications']` 前缀。
- 未读数**取服务端返回值**（`NotificationListResult.unreadCount`），不在前端数列表项——这与 React 一致，也是「筛选后未读数不缩水」的原因。
- 打开未读通知会自动标记已读，并把 `?notification=<id>` 写进 URL（可分享深链）；关闭抽屉只清这一个参数，保留 `page` / `filter`。
- `pageSize` 默认 10，服务端 clamp 5..50；`filter` 为 `all | unread | mention`。

### 5.7 快捷键

| 组合         | 行为                | 作用域                 |
| ------------ | ------------------- | ---------------------- |
| `Ctrl/Cmd+K` | 开/关命令面板       | 全局，`preventDefault` |
| `Ctrl/Cmd+B` | 收起/展开侧栏       | 仅 `sidebar` / `mixed` |
| `Esc`        | 关命令面板 / 关导览 | 各自组件内             |

### 5.8 反馈形态

沿用 Slice 3/4 的约定：**不引 toast 库**。页面内一次性反馈用 `useTransientMessage`（`role="status"`），需要跨页留存的结果交给界面自身（未读数、页签、横幅）。React 里 `toast.success` 的位置在本切片只有「退出登录」「离线恢复」「偏好已保存」三处，全部走页面内提示或横幅，不新增全局 toast。

## 6. 页面与组件职责

| 单元                          | 职责                       | 关键行为                                                                        |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `SettingsPage` 的 Shell 卡    | 布局 / 密度 / 宽度三组单选 | `aria-pressed` + `data-shell-option`，即时生效，无需保存按钮                    |
| `AppTopNav`                   | header 布局的横行导航      | 品牌 + 每组一个下拉；当前组高亮；`data-tour="topnav"`                           |
| `AppTabs`                     | 页签工作台                 | 见 §5.5；当前页 `aria-current="page"`；hover 出现关闭与下拉；右侧「全关」       |
| `AppSubnav`                   | 分组 chips                 | 当前路径不在任何分组时返回空；`aria-label` 用分组标题                           |
| `CommandPalette`              | 跳转与动作                 | 见 §7；空结果给 `command.empty`；选中后先关再执行                               |
| `NotificationBell`            | 未读提醒                   | 角标 `9+`；列表 5 条；「全部已读」在 0 未读时禁用；条目点击标记已读并跳详情深链 |
| `NotificationsPage`           | 收件箱                     | 三段筛选、全选、单条切换已读、分页、空态、详情抽屉、偏好卡                      |
| `NotificationDetailDrawer`    | 单条详情                   | 实体跳转按钮按目标页存在与否渲染；关闭只清 `notification` 参数                  |
| `NotificationPreferencesCard` | 投递偏好                   | 草稿态 + `dirty` 比较；保存 PUT 全量后回写缓存并失效；「重置」只回滚草稿        |
| `OfflineBanner`               | 离线提示                   | `navigator.onLine` + 事件监听；离线出横幅，恢复提示一次                         |
| `Tour`                        | 四步导览                   | 遮罩 + 目标环 + 弹层；`Esc` / 点遮罩 / 跳过 / 完成均可关；不持久化              |

## 7. 命令面板

- 数据源：`filterNavGroups(NAV_GROUPS, permissions)` 拍平，每组一个 heading；条目 `value = 标题 + 路径` 供过滤。
- 过滤：`trim().toLowerCase()` 后的子串匹配（不做模糊匹配，也不引 `cmdk` 的打分算法）。
- 动作组固定四条：切换明暗、切换语言（`nextLanguage()` 无值时不渲染）、去 `/profile`、退出登录。
- 选中后**先关面板再执行**（避免焦点回到已被遮罩的输入框）。
- 空查询时显示全部导航项（组内顺序即侧栏顺序）。

## 8. 可访问性

- 命令面板：`role="dialog"` + `aria-label`；输入框自动聚焦；`↑/↓` 移动、`Enter` 选中、`Esc` 关闭；高亮项 `aria-selected`。
- 页签：容器 `role="tablist"`，每项 `role="tab"` + `aria-selected`；关闭按钮 `aria-label` 带页名。
- 铃铛：按钮 `aria-label` 含未读数；列表 `role="menu"`，条目 `role="menuitem"`；角标文本对读屏可见（`aria-hidden` 的数字外再给 `sr-only` 句子）。
- 离线横幅：`role="status"` + `aria-live="polite"`。
- 导览：弹层 `role="dialog"` + `aria-modal`；打开时焦点进入弹层，关闭还原到触发按钮；目标元素加 `data-tour-active` 以便高亮环定位。
- 布局切换后侧栏焦点不丢：`header` 布局下 `#sidebar-trigger` 不渲染，`AppHeader` 的触发器需条件渲染。

## 9. 测试

### 9.1 Vitest

- `stores/ui.test.ts`：默认值、持久化往返、非法值回落、页签五种关闭语义（含「关右侧会连 pinned 一起关」）。
- `config/shell.test.ts`：`contentWidthClass` 三档、`isShellLayout` / `isShellDensity` / `isContentWidth` 的非法输入。
- `CommandPalette.test.ts`：过滤、分组顺序、动作四条、选中先关后执行。
- `AppTabs.test.ts`：不可达路径不进页签、关当前页跳剩余最后一页、全关只留 pinned。
- `AppSubnav.test.ts`：`mixed` 之外不渲染由 `AppShell` 保证；分组内当前项高亮；路径不在分组时为空。
- `OfflineBanner.test.ts`：离线出横幅、恢复提示一次。
- `Tour.test.ts`：四步顺序、`Esc` 关闭、焦点还原。
- `NotificationsPage.test.ts`：三段筛选、未读数来自服务端、单条切换、全选批量、空态、详情深链、偏好 `dirty` 与保存。
- `NotificationBell.test.ts`：角标 `9+`、0 未读禁用「全部已读」、点击标记已读并跳转。
- `SettingsPage.test.ts` 追加：Shell 卡三组选项写 store 并落 DOM。

### 9.2 Playwright

新增 `e2e-vue-template/specs/shell-notifications.spec.ts`：

1. 切到 `header` 布局 → 侧栏消失、顶栏出现 → 刷新后仍是 `header`。
2. 切到 `mixed` → 出现 Subnav chips → 密度切 `compact` 后 `html[data-density]` 生效 → 刷新保持。
3. `Ctrl+K` 打开命令面板 → 输入页名 → 回车落到该页。
4. 打开两个页面 → 页签出现两条 → 关闭当前 → 落到剩余页签 → 刷新后页签仍在。
5. 铃铛未读数 > 0 → 打开 `/notifications` → 标记一条已读 → 角标减一。
6. 「全部已读」→ 角标消失 → 刷新后仍为 0。
7. 断网（`context.setOffline(true)`）→ 出现离线横幅 → 恢复后横幅消失。

## 10. 文档与脚本

- `docs/en/vue-template.md` 与 `docs/zh-CN/vue-template.md`：路由表 +1 行、新增「壳层」与「通知」两节、偏差表更新（**删除 Slice 4 的「不出 Shell 卡片」条目**）、测试计数更新。
- `README.md` / `README.zh-CN.md`：页面计数 12 → 13，e2e 条数更新。
- `CHANGELOG.md`：新增 Added 条目（英文）。
- 根 `package.json` 无需新增脚本。

## 11. 验收标准

1. `pnpm install --frozen-lockfile`、`pnpm lint`、`pnpm format:check`、`pnpm typecheck` 全部退出码 0。
2. `pnpm test:shared`、`test:ui`、`test:vue` 计数不下降；`test:vue-template` 全绿且用例数上升；`test:e2e:vue-template` 全绿。
3. `pnpm build:vue-template` 成功；`pnpm docs:sync` / `docs:check` / `docs:build` 通过。
4. `pnpm test:parity:docker` 与 `test:parity:vue` 全绿；`git diff --name-only -- 'parity/**' '*-linux.png'` 为空。
5. 三种布局、三种宽度、两种密度均可即时切换并跨刷新保持。
6. 命令面板、页签、Subnav、离线横幅、导览六项交互按 §9.2 全部可复现。
7. 通知域七个端点全部被真实调用；未读数与「全部已读」在刷新后保持。
8. `IMPLEMENTED_PATHS` 为 13 项；`/notifications` 无权限键且不被加上权限键（有测试固定）。
9. 双语文档同提交更新；`CHANGELOG` 有对应条目。
10. 机器走查留存截图与结论；不 push、不打 tag、不 publish。

## 12. 与 React 模板的偏差（必须写入双语文档）

| 项             | React                                                | Vue（本切片）                          | 原因                                                         |
| -------------- | ---------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| 命令面板       | `cmdk` + `CommandDialog`                             | 自写输入框 + 过滤 + Dialog             | 不引只在单点使用的依赖；过滤语义取子串匹配，不做 cmdk 打分配 |
| 导览           | `packages/ui` 的 `Tour`（Portal）                    | 应用层 `Tour.vue`（自写 Portal）       | `packages/vue` 导出面冻结，不能加组件                        |
| 通知行悬浮预览 | `HoverCard`（300ms，显示正文）                       | 行内直接显示摘要，无悬浮层             | 少一个原语；信息没有丢失，只是提前展示                       |
| 静默时段选择   | `TimePicker`                                         | 原生 `<input type="time">`             | 两个字段不值得新造一个日期时间原语；值格式仍是 `HH:mm`       |
| 通知列表滚动区 | `ScrollArea`                                         | `max-h-[520px] overflow-y-auto`        | 同上                                                         |
| 偏好保存提示   | `toast.success`                                      | 卡片内 `role="status"`                 | 本模板无 toast 库（Slice 3 起的既定约定）                    |
| 侧栏折叠状态   | `SidebarProvider` 写 cookie（且从不读取）            | `ui` store 持久化                      | React 那个 cookie 是死代码；这里做成真的能记住               |
| `Ctrl/Cmd+B`   | `SidebarProvider` 注册                               | `AppShell` 注册，`header` 布局不生效   | 无侧栏时快捷键无意义                                         |
| 服务端菜单     | `GET /menu` + `enforceMenuAccess`                    | 静态 `NAV_CONTRACT`                    | Slice 1 起的既定偏差，本切片不扩大                           |
| 页签 `search`  | 泛型 `Record<string, unknown>`（number/bool 序列化） | `Record<string, string>`（只承载导航） | 页签不做筛选状态载体；筛选仍属各页                           |

## 13. 风险与缓解

| 风险                                                          | 缓解                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 改 `AppShell` 骨架导致既有 12 页布局回归                      | 骨架只在 `layout` 分支处变化；三个布局共用同一份右列结构；既有 e2e 14 条作为回归网，任务 1 完成即跑    |
| 密度改 `--spacing` 会影响全局间距，可能与既有页面视觉预期冲突 | 只在 `compact` 时生效；默认 `default` 不写任何属性；e2e 断言默认态 `data-density` 不存在或为 `default` |
| 页签持久化写入旧数据导致崩溃                                  | 读取逐项校验 + 非数组丢弃 + 不升 version；单测覆盖「垃圾数据」                                         |
| 通知未读数与列表不同步                                        | 所有写操作失效 `['notifications']` 前缀；未读数只信服务端                                              |
| 命令面板与导览的键盘事件互相抢焦点                            | 面板打开时注册 `keydown` 在 dialog 内；导览打开时禁用面板快捷键                                        |
| `mixed` 布局的 Subnav 与页签同屏过挤                          | Subnav 用 `text-xs` 胶囊 + `overflow-x-auto`，窄屏可横滑                                               |

## 14. 决策记录

### 14.1 为什么把协作三页移出本切片

React 侧 `/projects`（3226 行）、`/workflows`（1239）、`/files`（1793）生产代码合计 **6258 行**，且并集依赖约 50 个 `packages/vue` 未导出的原语（`QueryFilter`、`ProTable` 的虚拟滚动与分页、`Tree`、`Upload`、`Carousel`、`Cascader`、`ResizablePanel`、`TreeSelect`、`Rate`、`Transfer`…）。若与壳层同批，单切片会同时承担「重写外壳骨架」与「造 50 个原语」两类风险，回归面无法评估。Slice 4 已有先例：宁可拆片并写清理由，也不把不可评估的批量塞进一片。

### 14.2 为什么通知域反而进本切片

壳层与通知**互为前提**，拆开会立刻产出坏体验：

1. 导览第三步的目标就是铃铛（`data-tour="notifications"`），没有铃铛这一步得删或改锚点。
2. `HeaderActions` 的搜索与铃铛是两个并列的核心动作，只有搜索没有铃铛的顶栏是残缺的。
3. 铃铛条目点击必须跳到 `/notifications`；页面不存在就是「有入口、点进去 404」的死链——这正是 Slice 4 修 MFA 偏差时反对的形态。

通知域本身在 React 侧只有 922 行生产代码，且不依赖 `QueryFilter` / `Upload` / `Tree` 这类重原语，是本片可以吃下的量级。

### 14.3 为什么不引 `cmdk` / 导览库

两者都只在单点使用：命令面板要「分组 + 过滤 + 键盘选择」，导览要「遮罩 + 高亮环 + 弹层」，各约 150 行即可写完，且行为要按 §12 的偏差表精确控制。引库会同时引入新的 keydown/portal 行为，反而增加不可控面。

### 14.4 为什么 `ui` store 不升 version

`fish-admin:theme` 在 Slice 4 已有同款处理：读不到或读到非法值时按字段回落，而不是让整块数据失效。用户为了一个新字段丢掉布局、密度、宽度与页签四条偏好，代价不对等。

### 14.5 Shell 卡片反向兑现

Slice 4 决定「`/settings` 不出 Shell 卡片，宁可不做也不做假设置」。本切片把三布局、密度、宽度都做成真的落 DOM 且持久化，假设置的前提消失，因此**补上** Shell 卡片，并在双语文档里删掉那条偏差说明。
