# Vue 模板用户详情与动态（Slice 8）设计

> 状态：范围已定，待实施。
> 基线：`main` @ `439fcf8`（Slice 1–7 全部完成并已 `--ff-only` 合并）。
> 本 Spec 是实施计划的绑定权威；实施中的冲突以本文档为准。

## 1. 目标

补上 `/users/:id`：**返回、身份头部（头像 / 姓名 / 状态 / 邮箱 / 角色 / 部门 / 入职日期）、概览页签（9 项资料 + 标签编辑 + 头像拖拽）、动态页签（该用户的审计事件时间线）、编辑与删除入口、404 状态**，以及列表页姓名到详情的链接。

**成功定义**：从列表点任一姓名进入详情，能看到完整资料；管理员改标签、换头像后刷新仍在；`audit:read` 角色能在「动态」里看到该用户最近 20 条审计事件；不存在的 id 显示「用户不存在」并可一键返回列表，而不是全局 404；全部门禁通过，`parity/**` 与 `*-linux.png` 零改动。

## 2. 背景

- React 侧这一块 578 行：`user-detail-page.tsx` 194、`user-overview.tsx` 110、`user-activity-tab.tsx` 111、`avatar-dropzone.tsx` 98、`tags-editor.tsx` 65。
- Vue 侧 `features/users` 目前只有列表相关文件，没有任何详情文件；`router.ts` 只有 `users` 一条路由。
- **`packages/vue` 没有对应的原语**：53 个导出里没有 `DetailPage`、`Descriptions`、`Timeline`、`TagsInput`、`Dropzone`、`Result`。已具备的是 `Card`（应用层 `components/ui/Card.vue`）、`Separator`、`Tabs*`、`Avatar*`、`Badge`、`Button`、`Skeleton`、`Input`。导出面在本弧线内冻结，所以缺的部分在**应用层**自建。
- **后端不需要新接口**：`GET /users/:id`（404 走 `USER_NOT_FOUND`）、`PATCH /users/:id`（接受 `tags` / `avatar` / `jobTitle` / `departmentId`）、`GET /audit-events?entityType=user&entityId=…` 都已存在；`features/audit/api.ts` 的 `fetchAuditEvents` 已经支持 `entityType` / `entityId`。
- **i18n 键全部已存在**，不新增 locale 键：`users:detail.*`（26 个，含 `tabs.*`、`notFound*`、`avatar*`、`tags*`）、`users:actions.{edit,delete,view}`、`audit:activity.*`、`audit:actions.*`、`audit:actorFallback`、`audit:loadError`、`audit:entities.*`、`common:departments.*`、`common:status.*`。
- 标签建议来自字典：`fetchDictionary('user_tag')` 返回的 `items` 里 `enabled` 的那些，无需新端点。

## 3. 关键决策

### 3.1 路由挂在应用壳层的 children 里，权限沿用 `user:read`

`{ path: 'users/:id', name: 'user-detail', meta: { permission: 'user:read' } }`，与 React 的 `/users/$id` 同权限。不进侧栏、不计入「13 个导航页」，官方文档的页面计数不变。

**详情页不新增导航项**：它是列表的下钻，不是并列入口；react 侧的 16 个路由里详情也是子路由。

### 3.2 头部在页面内联，不抽 `DetailPage` 原语

React 的 `DetailPage` 是 `packages/ui` 的 6 个 Pro 组合之一，Vue 侧没有对应物。一个消费者（用户详情）时不抽泛型组件：`PageHeader` 已有标题/描述/动作的壳，详情页需要的只是「头像 + 徽章 + 副标题 + 元信息行」的多一层结构，直接写在 `UserDetailPage.vue` 里更短，也不用在文档里解释一个只有一处的抽象。若后面项目/文件详情也要这套头部，再抽。

### 3.3 `Descriptions` 用 `<dl>` 三段网格

React 的 `Descriptions columns={3}` 渲染的是 term/description 对。Vue 侧用 `<dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">` + 每个 `<div><dt/><dd/></div>`：语义正确、RTL 下自动跟随、不需要 JS。9 项的顺序照抄 React：角色、部门、职位、状态、邮箱已验证、两步验证、入职、最近活跃、简介。

### 3.4 时间线是应用层 `Timeline.vue`，色调复用审计页的映射

`packages/vue` 没有 `Timeline`。新建 `components/ui/Timeline.vue`：一个 `<ol>`，每条含图标圆点、标题、描述、时间戳，`tone` 决定圆点与图标底色，空列表显示传入的 `emptyLabel`。

色调来源是 `@fish-admin/contracts/audit` 的 `AUDIT_ACTION_TONES`。审计页已经有一份 `TONE_CLASSES` 映射（`AuditLogsPage.vue` 内联），本切片把它连同 `toneClass()` 提到 `features/audit/tones.ts`，页面与时间线共用 —— 两份硬编码的色调表迟早会漂移。

资产图标用 `audit:entities.*` 的实体类型映射（user / role / department / auth / project / file / integration / workflow / dictionary），与审计表一致。

### 3.5 标签编辑器自建 `TagsInput.vue`

`packages/vue` 没有 `TagsInput`。行为取 React 的三条硬约束：**Enter 或逗号提交**、**Backspace 在输入为空时删掉最后一个**、**最多 8 个**（`tagsHint` 明写 "Up to 8 tags"）。建议项只列字典里启用且当前未使用的值，点击即加入。

去重与大小写：按 React 的做法做**不区分大小写**的比较，但保留用户输入的原始写法。

### 3.6 头像复用 Profile 页的重编码，提到 `lib/image.ts`

`ProfilePage.vue` 已有一段「读文件 → 等比居中裁切 → 256² webp 0.85」的实现，含类型与 2 MB 上限校验。详情页是第二个调用点，按 CSV 同样的理由（`lib/csv.ts`）提到 `lib/image.ts`：`AVATAR_TYPES`、`MAX_AVATAR_BYTES`、`AVATAR_SIZE`、`validateAvatarFile()`、`createAvatarDataUrl()`。移动而不是复制。

`Dropzone.vue` 只管交互（点击选择、拖拽高亮、`accept` 过滤、错误文案、预览插槽），不碰编码。

### 3.7 404 用页内 Result，不用全局 404 页

详情请求返回 404 时渲染页内的「用户不存在」+「返回用户列表」按钮，而不是跳到 `/404`：全局 404 会丢掉壳层，用户还得自己找回列表。React 用 `Result status="not-found"`，Vue 侧用 `EmptyState`（已有，图标 + 标题 + 描述 + 动作插槽）表达同一件事。

### 3.8 列表姓名变成 `RouterLink`，行操作菜单加「查看详情」

React 的姓名单元格是 `<Link to="/users/$id">`，行右键菜单有「View details」。Vue 侧：姓名改成 `RouterLink`（`users:actions.view` 用作 `aria-label`？不 —— 链接文本就是姓名，可访问名因此自然正确）；行操作下拉菜单加一项「View details」，排在编辑之上。

### 3.9 编辑与删除复用现有弹窗

`UserFormDialog`（props: `open` / `user` / `roles` / `departments`）与 `DeleteUserDialog`（`user` + `deleted` 事件）在详情页直接复用，不新建。删除成功后 `router.replace('/users')`。

## 4. 范围

**要做**

- `router.ts`：`users/:id` 路由（shell children，`user:read`）。
- `lib/image.ts`：从 `ProfilePage.vue` 提出来，含测试；`ProfilePage.vue` 改为引用。
- `components/ui/Dropzone.vue`、`TagsInput.vue`、`Timeline.vue`：应用层原语 + 测试。
- `features/audit/tones.ts`：`TONE_CLASSES` + `toneClass` + 实体图标，审计页改为引用。
- `features/users/api.ts`：`fetchUser`、`updateUserProfile`、`fetchUserActivity`。
- `features/users/queries.ts`：`userDetailQueryOptions`、`userActivityQueryOptions`、`userTagOptionsQueryOptions`。
- `features/users/UserDetailPage.vue`、`UserOverview.vue`、`UserActivityTab.vue`、`UserStatusBadge.vue`（列表与详情共用状态徽章）。
- `columns.ts`：姓名链接、行菜单加「查看详情」。
- 测试：详情页（加载/404/权限/编辑删除入口/页签）、概览（9 项、标签保存、头像上传与移除）、动态（时间线、空态、错误、无 `audit:read` 时不出现页签）、三个原语组件、`lib/image.ts`。
- e2e：列表点姓名进详情 → 改标签 → 刷新仍在；404 的 id；`audit:read` 角色看得到动态页签。
- 文档：两份 `docs/*/vue-template.md` 的功能清单、偏离表、测试计数；`README`/`README.zh-CN` 的 e2e 计数；`CHANGELOG`。

**不做**

- 导入向导（Slice 9）。
- 用户头像裁剪框（React 的 `AvatarCropper`）：本模板只做等比居中裁切。
- 详情页的 `useDocumentTitle`：Vue 模板没有页面级标题机制，页签名由工作区决定，单开一条实现路径不值。
- 项目 / 文件 / 集成的详情页：它们是别的切片。
- 动态的分页与「查看更多」：React 也只取最近 20 条。

## 5. 验收

1. `/users/:id` 在刷新后仍然可直达（不是只有从列表点进去才能用），未登录跳登录、无 `user:read` 跳 403。
2. 概览 9 项齐全，空值显示 `users:detail.noJobTitle` / `noBio` 而不是空白。
3. 改标签：Enter 与逗号都能加，Backspace 删末尾，超过 8 个拒绝；保存后刷新仍在；成功与失败都走行内提示（`useTransientMessage`），不引 toast。
4. 换头像：拖入与点击都能上传，非图片与超 2 MB 给出对应文案，上传后头部与概览两处同时更新，可移除。
5. `audit:read` 才有「动态」页签；时间线按时间倒序、每条的标题是 `audit:actions.*`、描述含操作者与最多 2 条 metadata；空态用 `audit:activity.empty`。
6. 不存在的 id：页内「用户不存在」+ 返回按钮，`router` 不跳走。
7. 编辑保存后头部与概览立即反映新值；删除后回到 `/users` 且列表里没有该用户。
8. `pnpm test:vue-template` 全绿；e2e 34 条；`parity/**` 与 `*-linux.png` 零差异；`packages/vue` 导出面与各 `package.json` 未变。

## 6. 风险

1. **`TagsInput` 的键盘交互容易做半套。** Enter / 逗号 / Backspace / 去重 / 上限 5 条规则，任何一条漏了都会在手工走查里露出来（jsdom 里 `keydown` 可控，但要测对 `Enter` 的 `preventDefault`）。
2. **`createImageBitmap` 在 jsdom 里不存在。** 头像测试只能断言「拒绝非图片 / 拒绝超限 / 成功时调用了 mutation」，编码路径本身靠类型与 e2e 保证 —— 与 Profile 页现有测试同一策略。
3. **详情与列表的缓存要一起失效。** 改标签 / 换头像用 `['users']` 前缀失效（React 同做法），否则回到列表看到的还是旧头像。
4. **`Tabs` 的受控与内容挂载。** Reka 的 `Tabs` 默认卸载未激活面板，动态页签的查询要在激活后才发；这与 React 一致，但测试里要显式点页签再断言。
5. **PATCH 只送改动字段。** 标签编辑只发 `tags`、头像只发 `avatar`：`PATCH /users/:id` 会校验完整字段，送全量会把没改的 `roleId` 一起提交，可能触发自助降级之类的服务端拒绝。
