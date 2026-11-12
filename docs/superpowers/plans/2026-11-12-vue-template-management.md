# Vue 模板管理与报表页面（Slice 3）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/vue-template` 落地 8 个有真实数据的管理与报表页面，把可见导航从 2 项扩到 `NAV_CONTRACT` 16 项中的 9 项，订正文档中过期的「21」口径，并保持 parity 基线与视觉截图零改动。

**Architecture:** 四层推进。第一层补齐数据层与 i18n 基础（7 个新命名空间、各 feature 的本地 API/query 包装、列表页通用壳）；第二层按依赖顺序逐页交付 Reports → Departments → Roles → Roles matrix → Permissions → Dictionaries → Audit logs → Integrations，每个页面复用 Slice 2 的 `PageHeader` + `ProTable` + 外部分页器形态和修复轮的页码收敛机制；第三层统一收口路由、`IMPLEMENTED_PATHS`、权限三层与跨页面 Playwright 冒烟；第四层全量验收、双语文档与 `CHANGELOG`。全部改动只在 `apps/vue-template`、`e2e-vue-template`、`docs/en`、`docs/zh-CN`、README 与 `CHANGELOG`，不动 React 包、共享包 `src`、`packages/ui` 与 `parity/**`。

**Tech Stack:** 沿用 `apps/vue-template` 现有依赖（Vue 3.5、vue-router 4、Pinia、@tanstack/vue-query、@tanstack/vue-table、Reka UI 通过 `@fish-admin/vue`、lucide-vue-next、Tailwind 4、Vite 8、Vitest 5 + jsdom、Playwright 1.64.1、pnpm 9.1.1、Node >= 22）。**本计划不新增任何第三方依赖、不新增 workspace 包。**

**Spec:** `docs/superpowers/specs/2026-11-12-vue-template-management-design.md`（绑定权威）。上游口径见 `docs/en/vue-template.md`、`docs/zh-CN/vue-template.md`、`packages/contracts/src/navigation.ts` 与 `packages/mock/src/handlers/index.ts`。

## Global Constraints

- **React 面只读**：`packages/ui/**` 与 React `src/**` 在本计划中只读；不新增公开 API、不发布任何包、不改 React 组件行为。
- **共享包框架无关**：`packages/{contracts,i18n,mock}/src` 不得引入 `react`、`react-dom`、`@fish-admin/react`、`@/` 别名或 Lucide 导入；本计划不修改这三个包的 `src`。只有确实缺界面文案时才成对新增 locale JSON 键，并在同一提交内更新 en / zh-CN。
- **版本冻结**：根 `2.2.0`、`@fish-admin/react` `0.2.2`、`@fish-admin/tokens` `0.1.1` 不变；`@fish-admin/vue` 与 `@fish-admin/vue-template` 保持 `private: true` 与 `0.1.0`。本计划不发布、不升级、不新增包。
- **外部动作审批**：`git push`、远端 tag、`npm publish`、GitHub Release、Vercel 项目设置或部署变更，每一项都需要单独、明确的批准。**本计划只产生本地 commit，不 push、不打 tag、不发布。**
- **视觉基线不可再生**：198 张 `*-linux.png` 与 `parity/**` 零改动。任何任务都不得运行 `--update-snapshots=all`、`test:visual:update`、`test:docs:visual:update`，不得改动 `playwright.parity.config.ts` 的 `updateSnapshots: 'none'`。
- **RBAC 只是 UX**：所有 README、docs、界面文案中的「客户端权限不是安全边界」说明不得弱化或删除。
- **文档双语同步**：每改动一份 `docs/en/*.md`，必须同一提交内更新对应 `docs/zh-CN/*.md`；README 同理；`CHANGELOG.md` 只写英文。新文档必须以 H1 开头（`sync-template-docs.mjs` 与 `check-docs.mjs` 会校验），内部 spec / plan 不受此约束。
- **工具链固定**：Node >= 22、pnpm 9.1.1；所有命令在仓库根目录执行，Windows 使用 Git Bash。`docs/en/*.md` 工作树必须保持 LF，否则 `pnpm format:check` 与 docs H1 校验会误报。
- **每任务 gates**：每个任务结束前至少运行 `pnpm exec prettier --check <changed files>`、`pnpm lint` 与相关测试；声明「通过」之前必须附真实命令输出。
- **提交粒度**：每个任务一个本地 Conventional Commit；不得 `--amend` 已存在的提交，不得 `--no-verify`。commit message 正文每行不超过 100 字符（`commitlint` 的 `body-max-line-length`）。
- **不做的事（逐条）**：本计划不做协作域页面、账户域页面、认证页与 OTP/MFA 链路、壳层三布局/密度/宽度、命令面板、通知中心、App Tabs、Subnav、离线 banner、product tour、任何图表、CSV 导入导出、批量操作、保存视图、列控制、Users 详情/活动、`GET /menu` 服务端菜单、像素 parity 与新视觉基线。

---

## File Structure

```text
apps/vue-template/src/
  config/nav.ts                       # Modify: IMPLEMENTED_PATHS 2 -> 9
  lib/i18n.ts                        # Modify: ensureNamespaces 4 -> 11
  lib/list-page.ts                    # Create: 列表参数/分页收敛的共享纯函数
  router.ts                          # Modify: 8 条路由 + meta.permission
  components/common/
    ListPageHeader.vue               # Create
    DetailDrawer.vue                 # Create
  features/
    reports/
      api.ts queries.ts search.ts ReportsPage.vue ReportsPage.test.ts
    departments/
      api.ts queries.ts DepartmentTree.vue DepartmentTree.test.ts
      DepartmentsPage.vue DepartmentsPage.test.ts
    roles/
      api.ts queries.ts RolesPage.vue RolesPage.test.ts
      RoleMatrixPage.vue RoleMatrixPage.test.ts
    permissions/
      api.ts queries.ts PermissionsPage.vue PermissionsPage.test.ts
    dictionaries/
      api.ts queries.ts DictionariesPage.vue DictionariesPage.test.ts
    audit/
      api.ts queries.ts AuditDetailDrawer.vue AuditLogsPage.vue AuditLogsPage.test.ts
    integrations/
      api.ts queries.ts IntegrationDeliveryDrawer.vue
      IntegrationsPage.vue IntegrationsPage.test.ts
e2e-vue-template/specs/management.spec.ts   # Create
docs/en/vue-template.md / docs/zh-CN/vue-template.md   # Modify
README.md / README.zh-CN.md / CHANGELOG.md              # Modify
```

`src/**/*.test.ts` 与源文件同目录（沿用 `vitest.config.ts` 的 include）。不新增 `packages/vue` 导出，不新增根脚本，`typecheck` 链不变。

---

### Task 1: 数据层、命名空间与列表页基础

**Files:**

- Modify: `apps/vue-template/src/lib/i18n.ts`
- Create: `apps/vue-template/src/lib/list-page.ts`、`list-page.test.ts`
- Create: `apps/vue-template/src/components/common/{ListPageHeader.vue,DetailDrawer.vue}`、对应 `.test.ts`

**Interfaces:**

- Produces: `ensureNamespaces` 加载 11 个命名空间；`clampToPageCount(currentPage, pageCount)` 纯函数；`ListPageHeader`（标题/描述/操作插槽）；`DetailDrawer`（`open` / `title` / 默认插槽，Esc 关闭并归还焦点）。

- [ ] **Step 1: 扩展 i18nReady 的命名空间**

在 `lib/i18n.ts` 的 `ensureNamespaces([...])` 追加 `reports`、`departments`、`roles`、`permissions`、`dictionaries`、`audit`、`integrations`。补一条单测断言参数包含全部 11 个命名空间（防止后续页面首屏出现原始键名，spec §5.3）。

- [ ] **Step 2: 抽出页码收敛纯函数**

把修复轮在 `UsersPage.vue` 里的 `watch([data.pageCount, isPlaceholderData])` 判定逻辑抽成 `clampToPageCount(currentPage, pageCount, isPlaceholder)`，返回应写入 `search.page` 的值；`currentPage <= lastPage` 或 `isPlaceholder` 时原样返回。单测覆盖越界收敛、placeholder 跳过、`pageCount=0` 归一为 1、正常翻页不回拉。**不要修改 `UsersPage.vue` 的现有行为**，只在后续新页面复用该函数。

- [ ] **Step 3: 两个通用组件**

`ListPageHeader` 基于现有 `PageHeader` 包装，保留 `title` / `description` / `#actions` 插槽；`DetailDrawer` 用 `@fish-admin/vue` 的 `Dialog` 原语组合，`role="dialog"` + `aria-modal="true"`，Esc 关闭并把焦点还给触发元素。单测覆盖焦点返回与 Esc。

- [ ] **Step 4: 验证**

Run:

```bash
pnpm exec prettier --check apps/vue-template/src/lib/i18n.ts apps/vue-template/src/lib/list-page.ts apps/vue-template/src/lib/list-page.test.ts apps/vue-template/src/components/common/ListPageHeader.vue apps/vue-template/src/components/common/DetailDrawer.vue
pnpm lint
pnpm test:vue-template
```

Expected: 全部退出码 0；新单测通过；原有 64 条用例不回归。

- [ ] **Step 5: Commit**

```bash
git add apps/vue-template/src/lib apps/vue-template/src/components/common
git commit -m "feat(vue-template): add list-page foundations and management namespaces"
```

---

### Task 2: Reports 页面

**Files:**

- Create: `apps/vue-template/src/features/reports/{api.ts,queries.ts,search.ts,ReportsPage.vue,ReportsPage.test.ts}`
- Modify: `apps/vue-template/src/router.ts`（仅本页路由）

**Interfaces:**

- Produces: `fetchReports(params, signal)`、`reportsQueryOptions(params)`、`ReportsPage`（无 props）。请求 `GET /reports`，包装类型本地定义。

- [ ] **Step 1: API 与查询**

`api.ts` 用 `apiRequest` 拼接期间/维度参数；`queries.ts` 用 `queryOptions` + `computed(() => ['reports', unref(params)])`。不画图、不引入 `recharts`。

- [ ] **Step 2: 页面**

汇总卡片 + 期间筛选 + `ProTable` 数据表（`:table-label` 取 `reports:*` 文案）+ 分页器；复用 `ListPageHeader`、`EmptyState`、`ErrorState`；列表数据用 getter、页码用 `clampToPageCount`。

- [ ] **Step 3: 测试与验证**

Run: `pnpm test:vue-template` + `pnpm exec prettier --check <changed files>` + `pnpm lint`。
Expected: 新用例覆盖加载/错误/空态与筛选参数；全部退出码 0。

- [ ] **Step 4: Commit**

```bash
git add apps/vue-template/src/features/reports apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the reports page"
```

---

### Task 3: Departments 页面

**Files:**

- Create: `apps/vue-template/src/features/departments/{api.ts,queries.ts,DepartmentTree.vue,DepartmentTree.test.ts,DepartmentsPage.vue,DepartmentsPage.test.ts}`
- Modify: `apps/vue-template/src/router.ts`

**Interfaces:**

- Produces: `fetchDepartments`、`fetchDepartment(id)`、`createDepartment`、`updateDepartment`；`DepartmentTree`（`items` / `modelValue` / `update:modelValue`）。

- [ ] **Step 1: 树组件**

`role="tree"` / `role="treeitem"`，`aria-selected`，方向键切换，空组不渲染。单测覆盖键盘操作与选中事件。

- [ ] **Step 2: 页面与对话框**

左树右详情；新建/编辑用现有 `Dialog` 原语；成功后 `invalidateQueries({ queryKey: ['departments'] })` 并给出 `role="status"` 反馈。

- [ ] **Step 3: 测试与验证**

Run: `pnpm test:vue-template` + `pnpm exec prettier --check <changed files>` + `pnpm lint`。
Expected: 覆盖树键盘、详情切换、新建后刷新、无权限隐藏按钮；全部退出码 0。

- [ ] **Step 4: Commit**

```bash
git add apps/vue-template/src/features/departments apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the departments tree page"
```

---

### Task 4: Roles 页面

**Files:**

- Create: `apps/vue-template/src/features/roles/{api.ts,queries.ts,RolesPage.vue,RolesPage.test.ts}`
- Modify: `apps/vue-template/src/router.ts`

**Interfaces:**

- Produces: `fetchRoles`、`fetchRoleOptions`、`createRole`、`updateRole`、`deleteRole`、`updateRolePermissions`。

- [ ] **Step 1: 表格与 CRUD**

角色表格 + 新建/重命名/删除对话框；删除最后一页唯一一行后复用 `clampToPageCount` 收敛页码。**不实现 React 的多步创建向导**，用单对话框（写入 §12 偏差表）。

- [ ] **Step 2: 测试与验证**

Run: `pnpm test:vue-template` + `pnpm exec prettier --check <changed files>` + `pnpm lint`。
Expected: 覆盖 CRUD、invalidate 范围、权限隐藏、删除后页码收敛；全部退出码 0。

- [ ] **Step 3: Commit**

```bash
git add apps/vue-template/src/features/roles apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the roles page"
```

---

### Task 5: 角色权限矩阵

**Files:**

- Create: `apps/vue-template/src/features/roles/{RoleMatrixPage.vue,RoleMatrixPage.test.ts}`
- Modify: `apps/vue-template/src/features/roles/api.ts`、`apps/vue-template/src/router.ts`

**Interfaces:**

- Consumes: Task 4 的 `fetchRoleOptions` / `updateRolePermissions`；新增 `fetchPermissions`（`GET /permissions`）。

- [ ] **Step 1: 矩阵**

按模块分组的复选框矩阵，`PUT /roles/:id/permissions` 成功后即时反馈并刷新；每个复选框有可访问名称。

- [ ] **Step 2: 测试与验证**

Run: `pnpm test:vue-template` + `pnpm exec prettier --check <changed files>` + `pnpm lint`。
Expected: 覆盖勾选持久化、无 `role:update` 时只读、请求载荷；全部退出码 0。

- [ ] **Step 3: Commit**

```bash
git add apps/vue-template/src/features/roles apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the role permission matrix"
```

---

### Task 6: Permissions 页面

**Files:**

- Create: `apps/vue-template/src/features/permissions/{api.ts,queries.ts,PermissionsPage.vue,PermissionsPage.test.ts}`
- Modify: `apps/vue-template/src/router.ts`

**Interfaces:**

- Produces: `fetchPermissions`（与 Task 5 共用同一端点，可提取到 `features/permissions/api.ts` 并让 Roles 引用）。

- [ ] **Step 1: 只读分组展示**

按模块分组列出权限码与说明，无写操作；空态与错误态沿用统一形态。

- [ ] **Step 2: 测试与验证**

Run: `pnpm test:vue-template` + `pnpm exec prettier --check <changed files>` + `pnpm lint`。
Expected: 分组渲染、加载失败重试；全部退出码 0。

- [ ] **Step 3: Commit**

```bash
git add apps/vue-template/src/features/permissions apps/vue-template/src/features/roles apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the permissions page"
```

---

### Task 7: Dictionaries 页面

**Files:**

- Create: `apps/vue-template/src/features/dictionaries/{api.ts,queries.ts,DictionariesPage.vue,DictionariesPage.test.ts}`
- Modify: `apps/vue-template/src/router.ts`

**Interfaces:**

- Produces: 字典类型与条目的 CRUD 包装，端点见 spec §5.4。

- [ ] **Step 1: 双栏页面**

类型列表 + 条目表格；新建/编辑/删除对话框；条目重排若端点已提供则复用，否则本切片不做（写入偏差表）。

- [ ] **Step 2: 测试与验证**

Run: `pnpm test:vue-template` + `pnpm exec prettier --check <changed files>` + `pnpm lint`。
Expected: 覆盖类型切换、条目 CRUD、删除后页码收敛；全部退出码 0。

- [ ] **Step 3: Commit**

```bash
git add apps/vue-template/src/features/dictionaries apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the dictionaries page"
```

---

### Task 8: Audit logs 页面

**Files:**

- Create: `apps/vue-template/src/features/audit/{api.ts,queries.ts,AuditDetailDrawer.vue,AuditLogsPage.vue,AuditLogsPage.test.ts}`
- Modify: `apps/vue-template/src/router.ts`

**Interfaces:**

- Produces: `fetchAuditEvents`、`fetchAuditEvent(id)`；`AuditDetailDrawer` 基于 `DetailDrawer` 展示 metadata。

- [ ] **Step 1: 筛选、表格与详情抽屉**

时间/动作/实体筛选 + `ProTable` + 详情抽屉；抽屉 Esc 关闭并归还焦点（复用 Task 1 组件）。

- [ ] **Step 2: 测试与验证**

Run: `pnpm test:vue-template` + `pnpm exec prettier --check <changed files>` + `pnpm lint`。
Expected: 覆盖筛选参数、metadata 渲染、焦点返回；全部退出码 0。

- [ ] **Step 3: Commit**

```bash
git add apps/vue-template/src/features/audit apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the audit logs page"
```

---

### Task 9: Integrations 页面

**Files:**

- Create: `apps/vue-template/src/features/integrations/{api.ts,queries.ts,IntegrationDeliveryDrawer.vue,IntegrationsPage.vue,IntegrationsPage.test.ts}`
- Modify: `apps/vue-template/src/router.ts`

**Interfaces:**

- Produces: 集成 CRUD、投递记录查询与 `retry`；`IntegrationDeliveryDrawer`。

- [ ] **Step 1: 列表、表单抽屉与投递抽屉**

新建/编辑用表单抽屉；投递记录抽屉含重试按钮，成功后刷新列表并给出 `role="status"` 反馈。

- [ ] **Step 2: 测试与验证**

Run: `pnpm test:vue-template` + `pnpm exec prettier --check <changed files>` + `pnpm lint`。
Expected: 覆盖 CRUD、重试、抽屉焦点、失败态；全部退出码 0。

- [ ] **Step 3: Commit**

```bash
git add apps/vue-template/src/features/integrations apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the integrations page"
```

---

### Task 10: 导航、权限收口与跨页面冒烟

**Files:**

- Modify: `apps/vue-template/src/config/nav.ts`、`apps/vue-template/src/router.ts`
- Create: `apps/vue-template/src/config/nav.test.ts`（若已有则扩展）、`e2e-vue-template/specs/management.spec.ts`

**Interfaces:**

- Produces: `IMPLEMENTED_PATHS` 9 项；8 条路由的完整 `meta.permission`；`findNavItem` 对 `/roles/matrix` 的最长匹配。

- [ ] **Step 1: 导航与路由一致性**

把 9 个路径写入 `IMPLEMENTED_PATHS`；核对每条路由的 `meta.permission` 与 `NAV_CONTRACT` 的权限键一致；`findNavItem('/roles/matrix')` 命中 Roles 项。单测断言 9 项可见、空组丢弃、最长匹配。

- [ ] **Step 2: Playwright 冒烟**

`management.spec.ts` 覆盖 spec §9.2 的四组断言：管理员可见 9 项并逐页打开；只读账号直连无权限 URL 落 `/403`；Roles 矩阵勾选后刷新仍生效；删除条目后分页器回到有效页。只断言可访问名称/角色/可见文本/状态，不生成或比对截图。

- [ ] **Step 3: 验证**

Run:

```bash
pnpm test:vue-template
pnpm test:e2e:vue-template
pnpm exec prettier --check apps/vue-template/src/config/nav.ts e2e-vue-template/specs/management.spec.ts
pnpm lint
```

Expected: 原有 6 条 + 新增冒烟全过；全部退出码 0。

- [ ] **Step 4: Commit**

```bash
git add apps/vue-template/src/config e2e-vue-template/specs/management.spec.ts apps/vue-template/src/router.ts
git commit -m "test(vue-template): cover management navigation and permissions"
```

---

### Task 11: 全量验收、双语文档与 CHANGELOG

**Files:**

- Modify: `docs/en/vue-template.md`、`docs/zh-CN/vue-template.md`、`README.md`、`README.zh-CN.md`、`CHANGELOG.md`

- [ ] **Step 1: 订正口径与文档**

把「21 contracted pages / 21 features」订正为 `NAV_CONTRACT` 的 16 项；更新路由表（9 项可达 + `/roles/matrix`）、`Scope`、`Not included`、`Deviations` 表与测试计数。**en 与 zh-CN 必须在同一提交内同步**，两文件都保持 H1 开头，段落一一对应，工作树 LF。`CHANGELOG.md` 的 `[Unreleased]` 增加英文 `### Added` 条目。

- [ ] **Step 2: 全量 gates**

Run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test:shared
pnpm test:ui
pnpm test:vue
pnpm test:vue-template
pnpm test:e2e:vue-template
pnpm build:vue-template
pnpm --filter @fish-admin/docs sync:template
pnpm docs:check
pnpm docs:build
pnpm test:parity:docker
pnpm test:parity:vue
git diff --name-only -- 'parity/**' '*-linux.png'
git status --short
```

Expected: 所有命令退出码 0；`test:parity:docker` 119/119、`test:parity:vue` 42/42；倒数第二条输出为空；`git status --short` 为空；两个 Vue 私有包仍为 `private: true` / `0.1.0`。把真实输出写进 SDD 台账。

- [ ] **Step 3: 人工走查（spec §11 第 6 条）**

用 3 个演示账号分别登录，逐页确认导航、权限、抽屉焦点与刷新持久化，记录到台账。**没有真实浏览器证据时不得声明该步骤通过。**

- [ ] **Step 4: Commit**

```bash
git add docs/en/vue-template.md docs/zh-CN/vue-template.md README.md README.zh-CN.md CHANGELOG.md
git commit -m "docs(vue-template): document the management pages and correct the contract count"
```

Expected: 提交成功，工作区干净。**不 push、不打 tag、不执行 `npm publish`**；这些都需要用户单独批准。

---

## Self-Review

- **Spec coverage:** §3.1 的 8 个页面、导航扩展、i18n、数据层、权限、测试、文档与 §11 验收均有对应任务；§3.2 排除项（协作域、账户域、认证、壳层三布局、图表、CSV/批量、tour、服务端菜单、像素 parity）未被任何步骤引入。
- **Placeholder scan:** 所有任务给出具体文件、接口与验证命令；没有 TBD/TODO；不贴未验证的大段代码，实现时以对应 React feature 与 `packages/mock` 端点为准。
- **Type consistency:** 请求包装类型在各 feature 本地定义、形状对齐 React 同名类型；queryKey 统一为 `[domain, params]`；`clampToPageCount` 在 Task 1 定义、Task 2/4/7 复用；`meta.permission` 与 `NAV_CONTRACT` 权限键在 Task 10 集中核对。
- **Known gap:** 本切片只完成 16 项导航中的 9 项；账户域、协作域、认证流程、壳层增强与图表按 §14 决策记录留给 Slice 4/5。另需注意 `findNavItem` 在更深层嵌套路径出现时可能再次需要最长匹配调整。
