# Vue 模板管理与报表页面（Slice 3）设计

> 状态：范围已定，待复核本文档。
> 基线：`workbuddy/main-a7370c6a` @ `c22bbe3`（Slice 1、Slice 2 与其修复轮均已完成；未 push、未发布）。
> 本 Spec 是实施计划的绑定权威；计划中的冲突以本文档为准。

## 1. 目标

把 Vue 模板从「登录 + Dashboard + Users」扩到「登录 + Dashboard + Users + 管理与报表域」：新增 8 个有真实数据的页面，让 `NAV_CONTRACT` 的 16 个导航项中 9 项可达，并订正文档中过期的「21 个契约页面」口径。

**成功定义**：16 个导航项里 `/`、`/users`、`/reports`、`/departments`、`/roles`、`/permissions`、`/dictionaries`、`/audit-logs`、`/integrations` 共 9 项出现在侧栏、有对应路由、按权限键过滤且能打开真实数据；`/roles/matrix` 作为子路由可用；8 个页面共用同一套列表形态；双语文档、`CHANGELOG` 与验收证据齐备；parity 基线与视觉截图零改动。

## 2. 背景

- Slice 1 交付 `@fish-admin/vue@0.1.0` 与 `apps/parity-vue`，Vue 目标 42 条 parity 检查通过。
- Slice 2 交付私有 `apps/vue-template@0.1.0`：`/login`、`/`、`/users`、`/403`、404，共 64 个单测与 6 条 Playwright 冒烟。
- `c22bbe3` 修复了整分支评审留下的两条缺陷（分页越界、启动失败白屏），Slice 2 已收口。
- 契约权威清单是 `packages/contracts/src/navigation.ts` 的 `NAV_CONTRACT`：**4 组 16 项**，Vue 侧 `apps/vue-template/src/config/nav.ts` 目前用 `IMPLEMENTED_PATHS = new Set(['/', '/users'])` 过滤，只显示 2 项。
- 现有 `docs/en/vue-template.md`、`docs/zh-CN/vue-template.md` 与 Slice 2 spec 中的「21 个契约页面 / 21 features」是历史口径（源自 1.7.0 时期的页面数），与当前契约不符，本切片一并订正为 16。
- `packages/mock` 已提供本切片全部所需端点，`packages/contracts` 已提供领域实体类型；缺口集中在 Vue 侧页面、请求包装类型与本地组件。
- React 模板剩余能力远超单个切片可控规模，因此按内聚域分批；本切片是第一批。

## 3. 范围

### 3.1 包含

| 能力       | 内容                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 导航扩展   | `IMPLEMENTED_PATHS` 由 2 项扩到 9 项；`NAV_GROUPS` 过滤逻辑不变；`findNavItem` 需正确处理 `/roles/matrix` 的最长匹配                                    |
| 新页面     | `/reports`、`/departments`、`/roles`、`/roles/matrix`、`/permissions`、`/dictionaries`、`/audit-logs`、`/integrations`                                  |
| 数据层     | 每个 feature 本地的 `api.ts` / `queries.ts` / `search.ts`，复用 `apiRequest` 与 `queryClient`；请求/响应包装类型本地定义，不改共享包                    |
| i18n       | Vue 侧 `i18nReady` 追加加载 `reports`、`departments`、`roles`、`permissions`、`dictionaries`、`audit`、`integrations`；界面文案全部取自既有 locale JSON |
| 统一形态   | 列表页统一使用 `PageHeader` + `ProTable` + 外部分页器 + `EmptyState` / `ErrorState` + `role="status"` 反馈；沿用 Slice 2 的 `serverPageCount` 收敛规则  |
| 权限       | 路由 `meta.permission`、按钮级 `hasPermission`、导航过滤三层一致；`/403` 与 404 行为不变                                                                |
| 测试与文档 | 每个页面单测、跨页面 Playwright 冒烟、双语文档与 `CHANGELOG` 订正、全量验收                                                                             |

### 3.2 不包含

- `/projects`、`/workflows`、`/files`、`/notifications` 及其详情/看板/上传/附件等协作域页面。
- `/profile`、`/security`、`/settings` 账户域页面；主题 accent、布局三态、密度与内容宽度设置。
- 注册、找回/重置密码、邮箱验证、邀请接受、OTP/MFA 登录链路与 2FA；`MFA_NOT_SUPPORTED` 行为保持不变。
- `header` / `mixed` 布局、命令面板、通知铃与通知中心、App Tabs、Subnav、离线 banner、product tour。
- 任何图表：Reports 用汇总卡片 + 表格呈现，不引入 `recharts` 或任何 Vue 图表库，不新增第三方依赖。
- CSV 导入/导出、保存视图、列显示/列宽/密度控制、批量操作、虚拟滚动、Users 详情与活动记录。
- 服务端菜单 `GET /menu`（继续由静态 `NAV_CONTRACT` 派生）、像素级 parity、新视觉基线。
- 对 `parity/**`、`*-linux.png`、`packages/ui/**`、React `src/**` 的任何改动。

## 4. 全局约束

1. `packages/ui/**` 与 React `src/**` 只读；本切片不新增公开 API、不发布任何包、不改 React 组件行为。
2. 共享包 `packages/{contracts,i18n,mock}/src` 不得出现 `react`、`react-dom`、`@fish-admin/react`、`@/` 别名或 Lucide 组件导入；本切片不修改这三个包的 `src`（locale JSON 只在确实缺键时才成对新增）。
3. 版本冻结：根 `2.2.0`、`@fish-admin/react` `0.2.2`、`@fish-admin/tokens` `0.1.1` 不变；`@fish-admin/vue` 与 `@fish-admin/vue-template` 保持 `private: true` 与 `0.1.0`。本切片不新增包、不引入新第三方依赖。
4. 「客户端权限不是安全边界」说明不得弱化或删除；新文档与页面文案沿用既有口径。
5. 视觉基线不可再生：198 张 `*-linux.png` 与 `parity/**` 零改动；禁止 `--update-snapshots=all`、`test:visual:update`、`test:docs:visual:update`。
6. 双语同步：每改动一份 `docs/en/*.md`，同一提交更新对应 `docs/zh-CN/*.md`；README 同理；`CHANGELOG.md` 只写英文。内部 spec / plan 文档不受此约束。
7. 工具链固定：Node >= 22、pnpm 9.1.1，所有命令在仓库根目录执行，Windows 使用 Git Bash；`docs/en/*.md` 工作树必须保持 LF。
8. 每个任务结束前至少运行 `pnpm exec prettier --check <changed files>`、`pnpm lint` 与相关测试，声明「通过」必须附真实命令输出。
9. 提交粒度：每个任务一个本地 Conventional Commit；不得 `--amend` 已存在提交、不得 `--no-verify`。`git push`、远端 tag、`npm publish`、GitHub Release、Vercel 变更每一项都需要单独、明确的批准；本切片只产生本地 commit。

## 5. 架构

### 5.1 应用与依赖

`apps/vue-template` 继续依赖 `@fish-admin/contracts`（类型）、`@fish-admin/i18n`（文案）、`@fish-admin/mock/browser`（仅开发期 MSW）、`@fish-admin/vue`（组件）与既有的 `@tanstack/vue-query` / `@tanstack/vue-table` / `pinia` / `vue-router`。不新增依赖。所有新组件落在应用内，不进 `packages/vue`。

### 5.2 目录结构

```text
apps/vue-template/src/
  config/nav.ts                      # 修改：IMPLEMENTED_PATHS 扩到 9 项
  lib/i18n.ts                       # 修改：ensureNamespaces 追加 7 个命名空间
  router.ts                         # 修改：8 条新路由 + meta.permission
  components/common/
    ListPageHeader.vue              # 新增：列表页标题 + 操作区（复用 PageHeader）
    DetailDrawer.vue                # 新增：右侧详情抽屉通用壳
  features/
    reports/{api.ts,queries.ts,ReportsPage.vue,ReportsPage.test.ts}
    departments/{api.ts,queries.ts,DepartmentTree.vue,DepartmentsPage.vue,...}
    roles/{api.ts,queries.ts,RolesPage.vue,RoleMatrixPage.vue,...}
    permissions/{api.ts,queries.ts,PermissionsPage.vue,...}
    dictionaries/{api.ts,queries.ts,DictionariesPage.vue,...}
    audit/{api.ts,queries.ts,AuditLogsPage.vue,AuditDetailDrawer.vue,...}
    integrations/{api.ts,queries.ts,IntegrationsPage.vue,...}
e2e-vue-template/specs/management.spec.ts  # 新增：跨页面冒烟
docs/en/vue-template.md / docs/zh-CN/vue-template.md  # 修改
README.md / README.zh-CN.md / CHANGELOG.md            # 修改
```

### 5.3 启动顺序与命名空间

沿用 Slice 2 的 `start()` 顺序（`i18nReady` → mock worker → Pinia / `configureApi` → theme → `bootstrap()` → `createApp` → `router.isReady()` → `mount`），并保留 `void start().catch(handleStartupFailure)`。`lib/i18n.ts` 的 `ensureNamespaces([...])` 从 4 个扩到 11 个：`auth`、`dashboard`、`users`、`validation`、`reports`、`departments`、`roles`、`permissions`、`dictionaries`、`audit`、`integrations`。`common`、`nav`、`errors` 仍由共享包 eager 加载。若任一命名空间加载失败，沿用现有启动失败面板，不静默降级。

### 5.4 数据层

每个 feature 的 `api.ts` 用 `apiRequest` 调用既有 mock 端点，包装类型（列表参数、结果、输入）在 feature 内本地定义，形状对齐 React 侧同名类型但不修改 `packages/contracts`：`GET /reports`、`GET|POST /departments`、`PATCH /departments/:id`、`GET|POST /roles`、`GET /roles/options`、`PATCH|DELETE /roles/:id`、`PUT /roles/:id/permissions`、`GET /permissions`、`GET|POST /dictionaries`、`GET|PATCH|DELETE /dictionaries/:id`、`…/:id/items[/reorder][/:itemId]`、`GET /audit-events`、`GET /audit-events/:id`、`GET|POST|PATCH|DELETE /integrations[/:id]`、`GET /integrations/deliveries`、`GET /integrations/:id/deliveries`、`POST …/deliveries/:deliveryId/retry`。

`queries.ts` 统一用 `queryOptions` + `computed(() => [domain, params])` 的 queryKey（照 `usersQueryOptions` 先例），列表查询启用 `placeholderData: keepPreviousData`。写操作成功后只 `invalidateQueries({ queryKey: [domain] })`，不写无效的兄弟键。

### 5.5 权限与导航

`IMPLEMENTED_PATHS` 扩到 9 项后，`NAV_GROUPS` 由 `NAV_CONTRACT` 派生并丢弃空组的逻辑不变。路由 `meta.permission` 取契约权限键：`report:read`、`department:read`、`role:read`、`permission:read`、`dictionary:read`、`audit:read`、`integration:read`；`/roles/matrix` 沿用 `role:read`。按钮级检查用 `hasPermission(granted, 'xxx:create|update|delete')`，无权限时不渲染按钮（不以禁用态代替）。`findNavItem` 的最长匹配需覆盖 `/roles/matrix` 落在 Roles 项上。

### 5.6 列表页统一形态

所有带分页的页面沿用 `UsersPage.vue` 的形态：`PageHeader` + `ProTable`（`:table-label` 必填）+ 外部 `Page X of Y` 分页器 + `EmptyState` / `ErrorState` + `role="status"` 操作反馈；`useVueTable` 的 `data` / `columns` / `state.sorting` 必须用 getter（Slice 2 的真实缺陷），并复刻修复轮的 `watch([data.pageCount, isPlaceholderData])` 收敛逻辑，避免删除或筛选后页码越界。排序表头必须是真正可键盘操作的 `<button>`。

### 5.7 错误与空态

沿用 Slice 2：失败 refetch 保留上一页数据并显示 `actionError`；首次加载失败用 `ErrorState` + 重试；筛选无结果用带清除动作的 `EmptyState`；无筛选的空数据用普通 `EmptyState`。不新增 toast 库。

## 6. 路由与页面

### 6.1 路由表

| 路径            | 页面               | 访问规则                    |
| --------------- | ------------------ | --------------------------- |
| `/reports`      | `ReportsPage`      | 已登录 + `report:read`      |
| `/departments`  | `DepartmentsPage`  | 已登录 + `department:read`  |
| `/roles`        | `RolesPage`        | 已登录 + `role:read`        |
| `/roles/matrix` | `RoleMatrixPage`   | 已登录 + `role:read`        |
| `/permissions`  | `PermissionsPage`  | 已登录 + `permission:read`  |
| `/dictionaries` | `DictionariesPage` | 已登录 + `dictionary:read`  |
| `/audit-logs`   | `AuditLogsPage`    | 已登录 + `audit:read`       |
| `/integrations` | `IntegrationsPage` | 已登录 + `integration:read` |

所有新增路由都包在 `ShellLayout` 内，沿用 `sanitizeRedirect` 的站内校验；未登录跳 `/login`、无权限跳 `/403` 的行为不变。路由组件用 `() => import(...)` 懒加载，不引入新的全局状态。

### 6.2 各页面职责

| 页面         | 最小可验收行为                                                       |
| ------------ | -------------------------------------------------------------------- |
| Reports      | 汇总卡片 + 期间/维度筛选 + 报表数据表；**不画图**                    |
| Departments  | 左侧部门树（可选中）+ 右侧详情 + 新建/编辑对话框；树节点空组正确折叠 |
| Roles        | 角色表格 + 新建/重命名/删除对话框；删除后列表刷新                    |
| Roles matrix | 角色 × 权限矩阵，勾选后 `PUT /roles/:id/permissions` 并即时反馈      |
| Permissions  | 按模块分组展示权限码与说明，只读                                     |
| Dictionaries | 字典类型列表 + 条目表格 + 新建/编辑/删除对话框                       |
| Audit logs   | 时间/类型/实体筛选 + 审计表格 + 详情抽屉（展示 metadata）            |
| Integrations | 集成列表 + 新建/编辑抽屉 + 投递记录抽屉（含重试按钮）                |

### 6.3 权限门控

三层一致：侧栏 `filterNavGroups` 过滤、路由 `meta.permission` 校验、页面内按钮级 `hasPermission`。`403` 页与「客户端权限不是安全边界」说明保持原样。

## 7. 组件增量

| 组件                                              | 位置                    | 说明                                                              |
| ------------------------------------------------- | ----------------------- | ----------------------------------------------------------------- |
| `ListPageHeader`                                  | `components/common/`    | 统一标题、描述与操作插槽；基于现有 `PageHeader` 包装              |
| `DetailDrawer`                                    | `components/common/`    | 右侧详情抽屉通用壳；用现有 `Dialog` 原语组合，不改 `packages/vue` |
| `DepartmentTree`                                  | `features/departments/` | 树形选择，键盘可操作，空组不渲染                                  |
| `AuditDetailDrawer` / `IntegrationDeliveryDrawer` | 各 feature              | 基于 `DetailDrawer` 的领域内容                                    |

所有新增组件的 class 集合从对应 React 源码复制（允许 Prettier Tailwind 插件重排顺序），行为差异写入 §12 偏差表。不新增 `packages/vue` 导出。

## 8. 可访问性

- 每个列表 `<table>` 带本地化的 `:table-label`；排序表头是真按钮并带 `aria-sort`。
- 抽屉用 `role="dialog"` / `aria-modal="true"`，Esc 关闭并把焦点还给触发元素。
- 树形控件用 `role="tree"` / `role="treeitem"`，选中态用 `aria-selected`，方向键可切换。
- 所有图标 `aria-hidden="true"`，仅图标按钮必须有 `aria-label`。
- 操作反馈用 `role="status"`，错误用 `role="alert"`；不引入新的全局 landmark。

## 9. 测试

### 9.1 Vitest

| 模块                         | 覆盖                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `config/nav`                 | 9 项可见、空组丢弃、`/roles/matrix` 最长匹配命中 Roles                 |
| `router`                     | 8 条路由的 `meta.permission`、无权限跳 `/403`、`sanitizeRedirect` 回归 |
| 各 feature `api` / `queries` | 请求参数拼接、queryKey、invalidate 范围                                |
| 各页面组件                   | 加载/错误/空态、筛选与分页、权限隐藏按钮、写操作成功后刷新、页码收敛   |
| 新组件                       | `DetailDrawer` 焦点返回、`DepartmentTree` 键盘操作                     |

沿用 `apps/vue-template/vitest.config.ts` 的 `src/**/*.test.ts` include；无 `.only` / `.skip`；不依赖真实计时器做去抖断言。

### 9.2 Playwright

新增 `e2e-vue-template/specs/management.spec.ts`：用 3 个演示账号验证（1）管理员可见 9 个导航项并能逐个打开；（2）只读账号看不到无权限项、直连 URL 落 `/403`；（3）Roles 矩阵勾选后刷新仍生效；（4）删除一条字典/集成后分页器回到有效页。只断言可访问名称、角色、可见文本与状态，不写 CSS 选择器（根元素状态断言沿用既有豁免），不生成或比对截图。

## 10. 文档与脚本

- `docs/en/vue-template.md` 与 `docs/zh-CN/vue-template.md`：把「21」订正为 16，更新路由表、`Scope` / `Not included`、`Deviations` 表与测试计数，保持 H1 与段落一一对应。
- `README.md` 与 `README.zh-CN.md`：同步模板文档入口段落（若涉及）。
- `CHANGELOG.md`：`[Unreleased]` 增加英文 `### Added` 条目。
- 不新增根脚本；`typecheck` 链不变。

## 11. 验收标准

1. `pnpm lint` 0 error、`pnpm format:check` 通过、`pnpm typecheck` 9 包全过。
2. `pnpm test:vue-template` 全过且报告实际用例数；`pnpm test:vue`、`pnpm test:shared`、`pnpm test:ui` 不回归。
3. `pnpm test:e2e:vue-template` 原有 6 条 + 新增管理域冒烟全过。
4. `pnpm build:vue-template`、`pnpm docs:check`、`pnpm docs:build` 通过。
5. `pnpm test:parity:docker` 119/119、`pnpm test:parity:vue` 42/42；`git diff --name-only -- 'parity/**' '*-linux.png'` 为空。
6. 人工走查：3 个演示账号分别登录，逐页确认导航、权限、抽屉焦点与刷新持久化，并把证据写进 SDD 台账；没有真实浏览器证据不得声明通过。
7. 双语文档同提交同步，测试计数与实际输出一致；`CHANGELOG` 只含英文。
8. 无 push、无 tag、无 publish；`@fish-admin/vue` 与 `@fish-admin/vue-template` 仍为 `private: true` / `0.1.0`。

## 12. 与 React 模板的偏差（必须写入双语文档）

| 项                                   | React                                              | 本切片                               |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------ |
| 导航                                 | 16 项 + 服务端 `GET /menu`                         | 9 项，静态 `NAV_CONTRACT` 派生       |
| Reports / Dashboard                  | recharts 图表                                      | 汇总卡片 + 表格，无图表              |
| 壳层                                 | sidebar / header / mixed、密度、宽度、tabs、subnav | 仅 sidebar，沿用 Slice 2             |
| 命令面板 / 通知 / tour / 离线 banner | 有                                                 | 无                                   |
| 认证                                 | 注册 / 找回 / 重置 / 邀请 / OTP / 2FA              | 仍只有登录 + 会话恢复                |
| Users                                | CSV、批量、保存视图、列控制、详情、活动            | 仍只有 Slice 2 的搜索/筛选/分页/CRUD |
| 协作域页面                           | projects / workflows / files / notifications       | 不在本切片                           |
| 账户域页面                           | profile / security / settings                      | 不在本切片                           |
| 视觉 parity                          | 198 张基线                                         | 不新增、不改动任何基线               |

## 13. 风险与缓解

| 风险                                 | 缓解                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| 8 个页面铺开后形态不一致             | §5.6 统一列表骨架；每个页面 Task 都要求复用 `UsersPage.vue` 的 getter / 页码收敛模式 |
| 新命名空间漏加载导致首屏出现原始键名 | `i18nReady` 显式列出 11 个命名空间，并加一条单测断言 `ensureNamespaces` 参数         |
| 权限三层不一致造成直连绕过           | 路由表与 `NAV_GROUPS` 在同一 Task 收口，e2e 用只读账号直连验证                       |
| 抽屉/树组件焦点与键盘行为退化        | 新组件单测覆盖 Esc、焦点返回、`role=tree` 方向键                                     |
| 误改共享包或 React 包                | Global Constraints + 每个 Task 的 `git diff --name-only` 校验                        |
| 视觉基线被意外重录                   | 禁止所有 snapshot update 命令；验收第 5 条硬校验 diff 为空                           |
| 文档「21」口径继续扩散               | Task 收口时同时订正 4 处双语副本与 spec 引用                                         |
| 切片再次因规模失控中断               | 按域分批，本切片只做 8 页；账户/协作/壳层/图表明确写入 §14 的后续路线                |

## 14. 决策记录

1. **按域分批而非一次补齐**：React 模板剩余 14 个契约页面 + 7 个认证页 + 壳层/图表/命令面板等能力，单个切片无法在可控规模内验收；按内聚域切成 Slice 3（管理与报表）、Slice 4（账户与认证 + 壳层）、Slice 5（协作域 + 图表与高级能力）。
2. **本切片选管理与报表**：这 8 页的 mock 端点与 contracts 类型已齐备、不需要新第三方依赖、可逐页独立验收，是风险最低的一批。
3. **不引入图表库**：`recharts` 是 React 专用，Vue 侧引入新库会带来技术选型与体积风险；Reports 用表格呈现，图表留到专门切片决策。
4. **不动共享包**：请求包装类型在 feature 本地定义，沿用 Slice 2 的 `features/auth/api.ts` 先例，避免共享包 API 面扩大。
5. **继续静态导航**：`GET /menu` 属于服务端菜单能力，与命令面板/权限动态化同批更合适，本切片只扩 `IMPLEMENTED_PATHS`。
6. **订正「21」**：以 `NAV_CONTRACT` 的 16 项为唯一口径，避免后续切片继续按错误规模估算。
7. **不新增 `packages/vue` 导出**：抽屉、树等组件是应用级组合，放进组件包会扩大 Slice 1 冻结的 parity 面。
8. **沿用修复轮的两条机制**：`useVueTable` 的 getter 与 `watch([pageCount, isPlaceholderData])` 页码收敛，是所有新列表页的硬性要求，防止 IMP-1 类缺陷换页复发。
