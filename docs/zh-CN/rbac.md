# 基于角色的权限控制

FishAdmin 演示了一套完整的客户端权限闭环：导航、路由与按钮都读取同一个权限注册表，用来塑造用户能看到的界面。

> **客户端 RBAC 不是安全边界。** 任何人都可以修改浏览器中的 JavaScript、构造 API 请求或重放令牌。客户端检查只决定渲染什么。后端必须认证每个请求并校验每个操作。Mock API 也执行同样的权限码校验，方便你理解真实服务端应实现的契约。

## 模型

权限码采用 `resource:action` 格式：

| 权限码               | 保护对象                                                                             |
| -------------------- | ------------------------------------------------------------------------------------ |
| `dashboard:read`     | 工作台路由与 KPI 数据                                                                |
| `project:read`       | 项目看板、项目详情、任务与里程碑                                                     |
| `project:manage`     | 创建/更新/归档项目、任务、里程碑、预算与附件                                         |
| `file:read`          | 资源库、文件夹树、预览与下载                                                         |
| `file:manage`        | 上传、重命名、移动、收藏与删除文件                                                   |
| `report:read`        | 报表路由与 `GET /api/reports`                                                        |
| `integration:read`   | 集成列表、连接详情与投递日志                                                         |
| `integration:manage` | 创建、更新、删除集成与重放投递                                                       |
| `user:read`          | 用户路由、用户详情、用户列表与角色选项                                               |
| `user:create`        | 「新建用户」按钮、`POST /api/users` 与 CSV 导入                                      |
| `user:update`        | 编辑操作、`PATCH /api/users/:id` 与 `POST /api/users/bulk-status`                    |
| `user:delete`        | 删除操作、`DELETE /api/users/:id` 与批量删除/恢复端点                                |
| `role:read`          | 角色路由、权限矩阵与 `GET /api/roles`                                                |
| `role:create`        | 「新建角色」入口、创建向导与 `POST /api/roles`                                       |
| `role:update`        | 编辑自定义角色、权限矩阵、`PATCH /api/roles/:id` 与 `PUT /api/roles/:id/permissions` |
| `role:delete`        | 删除自定义角色与 `DELETE /api/roles/:id`                                             |
| `audit:read`         | 审计日志路由、用户动态与 `GET /api/audit-events`                                     |
| `department:read`    | 组织架构路由、部门树与 `GET /api/departments`                                        |
| `department:manage`  | 新建/重命名部门操作与 `POST`/`PATCH /api/departments`                                |
| `permission:read`    | 只读权限页与 `GET /api/permissions`                                                  |
| `demo:reset`         | 重置演示数据库                                                                       |

有若干区域刻意不设权限码：`/notifications`（只暴露当前用户自己的收件箱），以及只对当前用户生效的账户页 `/profile` 与 `/security`。`/settings` 同样仅需登录；组件示例已经彻底离开应用——它们是文档站点里的页面，而文档站没有需要鉴权的会话。

`src/config/permissions.ts` 是唯一事实来源，导出：

- `PERMISSION_CODES`：全应用使用的类型化常量。
- `PERMISSIONS`：角色编辑器与权限页所需的展示元数据（分组、label 与 description 的 i18n key）。
- `DEMO_ROLE_PERMISSIONS`：三个种子角色的初始授权。

`src/lib/permissions.ts` 中的 `hasPermission()` 支持精确匹配与两种通配：

- `*` 授予全部权限（管理员角色使用）。
- `resource:*` 授予某资源下的全部操作，例如 `user:*`。

有效权限列表来自 `GET /api/auth/me`，不随用户资料落库。管理员修改角色后，下一次 `/me` 请求即反映新权限——角色编辑器提示刷新会话正是这个原因。

## 演示角色

| 角色                    | 权限                                                                                                                                                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 管理员（Administrator） | `*`                                                                                                                                                                                                                                                                              |
| 经理（Manager）         | `dashboard:read`、`project:read`、`project:manage`、`file:read`、`file:manage`、`report:read`、`integration:read`、`user:read`、`user:create`、`user:update`、`role:read`、`role:create`、`role:update`、`audit:read`、`department:read`、`department:manage`、`permission:read` |
| 访客（Viewer）          | `dashboard:read`、`project:read`、`file:read`、`report:read`、`integration:read`、`user:read`、`audit:read`、`department:read`                                                                                                                                                   |

差异是刻意设计且肉眼可见的：

- 管理员能看到全部菜单，可删除用户与角色、在矩阵中编辑除管理员外的所有角色，并重置演示数据。
- 经理可新建与编辑用户、管理项目与文件、管理部门、创建与编辑自定义角色，并打开只读权限页；不能删除用户或角色，不能管理集成，矩阵中的管理员列只读。
- 访客只能看到工作台、项目、文件、报表、集成、用户、部门与审计日志，所有写操作入口都隐藏。

以访客身份直接输入 `/roles/matrix`：路由守卫会跳转到 `/403`。以经理身份可打开同一页面，但管理员列不可修改。

## 四层校验

| 层级     | 位置                                                    | 行为                                                                                                                                                                                    |
| -------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 导航     | `GET /menu` + `src/config/nav.ts` + `filterNavGroups()` | 以服务端的列表为准，再按会话权限过滤，空分组自动移除；后端未实现该接口时回落到内置导航。面包屑与命令面板读取同一棵树；`findNavItem()` 取最长匹配路径，所以 `/roles/matrix` 只点亮角色。 |
| 路由     | 各叶子路由的 `beforeLoad`                               | 未登录 → `/login?redirect=…`；已登录但无权限 → `/403`。                                                                                                                                 |
| 界面操作 | `<Can permission="...">` 或 `useCan()`                  | 隐藏或禁用按钮与菜单项。                                                                                                                                                                |
| 服务端   | Mock handlers / 你的后端                                | 未认证返回 `401`，角色缺少权限返回 `403`。                                                                                                                                              |

`_app/route.tsx` 只校验会话是否存在。权限检查放在叶子路由，保证刚被拒绝的用户仍能访问 `/403`。

```tsx
// src/routes/_app/users.tsx
export const Route = createFileRoute('/_app/users')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.userRead)(context)
    await ensureNamespaces(['users', 'roles'])
  },
  component: UsersPage,
})
```

条件渲染使用组件，可传入占位内容：

```tsx
<Can permission="user:delete" fallback={<span>只读</span>}>
  <Button variant="destructive">删除</Button>
</Can>
```

需要在逻辑中取得布尔值时——禁用状态、条件列或事件处理——调用 `useCan()`：

```tsx
const canDelete = useCan('user:delete')
```

## 四步新增一个权限

假设要新增发票管理，权限码为 `invoice:read`。

1. **注册权限**，修改 `src/config/permissions.ts`：

   ```ts
   export const PERMISSION_CODES = {
     // ...
     invoiceRead: 'invoice:read',
   } as const
   ```

   将其加入 `PERMISSIONS`，填写分组与翻译 key。若为新的分组，需加入 `PERMISSION_GROUPS`，并在两种语言中补充 `roles:permissionItems.*`。最后在 `DEMO_ROLE_PERMISSIONS` 中授予相应角色。

2. **添加导航项**，修改 `src/config/nav.ts`：

   ```ts
   {
     titleKey: 'nav:items.invoices',
     to: '/invoices',
     icon: ReceiptText,
     permission: PERMISSION_CODES.invoiceRead,
   }
   ```

   同时扩展 `AppPath` 并添加 `nav:items.invoices` 翻译。

3. **创建带守卫的路由**，`src/routes/_app/invoices.tsx`：

   ```tsx
   export const Route = createFileRoute('/_app/invoices')({
     beforeLoad: (context) => requirePermission(PERMISSION_CODES.invoiceRead)(context),
     component: InvoicesPage,
   })
   ```

4. **保护操作**：界面上使用 `<Can permission={PERMISSION_CODES.invoiceRead}>`，服务端拒绝缺少同一权限的请求。

完成。侧边栏、面包屑与命令面板由 `nav.ts` 派生；角色编辑器、权限矩阵与权限页由 `PERMISSIONS` 派生。

## 代码库中的防呆措施

- **导航漂移测试**——`src/config/nav.test.ts` 用生成的路由树解析每个导航路径，菜单项失去对应路由会导致测试失败。
- **注册表校验**——翻译测试检查每个权限 label 在中英文中都存在。
- **单飞刷新**——`401` 只触发一次刷新；失败则清空会话并回到登录页。
- **Mock 403**——写 handler 在修改数据前调用 `authorize()`。Playwright 套件验证访客直接 `POST /api/users` 会得到 `403`。
- **系统角色保护**——对种子角色调用 `PATCH` / `DELETE /api/roles/:id` 返回 `PROTECTED_ROLE`，管理员角色忽略权限编辑；删除仍有成员的自定义角色返回 `ROLE_IN_USE`。
- **矩阵显式保存**——权限按整组替换。矩阵保留本地 draft，逐个提交发生变更的角色，而不是每勾选一次就保存，避免两次快速编辑互相覆盖。
- **部门成环校验**——`PATCH /api/departments/:id` 拒绝把节点移动到自己的子树内，返回 `INVALID_PARENT`。
- **批量操作部分成功**——批量 handler 会逐行校验，而不只看调用者：当前用户本人和已删除的账号会放在 `skipped` 中返回，因此经理在批量删除中提交自己的 id 什么都改变不了。
- **禁止自删**——即使是管理员也不能删除自己的账号，服务端返回 `CANNOT_DELETE_SELF`。
- **禁止自锁**——账号本人不能停用自己或修改自己的角色（`CANNOT_DEACTIVATE_SELF`、`CANNOT_CHANGE_OWN_ROLE`）。没有这两道校验，管理员可以把自己降为访客，而撤销该操作所需的权限也同时消失，演示数据就此卡死。
- **认证状态与 RBAC 分离**——注册、邮箱验证、密码重置、邀请与 MFA 步骤都不依赖任何权限码即可运行，且 mock 登录 handler 像真实服务端一样校验 `emailVerified`、`status` 与锁定状态。

## 上线检查清单

1. 由你自己的 `/auth/me`（或独立权限接口）返回用户的有效权限。
2. 每个请求都在服务端校验令牌与权限，绝不相信客户端提交的角色或权限。
3. 保留 UI 检查——它们提供良好体验——但只当作提示。
4. 优先使用存放在 `httpOnly`、`Secure`、`SameSite` Cookie 中的短期 access token。演示项目因没有后端才把令牌放在 `localStorage`，真实系统不要照搬。
5. 记录并审查授权失败；持续的 `403` 是有价值的信号。
