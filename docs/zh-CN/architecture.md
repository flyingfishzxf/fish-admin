# 架构说明

FishAdmin 是一个单页 React 应用，构建在 `@fish-admin/react` 组件包之上。仓库中不包含服务端：演示 API 运行在 Service Worker 中，同一个客户端只需一个环境变量即可指向真实后端。

## 技术栈速览

| 关注点     | 实现                                                         |
| ---------- | ------------------------------------------------------------ |
| 渲染       | React 19 + Vite 8                                            |
| 路由       | TanStack Router，文件式路由，类型安全的 search params        |
| 服务端状态 | TanStack Query                                               |
| 客户端状态 | Zustand                                                      |
| 组件       | `@fish-admin/react`（`packages/ui`），shadcn/ui + Radix 原语 |
| 样式       | Tailwind CSS 4                                               |
| 表单       | React Hook Form + Zod                                        |
| Mock 后端  | MSW 2 + Faker + `localStorage`                               |
| 国际化     | i18next，JSON namespace 懒加载；组件文案由包提供             |

## 启动流程

[`src/main.tsx`](../../src/main.tsx) 负责编排启动顺序，确保路由守卫不会在会话状态未知时运行：

1. 等待 `i18nReady`，加载内置的 `common`、`nav`、`errors` namespace。
2. 解析 mock 开关：显式设置的 `VITE_ENABLE_MOCK` 优先，未设置时开发服务器为 `true`、构建产物为 `false`。开关为真时动态 import `src/mocks/browser` 并启动 Service Worker。worker 地址由 `import.meta.env.BASE_URL` 推导，因此支持子路径部署；未匹配的请求直接放行。这里的判断刻意直接读 `import.meta.env` 字面量而不是 `env.enableMock`，这样不含 mock 的构建能把整个 MSW chunk 摇掉。
3. 调用 `useAuthStore.getState().bootstrap()`。没有 refresh token 时状态为 `anonymous`；否则刷新令牌并请求 `/auth/me`。
4. 注册 `apiRequest` 使用的全局未授权处理器。
5. 挂载 React：`QueryClientProvider` → `RouterProvider` + `Toaster`。

React 加载之前，`index.html` 会引用两个放在 `public/` 下的文件，这样它们的 URL 在构建前后都保持稳定：`/theme-bootstrap.js` 是首屏阻塞的传统脚本，读取持久化主题并把 `.dark` 类与强调色属性写到 `<html>` 上；`/boot.css` 负责这段首屏的样式，并用一个极简的 CSS 加载指示器占位应用挂载的间隙。它们之所以是两个文件而不是一段内联 `<script>` 与 `<style>`，是因为生产环境使用 `script-src 'self'`，内联脚本会被拒绝——否则就要用一次错误的主题闪回来换这条策略。详见[安全响应头](security-headers.md)。

## 路由与守卫

路由位于 `src/routes`，由 `@tanstack/router-plugin` 生成到 `src/routeTree.gen.ts`。生成文件已提交，请勿手工修改。

```text
__root.tsx              Providers、全局 404 与错误兜底
├─ 401.tsx  500.tsx  503.tsx  maintenance.tsx   独立的 StatusScreen 页面
├─ _auth/route.tsx      已登录用户访问认证页时重定向离开
│  ├─ login.tsx         /login
│  ├─ register.tsx      /register           → 响应中返回验证 token
│  ├─ verify-email.tsx  /verify-email?token=…
│  ├─ forgot-password.tsx  /forgot-password → 演示用重置链接
│  ├─ reset-password.tsx   /reset-password?token=…
│  ├─ accept-invite.tsx    /accept-invite?token=…
│  └─ otp.tsx              /otp?challenge=…  第二因子
└─ _app/route.tsx       会话守卫 + AppShell（侧边栏、铃铛、离线横幅、命令面板）
   ├─ index.tsx         /            dashboard:read
   ├─ reports.tsx       /reports     report:read
   ├─ workflows.tsx     /workflows   workflow:read
   ├─ workflows_.$id.tsx /workflows/$id workflow:read
   ├─ projects.tsx      /projects    project:read
   ├─ projects_.$id.tsx /projects/$id project:read
   ├─ files.tsx         /files       file:read
   ├─ notifications.tsx /notifications 仅需登录
   ├─ users.tsx         /users       user:read
   ├─ users_.$id.tsx    /users/$id   user:read
   ├─ departments.tsx   /departments department:read
   ├─ roles.tsx         /roles       role:read
   ├─ roles_.matrix.tsx /roles/matrix role:read
   ├─ permissions.tsx   /permissions permission:read
   ├─ dictionaries.tsx  /dictionaries dictionary:read
   ├─ audit-logs.tsx    /audit-logs  audit:read
   ├─ integrations.tsx  /integrations integration:read
   ├─ profile.tsx       /profile     仅需登录
   ├─ security.tsx      /security    仅需登录
   ├─ settings.tsx      /settings    仅需登录
   ├─ 403.tsx           带外壳渲染的 403
   └─ $.tsx             带外壳渲染的 404；已下线的 `/components` 与 `/ui` 也由它交给文档站点
```

- `_app` 只校验会话是否存在。权限检查放在各叶子路由，保证 `/403` 自身始终可达。
- 守卫在 `beforeLoad` 中调用 `requirePermission(code)`。未登录跳转 `/login?redirect=…`；已登录但无权限跳转 `/403`。
- 登录页会清洗 `redirect`，只允许站内路径，避免开放重定向。
- 每个路由在渲染前预加载所需 namespace（`ensureNamespaces`），避免 Suspense 闪烁。
- loader 或渲染抛出的错误由 `src/router.tsx` 中的 `defaultErrorComponent` 捕获；`_app/route.tsx` 将其覆盖为保留外壳的错误页，使导航不会中断。

Vite 插件排在 React 与 Tailwind 插件之前，并启用了 `autoCodeSplitting`，因此功能代码按路由拆分加载（包括工作台使用的 Recharts）。

## 数据流

| 数据             | 持有者                      | 说明                                                               |
| ---------------- | --------------------------- | ------------------------------------------------------------------ |
| 会话与令牌       | `src/stores/auth-store.ts`  | 持久化键 `fish-admin:session`，只保存令牌                          |
| 主题模式与强调色 | `src/stores/theme-store.ts` | 持久化键 `fish-admin:theme`                                        |
| 命令面板可见性   | `src/stores/ui-store.ts`    | 仅内存                                                             |
| API 数据         | TanStack Query              | query key 与各 feature 的 `queries.ts` 放在一起                    |
| 表格筛选与分页   | URL search params           | `validateUsersSearch` 保证链接可分享、刷新后呈现一致               |
| 审计筛选与分页   | URL search params           | `validateAuditSearch` 同步搜索、动作、对象与日期区间               |
| 项目筛选与分页   | URL search params           | `validateProjectsSearch` 把状态、优先级、负责人与视图写入 URL      |
| 文件筛选与目录   | URL search params           | `validateFilesSearch` 驱动文件夹树、视图模式与分页                 |
| 报表区间         | URL search params           | `validateReportsSearch` 让 `from`、`to` 与粒度可分享               |
| 集成筛选         | URL search params           | `validateIntegrationsSearch` 同步服务商、启停与分页                |
| 选中部门         | URL search params           | `/departments?dept=…` 可深链，非法 id 回退到首个根节点             |
| 已保存视图       | `localStorage`              | `fish-admin:users-views:{userId}`，最多 10 个                      |
| 表格密度         | `localStorage`              | `fish-admin:users-density`                                         |
| 网络连通性       | `src/lib/online.ts`         | 基于 `useSyncExternalStore` 监听 window 的 `online`/`offline` 事件 |
| 演示数据库       | MSW handlers                | 持久化键 `fish-admin:db:v1`                                        |

### API 客户端

[`src/lib/api-client.ts`](../../src/lib/api-client.ts) 中的 `apiRequest` 是唯一调用 `fetch` 的地方：

1. 从 auth store 读取 access token——会话尚未建立时改用显式的 `token` 选项——并附加 `Authorization: Bearer …`。
2. 把调用方的 `AbortSignal` 与 `AbortSignal.timeout(VITE_REQUEST_TIMEOUT)` 组合，请求不会无限挂起。
3. 调用方主动取消会原样抛出，让 TanStack Query 丢弃被替换的请求而不是显示错误；超时或 `fetch` 失败则包装为 `status: 0` 的 `ApiError`，码为 `REQUEST_TIMEOUT` / `NETWORK_ERROR`，两者都会被查询默认策略重试。
4. 收到 `401` 时调用一次 `refreshSession()`。store 对并发刷新做单飞处理，多个并行 401 只会产生一个 `/auth/refresh` 请求。
5. 用新令牌重试原请求一次。
6. 刷新失败则清空会话与 Query 缓存，触发未授权事件并抛出 `ApiError`。

标记为 `auth: false` 的请求（会话建立之前的认证端点）跳过第 4 到第 6 步，因此登录被拒时只会反馈到表单，不会拆掉当前会话。

`bootstrap()` 同样做了单飞处理，避免 React StrictMode 的重复 effect 与并行路由预加载造成重复请求。

### Feature 模块

每个功能把 API 调用、query options、schema 与组件放在一起：

```text
features/users/
├─ api.ts          fetchUsers、fetchUser、createUser、updateUser、updateUserProfile、deleteUser、bulk*、restoreUsers
├─ queries.ts      userListQueryOptions、userDetailQueryOptions、userActivityQueryOptions
├─ schemas.ts      createUserSchema(t)
├─ search.ts       表格的 URL search 校验
└─ components/     UsersPage、UserDetailPage、UserFormDrawer、DeleteUserDialog、SavedViewsMenu、UserContextMenu、columns
```

```text
features/departments/           features/audit/
├─ api.ts          部门 CRUD     ├─ api.ts       列表与详情
├─ queries.ts      departments  ├─ queries.ts   auditListQueryOptions、
│                  QueryOptions  │                auditEventQueryOptions
└─ components/     树面板、详情  ├─ search.ts    URL search 与区间预设
                   与表单        └─ components/  AuditLogsPage、筛选、
                                                 列定义、详情抽屉
```

```text
features/auth/
├─ api.ts          login、mfaVerify、register、verifyEmail、forgot、reset、invites
├─ schemas.ts      RHF schema 工厂（login、register、reset、invite、修改密码）
├─ password.ts     注册/重置页密码强度条背后的评分逻辑
└─ components/     AuthShell 及账号生命周期每一步各一个页面
```

```text
features/projects/              features/files/
├─ api.ts          列表、详情  ├─ api.ts       文件夹、文件与批量删除
│                  与变更      ├─ queries.ts   文件夹与文件查询
├─ queries.ts      项目查询    ├─ search.ts    目录、视图、筛选与分页
├─ search.ts       筛选、视图  └─ components/  FileLibraryPage、文件夹树、
│                  与分页                      上传抽屉、预览分栏
└─ components/     ProjectsPage、项目看板、
                   创建向导、详情 tabs
```

```text
features/reports/               features/notifications/       features/integrations/
├─ api.ts          报表查询    ├─ api.ts       收件箱与偏好 ├─ api.ts       连接与投递
├─ queries.ts      按区间生成  │                变更         │                记录
│                  query key   ├─ queries.ts   通知查询     ├─ queries.ts   列表与投递
├─ search.ts       from/to/    │                             │                查询 key
│                  granularity └─ components/  收件箱、抽屉 ├─ search.ts    筛选与分页
└─ components/     ReportPage    与偏好设置                  └─ components/  列表、编辑器、
                   懒加载图表                                               投递抽屉
```

UI 组件不直接调用 `fetch`，而是使用包装了 feature API 的 TanStack Query options。

## Mock 后端

- `src/mocks/seed.ts` 使用固定种子通过 Faker 生成数据库：三个演示账号加 57 个生成用户、10 个部门节点、角色、邀请，以及分布在 90 天内的 160 条审计事件。
- `src/mocks/seed-workspace.ts` 为 seed 与迁移共用一套确定性的业务数据：12 个项目含 72 条任务、48 个里程碑与预算项；8 个文件夹与 18 个文件（图片缩略图使用小体积 SVG data URI）；6 个集成连接与 24 条投递记录；按用户保存的通知收件箱、免打扰时段与渠道偏好；以及 60 条引用真实项目、文件与集成 ID 的审计事件。
- `src/mocks/db/store.ts` 负责读写数据库，每次变更同步到 `localStorage`。`MOCK_DB_VERSION` 为 4：按 v1 → v2 → v3 → v4 迁移，保留用户、角色、部门、会话与令牌，把新权限码合并进系统角色，并幂等追加工作区集合；只有未知版本才重置。
- `src/mocks/handlers` 下的 handler 实现认证生命周期、用户（含批量操作、恢复与 CSV 导入）、部门、角色（含新建、重命名与删除）、权限、审计事件、项目（任务、里程碑与附件）、文件夹与文件（含批量删除）、报表、通知与偏好、集成（投递与重放）、工作台与重置接口。写操作会先调用 `authorize()`，token 所属角色缺少权限时返回 `403`。
- 报表完全由请求区间与粒度确定性生成；阈值与系列颜色只影响展示，不写库。文件上传发送元数据和可选的 data URL；超过 256 KB 的文件只保留元数据。
- 审计事件是唯一的活动日志。用户、角色、部门、个人资料、项目、文件与集成的变更都调用 `logAuditEvent()`；`logActivity()` 保留为薄包装，工作台通过 `recentActivity()` 映射最新事件。日志上限 500 条。
- 令牌是假令牌，但结构贴近真实：带过期时间的 base64url access token、与会话记录绑定的不透明 refresh token，以及各自带 TTL 的验证、密码重置和 MFA 挑战条目。
- `src/mocks/auth.ts` 集中认证规则：刷新时轮换会话、同一邮箱密码错误五次锁定一分钟、MFA 挑战会中断登录流程、修改密码时撤销其他会话。
- 删除用户是软删除（`deletedAt`），因此 `POST /api/users/restore` 可以撤销批量删除；停用用户会撤销其会话。
- `VITE_MOCK_LATENCY` 默认增加 300ms 延迟，让加载态可见。`POST /api/__mock/reset`（需要 `demo:reset`）重新播种数据库，若当前账号仍然存在则保留会话。

Service Worker 文件由 `msw init public --save` 生成并提交。生产环境需从应用根路径提供，且不要长期缓存。

## 主题

- `src/styles/index.css` 是唯一的 Tailwind 入口。语义 token 以 oklch CSS 变量写在 `:root` 与 `.dark` 上，再通过 `@theme inline` 映射为工具类。
- 五套强调色（`violet`、`cyan`、`emerald`、`orange`、`rose`）通过 `<html>` 上的 `data-accent` 应用，每套覆盖 primary 相关 token。
- `src/lib/theme.ts` 中的 `applyTheme()` 负责切换 `.dark`、设置 `colorScheme`、更新强调色与 `theme-color` meta。
- `ThemeSync` 在 store 变化或系统配色切换时重新应用主题。
- 主题模式、强调色与语言分开持久化，互不影响。

Tailwind 4 采用 CSS-first 配置，没有 `tailwind.config.js`。自定义 token 放在 `index.css` 中明确标记的区块，并与 shadcn CLI 可能重写的区块保持分离。

## 国际化

- 语言 JSON 位于 `src/locales/{en,zh-CN}`，共 21 个 namespace：`common`、`nav`、`auth`、`dashboard`、`projects`、`files`、`reports`、`notifications`、`integrations`、`users`、`roles`、`permissions`、`departments`、`audit`、`profile`、`security`、`settings`、`dictionaries`、`workflows`、`errors`、`validation`。组件自身的文案在包里，由 `UIProvider` 提供语言，见[安装指南](https://fish-admin-docs.vercel.app/guide/installation)。
- `common`、`nav`、`errors` 直接打入主包；其余通过 `i18next-resources-to-backend` 与 `import.meta.glob` 按需加载。
- 初始语言依次取 `localStorage`、浏览器语言，最后回退英文。
- `changeLanguage()` 持久化选择、切换 i18next 并同步 `<html lang>`。
- 日期、数字、货币与相对时间统一使用 `src/lib/format.ts` 中的 `Intl`，无需日期库。`react-day-picker` 日历会收到匹配的 locale，因此月份名称同样会翻译。
- 校验文案以翻译 key 传入 Zod schema 工厂，例如 `createUserSchema(t)`。
- 有一个单元测试对比两种语言展开后的 key 集合，缺失翻译会导致 CI 失败。

## 故障处理

- `StatusScreen` 为 `/401`、`/403`、`/500`、`/503` 与 `/maintenance` 提供统一布局；每个页面有各自的语气、图标、提示与操作，可从设置页进入。
- `useOnlineStatus()` 驱动 `AppShell` 中的离线横幅；网络恢复后横幅消失并弹出一条 Sonner toast。
- `src/router.tsx` 设置 `defaultErrorComponent`，`_app/route.tsx` 将其覆盖，使崩溃时保留侧边栏与顶栏而不是卸载整个应用。
- Query 层的失败通过带重试按钮的 `ErrorState` 呈现；mutation 失败则弹出 toast，服务端有返回信息时直接展示该信息。

## 测试策略

- 单元测试覆盖权限解析与通配展开、导航到路由的解析（含最长前缀匹配）、用户、审计、项目、文件、报表与集成的 URL search 校验、用户与所有认证表单的 Zod schema、密码强度、主题应用、locale key 对齐、API 客户端、query key、单飞刷新、已保存视图持久化、在线状态、`<Can>`、树工具函数、穿梭框选择、标签输入、通知偏好、集成请求头与确定性报表生成。
- 包里的 `packages/ui/src/registry.test.ts` 要求 83 个条目按 47 原语 / 30 企业 / 6 pro 分层、id 唯一且是 kebab-case、每个条目都能在出口文件里取到、`usedIn` 是以 `/` 开头的模板路由且不得是已下线的 `/components` 或 `/ui`，并按「层级 + id」排序，保证生成的清单可以稳定 diff。
- 数据库迁移测试会把 v1、v2、v3 数据重放到 v4，验证用户、会话与令牌保留、新权限合并、重复迁移幂等；损坏的存储会重置而不是崩溃。
- Playwright 覆盖登录重定向、错误凭据、登出、三种角色的 RBAC、API 层 `403`、注册/验证/重置/邀请/MFA 全流程、账号锁定、用户 CRUD 持久化、带撤销的批量操作、CSV 导入、已保存视图、密度与列控制、URL 还原筛选、用户详情与标签、部门深链与新建、权限矩阵与角色 CRUD、审计筛选与 JSON 详情抽屉、项目筛选/创建向导/归档/详情 tabs/任务/成员/预算/复盘、文件上传/预览/水印/移动/删除、通知已读与偏好、报表区间/锚点/CSV 导出、集成创建/启停/payload/重放、主题与语言持久化、状态页与离线画面，以及文档入口——`e2e/docs-link.spec.ts` 断言未设置 `VITE_DOCS_URL` 时不出现任何外链；`e2e/security.spec.ts` 在同一段导航路径上补上响应头比对与 `securitypolicyviolation` 扫描。
- CI 并行执行格式检查、lint、类型检查、覆盖率、`pnpm audit --audit-level=high`、生产构建与 E2E，构建 job 还会上传被度量的 `dist/`；CodeQL 单独按 push、pull request 与每周定时运行，dependabot 负责 npm 依赖与 actions 的更新。
