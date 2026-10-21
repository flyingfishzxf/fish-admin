# 接入真实 API

应用通过 `src/lib/api-client.ts` 与后端通信。演示后端是 MSW，但请求/响应契约就是普通的 HTTP JSON。你可以沿用下面的数据结构，也可以只改各 feature 下少量的 `api.ts` 做映射。

## 切换环境

| 变量                | 默认值  | 含义                                                                               |
| ------------------- | ------- | ---------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `/api`  | 所有请求的前缀，末尾无需斜杠                                                       |
| `VITE_ENABLE_MOCK`  | `false` | 为 `true` 时启动 MSW Service Worker；Vite 开发环境通过 `.env.development` 默认开启 |
| `VITE_MOCK_LATENCY` | `300`   | Mock 响应的模拟延迟（毫秒）                                                        |

接入真实后端的步骤：

1. 在 `.env.local` 中设置 `VITE_ENABLE_MOCK=false`、`VITE_API_BASE_URL=https://api.example.com`。
2. 移除 `src/main.tsx` 中的 mock 启动代码（或继续用开关保护）。
3. 不再需要演示后端后，删除 `src/mocks` 与 `public/mockServiceWorker.js`。
4. 让服务端实现下述契约，或修改 `src/features/*/api.ts` 适配你自己的数据结构。

> 若 API 位于其他源，需为应用源配置 CORS，允许 `Authorization` 与 `Content-Type` 请求头。如果改用 Cookie 认证，请在 `apiRequest` 中加入 `credentials: 'include'`，并让 CORS 允许携带凭据。

## 错误契约

所有非 2xx 响应应返回 JSON：

```json
{ "code": "FORBIDDEN", "message": "Missing permission: user:delete" }
```

客户端会包装成带 `status`、`code`、`message` 的 `ApiError`。任何 `401` 都会触发下文所述的刷新流程；其他状态码交给 TanStack Query，并在界面中展示。

| 状态码 | 场景                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | 校验失败（`VALIDATION_ERROR`、`INVALID_TOKEN`、`WEAK_PASSWORD`、`INVALID_PASSWORD`、`PASSWORD_UNCHANGED`、`SETUP_REQUIRED`）    |
| `401`  | 缺少/过期令牌（`UNAUTHORIZED`、`TOKEN_EXPIRED`、`INVALID_REFRESH_TOKEN`、`INVALID_CREDENTIALS`、`INVALID_CODE`、`MFA_EXPIRED`） |
| `403`  | 已认证但无权操作（`FORBIDDEN`、`ACCOUNT_INACTIVE`、`EMAIL_NOT_VERIFIED`）                                                       |
| `404`  | 资源不存在（`USER_NOT_FOUND`、`ROLE_NOT_FOUND`、`SESSION_NOT_FOUND`、`INVITE_NOT_FOUND`）                                       |
| `409`  | 冲突（`EMAIL_TAKEN`、`ALREADY_ENABLED`）                                                                                        |
| `410`  | 邀请已被使用或已过期（`INVITE_USED`、`INVITE_EXPIRED`）                                                                         |
| `429`  | 登录失败次数过多（`ACCOUNT_LOCKED`）                                                                                            |

## 认证

客户端把 `accessToken` 与 `refreshToken` 存放在 `fish-admin:session`，请求时以 `Authorization: Bearer <token>` 发送 access token。

### `POST /auth/login`

```json
{ "email": "admin@fish.dev", "password": "Admin123!" }
```

响应：

```json
{ "accessToken": "…", "refreshToken": "…" }
```

当账号启用了双因素认证时，同一接口会返回一个质询（challenge）而不是令牌：

```json
{ "mfaRequired": true, "challengeId": "mfa-…", "expiresAt": "2026-10-21T10:05:00.000Z" }
```

`src/features/auth/api.ts` 中的 `isMfaRequired()` 用于收窄这个联合类型，客户端随后会跳转到 `/otp?challenge=…`。连续五次密码错误应当锁定该邮箱地址；Mock 会在一分钟内返回 `429 ACCOUNT_LOCKED`。

随后应用调用 `/auth/me` 加载用户。

### `POST /auth/mfa/verify`

```json
{ "challengeId": "mfa-…", "code": "246810" }
```

返回 `{ accessToken, refreshToken }` 令牌对，或 `401 INVALID_CODE`。质询在五分钟后或连续五次验证码错误后失效。

### `POST /auth/register` 与 `POST /auth/verify-email`

`register` 接受 `{ name, email, password }`，创建一个未验证的账号并赋予默认角色。Mock 还会返回验证令牌，让演示流程无需真实邮件投递即可走通：

```json
{ "email": "visitor@fish.dev", "verificationToken": "…" }
```

`verify-email` 接受 `{ token }`，返回 `{ email }`。生产环境应向 `{email}` 发送链接，并且绝不在响应体中暴露令牌——界面仅在演示模式下从查询字符串读取它。

### `POST /auth/forgot-password` 与 `POST /auth/reset-password`

`forgot-password` 接受 `{ email }`，无论该地址是否存在都必须返回相同的成功响应体（Mock 额外返回 `demoResetToken`，只是因为该流程完全在浏览器内完成）。`reset-password` 接受 `{ token, password }`，返回 `204`，并且应使该令牌及该用户的所有现存会话失效。

### `GET /auth/invites/:token` 与 `POST /auth/accept-invite`

预览接口返回 `{ email, name, roleName, invitedByName, expiresAt }`（`name` 可选——邀请可能只携带一个邮箱地址）。接受邀请时接受 `{ token, name, email, password }` 并返回令牌对，让被邀请用户直接处于登录状态。重复使用或过期必须返回 `410`。

### `GET /auth/sessions`、`DELETE /auth/sessions/:id`、`DELETE /auth/sessions`

会话即 `/security` 页面上的设备列表：

```json
[
  {
    "id": "sess-…",
    "browser": "Chrome",
    "os": "Windows",
    "ip": "203.0.113.7",
    "createdAt": "2026-10-21T08:00:00.000Z",
    "lastActiveAt": "2026-10-21T09:40:00.000Z",
    "expiresAt": "2026-10-28T09:40:00.000Z",
    "current": true
  }
]
```

`DELETE /auth/sessions/:id` 撤销单个会话，且必须拒绝撤销调用者自己的会话（`400 CANNOT_REVOKE_CURRENT`）；`DELETE /auth/sessions` 撤销其余全部会话。

### `POST /auth/change-password`

`{ currentPassword, newPassword }` → `204`。与 Mock 一致，应撤销其他会话，让被盗设备退出登录。

### `POST /auth/2fa/setup`、`/2fa/enable`、`/2fa/disable`

`setup` 返回共享密钥（演示模式还会返回 `demoCode`），`enable` 在开启 2FA 前校验验证码，`disable` 要求提供当前密码并退出其他会话。接入真实后端时，应在服务端生成密钥并校验 TOTP 时间窗口，而不是比对固定验证码。

### `POST /auth/refresh`

```json
{ "refreshToken": "…" }
```

响应同样是 `{ accessToken, refreshToken }`。每次刷新都会轮换令牌，旧 refresh token 立即失效。

### `POST /auth/logout`

请求体 `{ "refreshToken": "…" }`，响应 `204`。即使该请求失败，客户端也会清理本地状态。

### `GET /auth/me`

返回当前用户及其有效权限：

```json
{
  "id": "user-admin",
  "name": "Avery Chen",
  "email": "admin@fish.dev",
  "avatar": null,
  "bio": "…",
  "roleId": "admin",
  "roleName": "Administrator",
  "permissions": ["*"]
}
```

`permissions` 必须是包含通配符的有效列表。界面会在本地解析 `*` 与 `resource:*`，详见 [RBAC](./rbac.md)。

### 刷新行为

`apiRequest` 对 `401` 的处理：

1. 调用 `refreshSession()`；并发请求共享同一个刷新 Promise。
2. 用新 access token 重试原请求一次。
3. 刷新失败则清空会话与 Query 缓存，触发未授权事件并跳转 `/login?redirect=…`。

刷新接口在 token 无效、过期或被撤销时应返回 `401`，不要返回 `403`——客户端会把后者当成权限错误。

## 用户

### `GET /users`

查询参数：

| 参数       | 类型                                         | 说明           |
| ---------- | -------------------------------------------- | -------------- |
| `page`     | number                                       | 从 1 开始      |
| `pageSize` | number                                       | 默认 10        |
| `q`        | string                                       | 匹配姓名或邮箱 |
| `roleId`   | string                                       | 精确匹配角色   |
| `status`   | `active \| invited \| inactive`              | 精确匹配状态   |
| `sort`     | `name \| email \| createdAt \| lastActiveAt` | 列 id          |
| `order`    | `asc \| desc`                                | 排序方向       |

响应：

```json
{
  "items": [
    {
      "id": "user-admin",
      "name": "Avery Chen",
      "email": "admin@fish.dev",
      "avatar": null,
      "roleId": "admin",
      "roleName": "Administrator",
      "status": "active",
      "department": "Platform",
      "bio": "…",
      "createdAt": "2025-01-10T08:00:00.000Z",
      "lastActiveAt": "2026-10-21T09:12:00.000Z"
    }
  ],
  "total": 60,
  "page": 1,
  "pageSize": 10,
  "pageCount": 6
}
```

搜索、筛选、排序与分页都保存在 URL 中（`src/features/users/search.ts` 的 `validateSearch`），复制链接即可还原同样的视图。

### `POST /users`

```json
{
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "roleId": "manager",
  "status": "active",
  "department": "Operations"
}
```

返回创建后的用户（`201` 亦可，Mock 返回 `200`）。

### `GET /users/:id`、`PATCH /users/:id`

`PATCH` 接受创建字段的任意子集，返回更新后的用户。

针对自己的两种修改会返回 `400`：把本人 `status` 改为 `inactive` 时返回 `CANNOT_DEACTIVATE_SELF`，把本人 `roleId` 改成其他角色时返回 `CANNOT_CHANGE_OWN_ROLE`。请在后端保留这两条校验——否则管理员可以停用自己的访问，或者把自己降到没有权限撤销该操作的角色。

### `DELETE /users/:id`

返回 `204`。与 Mock 一致，删除自己应返回 `400 CANNOT_DELETE_SELF`。Mock 采用软删除（写入 `deletedAt`），正是这一点让下文的撤销操作成为可能；硬删除同样可行，只要界面上去掉恢复功能即可。

### `POST /users/bulk-status`

```json
{ "ids": ["user-1", "user-2"], "status": "inactive" }
```

返回 `{ updated: string[], skipped: string[] }`。调用者不应触碰的行——自己的账号、已被删除的用户、状态本就正确的用户——会进入 `skipped`，而不是让整个请求失败。与 Mock 一致，将用户设为 inactive 时应撤销其会话。

### `POST /users/bulk-delete` 与 `POST /users/restore`

`bulk-delete` 接受 `{ ids }`，返回 `{ deleted: string[], skipped: string[] }`。`restore` 接受相同请求体，返回 `{ restored: User[] }`——客户端会在 toast 的撤销（Undo）操作中调用它，因此刚删除的 ids 至少要保留一个来回的时长以便恢复。

## 角色与权限

### `GET /roles`

```json
[
  {
    "id": "manager",
    "name": "Manager",
    "description": "Runs day-to-day user management.",
    "permissions": ["dashboard:read", "user:read", "user:create", "user:update", "role:read"],
    "isSystem": false,
    "userCount": 21
  }
]
```

### `GET /roles/options`

供下拉框使用的轻量列表：`[{ "id": "manager", "name": "Manager" }]`，需要 `user:read`。

### `PUT /roles/:id/permissions`

```json
{ "permissions": ["dashboard:read", "user:read"] }
```

返回更新后的角色，需拒绝未知权限码。种子数据中的管理员角色受保护，编辑会返回 `400 PROTECTED_ROLE`。

### `GET /permissions`

返回权限注册表：

```json
[
  {
    "code": "user:read",
    "group": "user",
    "labelKey": "roles:permissionItems.userRead",
    "descriptionKey": "roles:permissionItems.userReadDescription"
  }
]
```

## 工作台

### `GET /dashboard?range=7|30`

一次请求返回工作台所需的全部数据：

```json
{
  "range": 7,
  "kpis": [{ "id": "revenue", "value": 48250, "change": 12.4 }],
  "revenue": [{ "date": "2026-10-15", "value": 6200 }],
  "traffic": [{ "date": "2026-10-15", "visits": 1840, "signups": 96 }],
  "channels": [{ "name": "Organic", "value": 42 }],
  "activity": [
    {
      "id": "act-1",
      "action": "user.created",
      "actorName": "Avery Chen",
      "target": "Jordan Lee",
      "createdAt": "2026-10-21T09:12:00.000Z"
    }
  ]
}
```

你可以拆成多个接口，相应修改 `src/features/dashboard/api.ts` 与 `queries.ts` 即可。

## 个人资料

### `PATCH /profile`

```json
{ "name": "Avery Chen", "bio": "Building things.", "avatar": "data:image/png;base64,…" }
```

返回更新后的 `AuthUser`。传 `null` 或空字符串可移除头像。演示将 data URL 限制在 1.5MB 内；生产环境请使用对象存储。

## 演示数据重置

### `POST /__mock/reset`

仅存在于 Mock 中，且需要 `demo:reset` 权限。它会重新播种用户、角色、邀请、令牌与活动记录，然后当当前登录账号仍然存在时重新挂接现有会话。接入真实 API 后请移除设置页中的对应操作。

## 逐步替换 Mock

1. 继续使用 `src/types` 作为内部契约，或用 OpenAPI schema 生成的类型替换。
2. 重写七个 `api.ts`（`auth`、`users`、`roles`、`permissions`、`dashboard`、`profile`、`settings`），让它们调用你的接口。它们是仅有的使用 `apiRequest` 的位置；安全页面复用 `auth/api.ts`。
3. 保留 `apiRequest` 以复用 Bearer 令牌、单飞刷新与全局 401 处理。若后端使用 Cookie，可简化：去掉 Authorization 头、加入 `credentials: 'include'`，保留 401 跳转逻辑。
4. 在服务端实现完整的认证生命周期——注册与邮箱验证、带 TTL 的重置令牌、邀请、TOTP、登录锁定以及会话表。`src/mocks/handlers/auth.ts` 记录了每个界面所期待的请求/响应结构，客户端只依赖这些结构。
5. 把 `/auth/me` 的 `permissions` 字段换成服务端计算的有效权限列表。
6. 决定角色与权限数据放在哪里。演示为了方便角色编辑器在客户端保留完整注册表；真实后端可以只返回展示所需的标签。
7. 删除 `src/mocks` 与 `public/mockServiceWorker.js`，然后用 `pnpm build && pnpm preview` 验证生产构建。

## 针对真实 API 的测试

- 把 Playwright 的 `webServer` 指向接入了后端的构建，或用 `page.route` 模拟网络。
- 为每个接口保留一个契约测试，断言 UI 依赖的响应结构。
- 主动让 access token 过期，走一遍刷新路径；界面应重试一次，失败后登出。
