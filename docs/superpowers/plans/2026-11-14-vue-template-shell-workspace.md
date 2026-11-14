# Vue 模板外壳与通知域（Slice 5）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `apps/vue-template` 的壳层从单一 sidebar 布局补成三布局 + 密度 + 内容宽度 + 命令面板 + 页签 + Subnav + 离线横幅 + 导览，并整域交付通知（铃铛、`/notifications`、投递偏好），使 `NAV_CONTRACT` 16 项中的 13 项可达，且 `parity/**` 与视觉截图零改动。

**Architecture:** 五层推进。第一层只落状态（`config/shell.ts` + `ui` store 持久化与页签语义，零 UI 变化）；第二层换骨架（`AppShell` 按布局分支、`AppTopNav`、`HeaderActions`、密度与宽度落 DOM）；第三层逐个补壳层交互（Shell 设置卡 → 命令面板 → 页签 → Subnav → 离线横幅 → 导览），每个都是独立可验证的自足单元；第四层补通知域（数据层 + 铃铛 → 页面与详情抽屉 → 偏好卡）；第五层收口导航、跨页面 e2e、全量验收与双语文档。全部改动集中在 `apps/vue-template`、`e2e-vue-template`、`docs/en`、`docs/zh-CN`、README、`CHANGELOG`；不动 React 包、共享包 `src`、`packages/ui`、`packages/vue` 导出面与 `parity/**`。

**Tech Stack:** 沿用现有栈（Vue 3.5、vue-router 4、Pinia、@tanstack/vue-query、lucide-vue-next、Tailwind 4、Vite 8、Vitest + jsdom、Playwright 1.64.1、pnpm 9.1.1、Node >= 22）。**不新增任何依赖**：`Popover` 用已在用的 `reka-ui`，命令面板与导览自写，不引 `cmdk` / 导览库 / 新 toast 库。

**Spec:** `docs/superpowers/specs/2026-11-14-vue-template-shell-workspace-design.md`（绑定权威）。上游口径见 `src/stores/ui-store.ts`、`src/config/shell.ts`、`src/components/layout/*`、`src/features/notifications/*`（React 侧，只读）与 `packages/mock/src/handlers/notifications.ts`。

## Global Constraints

- **React 面只读**：`packages/ui/**` 与 React `src/**` 只读；不改 React 行为、不新增公开 API、不发布包。
- **共享包框架无关**：`packages/{contracts,i18n,mock}/src` 不引入 `react`、`@fish-admin/react`、`@/` 别名或 Lucide 导入；本计划不修改这三个包，**不新增 locale 键**（所需键已存在且 en/zh-CN 对齐）。
- **`packages/vue` 导出面不扩**：所有新组件落 `apps/vue-template/src/components/`；每个任务收尾校验 `git diff --name-only packages/vue/src` 为空。
- **版本冻结**：根 `2.2.0`、`@fish-admin/react` `0.2.2`、`@fish-admin/tokens` `0.1.1` 不变；`@fish-admin/vue`、`@fish-admin/vue-template`、`@fish-admin/parity-vue` 保持 `private: true` / `0.1.0`。
- **外部动作审批**：`git push`、tag、`npm publish`、Release、部署变更各需单独批准。**本计划只产生本地 commit。**
- **视觉基线不可再生**：`parity/**` 与 198 张 `*-linux.png` 零改动；禁止 `--update-snapshots=all`、`test:visual:update`、`test:docs:visual:update`。
- **RBAC 只是 UX**：所有「客户端权限不是安全边界」说明不得弱化；`/otp` 的固定演示验证码提示必须保留。
- **`/notifications` 无权限键**：不得给它加 `meta.permission`，也不得新增任何 `notification:read` 之类的权限码；有测试固定这条。
- **无 toast 库**：一次性反馈用 `useTransientMessage`（`role="status"`），跨页状态交给未读数/页签/横幅。
- **文档双语同步**：`docs/en/*.md` 与 `docs/zh-CN/*.md` 同提交；README 同理；`CHANGELOG.md` 只写英文。
- **每任务 gates**：至少 `pnpm exec prettier --check <changed>`、`pnpm lint`、`pnpm test:vue-template`；涉及壳层骨架的任务追加 `pnpm test:e2e:vue-template`；声明「通过」必须附真实输出。
- **提交粒度**：每任务一个本地 Conventional Commit；不 `--amend`、不 `--no-verify`。
- **明确不做**：`/projects`、`/workflows`、`/files` 三页与详情路由；`GET /menu` 服务端菜单与 `enforceMenuAccess`；通知的 `HoverCard` 悬浮预览；图表、CSV、保存视图、列控制、Users 详情页、虚拟滚动；像素 parity、新视觉基线。

---

## File Structure

```
apps/vue-template/src/
  config/shell.ts + shell.test.ts               Create  布局/密度/宽度枚举、选项表、contentWidthClass
  stores/ui.ts + ui.test.ts                     Modify/Create  布局/密度/宽度/页签 + 持久化
  styles/index.css                              Modify  html[data-density='compact'] 规则
  components/layout/
    AppShell.vue                                Modify  按 layout 分支 + 密度/宽度落 DOM
    AppSidebar.vue                              Modify  data-tour + Ctrl+B + 收起宽度
    AppHeader.vue                               Modify  改用 HeaderActions
    HeaderActions.vue                           Create  搜索 + 铃铛 + 主题 + 语言 + 用户菜单
    AppTopNav.vue + test.ts                     Create  header 布局横行导航
    AppTabs.vue + test.ts                       Create  页签工作台
    AppSubnav.vue + test.ts                     Create  mixed 布局分组 chips
    CommandPalette.vue + test.ts                Create  命令面板
    NotificationBell.vue + test.ts              Create  铃铛
    OfflineBanner.vue + test.ts                 Create  离线横幅
    Tour.vue + test.ts                          Create  四步导览
    UserMenu.vue                                Modify  data-tour="account"
  components/ui/
    Popover.vue                                 Create  基于 reka-ui
    Segmented.vue + test.ts                     Create  分段控件
    Pagination.vue + test.ts                    Create  分页
  features/notifications/
    api.ts queries.ts search.ts notification-meta.ts   Create
    NotificationsPage.vue + test.ts             Create
    NotificationDetailDrawer.vue                Create
    NotificationPreferencesCard.vue + test.ts   Create
  features/dashboard/DashboardPage.vue          Modify  导览触发按钮
  features/settings/SettingsPage.vue + test.ts  Modify  Shell 卡片
  lib/online.ts + test.ts                       Create  useOnlineStatus
  lib/i18n.ts                                   Modify  (+ notifications 命名空间)
  config/nav.ts + nav.test.ts                   Modify  IMPLEMENTED_PATHS 13 项
  router.ts                                     Modify  (+ /notifications)
e2e-vue-template/specs/shell-notifications.spec.ts     Create
docs/en/vue-template.md docs/zh-CN/vue-template.md     Modify
README.md README.zh-CN.md CHANGELOG.md                  Modify
```

---

### Task 1: 壳层配置与 `ui` store 持久化

**Files:**

- Create: `src/config/shell.ts`、`src/config/shell.test.ts`
- Modify: `src/stores/ui.ts`
- Create: `src/stores/ui.test.ts`

**Interfaces:**

- Produces: `SHELL_LAYOUTS` / `ShellLayout`、`SHELL_DENSITIES` / `ShellDensity`、`SHELL_CONTENT_WIDTHS` / `ShellContentWidth`、`SHELL_LAYOUT_OPTIONS` / `SHELL_DENSITY_OPTIONS` / `SHELL_CONTENT_WIDTH_OPTIONS`（每项 `value` + `labelKey` + `descriptionKey`，键前缀 `settings:shell.*`）、`contentWidthClass(width)`、`isShellLayout` / `isShellDensity` / `isContentWidth`、`UI_STORAGE_KEY = 'fish-admin:ui'`。
- Produces: `ShellTab { to: string; search?: Record<string, string>; pinned: boolean }`。
- ui store 新增 `layout` / `density` / `contentWidth` / `tabs` / `commandOpen` 与 `setLayout` / `setDensity` / `setContentWidth` / `setCommandOpen` / `toggleCommand` / `openTab` / `closeTab` / `closeOtherTabs` / `closeTabsToRight` / `closeAllTabs` / `toggleTabPin` / `keepOnlyTabs`。

- [ ] **Step 1: `config/shell.ts`**

  三组枚举与 React 同名同值（`sidebar|header|mixed`、`default|compact`、`contained|wide|full`）。`contentWidthClass` 返回
  `contained → 'max-w-7xl'`、`wide → 'max-w-[1600px]'`、`full → 'max-w-none'`。选项表的 `labelKey` / `descriptionKey`
  必须与 `packages/i18n/locales/en/settings.json` 的 `shell.*` 逐字对齐（`layouts.{value}` + `layouts.{value}Hint` 等）。

- [ ] **Step 2: store 状态与持久化**

  持久化 key `fish-admin:ui`，写入形状 `{ state: { layout, density, contentWidth, tabs }, version: 1 }`。
  `collapsed` / `mobileOpen` / `commandOpen` **不落盘**。读取时逐字段校验：三个枚举非法即回落默认值，
  `tabs` 非数组则置空、单项缺 `to` 或 `pinned` 布尔则丢弃该项。**不升 version。**

- [ ] **Step 3: 页签语义**

  `openTab` 已存在则只更新 `search`（不改变 `pinned`）；`closeOtherTabs(to)` 保留 `pinned`；
  `closeTabsToRight(to)` 为**纯位置切片** `slice(0, index + 1)`（右侧 pinned 一并关掉）；
  `closeAllTabs()` 只留 `pinned`；`keepOnlyTabs(reachable)` 在 `reachable` 为空时**直接返回**（避免冷启动清空）。

- [ ] **Step 4: 单测**

  `shell.test.ts`：三档 class、三个守卫函数的合法/非法输入、选项表长度与键前缀。
  `ui.test.ts`：默认值、写后读往返、非法值回落、`tabs` 垃圾数据丢弃、五种关闭语义（含「关右侧连 pinned 一起关」）、
  `keepOnlyTabs` 空集合跳过。

- [ ] **Step 5: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/config/shell.ts apps/vue-template/src/config/shell.test.ts apps/vue-template/src/stores/ui.ts apps/vue-template/src/stores/ui.test.ts
  pnpm lint
  pnpm test:vue-template
  ```

  Expected: 全部退出码 0；既有页面零改动（本任务不改任何组件）。

- [ ] **Step 6: Commit**

  ```bash
  git add apps/vue-template/src/config/shell.ts apps/vue-template/src/config/shell.test.ts apps/vue-template/src/stores/ui.ts apps/vue-template/src/stores/ui.test.ts
  git commit -m "feat(vue-template): persist the shell layout, density and tabs"
  ```

---

### Task 2: 三布局骨架、密度与内容宽度

**Files:**

- Create: `src/components/layout/HeaderActions.vue`、`src/components/layout/AppTopNav.vue`、`AppTopNav.test.ts`
- Modify: `src/components/layout/AppShell.vue`、`AppHeader.vue`、`AppSidebar.vue`、`UserMenu.vue`
- Modify: `src/styles/index.css`

**Interfaces:**

- Produces: `HeaderActions`（无 props，内部渲染主题/语言/用户菜单；搜索键位留给 Task 4、铃铛留给 Task 9）。
- `AppShell` 按 `ui.layout` 分支：`header` 不渲染 `AppSidebar`；`mixed` 初始 `collapsed = true` 并在
  `OfflineBanner`（Task 7 前为空位）与 `AppTabs`（Task 5 前为空位）之间预留 `AppSubnav` 位置。
- `AppSidebar` / `UserMenu` 补 `data-tour="sidebar"` / `data-tour="account"`；`AppHeader` 的触发器保留 `#sidebar-trigger`。

- [ ] **Step 1: 抽出 `HeaderActions`**

  把 `AppHeader` 右侧那组（ThemeToggle / LanguageToggle / 分隔线 / UserMenu）搬到 `HeaderActions.vue`，
  输出结构与可访问名保持不变；`AppHeader` 改为引用它。

- [ ] **Step 2: `AppTopNav`**

  横向顶栏：品牌（`BrandMark` + `common:app.name`）+ 每个有权限的分组一个按钮，点击展开该组条目
  （`@fish-admin/vue` 的 `DropdownMenu`，已在用）；当前路径所在项高亮。右侧 `HeaderActions`。
  `data-tour="topnav"`。移动端把分组收进一个下拉。

- [ ] **Step 3: `AppShell` 分支与密度/宽度**

  `watchEffect` 把 `density` 写入 `document.documentElement.dataset.density`；`main` 的 class 用
  `contentWidthClass(ui.contentWidth)` 替换硬编码 `max-w-7xl`。`Ctrl/Cmd+B` 在 `AppShell` 注册，
  `layout === 'header'` 时不响应且不 `preventDefault`。布局为 `mixed` 时若用户未手动改过 `collapsed`，
  初始为收起（用 `ui.layout === 'mixed'` 初始化，手动切换后以 store 为准）。

- [ ] **Step 4: 密度 CSS**

  `styles/index.css` 追加：

  ```css
  /* Mirrors the React template: compact density tightens the Tailwind spacing
     scale, which also reaches portalled overlays because it lives on <html>. */
  html[data-density='compact'] {
    --spacing: 0.21rem;
  }
  ```

  `--sidebar-width` 不引入（Vue 侧栏宽度是 `w-16` / `w-64` 的固定类，不是变量），改为在 `AppSidebar`
  给收起态加 `data-collapsed` 以便断言。

- [ ] **Step 5: 验证（既有 12 页不得回归）**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/components/layout apps/vue-template/src/styles/index.css
  pnpm lint && pnpm typecheck
  pnpm test:vue-template
  pnpm test:e2e:vue-template
  ```

  Expected: 全部退出码 0；`test:e2e:vue-template` 仍为 **14 passed**（默认布局仍是 sidebar）。

- [ ] **Step 6: Commit**

  ```bash
  git add apps/vue-template/src/components/layout apps/vue-template/src/styles/index.css
  git commit -m "feat(vue-template): render the three shell layouts"
  ```

---

### Task 3: `/settings` 的 Shell 卡片

**Files:**

- Modify: `src/features/settings/SettingsPage.vue`、`src/features/settings/SettingsPage.test.ts`

**Interfaces:**

- Consumes: `SHELL_LAYOUT_OPTIONS` / `SHELL_DENSITY_OPTIONS` / `SHELL_CONTENT_WIDTH_OPTIONS`、`ui.setLayout` / `setDensity` / `setContentWidth`。
- Produces: 一张 `Card`，标题 `settings:shell.title`，内含三组单选。

- [ ] **Step 1: Shell 卡片**

  放在 Appearance 卡之前。每组按钮：`aria-pressed` + `data-shell-option="<该组名>-<值>"`，
  选中态用 `aria-pressed:border-primary aria-pressed:bg-primary/5`，每项显示 `labelKey` 与 `descriptionKey`
  （小字 muted）。**无保存按钮**，点击即生效。

- [ ] **Step 2: 单测**

  三组各点一次，断言 store 值变化，且 `document.documentElement.dataset.density` 随之变化（密度那组）；
  断言 **8** 个选项按钮都存在（布局 3 + 密度 2 + 宽度 3）。

- [ ] **Step 3: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/features/settings
  pnpm lint && pnpm typecheck
  pnpm test:vue-template
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add apps/vue-template/src/features/settings
  git commit -m "feat(vue-template): add the shell card to settings"
  ```

---

### Task 4: 命令面板

**Files:**

- Create: `src/components/layout/CommandPalette.vue`、`CommandPalette.test.ts`
- Modify: `src/components/layout/HeaderActions.vue`（搜索按钮）、`src/components/layout/AppShell.vue`（挂载）

**Interfaces:**

- Produces: `CommandPalette` 无 props；打开状态在 `ui.commandOpen`（`setCommandOpen` / `toggleCommand`）。
- 键盘：`Ctrl/Cmd+K` 全局切换并 `preventDefault`；面板内 `↑/↓/Enter/Esc`。

- [ ] **Step 1: 面板**

  `Dialog`（`@fish-admin/vue`）+ 输入框 + 结果列表。数据源 `filterNavGroups(NAV_GROUPS, permissions)`：
  每组一个 heading，组内条目 `label = t(titleKey)`、`value = label + ' ' + to`。
  过滤为 `trim().toLowerCase()` 子串匹配；空结果显示 `common:command.empty`。
  动作组（`common:command.groups.actions`）四条：切换明暗（`theme.setMode`）、切换语言（`nextLanguage()` 有值才渲染）、
  去 `/profile`、退出登录（`auth.logout()` → `/login`）。

- [ ] **Step 2: 交互**

  选中后**先** `setCommandOpen(false)` 再执行；内部项 `router.push(to)`，外部/无路径项忽略。
  打开时输入框自动聚焦；关闭时焦点回触发按钮。

- [ ] **Step 3: 入口**

  `HeaderActions` 加搜索按钮（`data-tour="search"`，桌面显示 `common:header.search` + `<kbd>{{ t('common:command.shortcut') }}</kbd>`，
  移动端只显示图标），`aria-label` 用 `common:header.openCommand`。

- [ ] **Step 4: 单测**

  过滤（输入 `pro` 命中 Profile）、分组顺序与侧栏一致、动作四条齐全、选中先关后执行、`Ctrl+K` 切换。

- [ ] **Step 5: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/components/layout
  pnpm lint && pnpm typecheck
  pnpm test:vue-template
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add apps/vue-template/src/components/layout apps/vue-template/src/stores/ui.ts
  git commit -m "feat(vue-template): add the command palette"
  ```

---

### Task 5: 页签工作台

**Files:**

- Create: `src/components/layout/AppTabs.vue`、`AppTabs.test.ts`
- Modify: `src/components/layout/AppShell.vue`（挂载在 `main` 之上）

**Interfaces:**

- Consumes: `ui.tabs` 与页签动作、`filterNavGroups`、`findNavItem`、`NAV_GROUPS`。
- Produces: `role="tablist"` 容器；每项 `role="tab"` + `aria-selected` + 关闭按钮。

- [ ] **Step 1: 追踪当前路由**

  `reachable = filterNavGroups(...)` 拍平后的 `to` 集合。`watchEffect` 两件事：
  `reachable` 变化时 `keepOnlyTabs(reachable)`；`route.path` 命中 `reachable` 时
  `openTab({ to: route.path, search: normalizeQuery(route.query), pinned: false })`。

- [ ] **Step 2: 渲染与操作**

  标题取 `findNavItem(route.path)` 的 `titleKey` 再 `t()`，取不到显示路径。hover 出现下拉（Pin/Unpin、Reload、Close、
  Close others、Close to the right）与 `X`。`Reload` 当前页 → `queryClient.invalidateQueries()`；
  非当前页 → 先导航再失效。右侧「Close all」按钮。当前页 `aria-current="page"`。

- [ ] **Step 3: 关闭当前页的落点**

  关掉当前页后：若还有剩余页签，跳最后一个（带其 `search`）；否则去 `/`。

- [ ] **Step 4: 单测**

  不可达路径不进页签、两个页面产生两条、关当前页落到剩余最后一条、全关只留 pinned、
  关右侧会连 pinned 一起关（与 store 语义一致）、刷新（重建组件）后从 store 恢复。

- [ ] **Step 5: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/components/layout
  pnpm lint && pnpm typecheck
  pnpm test:vue-template
  pnpm test:e2e:vue-template
  ```

  Expected: e2e 仍 14 passed（页签只增加 DOM，不改变既有断言的选择器）。

- [ ] **Step 6: Commit**

  ```bash
  git add apps/vue-template/src/components/layout
  git commit -m "feat(vue-template): add the app tabs workspace"
  ```

---

### Task 6: `mixed` 布局的 Subnav

**Files:**

- Create: `src/components/layout/AppSubnav.vue`、`AppSubnav.test.ts`
- Modify: `src/components/layout/AppShell.vue`（仅 `mixed` 渲染）

**Interfaces:**

- Consumes: `findNavItem(route.path)` → 所属分组 → 组内条目。
- Produces: `aria-label` 为分组标题的横条，每项一个胶囊链接。

- [ ] **Step 1: 实现**

  当前路径不在任何分组（`/403`、状态页）时渲染空。当前项
  `border-primary bg-primary/10`，其余 `rounded-full border px-3 py-1 text-xs`。
  容器 `overflow-x-auto` + `whitespace-nowrap`，窄屏可横滑。

- [ ] **Step 2: 单测**

  分组内三项都渲染、当前项高亮、路径不在分组时不渲染、`aria-label` 用分组标题。

- [ ] **Step 3: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/components/layout
  pnpm lint && pnpm test:vue-template
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add apps/vue-template/src/components/layout
  git commit -m "feat(vue-template): add the subnav for the mixed layout"
  ```

---

### Task 7: 离线横幅

**Files:**

- Create: `src/lib/online.ts`、`src/lib/online.test.ts`、`src/components/layout/OfflineBanner.vue`、`OfflineBanner.test.ts`
- Modify: `src/components/layout/AppShell.vue`（三种布局都渲染，位置在顶栏之下、页签之上）

**Interfaces:**

- Produces: `useOnlineStatus(): Ref<boolean>`（初值 `navigator.onLine`，监听 `online` / `offline`，卸载时移除监听）。

- [ ] **Step 1: 实现**

  在线返回空。离线：琥珀色横条 `role="status" aria-live="polite"`，`WifiOff` 图标 +
  `errors:offline.title` / `description` + 重试按钮（`window.location.reload()`，文案 `errors:offline.retry`）。
  内部记住「曾经离线」，恢复在线时用 `useTransientMessage` 显示 `errors:offline.restored` 一次。

- [ ] **Step 2: 单测**

  初始在线不渲染；派发 `offline` 事件后渲染且含重试按钮；派发 `online` 后消失并出现恢复提示一次；
  卸载后监听被移除（派发事件不再报错）。

- [ ] **Step 3: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/lib apps/vue-template/src/components/layout
  pnpm lint && pnpm test:vue-template
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add apps/vue-template/src/lib apps/vue-template/src/components/layout
  git commit -m "feat(vue-template): show an offline banner"
  ```

---

### Task 8: 四步产品导览

**Files:**

- Create: `src/components/layout/Tour.vue`、`Tour.test.ts`
- Modify: `src/features/dashboard/DashboardPage.vue`（页头按钮）

**Interfaces:**

- Produces: `Tour` props `{ open: boolean; steps: TourStep[] }`、emits `update:open`；
  `TourStep { target: string; titleKey: string; descriptionKey: string; placement?: 'top'|'bottom'|'left'|'right' }`
  其中 `target` 是 CSS 选择器（如 `[data-tour="sidebar"]`）。

- [ ] **Step 1: 实现**

  `Teleport` 到 `body`：遮罩 `z-[80] bg-black/45`（点击关闭）+ 目标环 `z-[81]`（按目标 `getBoundingClientRect()` 定位）
  - 弹层 `z-[82] w-80`。`Esc` 关闭；`open` 变 true 时重置到第一步；`resize` / `scroll`（capture）重算位置；
    打开时焦点进弹层，关闭还原到触发按钮。按钮文案 `dashboard:tour.{next,previous,skip,finish}`，
    步数 `dashboard:tour.step` 带 `{{current}}/{{total}}`。

- [ ] **Step 2: Dashboard 入口**

  `PageHeader` 的 actions 槽加按钮（`Compass` 图标 + `dashboard:tour.start`），本地 `ref` 控制打开，**不持久化**。
  四步：`[data-tour="sidebar"]`（placement right）、`[data-tour="search"]`、`[data-tour="notifications"]`、
  `[data-tour="account"]`，标题/描述取 `dashboard:tour.steps.{sidebar,search,notifications,account}.*`。
  **`header` 布局下 `data-tour="sidebar"` 不存在**：找不到目标时跳过该步而不是崩——把「目标缺失即前进到下一步」写进实现与测试。

- [ ] **Step 3: 单测**

  四步顺序、下一步/上一步、`Esc` 关闭、焦点还原、目标缺失时跳过、打开时重置到第一步。

- [ ] **Step 4: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/components/layout apps/vue-template/src/features/dashboard
  pnpm lint && pnpm test:vue-template
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add apps/vue-template/src/components/layout apps/vue-template/src/features/dashboard
  git commit -m "feat(vue-template): add the product tour"
  ```

---

### Task 9: 通知数据层与铃铛

**Files:**

- Create: `src/features/notifications/{api.ts,queries.ts,search.ts,notification-meta.ts}`、`src/components/layout/NotificationBell.vue`、`NotificationBell.test.ts`
- Create: `src/components/ui/Popover.vue`
- Modify: `src/components/layout/HeaderActions.vue`（铃铛，`data-tour="notifications"`）、`src/lib/i18n.ts`（+ `notifications`）

**Interfaces:**

- Produces: `fetchNotifications(params)` → `NotificationListResult`（含 `unreadCount`）、`fetchNotification(id)`、
  `updateNotification(id, read)`、`markNotificationsRead(ids)`、`markAllNotificationsRead()`、
  `fetchNotificationPreferences()` / `updateNotificationPreferences(input)`。
- 查询键：`['notifications','list',params]`、`['notifications','summary']`、`['notifications','detail',id]`、`['notifications','preferences']`。

- [ ] **Step 1: 数据层**

  七个端点按 mock 路径逐字对齐（`GET /notifications`、`GET /notifications/:id`、`PATCH /notifications/:id`、
  `POST /notifications/read`、`POST /notifications/read-all`、`GET|PUT /notifications/preferences`）。
  摘要查询 `pageSize: 5`、`staleTime: 60_000`。所有写操作后 `invalidateQueries({ queryKey: ['notifications'] })`。
  `notification-meta.ts` 把 kind 映射到 `notifications:kinds.*`（`mention|invite|project|system`），
  插值 `actor` / `entity`，缺失时回落 `kinds.unknownActor` / `kinds.somewhere`。

- [ ] **Step 2: `Popover`**

  `reka-ui` 的 `PopoverRoot/Trigger/Portal/Content` 包一层，暴露 `open` / `#trigger` / `#content`，
  `Content` 带 `align="end"` 与 `sideOffset`。

- [ ] **Step 3: 铃铛**

  按钮 `aria-label` 含未读数（`notifications:bell.label`）；角标 `unread > 9 ? '9+' : unread`，
  数字旁给 `sr-only` 句子；0 未读时不显示角标。面板标题 `notifications:bell.title`，
  列表 5 条（图标 + 标题 + 相对时间，未读高亮），底部「全部已读」（0 未读时 `disabled`）与「查看全部」
  （跳 `/notifications`）。点条目：先 `updateNotification(id, true)`，再 `router.push('/notifications?notification=<id>')`。

- [ ] **Step 4: 命名空间**

  `lib/i18n.ts` 的 `REQUIRED_NAMESPACES` 追加 `'notifications'`，并同步 `i18n.test.ts` 的清单断言。

- [ ] **Step 5: 单测**

  角标 `9+` 截断、0 未读无角标且禁用「全部已读」、点条目调 PATCH 并带着 `?notification=` 跳转、点「全部已读」调 read-all 并失效缓存。

- [ ] **Step 6: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/features/notifications apps/vue-template/src/components/layout apps/vue-template/src/components/ui apps/vue-template/src/lib
  pnpm lint && pnpm typecheck
  pnpm test:vue-template
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/vue-template/src/features/notifications apps/vue-template/src/components apps/vue-template/src/lib/i18n.ts apps/vue-template/src/lib/i18n.test.ts
  git commit -m "feat(vue-template): add the notification bell"
  ```

---

### Task 10: `/notifications` 页与详情抽屉

**Files:**

- Create: `src/components/ui/{Segmented.vue,Segmented.test.ts,Pagination.vue,Pagination.test.ts}`
- Create: `src/features/notifications/NotificationsPage.vue`、`NotificationsPage.test.ts`、`NotificationDetailDrawer.vue`
- Modify: `src/router.ts`（`/notifications`，**无 `meta.permission`**）

**Interfaces:**

- Consumes: Task 9 的数据层、`useTransientMessage`、`Card`、`EmptyState`、`ErrorState`、`DetailDrawer`。
- URL 参数：`page`（默认 1）、`pageSize`（默认 10）、`filter`（`all|unread|mention`，默认 `all`）、`notification`（抽屉深链）。

- [ ] **Step 1: `Segmented` 与 `Pagination`**

  `Segmented`：`options: {value,labelKey?}[]` + `v-model`，`role="tablist"` 语义或 `aria-pressed` 按钮组（取后者，简单且可读屏），
  `size?: 'sm'|'md'`。`Pagination`：`page` / `pageCount` / `@update:page`，含上一页/下一页与省略号（复用
  `lib/list-page.ts` 的 `clampToPageCount`），`pageCount <= 1` 时不渲染。

- [ ] **Step 2: 页面**

  `PageHeader`（标题/副标题 + 「全部已读」按钮，`disabled` 当 `unreadCount === 0 || pending`）。
  `Card` 内：Segmented 三段 + 右侧「标记已选已读」（`selected.size > 0` 才显示）；错误态 `ErrorState` 可重试；
  加载态骨架；空态 `EmptyState`（`unread` 用 `empty.*`，其余 `list.emptyTitle/Description`）；
  全选行（含 indeterminate）+ 列表（复选框 + kind 图标 + 标题/摘要 + 相对时间 + 单条「标记已读/未读」按钮；
  未读行 `bg-primary/5`）；分页。筛选或翻页时清空选择集。

- [ ] **Step 3: 详情抽屉**

  `open = Boolean(route.query.notification)`；数据 `detailQuery.data ?? items.find(...)`。
  打开未读条目时自动标记已读，并把 `?notification=<id>` 写进 URL；关闭**只清这一个参数**。
  抽屉内第二个「标记已读/未读」按钮，`variant` 随 `read` 切换。

- [ ] **Step 4: 路由**

  `router.ts` 的 `ShellLayout` children 加 `{ path: 'notifications', name: 'notifications', component: () => import('./features/notifications/NotificationsPage.vue') }`，
  **不带 `meta.permission`**。

- [ ] **Step 5: 单测**

  三段筛选写 URL 并重置 `page`、未读数取服务端值、单条切换调 PATCH、全选批量调 read、空态两种文案、
  深链打开抽屉并标记已读、关闭只清 `notification` 参数。

- [ ] **Step 6: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/features/notifications apps/vue-template/src/components/ui apps/vue-template/src/router.ts
  pnpm lint && pnpm typecheck
  pnpm test:vue-template
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add apps/vue-template/src/features/notifications apps/vue-template/src/components/ui apps/vue-template/src/router.ts
  git commit -m "feat(vue-template): add the notifications page"
  ```

---

### Task 11: 通知投递偏好卡

**Files:**

- Create: `src/features/notifications/NotificationPreferencesCard.vue`、`NotificationPreferencesCard.test.ts`
- Modify: `src/features/notifications/NotificationsPage.vue`（页面第二张卡）

**Interfaces:**

- Consumes: `fetchNotificationPreferences` / `updateNotificationPreferences`、`Card`、`Switch`（已有）。

- [ ] **Step 1: 草稿与 dirty**

  查询结果同步到本地 `draft`（`watch` 同步，首次 `immediate`）。`dirty = JSON.stringify(draft) !== JSON.stringify(query.data)`。
  字段：`quietStart` / `quietEnd`（原生 `<input type="time">`，`HH:mm`）、`digest`（三个单选按钮 off/daily/weekly）、
  `channels`（inApp / email / push 三个 `Switch`）。

- [ ] **Step 2: 保存与重置**

  保存：PUT 全量 → `setQueryData(['notifications','preferences'], result)` → `invalidateQueries({ queryKey: ['notifications'] })`
  → 卡片内 `role="status"` 提示（`useTransientMessage`）。「重置」只 `draft = query.data`，不写服务端。
  保存按钮 `disabled = !dirty || pending`。

- [ ] **Step 3: 单测**

  初始 `dirty === false` 且保存禁用；改一个开关后 `dirty === true`；保存后 PUT 被调用一次且提示出现；
  「重置」回到原值且不再 dirty；静默时段用 `input[type="time"]` 且值格式为 `HH:mm`。

- [ ] **Step 4: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/features/notifications
  pnpm lint && pnpm test:vue-template
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add apps/vue-template/src/features/notifications
  git commit -m "feat(vue-template): add the notification preferences card"
  ```

---

### Task 12: 导航收口与跨页面 e2e

**Files:**

- Modify: `src/config/nav.ts`、`src/config/nav.test.ts`、`src/components/layout/AppSidebar.test.ts`
- Create: `e2e-vue-template/specs/shell-notifications.spec.ts`

**Interfaces:**

- `IMPLEMENTED_PATHS` 由 12 项扩到 **13** 项（新增 `/notifications`）。

- [ ] **Step 1: 导航**

  `IMPLEMENTED_PATHS` 加 `/notifications`。`nav.test.ts` 断言 13 项，并新增一条用例：
  `/notifications` 的 `item.permission === undefined` 且 `router.resolve('/notifications').meta.permission === undefined`
  ——把「通知页不得有权限键」写成测试。

- [ ] **Step 2: 侧栏期望**

  `AppSidebar.test.ts` 的可见项现在多一条 `Notifications`（它在协作组、无权限键，viewer 也看得见），
  按实际顺序更新期望；补 `/notifications` 的 stub 路由消除 `No match found` 告警。

- [ ] **Step 3: e2e 七条**（见 spec §9.2）

  1. 切 `header` → 侧栏消失、顶栏出现 → 刷新后仍是 `header`
  2. 切 `mixed` → Subnav 出现 → 密度 `compact` 落 `html[data-density]` → 刷新保持
  3. `Control+k` 打开面板 → 输入页名 → 回车落到该页
  4. 打开两页 → 两条页签 → 关当前 → 落到剩余页签 → 刷新后仍在
  5. 铃铛未读 > 0 → 进 `/notifications` → 标记一条已读 → 角标减一
  6. 「全部已读」→ 角标消失 → 刷新后仍为 0
  7. `context.setOffline(true)` → 出现离线横幅 → 恢复后消失

  备注：断言定位用 `data-shell-option` / `data-tour` / `role`，不依赖文案（文案随语言变）。

- [ ] **Step 4: 验证**

  ```bash
  pnpm exec prettier --check apps/vue-template/src/config e2e-vue-template/specs/shell-notifications.spec.ts
  pnpm lint && pnpm typecheck
  pnpm test:vue-template
  pnpm test:e2e:vue-template
  ```

  Expected: 单测全绿；e2e **21 passed**（14 + 7）。

- [ ] **Step 5: Commit**

  ```bash
  git add apps/vue-template/src/config e2e-vue-template/specs/shell-notifications.spec.ts apps/vue-template/src/components/layout/AppSidebar.test.ts
  git commit -m "test(vue-template): cover the shell and notification surfaces"
  ```

---

### Task 13: 全量验收、双语文档与走查

**Files:**

- Modify: `docs/en/vue-template.md`、`docs/zh-CN/vue-template.md`、`README.md`、`README.zh-CN.md`、`CHANGELOG.md`
- Create: `.superpowers/sdd/<slice>/task-13/*.log` 与 `walkthrough/**`（本地，不进 git）

- [ ] **Step 1: 全量门禁**（真实输出，逐条落日志）

  ```bash
  pnpm install --frozen-lockfile
  pnpm lint
  pnpm format:check
  pnpm typecheck
  pnpm test:shared
  pnpm test:ui
  pnpm test:vue
  pnpm test:vue-template
  pnpm test:e2e:vue-template
  pnpm build:vue-template
  pnpm docs:sync && pnpm docs:check && pnpm docs:build
  pnpm test:parity:docker
  pnpm test:parity:vue
  git diff --name-only -- 'parity/**' '*-linux.png'
  ```

- [ ] **Step 2: 双语文档**

  路由表 +1 行（`/notifications`）；新增「壳层」与「通知」两节（三布局/密度/宽度/命令面板/页签/Subnav/离线/导览；
  铃铛/收件箱/偏好）；偏差表**删除** Slice 4 那条「`/settings` 不出 Shell 卡片」，并新增 spec §12 的 10 条偏差；
  测试计数按实际更新。中英同提交。

- [ ] **Step 3: README / CHANGELOG**

  README 页面计数 12 → 13，e2e 条数更新；CHANGELOG 新增 Added 条目（英文）。

- [ ] **Step 4: 机器走查**

  Playwright 脚本走三种布局 + 命令面板 + 页签 + 通知 + 离线，截图留存；逐张核对渲染，记录发现。
  **明确写清这是机器驱动证据，不是人工目检。** 截图暴露的缺陷当场修，修完重跑相关门禁。

- [ ] **Step 5: Commit**

  ```bash
  git add docs/en/vue-template.md docs/zh-CN/vue-template.md README.md README.zh-CN.md CHANGELOG.md
  git commit -m "docs(vue-template): document the shell and notifications"
  ```

- [ ] **Step 6: 合并**

  ```bash
  git -C /c/fish/Study/FishAdmin merge --ff-only workbuddy/main-a7370c6a
  ```

  Expected: 两棵树 `git status --short` 均为空。**不 push、不打 tag、不 publish。**

---

## 验收对照

| Spec §11                     | 由谁覆盖                           |
| ---------------------------- | ---------------------------------- |
| 1–3 工具链与构建             | Task 13 Step 1                     |
| 4 parity 零改动              | 每个任务收尾 + Task 13             |
| 5 三布局/三宽度/两密度       | Task 2、Task 3、Task 12 e2e 1–2    |
| 6 面板/页签/Subnav/离线/导览 | Task 4–8 单测 + Task 12 e2e 3–4、7 |
| 7 通知七端点                 | Task 9–11 + Task 12 e2e 5–6        |
| 8 导航 13 项与无权限键       | Task 12 Step 1                     |
| 9 双语与 CHANGELOG           | Task 13 Step 2–3                   |
| 10 走查与不发布              | Task 13 Step 4–6                   |
