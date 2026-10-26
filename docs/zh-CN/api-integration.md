# 接入真实 API

应用通过 `src/lib/api-client.ts` 与后端通信。演示后端是 MSW，但请求/响应契约就是普通的 HTTP JSON。你可以沿用下面的数据结构，也可以只改各 feature 下少量的 `api.ts` 做映射。

## 切换环境

| 变量                   | 默认值                       | 含义                                                                                     |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`    | `/api`                       | 所有请求的前缀，末尾无需斜杠                                                             |
| `VITE_ENABLE_MOCK`     | dev: `true` / build: `false` | 为 `true` 时启动 MSW Service Worker；不设置时 `pnpm dev` 默认开启、`pnpm build` 默认关闭 |
| `VITE_MOCK_LATENCY`    | `300`                        | Mock 响应的模拟延迟（毫秒）                                                              |
| `VITE_REQUEST_TIMEOUT` | `15000`                      | 请求超时后被中止并转为 `REQUEST_TIMEOUT` 的毫秒数，有效范围 1000–300000                  |
| `VITE_UPLOAD_TIMEOUT`  | `60000`                      | 两个 base64 上传接口（`/files`、项目附件）的超时上限（毫秒），有效范围 1000–600000       |

变量未设置时使用默认值；设置了但无法解析时会在启动阶段直接抛错，而不是静默回退（校验位于 `src/config/env.ts`）。仓库只跟踪 `.env.example`，其余 `.env*` 文件一律被 git 忽略，因此全新 clone 就是从上表的模式默认值开始。

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

客户端会包装成带 `status`、`code`、`message` 的 `ApiError`。已认证请求返回 `401` 会触发下文所述的刷新流程；`/auth/login` 这类会话建立之前的端点返回 `401` 会原样抛出；其他状态码交给 TanStack Query，并在界面中展示。

| 状态码 | 场景                                                                                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | 校验失败（`VALIDATION_ERROR`、`INVALID_TOKEN`、`WEAK_PASSWORD`、`INVALID_PASSWORD`、`PASSWORD_UNCHANGED`、`SETUP_REQUIRED`、`INVALID_PARENT`、`PROTECTED_ROLE`） |
| `401`  | 缺少/过期令牌（`UNAUTHORIZED`、`TOKEN_EXPIRED`、`INVALID_REFRESH_TOKEN`、`INVALID_CREDENTIALS`、`INVALID_CODE`、`MFA_EXPIRED`）                                  |
| `403`  | 已认证但无权操作（`FORBIDDEN`、`ACCOUNT_INACTIVE`、`EMAIL_NOT_VERIFIED`）                                                                                        |
| `404`  | 资源不存在（`USER_NOT_FOUND`、`ROLE_NOT_FOUND`、`DEPARTMENT_NOT_FOUND`、`AUDIT_EVENT_NOT_FOUND`、`SESSION_NOT_FOUND`、`INVITE_NOT_FOUND`）                       |
| `409`  | 冲突（`EMAIL_TAKEN`、`ALREADY_ENABLED`、`ROLE_NAME_TAKEN`、`ROLE_IN_USE`、`DEPARTMENT_NAME_TAKEN`）                                                              |
| `410`  | 邀请已被使用或已过期（`INVITE_USED`、`INVITE_EXPIRED`）                                                                                                          |
| `429`  | 登录失败次数过多（`ACCOUNT_LOCKED`）                                                                                                                             |

非 2xx 响应若不符合这份契约（例如代理返回的 HTML 错误页），同样会被包装成 `ApiError`：`code` 退回 `REQUEST_FAILED`，`message` 使用 HTTP 状态描述文本。

### 客户端侧失败

没有拿到任何 HTTP 响应的请求，同样使用 `ApiError`，但 `status` 为 `0`：

| 码                | 场景                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `REQUEST_TIMEOUT` | 在 `VITE_REQUEST_TIMEOUT` 毫秒内没有收到响应。                               |
| `NETWORK_ERROR`   | `fetch` 在到达 API 之前就失败：离线、DNS 故障、CORS 被拦截、混合内容被阻止。 |

这两者与 `5xx` 一样被 `src/lib/query-client.ts` 视为可恢复错误，最多重试两次。

调用方自己的取消不会被转换：当 TanStack Query 中止被替换的请求时，原始 `AbortError` 会原样抛出，使该查询被丢弃而不是显示成错误。因此每个读取函数都接收一个可选的末位 `signal` 参数，且所有 `queryFn` 都会把拿到的 signal 继续传下去。

### 请求选项

`apiRequest(path, options)` 是唯一接触网络的地方：

| 选项        | 默认值                 | 用途                                                                                  |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `method`    | `GET`                  | HTTP 方法。                                                                           |
| `body`      | –                      | 以 JSON 序列化，并带上 `Content-Type: application/json`。                             |
| `headers`   | –                      | 追加的请求头，最后合并。                                                              |
| `signal`    | –                      | 调用方持有的取消信号。                                                                |
| `auth`      | `true`                 | 附带会话令牌并允许刷新流程。`/auth/login`、`/auth/refresh`、`/auth/me` 等传 `false`。 |
| `token`     | –                      | 会话尚未建立时使用的显式 bearer。                                                     |
| `retry`     | `true`                 | 允许在 `401` 之后刷新并重试一次。                                                     |
| `timeoutMs` | `VITE_REQUEST_TIMEOUT` | 单请求覆盖；两个上传接口改用 `VITE_UPLOAD_TIMEOUT`。                                  |

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

以 `auth: false` 发出的请求（`/auth/login`、`/auth/mfa/verify`、`/auth/refresh`、`/auth/me` 以及注册/邀请/重置流程）完全不走这条路径，因此密码错误只会被反馈到表单，而不会清掉会话并触发刷新。

## 用户

### `GET /users`

查询参数：

| 参数                 | 类型                                         | 说明               |
| -------------------- | -------------------------------------------- | ------------------ |
| `page`               | number                                       | 从 1 开始          |
| `pageSize`           | number                                       | 默认 10            |
| `q`                  | string                                       | 匹配姓名或邮箱     |
| `roleId`             | string                                       | 精确匹配角色       |
| `status`             | `active \| invited \| inactive`              | 精确匹配状态       |
| `departmentId`       | string                                       | 精确匹配部门       |
| `includeDescendants` | `1`                                          | 连同子部门一起筛选 |
| `sort`               | `name \| email \| createdAt \| lastActiveAt` | 列 id              |
| `order`              | `asc \| desc`                                | 排序方向           |

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
      "departmentId": "dept-engineering-platform",
      "departmentPath": ["Engineering", "Platform"],
      "jobTitle": "Staff Engineer",
      "tags": ["on-call", "backend"],
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
  "departmentId": "dept-operations",
  "jobTitle": "Operations Lead",
  "tags": ["remote"]
}
```

返回创建后的用户（`201` 亦可，Mock 返回 `200`）。`departmentId`（或兼容字段 `department` 名称）必填；`tags` 最多 8 个。

### `GET /users/:id`、`PATCH /users/:id`

`GET` 返回单个用户；未知或已删除的 id 返回 `404 USER_NOT_FOUND`，详情页会渲染 `Result` 空状态。

`PATCH` 接受创建字段的任意子集，包括 `departmentId`、`jobTitle`、`tags` 与 `avatar`，返回更新后的用户。

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
    "permissions": [
      "dashboard:read",
      "user:read",
      "user:create",
      "user:update",
      "role:read",
      "role:create",
      "role:update",
      "audit:read",
      "department:read",
      "department:manage",
      "permission:read"
    ],
    "isSystem": true,
    "userCount": 21
  }
]
```

### `POST /roles`

```json
{ "name": "Support", "description": "Handles customer tickets.", "permissions": ["user:read"] }
```

返回创建后的角色。名称重复返回 `409 ROLE_NAME_TAKEN`；未知权限码返回 `400 VALIDATION_ERROR`。

### `PATCH /roles/:id`、`DELETE /roles/:id`

`PATCH` 接受 `{ name?, description? }`。种子角色受保护，返回 `400 PROTECTED_ROLE`。`DELETE` 返回 `204`；系统角色同样返回 `PROTECTED_ROLE`，仍有启用成员时返回 `409 ROLE_IN_USE`。

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

## 部门

### `GET /departments`

返回扁平的前序列表，由客户端构建树：

```json
{
  "items": [
    {
      "id": "dept-engineering",
      "name": "Engineering",
      "parentId": null,
      "managerId": "user-admin",
      "managerName": "Avery Chen",
      "directMemberCount": 12,
      "memberCount": 34,
      "sortOrder": 1,
      "createdAt": "2025-01-10T08:00:00.000Z"
    }
  ]
}
```

`memberCount` 含后代部门，详情面板与 `includeDescendants` 筛选都以它为准。

### `POST /departments`、`PATCH /departments/:id`

`POST` 接受 `{ name, parentId }`（根节点用 `null`），返回创建后的部门。`PATCH` 接受 `{ name?, parentId? }`；重命名会同步成员的 `department` 名称。两者都需要 `department:manage`，名称重复返回 `409 DEPARTMENT_NAME_TAKEN`。把节点移动到自己的后代之下会返回 `400 INVALID_PARENT`，父级不存在同样如此。

## 审计事件

### `GET /audit-events`

| 参数         | 类型                                 | 说明                               |
| ------------ | ------------------------------------ | ---------------------------------- |
| `page`       | number                               | 从 1 开始                          |
| `pageSize`   | number                               | 限制在 10–100                      |
| `q`          | string                               | 匹配操作人、对象名称与 metadata 值 |
| `action`     | `AuditAction`                        | 精确动作，例如 `user.updated`      |
| `entityType` | `user \| role \| department \| auth` | 精确对象类型                       |
| `entityId`   | string                               | 精确对象 id                        |
| `from`、`to` | `yyyy-MM-dd`                         | 按本地日界含首尾比较               |

返回 `PaginatedResult<AuditEvent>`：

```json
{
  "items": [
    {
      "id": "audit-…",
      "action": "user.updated",
      "actorId": "user-admin",
      "actorName": "Avery Chen",
      "entityType": "user",
      "entityId": "user-42",
      "entityLabel": "Jordan Lee",
      "metadata": { "fields": "departmentId, tags" },
      "createdAt": "2026-10-21T09:12:00.000Z"
    }
  ],
  "total": 160,
  "page": 1,
  "pageSize": 20,
  "pageCount": 8
}
```

未知动作或对象类型返回 `400 VALIDATION_ERROR`；日期格式错误或 `from > to` 返回 `400 INVALID_DATE_RANGE`。

### `GET /audit-events/:id`

返回 `{ event, related }`，其中 `related` 是同一对象最近 5 条事件。id 不存在返回 `404 AUDIT_EVENT_NOT_FOUND`。演示最多保留 500 条事件。

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

仅存在于 Mock 中，且需要 `demo:reset` 权限。它会重新播种用户、角色、部门、审计事件、邀请与令牌，然后当当前登录账号仍然存在时重新挂接现有会话。接入真实 API 后请移除设置页中的对应操作。

## 逐步替换 Mock

1. 继续使用 `src/types` 作为内部契约，或用 OpenAPI schema 生成的类型替换。
2. 重写各 feature 的 `api.ts`（`auth`、`users`、`roles`、`permissions`、`departments`、`audit`、`dashboard`、`profile`、`settings`），让它们调用你的接口。它们是仅有的使用 `apiRequest` 的位置；安全页面复用 `auth/api.ts`。
3. 保留 `apiRequest` 以复用 Bearer 令牌、单飞刷新与全局 401 处理。若后端使用 Cookie，可简化：去掉 Authorization 头、加入 `credentials: 'include'`，保留 401 跳转逻辑。
4. 在服务端实现完整的认证生命周期——注册与邮箱验证、带 TTL 的重置令牌、邀请、TOTP、登录锁定以及会话表。`src/mocks/handlers/auth.ts` 记录了每个界面所期待的请求/响应结构，客户端只依赖这些结构。
5. 把 `/auth/me` 的 `permissions` 字段换成服务端计算的有效权限列表。
6. 决定角色、部门与权限数据放在哪里。演示为了方便角色编辑器与权限矩阵在客户端保留完整注册表；真实后端可以只返回展示所需的标签，但仍必须在服务端强制校验每个权限码。
7. 删除 `src/mocks` 与 `public/mockServiceWorker.js`，然后用 `pnpm build && pnpm preview` 验证生产构建。

## 针对真实 API 的测试

- 把 Playwright 的 `webServer` 指向接入了后端的构建，或用 `page.route` 模拟网络。
- 为每个接口保留一个契约测试，断言 UI 依赖的响应结构。
- 主动让 access token 过期，走一遍刷新路径；界面应重试一次，失败后登出。
