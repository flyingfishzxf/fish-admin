# 账号生命周期与失败页面

FishAdmin 把后台应用里通常被留作练习的部分补齐了：注册、邮箱验证、密码找回、通过邀请加入、两步验证、会话管理，以及出问题时用户会落到的那些页面。

> 本文中的所有逻辑都在浏览器中运行，对接的是 MSW mock。令牌、TTL 与锁定机制只是对某种契约的演示，并非安全实现。边界警告请阅读 [RBAC](./rbac.md)。

## 各部分所在位置

| 关注点    | 文件                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| 页面      | `src/features/auth/components/*`、`src/features/security/*`                           |
| 请求      | `src/features/auth/api.ts`                                                            |
| 校验      | `src/features/auth/schemas.ts`、`src/features/auth/password.ts`                       |
| 会话状态  | `src/stores/auth-store.ts`                                                            |
| Mock 规则 | `src/mocks/handlers/auth.ts`、`src/mocks/auth.ts`、`src/mocks/jwt.ts`                 |
| 失败页面  | `src/components/common/status-screen.tsx`、`src/routes/{401,500,503,maintenance}.tsx` |
| 离线处理  | `src/lib/online.ts`、`src/components/layout/offline-banner.tsx`                       |

## 登录与两步验证

1. `/login` 提交 `{ email, password }`。普通账号会拿到一对令牌；store 调用 `/auth/me`，并在 `sanitizeRedirect()` 过滤掉所有非站内路径后遵循 `?redirect=`。
2. 开启两步验证的账号返回 `{ mfaRequired, challengeId, expiresAt }`，客户端随即跳转到 `/otp?challenge=…&email=…&redirect=…`。
3. `/otp` 使用 `InputOTP`，输满六位即自动提交。验证码错误返回 `401 INVALID_CODE`，在原地提示并清空输入框。挑战过期返回 `MFA_EXPIRED`，提示「重新登录以获取新的验证挑战」；这里不会自动重试，因为验证挑战是在密码验证阶段创建的。
4. 演示验证码是 `246810`（`DEMO_MFA_CODE`），固定不变以保证流程可复现。在 `/security` 点击 **Enable 2FA** 开启。

`/security` 还提供 **Disable 2FA**，它会要求输入当前密码并撤销其他会话——真实服务端也应遵循同样的规则。

## 注册与邮箱验证

`/register` 调用 `POST /auth/register`，创建一个 `emailVerified: false` 的 `viewer`，并返回验证令牌以便演示继续走下去。`/verify-email?token=…&email=…` 提交该令牌、翻转标志位，并给出通往 `/login` 的链接。未验证就登录会返回 `403 EMAIL_NOT_VERIFIED`，登录页会就地提示。

生产环境的服务端会发送一封带有单次使用令牌的链接邮件，并返回不含内部信息的结果；详见 [接入真实 API](./api-integration.md)。

## 密码重置

`/forgot-password` 无论邮箱是否存在都返回 `200`，以免表单被用来枚举账号。若地址存在，mock 会保存一个重置令牌（TTL 30 分钟）并把它返回，用于生成演示链接。`/reset-password?token=…` 设置新密码、作废该令牌，并调用 `revokeSessionsForUser()`——正因如此，之后其他所有设备都会被登出。

## 邀请

`/accept-invite?token=…` 会加载一个预览（受邀地址、角色名称、邀请人、过期时间），表单只要求填写姓名与密码，`POST /auth/accept-invite` 返回一对令牌，让新用户直接进入应用。种子链接是 `/accept-invite?token=fish-demo-invite`（manager 角色）。重复使用令牌返回 `410 INVITE_USED`；已过期的返回 `INVITE_EXPIRED`，此时页面渲染「向管理员索取新的邀请」提示，而不是表单。

## 登录锁定

`src/mocks/auth.ts` 在 mock 数据库里为每个邮箱维护计数。失败五次会设置 `lockedUntil = now + 60s`；此后即便密码正确，继续尝试也返回 `429 ACCOUNT_LOCKED`。登录成功会清除该记录，修改密码和重置密码同样如此。

## 会话

`GET /auth/sessions` 列出当前用户的活跃会话，先是自己这条，其余按最近活跃时间排序。每一行既可单独撤销（`DELETE /auth/sessions/:id`，撤销自己会返回 `400 CANNOT_REVOKE_CURRENT`），也可批量撤销（`DELETE /auth/sessions`）。会话记录请求的 `User-Agent` 和一个占位 IP（`127.0.0.1`——真实后端会记录实际连接地址），新建会话时会顺带清掉该用户所有已过期的会话。刷新令牌会轮换 refresh token，但保留会话 id，access token 里的 `sid` 声明指向的正是它。

## 失败页面

`StatusScreen` 是共享布局：状态码、图标、语气（tone）、标题、描述、可选提示、操作按钮，以及角落里的主题与语言控件。

| 路由           | 语气        | 触发方式                                |
| -------------- | ----------- | --------------------------------------- |
| `/401`         | warning     | 会话过期或被撤销；登出并跳转到 `/login` |
| `/500`         | destructive | 服务器错误，或从设置页预览              |
| `/503`         | warning     | 服务不可用                              |
| `/maintenance` | muted       | 计划内停机                              |

`/401`、`/500`、`/503` 和 `/maintenance` 都是公开、独立的 `StatusScreen` 页面。`/403` 不同：它由外壳内部的 `requirePermission()` 重定向而来，所以其组件在内容区渲染一张紧凑卡片，并保留侧边栏、顶栏与面包屑——用户需要的是一条出路，而不只是「返回首页」。`src/router.tsx` 里路由级的 `defaultErrorComponent` 在 loader 抛出异常时渲染独立样式，而 `_app/route.tsx` 会用它那个保留外壳的版本覆盖掉这一默认。

## 离线处理

`useOnlineStatus()` 通过 `useSyncExternalStore` 订阅 window 的 `online`/`offline` 事件。挂载在 `AppShell` 中的 `OfflineBanner` 会在 `navigator.onLine` 为 false 时出现，并在网络恢复时弹出一个「连接已恢复」的提示。断网期间发出的 mutation 既不会被悄悄丢弃，也不会重试：`queryClient` 设了 `mutations.retry = false`，请求会立即以网络错误信息失败，表单则保留已填内容。query 的行为不同——它最多重试两次，且只对网络错误或 `5xx` 响应重试（`4xx` 从不重试）；又因为 `refetchOnWindowFocus` 关闭，恢复联网后你只会在下一次导航、`invalidateQueries` 或手动重新获取时拿到新数据，而不是标签页重新获得焦点的那一刻。

想体验：DevTools → Network → Offline，或在 Playwright 中调用 `context.setOffline(true)`。

## 测试清单

- `e2e/auth-lifecycle.spec.ts`——注册 + 验证、弱密码拒绝、账号锁定、通过演示链接重置、开启两步验证 → OTP 登录、接受邀请 → 邀请已使用。
- `e2e/status-screens.spec.ts`——各个状态路由、带外壳的 403、设置页预览在新标签页打开、离线横幅与恢复、404 兜底页。
- 单元测试——`src/features/auth/schemas.test.ts`、`password.test.ts`、`api.test.ts`（Bearer 头、204 处理、`ApiError` 映射）、`src/lib/online.test.ts`，以及 auth-store 的刷新测试。
