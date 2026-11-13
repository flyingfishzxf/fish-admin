# Vue 模板认证与账户域（Slice 4）设计

> 状态：范围已定，待复核本文档。
> 基线：`workbuddy/main-a7370c6a` @ `98e7b0d`（Slice 1–3 全部完成；未 push、未发布）。
> 本 Spec 是实施计划的绑定权威；计划中的冲突以本文档为准。

## 1. 目标

把 Vue 模板从「只有登录」补成「完整认证链路 + 账户域」：新增 6 个认证页与 3 个账户页，让 `NAV_CONTRACT` 的 16 个导航项中 **12 项**可达，并把 Slice 2 遗留的「Vue 演示不支持 MFA」偏差彻底修掉。

**成功定义**：`/register`、`/forgot-password`、`/reset-password`、`/verify-email`、`/accept-invite`、`/otp` 六个认证页可用且能走通 mock 全链路；`/profile`、`/security`、`/settings` 三页进入侧栏并按权限/会话正确门控；已登录账号命中的 2FA 能真正完成二次验证而不是报「不支持」；双语文档与验收证据齐备；parity 基线与视觉截图零改动。

## 2. 背景

- Slice 3 收口后 `IMPLEMENTED_PATHS` 为 9 项，剩余 7 项契约页面中 3 项属于账户组（`/profile`、`/security`、`/settings`）、4 项属于协作组。
- 账户组在契约里**不带权限键**（`NavRouteContract.permission` 缺省）：任何已登录会话都能进入，这与 React 一致，也是本切片不得引入权限门控的地方。
- Slice 2 的 `LoginPage.vue` 把 MFA 响应转成 `MFA_NOT_SUPPORTED` 并提示 `auth:mfaUnsupported`，`stores/auth.ts` 没有 `completeMfa`；而 `/otp` 页与「支持 2FA 的账号」是这个域的核心路径，必须在本切片修正。
- `packages/mock` 的认证端点已全部就绪（register / verify-email / forgot-password / reset-password / invites / accept-invite / mfa/verify / sessions / change-password / 2fa setup|enable|disable / me / logout），账户域无需新端点；`PATCH /profile` 与 `POST /__mock/reset` 位于 `handlers/dashboard.ts`。**没有** `GET /profile`，用户数据一律来自 `GET /auth/me`。
- `packages/i18n` 已有 `profile.json`、`security.json`、`settings.json`，en 与 zh-CN 键集合完全一致，本切片**不新增 locale 键**。
- Vue 侧缺口集中在：应用级 UI 组件（Card / Alert / AlertDialog / Collapsible / Textarea / Separator / OTP 输入）、账户页路由、认证页路由、`AuthShell` 仍未从登录页抽出、主题只有 violet 一种强调色。

## 3. 范围

### 3.1 包含

| 能力         | 内容                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 认证页       | `/register`、`/forgot-password`、`/reset-password`、`/verify-email`、`/accept-invite`、`/otp`                                                                  |
| 账户页       | `/profile`、`/security`、`/settings`                                                                                                                           |
| 认证基础设施 | 抽出 `AuthShell`、`PasswordInput`、`PasswordStrength`；`stores/auth.ts` 增加 `completeMfa(challengeId, code)`；登录页命中 MFA 时跳 `/otp`                      |
| 主题         | 强调色由 1 种扩到 5 种（violet / cyan / emerald / orange / rose），`data-accent` 持久化；`packages/tokens` 已含对应变量，无需改 token                          |
| 导航         | `IMPLEMENTED_PATHS` 由 9 项扩到 12 项，账户组出现在侧栏                                                                                                        |
| 状态页       | `/401`、`/500`、`/503`、`/maintenance`（settings 的「状态页预览」外链目标）                                                                                    |
| 应用级组件   | `Card*`、`Alert*`、`AlertDialog*`、`Collapsible*`、`Textarea`、`Separator`、`OtpInput`，全部放 `apps/vue-template/src/components/ui/`，**不进 `packages/vue`** |
| 测试与文档   | 每页单测、认证生命周期与账户域 Playwright e2e、双语文档与 `CHANGELOG`、全量验收、人工走查                                                                      |

### 3.2 不包含

- 壳层三布局的真实渲染（`sidebar` / `header` / `mixed`）、密度、内容宽度：`/settings` 的 **Shell 卡片整体延后**，与其配套的 `ui` store 扩展一并在 Slice 5 交付。
- 命令面板、通知铃与通知中心、App Tabs、Subnav、离线 banner、product tour。
- 协作域 6 页（`/projects`、`/projects/:id`、`/workflows`、`/workflows/:id`、`/files`、`/notifications`）与任何图表。
- 服务端菜单 `GET /menu`（继续静态 `NAV_CONTRACT` 派生）、像素级 parity、新视觉基线。
- CSV / 批量 / 保存视图 / 列控制、Users 详情页。
- `packages/ui/**`、React `src/**`、`parity/**`、`*-linux.png` 的任何改动。

## 4. 全局约束

1. `packages/ui/**` 与 React `src/**` 只读；不新增公开 API、不发布包、不改 React 行为。
2. 共享包 `packages/{contracts,i18n,mock}/src` 不出现 `react`、`@fish-admin/react`、`@/` 别名或 Lucide 组件导入；本切片不改这三个包的 `src`，**不新增 locale 键**。
3. 版本冻结：根 `2.2.0`、`@fish-admin/react` `0.2.2`、`@fish-admin/tokens` `0.1.1` 不变；`@fish-admin/vue`、`@fish-admin/vue-template`、`@fish-admin/parity-vue` 保持 `private: true` / `0.1.0`。
4. **`packages/vue` 的导出面不得扩大**（Slice 1 冻结的 parity 契约）；所有新组件落在应用层 `src/components/ui/`。
5. 「客户端权限不是安全边界」说明不得弱化；`/otp` 的固定演示验证码提示必须保留。
6. 视觉基线不可再生：`parity/**` 与 198 张 `*-linux.png` 零改动；禁止 `--update-snapshots=all`、`test:visual:update`、`test:docs:visual:update`。
7. 双语同步：改一份 `docs/en/*.md` 同一提交更新对应 `docs/zh-CN/*.md`；`CHANGELOG.md` 只写英文；内部 spec / plan 不受此约束。
8. 每个任务结束前至少运行 `pnpm exec prettier --check <changed>`、`pnpm lint`、相关测试；声明「通过」必须附真实输出。
9. 每个任务一个本地 Conventional Commit；不得 `--amend`、不得 `--no-verify`；`push` / tag / publish 各需单独批准。

## 5. 架构

### 5.1 应用与依赖

- 唯一新增第三方依赖：`reka-ui@^2.11.0` 提升为 `apps/vue-template` 的直接依赖（`packages/vue` 已在用同版本，无新下载、无版本分叉），用于 `AlertDialog`、`Collapsible`、`PinInput`。
- **不引入** `zod`、`vee-validate`、`react-hook-form` 等价物、`sonner`：校验沿用 `reactive` + 手写 `validate()`（与 `LoginPage.vue` 一致），提示沿用页面内 `role="status"` 3 秒反馈。
- `@tanstack/vue-query` 用于 `/accept-invite` 的邀请查询（`enabled: Boolean(token)`, `retry: false`）与 `/security` 的会话列表。

### 5.2 目录结构

```
src/components/ui/          Card.vue Alert.vue AlertDialog.vue Collapsible.vue
                            Textarea.vue Separator.vue OtpInput.vue
src/features/auth/          AuthShell.vue PasswordInput.vue PasswordStrength.vue
                            password.ts RegisterPage.vue ForgotPasswordPage.vue
                            ResetPasswordPage.vue VerifyEmailPage.vue
                            AcceptInvitePage.vue OtpPage.vue
                            api.ts（追加 6 个函数）store 扩展在 stores/auth.ts
src/features/profile/       api.ts ProfilePage.vue ProfilePage.test.ts
src/features/security/      api.ts queries.ts SecurityPage.vue SecurityPage.test.ts
src/features/settings/      api.ts SettingsPage.vue SettingsPage.test.ts
src/pages/                  UnauthorizedPage.vue ServerErrorPage.vue
                            ServiceUnavailablePage.vue MaintenancePage.vue
```

### 5.3 路由与守卫

- 6 个认证页 `meta: { public: true }`；`meta.public` 已存在，守卫据此放行未登录访问。
- 新增一条反向守卫：`meta.public === true` 且已登录且路径属于「认证入口页」时重定向 `/`（React 由 `_auth` 布局统一处理；Vue 用路由 `meta.authEntry` 标出这 6 页，`/403`、404 不受影响）。
- `/profile`、`/security`、`/settings` 不设 `meta.permission`（契约即如此），仅要求「已登录」。
- `/401`、`/500`、`/503`、`/maintenance` 为公开页，不参与导航。

### 5.4 数据层

- 每个 feature 本地 `api.ts`；请求包装类型本地定义，沿用 Slice 3 先例。
- 认证端点一律 `auth: false`（不带 Bearer、401 不触发 refresh），与 React 一致。
- `/security` 的会话查询 key 为 `['auth', 'sessions']`；改密码、撤销会话、2FA 变更成功后失效该 key。
- `/profile` 保存成功后写回 `auth` store（`updateUser`），并失效 `['users']`。
- `/settings` 的 demo reset 成功后 `queryClient.clear()` + `refreshUser()`，与 React 一致。

### 5.5 状态与持久化

- 主题：`stores/theme.ts` 持久化 `{ mode, accent }`，`accent` 五选一，写入 `documentElement.dataset.accent`；旧持久化数据缺 `accent` 时回落 `violet`（不升 version，读取时补默认值）。
- 语言：沿用 `setLanguage`，`/settings` 只做入口。
- 认证：`stores/auth.ts` 增加 `completeMfa(challengeId, code)`（调 `POST /auth/mfa/verify` → `completeLogin`），并保留 `login()` 的 MFA 分支改为返回挑战信息而不是抛 `MFA_NOT_SUPPORTED`。

### 5.6 表单与反馈形态

- 表单：`reactive` 值 + `errors` 对象 + `validate()`；输入加 `aria-invalid` / `aria-describedby`，错误 `<p id="…-error" class="text-xs text-destructive">`。
- 服务端错误：`<Alert variant="destructive" role="alert">`。
- 成功反馈：页面内 `role="status"` 文本 3 秒后消失（`useTransientMessage()` 组合式函数，放 `src/lib/`），**不引入 toast 库**。
- 危险操作（撤销会话、关闭 2FA、重置演示数据）一律 `AlertDialog` + `role="alertdialog"`，焦点落在取消按钮上，Esc 关闭。

### 5.7 认证页形态

- 6 页共用 `AuthShell`（左品牌面板 + 右卡片 + 右上主题/语言切换）；`AuthShell` 由 `LoginPage.vue` 内联结构抽出，登录页改为复用，**行为与文案不变**。
- 每页独立 `resolveXError(error)`，错误码映射与 React 逐条对齐（`EMAIL_TAKEN`、`WEAK_PASSWORD`、`INVALID_TOKEN`、`INVITE_EXPIRED`、`INVITE_USED`、`INVALID_CODE`、`MFA_EXPIRED`、兜底 `auth:errors.generic`）。

## 6. 页面职责

| 页面               | 关键行为                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/register`        | 表单 → `POST /auth/register` → 原地成功态；展示 `verificationToken` 的「Verify email now」直达 `/verify-email?token=&email=`；`EMAIL_TAKEN` / `WEAK_PASSWORD` 映射 |
| `/forgot-password` | 表单 → `POST /auth/forgot-password`；有 `demoResetToken` 才显示「Open reset link」，无则显示 `noAccountHint`；防枚举文案保留                                       |
| `/reset-password`  | 缺 `token` → 缺失态；否则表单 → `POST /auth/reset-password`（204）→ 成功态；`INVALID_TOKEN` / `WEAK_PASSWORD`                                                      |
| `/verify-email`    | **不在挂载时自动验证**，必须点按钮；缺 token → 缺失态；成功态用响应里的 email                                                                                      |
| `/accept-invite`   | `useQuery(['auth','invite',token])` 四态（缺 token / 骨架 / 无效 / 表单）；提交 `POST /auth/accept-invite` 返回 `TokenPair` 后**直接登录**并跳 `/`                 |
| `/otp`             | 缺 `challenge` → 缺失态；`OtpInput` 6 位，满 6 位自动提交；`DEMO_MFA_CODE` 常驻提示；成功后按 `sanitizeRedirect(redirect)` 跳转                                    |
| `/profile`         | 头像（data URL，≤2 MB，png/jpeg/webp，缩放 256²）、姓名（2–60）、bio（≤280）、只读邮箱；「Effective permissions」卡片；会话卡片含退出登录                          |
| `/security`        | 改密码（当前/新/确认 + 强度条）、活跃会话列表（当前会话不可撤销）、撤销其他会话、2FA 启用（secret + 6 位码）/ 停用（密码）                                         |
| `/settings`        | 外观（模式三选一 + 强调色五选一）、语言、账户安全入口、关于、演示数据重置（仅 `demo:reset`）、数据保留折叠面板、状态页预览；**无 Shell 卡片**                      |

## 7. 组件增量

| 组件                                                                    | 实现基础              | 关键要求                                                                     |
| ----------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` | 纯标记 + `cn()`       | 与 React 版视觉一致（`shadow-soft rounded-xl border bg-card`）               |
| `Alert`                                                                 | 纯标记                | `variant: default \| destructive`，`role="alert"`                            |
| `AlertDialog`                                                           | `reka-ui` AlertDialog | `role="alertdialog"`，默认焦点在取消，Esc 关闭，`data-action` 供测试         |
| `Collapsible`                                                           | `reka-ui` Collapsible | 触发按钮带 `aria-expanded`，箭头 `data-state` 旋转                           |
| `Textarea`                                                              | 原生 textarea         | `aria-invalid` 透传、`rows`                                                  |
| `Separator`                                                             | 纯标记                | `role="separator"`                                                           |
| `OtpInput`                                                              | `reka-ui` PinInput    | 6 位、`inputmode=numeric`、满位 `complete` 事件、`aria-invalid`、`autoFocus` |
| `PasswordInput`                                                         | 复用 `Input`          | 眼睛按钮 `aria-label` 在 `auth:showPassword` / `auth:hidePassword` 间切换    |
| `PasswordStrength`                                                      | `password.ts` 评分    | 4 段条 + 3 个检查项，容器 `aria-live="polite"`                               |

## 8. 可访问性

- 所有表单控件有 `Label` 关联；错误用 `aria-describedby` 指向；服务端错误 `role="alert"`。
- OTP 输入 `aria-label={auth:otp.codeLabel}`，整组 `inputmode="numeric"`。
- `AlertDialog` 打开时焦点进入对话框、关闭后回到触发按钮（与 Slice 3 抽屉同一验收口径）。
- 主题/强调色/语言切换按钮为 `aria-pressed` 或原生控件，不依赖颜色单独传达状态。

## 9. 测试

### 9.1 Vitest

- 每页一个 `*.test.ts`：渲染、校验、错误码映射、成功路径、禁用态、焦点/Esc。
- 组件：`AlertDialog`（焦点、Esc、取消）、`Collapsible`（`aria-expanded`）、`OtpInput`（输入/粘贴/满位回调）。
- 基础设施：`password.ts` 评分边界（复刻 React 的 8 条断言）、`theme` store 的 accent 持久化与旧数据回落、`useTransientMessage`。
- 预计新增 60–75 例，总量由 200 升到约 265。

### 9.2 Playwright

- 认证生命周期：注册 → 验证邮箱 → 登录；找回密码 → 重置 → 用新密码登录；邀请接受后直达 Dashboard。
- 账户域：profile 改名后刷新仍生效；改密码后旧会话失效；2FA 启用后再次登录走 `/otp` 并成功。
- 设置：切换强调色后刷新仍是所选值；只读账号看不到「重置演示数据」。

## 10. 文档与脚本

- `docs/en/vue-template.md` + `docs/zh-CN/vue-template.md`：路由表补 12 项与 4 个状态页；Scope 增加认证链路与账户域；偏差表新增「无 zod / 无 toast 库 / 无 Shell 卡片 / 无 docs 链接」；测试计数订正。
- `README.md` / `README.zh-CN.md`：页面数与 e2e 条数。
- `CHANGELOG.md`：`[Unreleased] ### Added` 追加英文条目。

## 11. 验收标准

1. `pnpm lint` 0 error、`pnpm format:check`、`pnpm typecheck` 全过。
2. `pnpm test:vue-template` 全过并报告实际数；`test:vue`、`test:shared`、`test:ui` 不回归。
3. `pnpm test:e2e:vue-template` 原有 10 条 + 新增认证/账户/设置冒烟全过。
4. `pnpm build:vue-template`、`pnpm docs:check`、`pnpm docs:build` 通过。
5. `pnpm test:parity:docker` 119/119、`pnpm test:parity:vue` 42/42；`git diff --name-only -- 'parity/**' '*-linux.png'` 为空。
6. 人工走查：三个演示账号 + 一个新建账号，覆盖注册→验证→登录、找回→重置、邀请接受、2FA 登录、账户三页；截图与观察写进台账；没有真实浏览器证据不得声明通过。
7. 双语文档同提交同步；`CHANGELOG` 只含英文；测试计数与实际输出一致。
8. 无 push / tag / publish；三个 Vue 包仍为 `private: true` / `0.1.0`；`git status --short` 为空。

## 12. 与 React 模板的偏差（必须写入双语文档）

| 项                                         | React                                  | 本切片                                                |
| ------------------------------------------ | -------------------------------------- | ----------------------------------------------------- |
| 表单校验                                   | zod + react-hook-form                  | 手写 `validate()` + `reactive`（与既有 Vue 页面一致） |
| 成功提示                                   | sonner toast                           | 页面内 `role="status"` 3 秒文本                       |
| 壳层布局                                   | sidebar / header / mixed + 密度 + 宽度 | 仍只 sidebar；`/settings` 无 Shell 卡片               |
| 命令面板 / 通知 / App Tabs / Subnav / tour | 有                                     | 无                                                    |
| 认证页品牌面板 docs 链接                   | 有（`VITE_DOCS_URL`）                  | 无（Vue 无该环境变量）                                |
| 协作域 / 图表                              | 有                                     | 不在本切片                                            |
| 服务端菜单                                 | `GET /menu`                            | 静态 `NAV_CONTRACT`                                   |
| 视觉 parity                                | 198 张基线                             | 不新增、不改动                                        |
| MFA 登录                                   | 支持                                   | **本切片起支持**（修正 Slice 2 的「不支持」偏差）     |

## 13. 风险与缓解

| 风险                          | 缓解                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 抽出 `AuthShell` 时改坏登录页 | Task 3 先抽取、跑既有登录单测与 e2e，确保零行为变化后再加新页                                                |
| 支持 MFA 打翻既有断言         | Task 7 单独提交：改 store、改登录页分支、**同步改**原先断言 `MFA_NOT_SUPPORTED` 的用例，并在台账记录语义变化 |
| `packages/vue` 导出被顺手扩大 | Global Constraint 4 + 每任务 `git diff packages/vue/src/index.ts` 必为空                                     |
| 强调色扩展破坏旧持久化        | 读取时对缺失/非法 `accent` 回落 `violet`，并有单测                                                           |
| 9 个页面形态漂移              | §5.6 统一表单/反馈形态；每个页面 Task 明确复用 `Alert` + `PasswordInput` + `useTransientMessage`             |
| 邀请页查询缓存与登录态冲突    | `retry: false`、`enabled: Boolean(token)`；接受成功后 `completeLogin` 再 `queryClient.clear()`               |
| 状态页被误加入导航            | 4 个状态页 `meta.public` 且不进 `IMPLEMENTED_PATHS`，`nav.test.ts` 的数量断言同步更新                        |
| 视觉基线被意外重录            | 禁止所有 snapshot update 命令；验收第 5 条硬校验 diff 为空                                                   |

## 14. 决策记录

1. **对 Slice 3 spec §14 的路线做一次拆分**：原定「Slice 4 = 账户与认证 + 壳层」，实际把壳层（三布局渲染、密度、宽度、命令面板、通知、tabs、subnav、tour）整体后移到与协作域同批。理由是壳层三布局会重写 `AppShell` 的骨架，与 9 个新页面同批交付会让单切片规模与回归面同时失控；账户域内部自洽，先收口。
2. **`/settings` 暂不出 Shell 卡片**：宁可少一个卡片，也不做「能存不能生效」的假设置；卡片与布局实现同批回归。
3. **新组件全部放应用层**：`packages/vue` 的导出面是 Slice 1 冻结的 parity 契约，`Card`/`Alert`/`AlertDialog` 属于页面组合级别，进包会扩大 parity 面。
4. **不引入 zod 与 toast 库**：Vue 模板已有手写校验与 `role="status"` 惯例，引入 zod 只为 6 个表单不值；toast 库会带来全局容器与主题适配成本。
5. **提升 `reka-ui` 为直接依赖**：`AlertDialog`、`Collapsible`、`PinInput` 自研的无障碍与焦点管理成本高于收益，且同版本已在工作区内。
6. **修正 MFA 偏差而不是保留**：Slice 2 的「不支持 2FA」是权宜；`/otp` 是契约页面之一，继续保留会导致「有页面但登录进不去」的割裂。
7. **账户组不加权限键**：契约本身不带 `permission`，加键会与 `NAV_CONTRACT` 脱钩并被 `nav.test.ts` 的等值断言拦下。
8. **状态页放进本切片**：`/settings` 的四个预览外链若指向 404，是可见缺陷；4 个静态页成本低，顺手补齐闭环。
