# 审批中心

审批中心是多步骤业务流的完整示例：申请沿着固定的审批链流转，每一次决定都追加到时间线，界面本身不做任何裁决。`/workflows` 是列表，`/workflows/$id` 展示表单快照、时间线、评论与处理面板。

> 审批链由浏览器里的 Mock handler 裁决，这只是接口契约的演示，不是安全边界。真实后端必须在数据库事务中重新执行所有校验，见[生产环境注意事项](#生产环境注意事项)。

## 代码位置

| 关注点     | 文件                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| 类型       | `src/types/workspace.ts`（`WorkflowInstanceRecord`、`WorkflowStep`、`WorkflowComment`） |
| 客户端 API | `src/features/workflows/api.ts`、`queries.ts`、`search.ts`                              |
| 界面       | `src/features/workflows/components/*`                                                   |
| 路由       | `src/routes/_app/workflows.tsx`、`src/routes/_app/workflows_.$id.tsx`                   |
| Mock 规则  | `src/mocks/handlers/workflows.ts`、`src/mocks/seed-workflows.ts`                        |
| 权限       | `src/config/permissions.ts` 中的 `workflow:read`、`workflow:approve`                    |
| 菜单与图标 | `src/config/nav.ts`、`src/features/navigation/menu-icons.ts`（`workflow`）              |

## 路由与视图

| 视图     | 查询参数       | 内容                                         |
| -------- | -------------- | -------------------------------------------- |
| 我发起   | `view=mine`    | `initiatorId` 为当前用户的申请               |
| 待我审批 | `view=pending` | 状态为待审批，且当前审批人正是当前用户的申请 |
| 全部     | `view=all`     | 当前角色可读的全部申请                       |

搜索、状态、类型、发起人与时间范围都写入 URL，刷新或分享带筛选的链接结果一致。直接访问 `/workflows` 会落到 `page=1&pageSize=10&view=pending`。

处理面板只在三个条件同时满足时渲染：申请为 `pending`、当前审批人是登录用户、会话拥有 `workflow:approve`。服务端会重复同样的校验：轮次不符返回 `403 NOT_YOUR_TURN`，已结束的申请即使按钮被绕过也会返回 `409 WORKFLOW_CLOSED`。

## 接口契约

所有接口都要求 `Authorization: Bearer <access token>` 与 `workflow:read`；审批决定额外要求 `workflow:approve`。

### `GET /workflows`

| 参数          | 说明                                           |
| ------------- | ---------------------------------------------- |
| `view`        | `mine`、`pending` 或 `all`；未知值回落到 `all` |
| `status`      | `pending`、`approved` 或 `rejected`            |
| `type`        | `purchase`、`leave`、`seal` 或 `change`        |
| `initiatorId` | 发起人精确匹配                                 |
| `from`、`to`  | `yyyy-MM-dd`，包含端点，作用于 `createdAt`     |
| `q`           | 忽略大小写匹配编号、标题、摘要、发起人或审批人 |
| `page`        | 从 1 开始；超过总页数时收敛到最后一页          |
| `pageSize`    | 限制在 `10…100`，默认 `10`                     |

返回 `PaginatedResult<WorkflowInstance>`，按 `updatedAt` 倒序、同时间再按编号排序。非法状态、类型或日期返回 `400 VALIDATION_ERROR` / `400 INVALID_DATE_RANGE`。

### `GET /workflows/:id`

返回 `{ instance, steps, comments }`，步骤与评论按时间正序。找不到时返回 `404 WORKFLOW_NOT_FOUND`。

### `POST /workflows/:id/decisions`

请求体：`{ decision: 'approve' | 'reject' | 'transfer', comment?, transferToId? }`。

| 决定 | 效果                                                                  |
| ---- | --------------------------------------------------------------------- |
| 同意 | 追加 `approved` 步骤，审批链前进一步；最后一步后状态变为 `approved`。 |
| 驳回 | 追加 `rejected` 步骤，申请以 `rejected` 结束。                        |
| 转交 | 替换当前步骤的审批人，审批链位置不变。                                |

`comment` 可选，会去掉首尾空白，空内容不落库。`transferToId` 必须是状态正常且角色拥有 `workflow:approve` 的用户，且不能是操作者本人。同意与驳回写入 `workflow.approved` / `workflow.rejected` 审计事件，转交写入 `workflow.transferred`。响应是更新后的 `WorkflowDetail`，客户端无需再拉一次。

### `POST /workflows/:id/comments`

请求体 `{ body }`，去空白后 1–1000 字符。返回该申请的全部评论。拥有 `workflow:read` 的会话即可评论，Mock 没有单独拆出评论权限。

### `GET /workflows/approvers`

返回角色拥有 `workflow:approve` 且状态正常的用户，按姓名排序。详情页用它填充转交选择器，并排除当前审批人。

## 审批链的精确定义

实例保存 `approverIds`（审批链）、`currentStep`（等待决定的当前位置）与推导出的 `status`。

- 提交时在 `currentStep = 0` 处追加 `submitted` 步骤。
- 同意使 `currentStep` 加一；达到 `approverIds.length` 时申请变为 `approved`，并写入 `completedAt`。
- 驳回不推进审批链，直接把申请置为结束并写入 `completedAt`。
- 转交重写 `approverIds[currentStep]`，追加一条同时记录操作人与目标审批人的 `transferred` 步骤。
- 已结束的申请拒绝任何后续决定。

`src/mocks/seed-workflows.ts` 用完全相同的逻辑回放种子数据，因此时间线不可能与存储的状态互相矛盾。

## 数据与 Mock 数据库

Mock 数据库版本为 `5`。从 v4 迁移时会补上 `workflows`、`workflowSteps`、`workflowComments`，并基于已有用户重放演示审批链；原有用户、角色、会话与协作数据都会保留，演示用的 manager 角色会补上两个审批权限码。v1–v3 的存储会沿同一条链路迁移。清掉 `localStorage` 中的 `fish-admin:db:v1` 即可恢复出厂种子。

种子包含八条申请：四条待审批（其中一条是两步链，另有一条停在其他审批人处）、三条已通过、一条已驳回，其中三条带有评论。`WF-2026-0142` 是单步申请，正等待 e2e 使用的 admin 账号处理。

## 生产环境注意事项

客户端刻意做得很薄，因为它的判断都不可信：

- **在同一事务里先复核再写入。** 用行锁（或版本号比较）重新读取实例，确认 `status = pending` 且调用者正是 `currentStep` 的审批人，再追加步骤、更新实例并写审计记录。两个针对同一步的并发审批不能都成功。
- **时间线由服务端掌握。** 步骤只追加，绝不允许客户端提交 `currentStep`、`status` 或时间戳；上面的请求体只能表达"做了什么决定"和可选备注。
- **服务端校验转交目标。** "此人能审批"是角色与账号状态的检查，不是客户端传来的标记。
- **审计与决定同事务。** 审计日志是决定发生过的证据；写入失败应当回滚决定，而不是留下缺口。
- **按记录授权读取。** Mock 对任何拥有 `workflow:read` 的会话都返回 `view=all`；真实系统通常还要按部门、项目或租户收窄范围。三个视图只是交互便利，不是授权模型。
- **客户端 RBAC 只是体验层。** 隐藏按钮或跳转 `/403` 只能避免误操作，拦不住请求。参见[权限系统](./rbac.md)。

## 测试

- `e2e/workflows.spec.ts` —— admin 同意 `WF-2026-0142`（状态、时间线、刷新后仍在、审计事件）；viewer 没有菜单入口且直达落 `/403`。
- `src/mocks/db/migrate.test.ts` —— v4 → v5 保留原有数据、补种审批链并合并新的权限码。
- 视觉基线 —— `workflows.png`（待办队列）与 `approval-detail.png`（时间线、快照、处理面板）。
