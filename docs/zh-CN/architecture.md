# 架构说明

FishAdmin 是一个单页 React 应用。仓库中不包含服务端：演示 API 运行在 Service Worker 中，同一个客户端只需一个环境变量即可指向真实后端。

## 技术栈速览

| 关注点     | 实现                                                  |
| ---------- | ----------------------------------------------------- |
| 渲染       | React 19 + Vite 8                                     |
| 路由       | TanStack Router，文件式路由，类型安全的 search params |
| 服务端状态 | TanStack Query                                        |
| 客户端状态 | Zustand                                               |
| 样式       | Tailwind CSS 4 + shadcn/ui + Radix 原语               |
| 表单       | React Hook Form + Zod                                 |
| Mock 后端  | MSW 2 + Faker + `localStorage`                        |
| 国际化     | i18next，JSON namespace 懒加载                        |

## 启动流程

[`src/main.tsx`](../../src/main.tsx) 负责编排启动顺序，确保路由守卫不会在会话状态未知时运行：

1. 等待 `i18nReady`，加载内置的 `common`、`nav`、`errors` namespace。
2. 当 `VITE_ENABLE_MOCK` 为 `true` 时，动态 import `src/mocks/browser` 并启动 Service Worker。worker 地址由 `import.meta.env.BASE_URL` 推导，因此支持子路径部署；未匹配的请求直接放行。
3. 调用 `useAuthStore.getState().bootstrap()`。没有 refresh token 时状态为 `anonymous`；否则刷新令牌并请求 `/auth/me`。
4. 注册 `apiRequest` 使用的全局未授权处理器。
5. 挂载 React：`QueryClientProvider` → `RouterProvider` + `Toaster`。

`index.html` 中有一段内联脚本，在 React 加载前读取持久化的主题并写入 `<html>` 的 `.dark` 类与强调色属性，保证首屏即为正确主题。应用挂载期间由一个极简的 CSS 加载指示器占位。

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
└─ _app/route.tsx       会话守卫 + AppShell（侧边栏、离线横幅、命令面板）
   ├─ index.tsx         /            dashboard:read
   ├─ ui.tsx            /ui          仅需登录（组件演练场）
   ├─ users.tsx         /users       user:read
   ├─ roles.tsx         /roles       role:read
   ├─ permissions.tsx   /permissions permission:read
   ├─ profile.tsx       /profile     仅需登录
   ├─ security.tsx      /security    仅需登录
   ├─ settings.tsx      /settings    仅需登录
   ├─ 403.tsx           带外壳渲染的 403
   └─ $.tsx             带外壳渲染的 404
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
| 已保存视图       | `localStorage`              | `fish-admin:users-views:{userId}`，最多 10 个                      |
| 表格密度         | `localStorage`              | `fish-admin:users-density`                                         |
| 网络连通性       | `src/lib/online.ts`         | 基于 `useSyncExternalStore` 监听 window 的 `online`/`offline` 事件 |
| 演示数据库       | MSW handlers                | 持久化键 `fish-admin:db:v1`                                        |

### API 客户端

[`src/lib/api-client.ts`](../../src/lib/api-client.ts) 中的 `apiRequest`：

1. 从 auth store 读取 access token，附加 `Authorization: Bearer …`。
2. 收到 `401` 时调用一次 `refreshSession()`。store 对并发刷新做单飞处理，多个并行 401 只会产生一个 `/auth/refresh` 请求。
3. 用新令牌重试原请求一次。
4. 刷新失败则清空会话与 Query 缓存，触发未授权事件并抛出 `ApiError`。

`bootstrap()` 同样做了单飞处理，避免 React StrictMode 的重复 effect 与并行路由预加载造成重复请求。

### Feature 模块

每个功能把 API 调用、query options、schema 与组件放在一起：

```text
features/users/
├─ api.ts          fetchUsers、createUser、updateUser、deleteUser、bulk*、restoreUsers
├─ queries.ts      userListQueryOptions
├─ schemas.ts      createUserSchema(t)
├─ search.ts       表格的 URL search 校验
└─ components/     UsersPage、UserFormDrawer、DeleteUserDialog、SavedViewsMenu、UserContextMenu、columns
```

```text
features/auth/
├─ api.ts          login、mfaVerify、register、verifyEmail、forgot、reset、invites
├─ schemas.ts      RHF schema 工厂（login、register、reset、invite、修改密码）
├─ password.ts     注册/重置页密码强度条背后的评分逻辑
└─ components/     AuthShell 及账号生命周期每一步各一个页面
```

UI 组件不直接调用 `fetch`，而是使用包装了 feature API 的 TanStack Query options。

## Mock 后端

- `src/mocks/seed.ts` 使用固定种子通过 Faker 生成数据库：三个演示账号加 57 个生成用户，以及角色、邀请和活动记录。
- `src/mocks/db/store.ts` 负责读写数据库，每次变更同步到 `localStorage`。
- `src/mocks/handlers` 下的 handler 实现认证生命周期、用户（含批量操作与恢复）、角色、权限、工作台与重置接口。写操作会先调用 `authorize()`，token 所属角色缺少权限时返回 `403`。
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

- 语言 JSON 位于 `src/locales/{en,zh-CN}`，共 13 个 namespace：`common`、`nav`、`auth`、`dashboard`、`users`、`roles`、`permissions`、`profile`、`security`、`settings`、`ui`、`errors`、`validation`。
- `common`、`nav`、`errors` 直接打入主包；其余通过 `i18next-resources-to-backend` 与 `import.meta.glob` 按需加载。
- 初始语言依次取 `localStorage`、浏览器语言，最后回退英文。
- `changeLanguage()` 持久化选择、切换 i18next 并同步 `<html lang>`。
- 日期、数字、货币与相对时间统一使用 `src/lib/format.ts` 中的 `Intl`，无需日期库。`react-day-picker` 日历会收到匹配的 locale，因此月份名称同样会翻译。
- 校验文案以翻译 key 传入 Zod schema 工厂，例如 `createUserSchema(t)`。
- 有一个单元测试对比两种语言展开后的 key 集合，缺失翻译会导致 CI 失败。

## 故障处理

- `StatusScreen` 为 `/401`、`/403`、`/500`、`/503` 与 `/maintenance` 提供统一布局；每个页面有各自的语气、图标、提示与操作，可从设置页与 `/ui` 进入。
- `useOnlineStatus()` 驱动 `AppShell` 中的离线横幅；网络恢复后横幅消失并弹出一条 Sonner toast。
- `src/router.tsx` 设置 `defaultErrorComponent`，`_app/route.tsx` 将其覆盖，使崩溃时保留侧边栏与顶栏而不是卸载整个应用。
- Query 层的失败通过带重试按钮的 `ErrorState` 呈现；mutation 失败则弹出 toast，服务端有返回信息时直接展示该信息。

## 测试策略

- 单元测试覆盖权限解析、导航到路由的解析、URL search 校验、用户与所有认证表单的 Zod schema、密码强度、主题应用、locale key 对齐、API 客户端、query key、单飞刷新、已保存视图持久化、在线状态与 `<Can>`。
- Playwright 覆盖登录重定向、错误凭据、登出、三种角色的 RBAC、API 层 `403`、注册/验证/重置/邀请/MFA 全流程、账号锁定、用户 CRUD 持久化、带撤销的批量操作、已保存视图、密度与列控制、URL 还原筛选、主题与语言持久化、`/ui` 演练场以及状态页与离线画面。
- CI 并行执行格式检查、lint、类型检查、覆盖率、生产构建与 E2E。
