# Vue 模板外壳（Slice 2）设计

> 状态：已通过范围确认，待用户复核本文档。
> 基线：`main` @ `d187981`（Slice 1 已本地合并，未 push、未发布）。
> 本 Spec 是实施计划的绑定权威；计划中的冲突以本文档为准。

## 1. 目标

为 FishAdmin 交付一个可演示的私有 Vue 3 中后台外壳：登录、权限导航、主题与语言切换、Dashboard、Users 列表与增删改查。它复用 Slice 1 的组件与共享包，验证 Vue 侧不仅能做组件，也能承载模板级的路由、会话、权限与数据流。

**成功定义**：`apps/vue-template` 能在本地启动，用三个 demo 账号登录，看到按权限过滤的导航；Dashboard 展示 KPI 与活动；Users 支持搜索、状态筛选、分页、排序与增删改；light/dark × en/zh 切换正确并在刷新后保持；全部门禁与冒烟测试通过，且不改变 React/Vue parity 的任何结果或基线。

## 2. 背景

- Slice 1 已交付 `@fish-admin/vue@0.1.0`（12 个基础组件、ProTable、DateRangePicker）与 `apps/parity-vue` 的 6 组件试点。
- React 模板位于仓库根目录（`src/`），包含 21 个业务 feature、三种 shell 布局与完整认证流程。完整移植不在本切片。
- 共享包已框架无关：`@fish-admin/contracts`（导航、权限、类型、demo 数据）、`@fish-admin/i18n`（i18next 资源）、`@fish-admin/mock`（MSW API 与假认证）可直接被 Vue 消费。
- 本切片只做一个 shell 布局（sidebar）、两个业务页面与最小认证流程。

## 3. 范围

### 3.1 包含

| 能力      | 内容                                                                 |
| --------- | -------------------------------------------------------------------- |
| 应用      | 新建私有 `apps/vue-template`（`@fish-admin/vue-template@0.1.0`）     |
| 路由      | `/login`、`/`（Dashboard）、`/users`、`/403`、404 兜底               |
| 认证      | 登录、登出、启动恢复、access token 过期刷新、401 跳转登录            |
| 权限      | 导航过滤、路由守卫、按钮级权限（新增/编辑/删除）                     |
| 外壳      | Sidebar（桌面可折叠、移动端抽屉）、Header、面包屑、用户菜单          |
| 主题      | light / dark / system，持久化并同步 `color-scheme`                   |
| 语言      | en / zh-CN，复用 `@fish-admin/i18n`，持久化并同步 `<html lang>`      |
| Dashboard | 7/30 天切换、4 张 KPI 卡、最近活动列表                               |
| Users     | 搜索、状态筛选、分页、服务端排序、行操作、新建/编辑 Dialog、删除确认 |
| 组件增量  | `@fish-admin/vue` 新增 `avatar`、`dropdown-menu` 两个封装            |
| 测试      | Vitest 单测 + Playwright 功能冒烟 6 条（无像素基线）                 |
| 文档      | 双语 `vue-template.md`、README/CHANGELOG、根脚本                     |

### 3.2 不包含

- `header` / `mixed` 两种布局、密度与内容宽度设置页。
- 命令面板、通知中心、离线横幅、App Tabs、Subnav、通知铃。
- Profile、Security、Settings、角色/部门/审计/项目/工作流等其余页面。
- 注册、找回密码、重置密码、邀请、邮箱验证、OTP/MFA 页面与流程。
- Dashboard 图表（recharts 的 Vue 替代）、CSV 导入/导出、保存视图、列显示/列宽/密度、批量操作、虚拟滚动。
- 像素级 parity、新的视觉基线、对 `parity/**` 或 `*-linux.png` 的任何改动。
- push、tag、`npm publish`、GitHub Release、Vercel 配置或部署变更。

## 4. 全局约束

- `packages/ui/**`（React 组件库）只读；不修改 React 模板 `src/**`。
- 新增 Vue 封装的 class 集合从对应 React 源码逐字复制；行为差异必须在第 13 节列出。
- 共享包 `packages/contracts`、`packages/i18n`、`packages/mock` 的 `src` 不新增 React、`@/` 别名或 Lucide 组件依赖。
- 所有 README、docs、界面中的“客户端权限不是安全边界”说明不得弱化或删除；新文档必须包含同一说明。
- 文档双语同步：每改一份 `docs/en/*.md`，同一提交更新对应 `docs/zh-CN/*.md`；README 同理；CHANGELOG 只写英文。
- 工具链：Node >= 22、pnpm 9.1.1；根目录执行命令，Windows 使用 Git Bash。
- 每个任务结束前运行 `pnpm exec prettier --check <changed files>`、`pnpm lint`、相关测试；声明“通过”必须附真实输出。
- 每个任务一个本地 Conventional Commit；不得 `--amend` 已存在提交，不得 `--no-verify`。
- `@fish-admin/vue-template` 与 `@fish-admin/vue` 保持 private，版本 `0.1.0`。

## 5. 架构

### 5.1 应用与依赖

新建独立应用，而不是扩展 `apps/parity-vue`：后者的 demo 页面、标题与 42 条 parity 已冻结，混入业务页面会污染 parity 契约。

```
apps/vue-template
├── vue, vue-router, pinia
├── @tanstack/vue-query
├── i18next (via @fish-admin/i18n)
├── reka-ui, lucide-vue-next, tailwindcss
├── @fontsource-variable/inter
└── @fish-admin/vue, @fish-admin/contracts, @fish-admin/mock, @fish-admin/tokens
```

`vite.config.ts` 通过 `define` 注入 `__APP_VERSION__`（读根 `package.json` 的版本，与 React 一致），`src/vite-env.d.ts` 声明该常量与 `ImportMetaEnv`。

依赖方向：`app → @fish-admin/vue → @fish-admin/tokens`；`app → shared packages`。共享包不依赖 app，也不依赖 Vue。

`src/styles/index.css` 以 `apps/parity-vue/src/styles/index.css` 为模板：导入 Inter、`@fish-admin/vue/styles/index.css` 与 Tailwind preflight，`@layer base` 恢复 `border-color: var(--border)`，`@source` 同时指向本应用 `src` 与 `packages/vue/src`，否则包内 class 不会被扫描。

### 5.2 目录

```
apps/vue-template/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
  public/mockServiceWorker.js          # 从仓库根 public/ 原样复制
  src/
    main.ts
    App.vue
    router.ts
    vite-env.d.ts
    config/env.ts                      # VITE_* 读取与校验
    config/nav.ts                      # NAV_CONTRACT → Vue 菜单 + 图标表
    config/theme.ts                    # ThemeMode、applyTheme
    lib/api-client.ts                  # configureApi + apiRequest
    lib/api-error.ts
    lib/auth-redirect.ts               # sanitizeRedirect
    lib/format.ts                      # 日期/数字格式
    lib/i18n.ts                        # useT / language ref
    lib/permissions.ts                 # filterNavGroups / hasPermission
    stores/auth.ts
    stores/theme.ts
    stores/ui.ts
    components/layout/AppShell.vue
    components/layout/AppSidebar.vue
    components/layout/AppHeader.vue
    components/layout/AppBreadcrumbs.vue
    components/layout/UserMenu.vue
    components/layout/ThemeToggle.vue
    components/layout/LanguageToggle.vue
    components/common/PageHeader.vue
    components/common/ErrorState.vue
    components/common/EmptyState.vue
    features/auth/api.ts
    features/auth/LoginPage.vue
    features/dashboard/api.ts
    features/dashboard/queries.ts
    features/dashboard/DashboardPage.vue
    features/dashboard/KpiCards.vue
    features/dashboard/ActivityList.vue
    features/users/api.ts
    features/users/queries.ts
    features/users/UsersPage.vue
    features/users/columns.ts
    features/users/UserFormDialog.vue
    features/users/DeleteUserDialog.vue
    pages/ForbiddenPage.vue
    pages/NotFoundPage.vue
    styles/index.css
  test/setup.ts
```

单测与源文件同目录（`*.test.ts`）。应用外的根级新增：

```
playwright.vue-template.config.ts
e2e-vue-template/specs/smoke.spec.ts
docs/en/vue-template.md
docs/zh-CN/vue-template.md
```

### 5.3 启动顺序

`src/main.ts` 严格按以下顺序执行；除 mock 启动失败只记录并继续外，任何一步失败都不挂载应用：

1. 等待 `setupI18n({ storageKey: 'fish-admin:lang' })` 的 `ready`。
2. 判断 mock：`VITE_ENABLE_MOCK` 显式设置时以它为准；未设置时 `MODE === 'development'` 开启。开启则动态导入 `createMockWorker`（`@fish-admin/mock/browser`），以 `{ apiBaseUrl, latency }` 创建、以 `onUnhandledRequest: 'bypass'` 启动，service worker 路径为 `${import.meta.env.BASE_URL}mockServiceWorker.js`；捕获异常后 `console.error` 并继续。
3. 安装 Pinia，调用 `configureApi({ getAccessToken, refreshSession, onSessionExpired })`。
4. `await useAuthStore().bootstrap()`。
5. `createApp(App).use(pinia).use(router).use(VueQueryPlugin, { queryClient })`，把 `router` 与 `queryClient` 注入全局，最后 `mount('#app')`。

`config/env.ts` 读取并校验环境变量：`VITE_API_BASE_URL`（默认 `/api`，去掉尾部 `/`）、`VITE_ENABLE_MOCK`（未设置时按 `MODE === 'development'`）、`VITE_MOCK_LATENCY`（默认 `300`）、`VITE_REQUEST_TIMEOUT`（默认 `15000`）。显式设置但无法解析时启动即抛错，不静默回退。

`onSessionExpired` 清除会话与 query 缓存；若当前不在 `/login`，跳转 `/login?redirect=<当前完整路径>`。

### 5.4 认证与会话

- 复用 mock 的 `/auth/login`、`/auth/me`、`/auth/refresh`、`/auth/logout`。
- `auth` store 状态：`user: AuthUser | null`、`accessToken`、`refreshToken`、`status: 'idle' | 'loading' | 'authenticated' | 'anonymous'`。
- 动作：`login(email, password)`、`logout()`、`bootstrap()`、`refreshSession()`、`clearSession()`。
- 持久化：只存 token，键 `fish-admin:session`，兼容 React 的 zustand persist 结构：
  `{ "state": { "accessToken": string | null, "refreshToken": string | null }, "version": 1 }`。
  读取时容忍缺字段与损坏 JSON；写入只覆盖这两个字段。
- `bootstrap()`：无 refresh token → `anonymous`；先用缓存的 access token 调 `/auth/me`；失败再 `refreshSession()`；仍失败则清空并 `anonymous`。
- 刷新并发：模块级 `refreshInFlight` 复用同一个 Promise，避免多请求同时刷新。
- 登录响应带 `mfaRequired: true` 时不做 OTP 流程；`features/auth/api.ts` 本地定义 `TokenPair`、`MfaRequiredResponse`、`LoginResponse` 与 `isMfaRequired`（与 React `src/features/auth/api.ts` 形状一致，不修改共享包），抛出 `ApiError`（code `MFA_NOT_SUPPORTED`），界面显示新增的 `auth:mfaUnsupported` 双语提示。
- 登出先清本地会话与 query 缓存，再 best-effort 调 `/auth/logout`；网络失败不影响登出。
- `lib/api-client.ts` 不直接 import store，避免循环依赖：
  ```ts
  configureApi({
    getAccessToken: () => store.accessToken,
    refreshSession: () => store.refreshSession(),
    onSessionExpired: () => { ... },
  })
  ```
  `apiRequest` 支持 `auth: false`（登录、刷新、`/auth/me`）与 `token` 显式 bearer；401 且 `auth` 时最多刷新重试一次；超时取 `env.requestTimeout`；`204` 返回 `undefined`。

### 5.5 权限与导航

- `config/nav.ts` 把 `NAV_CONTRACT` 映射为带 Lucide 组件的菜单项（`MENU_ICON_NAMES` → `lucide-vue-next` 图标），并先按 `IMPLEMENTED_PATHS = new Set(['/', '/users'])` 剔除本切片未实现的条目；否则侧边栏会出现指向 404 的死链。
- `lib/permissions.ts` 提供 `hasPermission(granted, required)`（`*` 通配）与 `filterNavGroups(groups, granted)`；空分组删除。
- 侧边栏只渲染 `user.permissions` 允许的项；当前路径高亮使用 `aria-current="page"`。
- 路由 `meta.permission`：`/` 需要 `dashboard:read`，`/users` 需要 `user:read`。守卫在未认证时优先跳登录；已认证但无权限跳 `/403`。
- 按钮级：新建需 `user:create`，编辑需 `user:update`，删除需 `user:delete`；无权限时不渲染对应按钮，不以禁用态代替。
- 所有权限判断是客户端体验层：README 与新文档必须写明“客户端权限不是安全边界”。

### 5.6 i18n

- 直接复用 `@fish-admin/i18n`，不引入 `vue-i18n`，避免第二套资源。
- `lib/i18n.ts` 暴露：
  - `i18nReady`：setupI18n 的 ready；
  - `language: Ref<SupportedLanguage>`：由 `i18n.on('languageChanged')` 更新，初始为 `currentLanguage()`；
  - `useT(namespace?: string)`：返回 `t(key, options?)`，实现内先读取 `language.value` 再调用 `i18n.t`，保证模板随语言变化重渲染；
  - `toggleLanguage()`：调用 `changeLanguage(nextLanguage())`。
- app 初始化时（`App.vue` 的 `setup` 内）调用 `provideUILocale(language)`，让 `@fish-admin/vue` 的日历/对话框内建文案跟随。
- 仅新增两个键：`auth:mfaUnsupported` 与 `common:footer.builtWithVue`（en/zh-CN 同提交）。其余复用现有命名空间；`common:footer.builtWith` 的文案写死为 React，不能在 Vue 应用复用。

### 5.7 主题

- `config/theme.ts`：`ThemeMode = 'light' | 'dark' | 'system'`；`applyTheme(mode)` 按系统偏好解析，切换 `<html class="dark">`、`style.colorScheme` 与 `meta[name="theme-color"]`（`#191820` / `#fcfbfd`）。
- store 持久化到 `fish-admin:theme`，兼容 React 结构：
  `{ "state": { "mode": ThemeMode, "accent": "violet" }, "version": 1 }`。本切片不提供 accent 切换，但保留字段以免覆盖 React 端的设置。
- `mode === 'system'` 时监听 `matchMedia('(prefers-color-scheme: dark)')`，变化即重算；卸载时移除监听。
- 初始渲染前在主入口读取并应用，避免首屏闪烁。

### 5.8 数据层

- 全局 `QueryClient`：`retry: 1`、`refetchOnWindowFocus: false`、`staleTime: 30_000`。
- 登录成功、登出、会话失效时调用 `queryClient.clear()`。
- Dashboard：`queryKey: ['dashboard', range]`，`placeholderData: keepPreviousData`，`GET /dashboard?range=7|30`。
- Users 列表：`queryKey: ['users', params]`，`placeholderData: keepPreviousData`，`GET /users?page&pageSize&q&status&sort&order`。
- Users 选项：`queryKey: ['users', 'options']`，并行请求 `GET /roles/options` 与 `GET /departments`（取 `items`），合并为 `{ roles, departments }`。
- 变更：创建 `POST /users`、更新 `PATCH /users/:id`、删除 `DELETE /users/:id`；成功后 `invalidateQueries({ queryKey: ['users'] })`。
- 错误：`ApiError` 带 `status`、`code`、`message`；列表/详情错误显示 `ErrorState` + 重试；表单错误显示在 Dialog 内；登录错误按 code 映射（`INVALID_CREDENTIALS`、`ACCOUNT_LOCKED`、`EMAIL_NOT_VERIFIED`、`ACCOUNT_INACTIVE` → 现有 `auth:` 键，`MFA_NOT_SUPPORTED` → `auth:mfaUnsupported`，其余为通用错误）。

## 6. 路由与页面

### 6.1 路由表

| 路径               | 组件            | 访问规则                   |
| ------------------ | --------------- | -------------------------- |
| `/login`           | `LoginPage`     | public；已登录访问则跳 `/` |
| `/`                | `DashboardPage` | 已登录 + `dashboard:read`  |
| `/users`           | `UsersPage`     | 已登录 + `user:read`       |
| `/403`             | `ForbiddenPage` | 已登录                     |
| `/:pathMatch(.*)*` | `NotFoundPage`  | public                     |

登录后的 `redirect` 参数只接受站内路径：必须以 `/` 开头、不得以 `//` 或 `/\` 开头；否则回 `/`。

`AppShell` 只包裹 `/`、`/users`、`/403`；`/login` 与 404 使用独立的居中布局（登录页保留主题/语言切换）。

### 6.2 登录页

- 结构对齐 React `AuthShell`：`lg` 以上左侧品牌栏（标题、描述、三条能力说明、demo 免责声明），右侧居中卡片；小屏只显示右侧内容。
- 右上角固定主题与语言切换。
- 表单：邮箱、密码（可切换明文）、提交按钮；提交中禁用并显示 spinner。
- 三个 demo 账号按钮（admin / manager / viewer）一键填充邮箱与密码。
- 错误信息放在表单内 `role="alert"` 区域。
- 页脚显示现有 `auth:footer.demoNote`；`auth:disclaimer` 在左栏（`lg` 及以上）与小屏页脚各显示一次，与 React 一致，不新增键。
- 不含注册、忘记密码、邀请链接。

### 6.3 外壳

- **Sidebar（桌面 ≥ 1024px）**：固定左侧，可折叠为 64px 图标栏；折叠状态只存内存。顶部品牌（名称 + tagline），中间按 `filterNavGroups` 渲染分组与菜单项，底部 demo 提示与版本号。当前项 `aria-current="page"`；折叠时用 `title` 提供可访问名称。
- **Sidebar（移动端）**：默认隐藏，Header 的菜单按钮打开抽屉；抽屉使用 `role="dialog"` + `aria-modal="true"`，点击遮罩、按 Esc、点击菜单项后关闭，打开时焦点移入第一个菜单项，关闭后焦点回到触发按钮。
- **Header**：左侧折叠/抽屉按钮 + 面包屑（Home / 当前菜单标题），右侧主题切换、语言切换、用户菜单。
- **用户菜单**：头像（首字母回退）、姓名、邮箱、角色徽标；菜单项只有“退出登录”。不提供 React 的 Profile/Security/Settings 链接，也不放无跳转的占位项。
- **Footer**：`builtWithVue`、版本号、license 文案；前两者用新增的 `common:footer.builtWithVue` 与现有 `common:footer.license`（现有 `builtWith` 写死 React，不复用）。
- 内容区：`max-w-7xl`、`px-4 py-6 sm:px-6 sm:py-8 lg:px-8`，与 React shell 的 default 内容宽度一致。

### 6.4 Dashboard

- 页面标题/副标题使用 `dashboard:title` / `dashboard:subtitle`。
- 右上 7/30 天切换（两个按钮，`aria-pressed`），切换触发新查询并保持旧数据。
- 4 张 KPI 卡：值、百分比变化、方向图标与语义颜色（上升/下降）。
- 最近活动列表：取 `activity` 前 8 条，显示动作、操作者、目标与时间；空态显示 `EmptyState`。
- 不渲染 `revenue` / `traffic` / `channels` 图表；文档记录该偏差。

### 6.5 Users

- 页面标题/副标题使用 `users:title` / `users:subtitle`。
- 工具栏：搜索框（300ms 防抖，可清空）、状态 Select（all / active / invited / inactive）、新建按钮（`user:create`）。
- 表格：ProTable + `useVueTable`，列 = 用户（头像首字母 + 姓名）、邮箱、角色、状态（Badge）、加入时间、操作。
  - 服务端分页：`manualPagination`，`pageSize = 10`，显示 `第 X / Y 页` 与上一页/下一页。
  - 服务端排序：姓名与加入时间可排序；`asc/desc` 写入 `sort`/`order` 参数；默认按加入时间倒序。
  - 行操作：`DropdownMenu`，编辑（`user:update`）、删除（`user:delete`）；无权限则不渲染对应项。
- 状态色：active 使用 `default` Badge，invited 使用 `secondary`，inactive 使用 `outline`；class 与 React 保持一致。
- 新建/编辑 Dialog：字段姓名、邮箱、角色、状态、部门；必填校验与邮箱格式校验；提交中禁用；成功后关闭、清空提示、刷新列表。
- 删除确认 Dialog：显示姓名与邮箱；确认按钮使用 destructive variant；成功后刷新列表。
- 页面级 `role="status"` 提示条显示“已创建/已更新/已删除”，3 秒后自动清空；错误提示使用 `role="alert"`。
- 空/加载/错误：搜索无结果显示 `EmptyState`；加载显示表格骨架（ProTable `loading`）；请求失败显示 `ErrorState` 与重试按钮。

### 6.6 403 / 404

- 403：说明需要权限，提供“返回 Dashboard”和“切换账号”（登出并回登录）。
- 404：说明页面不存在，提供“返回 Dashboard”。

## 7. 组件增量（`@fish-admin/vue`）

只新增两个封装，均基于 Reka UI，class 从 React 源码逐字复制：

| 组件         | 文件                                                                                                                                              | 说明                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Avatar       | `components/ui/avatar/{Avatar,AvatarImage,AvatarFallback}.vue`                                                                                    | `size: 'default'                                                                 | 'sm' | 'lg'`（默认 `default`）写入 `data-size`，图片加载失败回退首字母 |
| DropdownMenu | `components/ui/dropdown-menu/{DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator}.vue` | 支持 `align`、`sideOffset`、`asChild`（触发器）、`variant="destructive"`（item） |

- class 逐字复制，唯一例外是 CSS 变量前缀：React 的 `--radix-dropdown-menu-*` 改为 Reka 暴露的 `--reka-dropdown-menu-*`（与 Slice 1 的 `SelectContent` 处理一致），并在文档偏差表记录。

- 两者加入 `packages/vue/src/index.ts` 导出。
- 每个组件至少一个 Vitest 用例（渲染、回退、点击关闭、危险项样式）。
- 不新增 tooltip、separator、sidebar、command、toast 封装；外壳用边框、`title` 与现有 Dialog 替代。

## 8. 可访问性

- 所有图标按钮有 `aria-label` 或可见文本；装饰图标 `aria-hidden="true"`。
- 导航使用 `<nav aria-label>`、列表语义与 `aria-current="page"`。
- 移动抽屉具备对话框语义、Esc 关闭与焦点回收。
- 表格使用 `tableRegion` 作为 `aria-label`；排序列头按钮有 `aria-sort`。
- Dialog 标题/描述关联由 `@fish-admin/vue` 的 Dialog 封装保证；表单控件有 `<label>`。
- 颜色对比度沿用 tokens；状态不只靠颜色表达（Badge 文本）。
- 所有交互元素可通过键盘完成：登录、菜单、分页、排序、Dialog、主题/语言切换。

## 9. 测试

### 9.1 Vitest（jsdom）

| 模块                  | 覆盖                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| `lib/auth-redirect`   | 站内路径通过；`//evil`、`https://`、空值回退 `/`                           |
| `lib/permissions`     | `*` 通配、空分组删除、子项过滤                                             |
| `stores/auth`         | 登录成功/失败、bootstrap 恢复、刷新并发只发一次、登出清理                  |
| `lib/i18n`            | 语言切换更新 ref 与 `<html lang>`；持久化键                                |
| `stores/theme`        | 三种模式解析、持久化结构、system 监听回调                                  |
| `LoginPage`           | 必填/邮箱校验、demo 填充、错误提示、loading                                |
| `UsersPage`           | 搜索防抖参数、状态筛选、分页、排序、权限按钮可见性、创建/编辑/删除触发失效 |
| `Users` 表单          | 必填、邮箱格式、提交载荷                                                   |
| `AppSidebar`          | 权限过滤、当前项 `aria-current`、移动抽屉 Esc/焦点                         |
| Avatar / DropdownMenu | 图片回退、触发器打开、菜单项点击回调、destructive class                    |

API 在单测中通过 `vi.mock` 或 MSW 的 node server 模拟；每个测试文件自包含，不依赖真实网络。

### 9.2 Playwright 功能冒烟

`playwright.vue-template.config.ts` 使用 dev server（`--port 4177 --strictPort`），`webServer` 以 `VITE_ENABLE_MOCK=true VITE_MOCK_LATENCY=0` 启动并 `reuseExistingServer: true`；不生成截图、不比较基线。`e2e-vue-template/specs/smoke.spec.ts` 6 条：

1. 未登录访问 `/users` → 跳转 `/login?redirect=/users`；登录后回到 `/users`。
2. admin 登录 → Dashboard 显示 4 张 KPI；切换 7/30 天会重新请求并更新。
3. Users 搜索 + 状态筛选 + 翻页会改变行内容与页码。
4. admin 新建用户 → 列表出现；编辑姓名与状态 → 行更新；删除 → 行消失。
5. manager 登录 → Users 页面可见，但行内“删除”不可见（缺少 `user:delete`）。
6. 切换语言到中文、主题到深色 → 刷新后保持；登出回登录页且 redirect 清空；直接访问 `/users` 被重定向到登录。

失败时保留 trace 与视频（`trace: 'retain-on-failure'`），不产生任何 `*-linux.png`。

## 10. 文档与脚本

- 新增 `docs/en/vue-template.md` 与 `docs/zh-CN/vue-template.md`：范围、路由、demo 账号、命令、与 React 模板的偏差、客户端权限边界说明。
- `README.md` / `README.zh-CN.md`：应用树加入 `apps/vue-template`，脚本表加入 `dev:vue-template`、`test:vue-template`、`test:e2e:vue-template`。
- `CHANGELOG.md`：`[Unreleased] / Added` 增加英文条目。
- 根 `package.json` 新增：
  ```json
  "dev:vue-template": "pnpm --filter @fish-admin/vue-template dev",
  "build:vue-template": "pnpm --filter @fish-admin/vue-template build",
  "test:vue-template": "pnpm --filter @fish-admin/vue-template test",
  "test:e2e:vue-template": "playwright test -c playwright.vue-template.config.ts"
  ```
  `typecheck` 串入 `pnpm --filter @fish-admin/vue-template typecheck`。

## 11. 验收标准

1. `pnpm install --frozen-lockfile` 成功，`pnpm --filter @fish-admin/vue-template dev` 在 4177 启动。
2. `pnpm lint`、`pnpm format:check`、`pnpm typecheck`、`pnpm build`、`pnpm --filter @fish-admin/vue-template build` 全部退出码 0。
3. `pnpm test:shared`、`pnpm test:ui`、`pnpm test:vue`、`pnpm test:vue-template` 全绿；文档记录真实数量。
4. `pnpm test:e2e:vue-template` 6/6。
5. `pnpm test:parity:docker` 仍为 119/119；`pnpm test:parity:vue` 仍为 42/42；`git diff --name-only -- 'parity/**' '*-linux.png'` 在切片提交范围内为空。
6. 人工走查（ego lite / Playwright 交互）：三个账号登录；导航随权限变化；Dashboard 7/30；Users 搜索/筛选/分页/排序/增删改；light/dark × en/zh；360px 移动视口抽屉；刷新后主题/语言/会话保持。
7. 双语文档与 CHANGELOG 更新；无 push、无 tag、无 publish；两个包仍为 private。

## 12. 与 React 模板的偏差（必须写入双语文档）

| 项                                 | React                                               | 本切片                                 |
| ---------------------------------- | --------------------------------------------------- | -------------------------------------- |
| Shell 布局                         | sidebar / header / mixed + 密度/宽度设置            | 仅 sidebar；无设置页                   |
| 导航                               | 契约中全部 21 个页面                                | 只显示已实现的 Dashboard 与 Users      |
| 命令面板/通知/离线横幅/Tabs/Subnav | 有                                                  | 无                                     |
| 认证                               | 登录、注册、找回、邀请、OTP、2FA                    | 仅登录；已有会话恢复                   |
| Dashboard                          | KPI + 3 张图表 + 引导 Tour                          | KPI + 活动列表；无图表/Tour            |
| Users                              | 列显示/排序/密度/保存视图/CSV/批量/导入/详情页/活动 | 搜索/状态/分页/排序/增删改             |
| 个人资料/安全/设置                 | 有                                                  | 无入口；用户菜单只保留退出登录         |
| 主题                               | light/dark/system + accent                          | light/dark/system；accents 固定 violet |
| 剩余业务页                         | 21 个 feature                                       | 仅 Dashboard、Users                    |

## 13. 风险与缓解

| 风险                                           | 缓解                                                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| MSW service worker 在子应用路径下注册失败      | 原样复制根 `public/mockServiceWorker.js`；启动失败在控制台报错且不阻塞壳渲染；E2E 覆盖登录即可发现 |
| i18next 与 Vue 响应式脱节                      | `useT` 读取 `language` ref 建立依赖；单测断言切换后文本更新                                        |
| Pinia store 与 api-client 循环依赖             | `configureApi` 注入回调，api-client 不 import store                                                |
| ProTable 服务端分页/排序与 TanStack 状态不同步 | 显式 `manualPagination/manualSorting`，页码与排序作为 query 参数单一来源；单测覆盖参数             |
| 新组件 Divergence                              | class 从 React 逐字复制；单测覆盖可见行为；文档记录 API 差异                                       |
| 权限缓存过期                                   | 登录/登出/401 清空 query 缓存；导航每次从 store 派生                                               |
| E2E 依赖 mock 的固定数据                       | 只断言与数据无关的结构/行为，创建的用户邮箱随机后缀                                                |

## 14. 决策记录

1. **新应用而非扩展 parity-vue**：保护冻结的 42 条 parity 与 demo 页面。
2. **不新增像素基线**：外壳仍在演进，像素基线成本高；组件 parity 继续覆盖 6 个试点。
3. **用 `@tanstack/vue-query`**：与 React 的缓存/失效语义一致，后续业务页可复用。
4. **用 Vue Router + Pinia**：Vue 生态标准，避免 TanStack Router Vue 的额外迁移面。
5. **不引入 vue-i18n / vue-sonner**：复用现有 i18next 资源；提示用页面级 status/alert，少一个依赖。
6. **只加 avatar / dropdown-menu 两个封装**：外壳必需且可复用；其余用现有类名或 Dialog。
7. **Users 表单保留角色/部门**：`UserInput` 要求两者；通过 `/roles/options` 与 `/departments` 获取，不新做角色/部门页面。
8. **会话与主题存储兼容 React 的键结构**：同一浏览器切换框架时设置可延续，也便于对比测试。
