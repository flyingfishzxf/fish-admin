# Vue 模板认证与账户域（Slice 4）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/vue-template` 交付 6 个认证页与 3 个账户页，把可见导航从 9 项扩到 `NAV_CONTRACT` 16 项中的 12 项，修正 Slice 2 遗留的「Vue 不支持 MFA」偏差，并保持 parity 基线与视觉截图零改动。

**Architecture:** 四层推进。第一层补齐应用级 UI 组件、瞬时反馈惯例、强调色五色与主题持久化；第二层把 `AuthShell`/`PasswordInput`/`PasswordStrength` 从登录页抽出（零行为变化），随后按依赖顺序交付认证页 `register → verify-email → forgot → reset → accept-invite → otp`；第三层交付账户页 `profile → security → settings` 与 4 个状态页；第四层收口路由与导航、跨页面 Playwright、全量验收与双语文档。全部改动集中在 `apps/vue-template`、`e2e-vue-template`、`docs/en`、`docs/zh-CN`、README、`CHANGELOG`；不动 React 包、共享包 `src`、`packages/ui`、`packages/vue` 导出面与 `parity/**`。

**Tech Stack:** 沿用现有栈（Vue 3.5、vue-router 4、Pinia、@tanstack/vue-query、lucide-vue-next、Tailwind 4、Vite 8、Vitest + jsdom、Playwright 1.64.1、pnpm 9.1.1、Node >= 22）。唯一新增直接依赖：`reka-ui@^2.11.0`（`packages/vue` 已在用同版本，用于 `AlertDialog` / `Collapsible` / `PinInput`）。**不引入 zod、表单库或 toast 库，不新增 workspace 包。**

**Spec:** `docs/superpowers/specs/2026-11-13-vue-template-auth-account-design.md`（绑定权威）。上游口径见 `docs/en/vue-template.md`、`packages/contracts/src/navigation.ts`、`packages/contracts/src/types/index.ts`、`packages/mock/src/handlers/auth.ts` 与 `packages/mock/src/handlers/dashboard.ts`。

## Global Constraints

- **React 面只读**：`packages/ui/**` 与 React `src/**` 只读；不改 React 行为、不新增公开 API、不发布包。
- **共享包框架无关**：`packages/{contracts,i18n,mock}/src` 不引入 `react`、`@fish-admin/react`、`@/` 别名或 Lucide 导入；本计划不修改这三个包，**不新增 locale 键**（所需键已存在且 en/zh-CN 对齐）。
- **`packages/vue` 导出面不扩**：所有新组件落 `apps/vue-template/src/components/ui/`；每个任务收尾校验 `git diff --name-only packages/vue/src` 为空。
- **版本冻结**：根 `2.2.0`、`@fish-admin/react` `0.2.2`、`@fish-admin/tokens` `0.1.1` 不变；`@fish-admin/vue`、`@fish-admin/vue-template`、`@fish-admin/parity-vue` 保持 `private: true` / `0.1.0`。
- **外部动作审批**：`git push`、tag、`npm publish`、Release、部署变更各需单独批准。**本计划只产生本地 commit。**
- **视觉基线不可再生**：`parity/**` 与 198 张 `*-linux.png` 零改动；禁止 `--update-snapshots=all`、`test:visual:update`、`test:docs:visual:update`，不改 `playwright.parity.config.ts` 的 `updateSnapshots: 'none'`。
- **RBAC 只是 UX**：所有「客户端权限不是安全边界」说明不得弱化；`/otp` 的固定演示验证码提示必须保留。
- **文档双语同步**：`docs/en/*.md` 与 `docs/zh-CN/*.md` 同提交；README 同理；`CHANGELOG.md` 只写英文；新文档以 H1 开头；`docs/en/*.md` 工作树保持 LF。
- **每任务 gates**：至少 `pnpm exec prettier --check <changed>`、`pnpm lint` 与相关测试；声明「通过」必须附真实输出。
- **提交粒度**：每任务一个本地 Conventional Commit；不 `--amend`、不 `--no-verify`；正文每行 ≤100 字符。
- **明确不做**：壳层三布局/密度/宽度（含 `/settings` 的 Shell 卡片）、命令面板、通知、App Tabs、Subnav、离线 banner、tour、协作域页面、任何图表、CSV/批量/保存视图、`GET /menu` 服务端菜单、像素 parity、新视觉基线。

---

## File Structure

```
apps/vue-template/
  package.json                                  Modify  (+ reka-ui 直接依赖)
  src/components/ui/                            Create  Card.vue Alert.vue AlertDialog.vue
                                                        Collapsible.vue Textarea.vue Separator.vue
                                                        OtpInput.vue + *.test.ts
  src/components/common/                        Modify  (若需复用) 无强制改动
  src/features/auth/
    AuthShell.vue PasswordInput.vue             Create
    PasswordStrength.vue password.ts            Create
    RegisterPage.vue ForgotPasswordPage.vue     Create
    ResetPasswordPage.vue VerifyEmailPage.vue   Create
    AcceptInvitePage.vue OtpPage.vue            Create
    api.ts                                      Modify  (+6 endpoints)
    *.test.ts                                   Create
  src/features/auth/LoginPage.vue               Modify  (复用 AuthShell/PasswordInput，MFA 跳转)
  src/features/profile/                         Create  api.ts ProfilePage.vue ProfilePage.test.ts
  src/features/security/                        Create  api.ts queries.ts SecurityPage.vue + test
  src/features/settings/                        Create  api.ts SettingsPage.vue + test
  src/pages/                                    Create  UnauthorizedPage.vue ServerErrorPage.vue
                                                        ServiceUnavailablePage.vue MaintenancePage.vue
  src/lib/use-transient-message.ts + test       Create
  src/lib/i18n.ts                               Modify  (+ profile, security, settings)
  src/config/theme.ts                           Modify  (accent 五色)
  src/stores/theme.ts                           Modify  (accent 持久化 + 旧数据回落)
  src/stores/auth.ts                            Modify  (completeMfa，login 返回挑战)
  src/config/nav.ts                             Modify  (IMPLEMENTED_PATHS 12 项)
  src/router.ts                                 Modify  (9 条新路由 + 认证入口反向守卫)
e2e-vue-template/specs/auth-account.spec.ts     Create
docs/en/vue-template.md docs/zh-CN/vue-template.md   Modify
README.md README.zh-CN.md CHANGELOG.md          Modify
```

---

### Task 1: 应用级 UI 组件与瞬时反馈

**Files:**

- Modify: `apps/vue-template/package.json`（`reka-ui` 直接依赖）
- Create: `src/components/ui/{Card,Alert,AlertDialog,Collapsible,Textarea,Separator}.vue`、`src/lib/use-transient-message.ts`
- Create: `src/components/ui/{Alert,AlertDialog,Collapsible}.test.ts`、`src/lib/use-transient-message.test.ts`

**Interfaces:**

- Produces: `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent`；`Alert`（`variant: 'default' | 'destructive'`，`role="alert"`）；`AlertDialog`（`open`、`title`、`description`、`confirmLabel`、`variant`、`#default`，事件 `confirm` / `cancel`）；`Collapsible`（`title`、`description`，默认插槽为内容）；`Textarea`（`modelValue`、`rows`、`invalid`）；`Separator`；`useTransientMessage(timeout = 3000)` → `{ message, show(text), clear() }`。

- [ ] **Step 1: 提升 reka-ui 为直接依赖**

在 `apps/vue-template/package.json` 的 `dependencies` 加 `"reka-ui": "^2.11.0"`，执行 `pnpm install --lockfile-only` 后跑 `pnpm install --frozen-lockfile` 确认锁文件一致。**不升级 `packages/vue` 里的同版本。**

- [ ] **Step 2: 四个纯标记组件**

`Card*` 用 `cn()` 组合 `shadow-soft rounded-xl border bg-card`；`Alert` 用 `cva` 风格的两组类，`role="alert"`；`Textarea` 透传 `aria-invalid` 并复用 `Input` 的聚焦环；`Separator` 输出 `role="separator"` + `h-px bg-border`。三个组件都要接受 `class` 透传（`inheritAttrs` 默认行为即可）。

- [ ] **Step 3: AlertDialog 与 Collapsible**

`AlertDialog` 基于 `reka-ui` 的 `AlertDialogRoot/Trigger/Portal/Overlay/Content/Title/Description/Cancel/Action`，`role="alertdialog"`，取消按钮带 `data-action="cancel"`、确认按钮 `data-action="confirm"` 且 `variant="destructive"` 时用 `bg-destructive text-white`；`onOpenAutoFocus` 把焦点放到取消按钮。`Collapsible` 基于 `reka-ui`，触发按钮 `w-full` 且带 `aria-expanded`，箭头用 `data-state` 旋转。

- [ ] **Step 4: 瞬时反馈组合式函数**

`useTransientMessage(timeout = 3000)`：`message` 为 `ref<string | null>`，`show(text)` 写入并重置计时器，`clear()` 取消计时；组件卸载时清理。单测用 `vi.useFakeTimers()` 覆盖「3 秒后自动清空」「连续 show 只保留最后一条」「卸载后不再写入」。

- [ ] **Step 5: 验证**

```bash
pnpm exec prettier --check apps/vue-template/package.json apps/vue-template/src/components/ui apps/vue-template/src/lib/use-transient-message.ts apps/vue-template/src/lib/use-transient-message.test.ts
pnpm lint
pnpm test:vue-template
git diff --name-only packages/vue/src
```

Expected: 全部退出码 0；`packages/vue/src` 无 diff；原有 200 条用例不回归。

- [ ] **Step 6: Commit**

```bash
git add apps/vue-template/package.json apps/vue-template/src/components/ui apps/vue-template/src/lib/use-transient-message.ts apps/vue-template/src/lib/use-transient-message.test.ts pnpm-lock.yaml
git commit -m "feat(vue-template): add the app-level card, alert and dialog primitives"
```

---

### Task 2: 强调色五色与主题持久化

**Files:**

- Modify: `src/config/theme.ts`、`src/stores/theme.ts`
- Modify: `src/stores/theme.test.ts`

**Interfaces:**

- Produces: `export type Accent = 'violet' | 'cyan' | 'emerald' | 'orange' | 'rose'`；`ACCENTS: readonly Accent[]`；`applyTheme(mode, accent)` 写入 `documentElement.dataset.accent`；theme store 暴露 `accent` 与 `setAccent(value)`。

- [ ] **Step 1: 扩 Accent 与 applyTheme**

`config/theme.ts` 的 `Accent` 扩为五值，新增 `ACCENTS` 常量与 `isAccent(value): value is Accent`。`applyTheme(mode, accent)` 在设置 `data-theme` 之外写 `root.dataset.accent = accent`。**`packages/tokens/dist/tokens.css` 已包含五种 accent 的亮/暗变量，不改 token。**

- [ ] **Step 2: store 持久化与旧数据回落**

`stores/theme.ts` 持久化 `{ mode, accent }`；`readStored` 读到缺失或非法的 `accent` 时回落 `'violet'`（**不升 persist version**，避免已有用户数据被判为过期而整块丢弃）；`setAccent` 立即 `applyTheme`。

- [ ] **Step 3: 单测**

覆盖：默认 `violet`；`setAccent('cyan')` 后 `dataset.accent === 'cyan'` 且写入 localStorage；旧数据 `{ mode: 'dark' }` 读取后 `accent === 'violet'` 且 `mode` 保留；非法值 `'purple'` 回落。

- [ ] **Step 4: 验证**

```bash
pnpm exec prettier --check apps/vue-template/src/config/theme.ts apps/vue-template/src/stores/theme.ts apps/vue-template/src/stores/theme.test.ts
pnpm lint
pnpm test:vue-template
```

Expected: 退出码 0；新增断言通过；既有主题用例不回归。

- [ ] **Step 5: Commit**

```bash
git add apps/vue-template/src/config/theme.ts apps/vue-template/src/stores/theme.ts apps/vue-template/src/stores/theme.test.ts
git commit -m "feat(vue-template): support the five accent palettes"
```

---

### Task 3: 抽出 AuthShell、PasswordInput 与 PasswordStrength

**Files:**

- Create: `src/features/auth/{AuthShell.vue,PasswordInput.vue,PasswordStrength.vue,password.ts,password.test.ts}`
- Modify: `src/features/auth/LoginPage.vue`、`src/features/auth/LoginPage.test.ts`

**Interfaces:**

- Produces: `AuthShell`（props `title`、`subtitle`，插槽默认/`footer`）；`PasswordInput`（`modelValue`、`label`、`autocomplete`、`error`、`id`）；`PasswordStrength`（`password`）；`analyzePassword(password): { score, checks }`。
- **Consumes:** `BrandMark.vue`、`ThemeToggle.vue`、`LanguageToggle.vue`。

- [ ] **Step 1: 抽 AuthShell**

把 `LoginPage.vue` 模板里的分栏结构（左品牌面板 + 右卡片 + 右上主题/语言切换 + 移动端品牌）整体搬到 `AuthShell.vue`，props 为 `title`/`subtitle`，默认插槽放表单，`footer` 插槽放页脚链接。品牌面板文案用 `auth:brand.*` 与 `auth:demo.disclaimer`（已存在），**不加** docs 外链（Vue 无 `VITE_DOCS_URL`，spec §12 已记录）。

- [ ] **Step 2: 抽 PasswordInput 与 PasswordStrength**

`PasswordInput` 把登录页内联的眼睛按钮搬出来，`aria-label` 在 `auth:showPassword` / `auth:hidePassword` 间切换；`PasswordStrength` 复刻 React 的 4 段条 + 3 项检查（`auth:passwordStrength.*`、`auth:passwordChecks.*`），容器 `aria-live="polite"`，空串不渲染。`password.ts` 逐行复刻 React 的 `analyzePassword`。

- [ ] **Step 3: 登录页改为复用**

`LoginPage.vue` 用 `AuthShell` 包裹、用 `PasswordInput` 替换内联密码框。**渲染结构、可访问名与文案保持不变**，`LoginPage.test.ts` 与 `e2e-vue-template` 的既有断言不得修改。

- [ ] **Step 4: 单测**

`password.test.ts` 复刻 React 的 8 条边界（`''`→0、`'ab'`→0、`'aB'`→1、`'abcdefgh'`→1、`'Abcdefgh'`→2、`'Abcdefg1'`→3、`'Abcdefg1!'`→3、`'Ab1!'`→3、`'Abcdefgh1!'`→4）。`PasswordInput` 覆盖显隐切换与 `aria-label` 变化；`PasswordStrength` 覆盖空串不渲染与 score→等级文案。

- [ ] **Step 5: 验证（登录行为零变化是硬门槛）**

```bash
pnpm exec prettier --check apps/vue-template/src/features/auth
pnpm lint
pnpm typecheck
pnpm test:vue-template
pnpm test:e2e:vue-template
```

Expected: 全部退出码 0；`test:e2e:vue-template` 仍为 **10 passed**；登录相关单测未改动却仍通过。

- [ ] **Step 6: Commit**

```bash
git add apps/vue-template/src/features/auth
git commit -m "refactor(vue-template): extract the auth shell and password controls"
```

---

### Task 4: 注册页与邮箱验证页

**Files:**

- Modify: `src/features/auth/api.ts`（`registerRequest`、`verifyEmailRequest`）
- Create: `src/features/auth/RegisterPage.vue`、`VerifyEmailPage.vue` 及两个测试
- Modify: `src/router.ts`

**Interfaces:**

- Produces: `registerRequest({ name, email, password }): Promise<{ email, verificationToken }>`；`verifyEmailRequest(token): Promise<{ email }>`。两条路由 `/register`、`/verify-email`，均 `meta: { public: true, authEntry: true }`。

- [ ] **Step 1: api 两个函数**

按 React 逐字对齐：`POST /auth/register`（`auth: false`）、`POST /auth/verify-email`（`auth: false`）。

- [ ] **Step 2: RegisterPage 两态**

表单态：姓名/邮箱/密码/确认密码 + 强度条；手写 `validate()`：姓名 ≥2、邮箱正则、密码 ≥8 且含字母与数字、两次一致。成功态：`auth:register.successTitle` 等文案 + `verificationToken` 提示 + 「Verify email now」跳 `/verify-email?token=&email=`。错误映射 `EMAIL_TAKEN` / `WEAK_PASSWORD` / 兜底 `auth:errors.generic`。

- [ ] **Step 3: VerifyEmailPage 三态**

缺 `token` → 缺失态；否则「待确认」态（**不在挂载时自动发请求**）；点按钮后成功态用响应 email 渲染，`INVALID_TOKEN` → `auth:verify.invalid`。

- [ ] **Step 4: 路由与单测**

两条路由加入 `router.ts`。单测覆盖：姓名过短、邮箱格式、密码缺数字、两次不一致、成功态出现 `/verify-email?token=` 链接、`EMAIL_TAKEN` 文案、缺 token 缺失态、验证失败文案。

- [ ] **Step 5: 验证**

```bash
pnpm exec prettier --check apps/vue-template/src/features/auth apps/vue-template/src/router.ts
pnpm lint
pnpm typecheck
pnpm test:vue-template
```

Expected: 退出码 0；新用例通过；`test:vue-template` 计数上升但无失败。

- [ ] **Step 6: Commit**

```bash
git add apps/vue-template/src/features/auth apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the registration and email verification pages"
```

---

### Task 5: 找回密码与重置密码页

**Files:**

- Modify: `src/features/auth/api.ts`（`forgotPasswordRequest`、`resetPasswordRequest`）
- Create: `src/features/auth/ForgotPasswordPage.vue`、`ResetPasswordPage.vue` 及两个测试
- Modify: `src/router.ts`

**Interfaces:**

- Produces: `forgotPasswordRequest(email): Promise<{ demoResetToken?: string }>`；`resetPasswordRequest({ token, password }): Promise<void>`。路由 `/forgot-password`、`/reset-password`，`meta: { public: true, authEntry: true }`。

- [ ] **Step 1: api 两个函数**

`POST /auth/forgot-password`、`POST /auth/reset-password`，均 `auth: false`；后者 204 无 body。

- [ ] **Step 2: ForgotPasswordPage 两态**

成功态分两支：有 `demoResetToken` 显示「Open reset link」（跳 `/reset-password?token=&email=`），无 token 显示 `auth:forgot.noAccountHint`；两种都保留「Create your account」与「Back to sign in」。

- [ ] **Step 3: ResetPasswordPage 三态**

缺 `token` → 缺失态（跳 `/forgot-password`）；表单态副标题按有无 `email` 取 `subtitleFor` / `subtitle`；成功态按钮跳 `/login?email=`。错误映射 `INVALID_TOKEN` / `WEAK_PASSWORD`。

- [ ] **Step 4: 路由与单测**

单测覆盖：找回成功后两种分支、重置缺 token、密码不一致、`INVALID_TOKEN` 文案、成功态跳转目标含 email。

- [ ] **Step 5: 验证与提交**

```bash
pnpm exec prettier --check apps/vue-template/src/features/auth apps/vue-template/src/router.ts
pnpm lint && pnpm typecheck && pnpm test:vue-template
git add apps/vue-template/src/features/auth apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the password recovery pages"
```

Expected: 全部退出码 0。

---

### Task 6: 接受邀请页

**Files:**

- Modify: `src/features/auth/api.ts`（`getInviteRequest`、`acceptInviteRequest`）
- Create: `src/features/auth/queries.ts`（`inviteQueryOptions`）、`AcceptInvitePage.vue` 及测试
- Modify: `src/router.ts`

**Interfaces:**

- Produces: `inviteQueryOptions(token)`（`queryKey: ['auth', 'invite', token]`，`enabled: Boolean(token)`，`retry: false`）；`acceptInviteRequest({ token, name, email, password }): Promise<TokenPair>`。路由 `/accept-invite`，`meta: { public: true, authEntry: true }`。

- [ ] **Step 1: api 与查询**

`GET /auth/invites/:token`（带 `signal`）、`POST /auth/accept-invite`；两者 `auth: false`。查询选项单独放 `features/auth/queries.ts`。

- [ ] **Step 2: 四态页面**

缺 token → 缺失态；查询 pending → 骨架（4 个 `Skeleton`）；错误或空 → 无效态（`INVITE_EXPIRED` 用 `auth:invite.expired`，其余 `invalidDescription`）；有数据 → 表单态：邀请卡片（email / invitedBy / roleName / 过期日期 `formatDate`）、姓名、只读邮箱、密码 + 强度条、确认密码。

- [ ] **Step 3: 成功即登录**

提交成功后 `auth.completeLogin(tokens)` → `queryClient.clear()` → `router.replace('/')`；页面内 `role="status"` 显示 `auth:invite.successToast`。错误映射 `INVITE_EXPIRED`/`INVITE_USED`/`EMAIL_TAKEN`/`WEAK_PASSWORD`。

- [ ] **Step 4: 单测**

覆盖四态、只读邮箱不可编辑、过期文案、成功调用 `completeLogin` 并跳 `/`、`EMAIL_TAKEN` 映射。

- [ ] **Step 5: 验证与提交**

```bash
pnpm exec prettier --check apps/vue-template/src/features/auth apps/vue-template/src/router.ts
pnpm lint && pnpm typecheck && pnpm test:vue-template
git add apps/vue-template/src/features/auth apps/vue-template/src/router.ts
git commit -m "feat(vue-template): add the invitation acceptance page"
```

Expected: 全部退出码 0。

---

### Task 7: OTP 页与 MFA 收口（修正 Slice 2 偏差）

**Files:**

- Modify: `src/stores/auth.ts`（`completeMfa`；`login` 返回挑战而非抛错）
- Modify: `src/features/auth/LoginPage.vue`（命中 MFA 时跳 `/otp`）
- Modify: `src/features/auth/LoginPage.test.ts`、`src/stores/auth.test.ts`
- Create: `src/components/ui/OtpInput.vue` + 测试、`src/features/auth/OtpPage.vue` + 测试
- Modify: `src/router.ts`、`src/features/auth/api.ts`（`verifyMfaRequest`）

**Interfaces:**

- Produces: `auth.login()` 返回 `{ status: 'authenticated' } | { status: 'mfa'; challengeId: string; email: string }`；`auth.completeMfa(challengeId, code)`。路由 `/otp`（`meta: { public: true, authEntry: true }`）。

- [ ] **Step 1: OtpInput**

基于 `reka-ui` 的 `PinInput`，6 位、`inputmode="numeric"`、满位触发 `complete`、支持 `aria-invalid`、`autoFocus`、`aria-label`。单测覆盖逐位输入、整段粘贴、满位回调、退格。

- [ ] **Step 2: store 改造**

`login()` 命中 MFA 时返回 `{ status: 'mfa', challengeId, email }` 而不是抛 `MFA_NOT_SUPPORTED`；新增 `completeMfa(challengeId, code)` → `POST /auth/mfa/verify` → `completeLogin(tokens)`。**同步改** `stores/auth.test.ts` 与 `LoginPage.test.ts` 里断言 `MFA_NOT_SUPPORTED` 的用例，改成断言「跳 `/otp` 且带 challenge/email/redirect」。

- [ ] **Step 3: OtpPage**

缺 `challenge` → 缺失态；否则标题按有无 email 取 `subtitleFor`/`subtitle`；`DEMO_MFA_CODE` 常驻提示；满 6 位自动提交，也可点「Verify and sign in」；失败清空输入并显示 `INVALID_CODE` / `MFA_EXPIRED` 文案；成功按 `sanitizeRedirect(redirect) ?? '/'` 跳转并显示 `auth:loginSuccess`。

- [ ] **Step 4: 登录页分支**

登录页拿到 `status === 'mfa'` 时 `router.push({ name: 'otp', query: { challenge, email, redirect } })`；不再显示 `auth:mfaUnsupported`。

- [ ] **Step 5: 验证**

```bash
pnpm exec prettier --check apps/vue-template/src/stores/auth.ts apps/vue-template/src/features/auth apps/vue-template/src/components/ui/OtpInput.vue apps/vue-template/src/router.ts
pnpm lint && pnpm typecheck && pnpm test:vue-template
pnpm test:e2e:vue-template
```

Expected: 退出码 0；e2e 仍 10 passed（现有冒烟用无 2FA 账号，不应受影响）。

- [ ] **Step 6: Commit**

```bash
git add apps/vue-template/src/stores/auth.ts apps/vue-template/src/features/auth apps/vue-template/src/components/ui/OtpInput.vue apps/vue-template/src/components/ui/OtpInput.test.ts apps/vue-template/src/router.ts
git commit -m "feat(vue-template): support two-factor sign-in end to end"
```

---

### Task 8: Profile 页

**Files:**

- Create: `src/features/profile/{api.ts,ProfilePage.vue,ProfilePage.test.ts}`
- Modify: `src/router.ts`、`src/lib/i18n.ts`（追加 `profile` 命名空间）

**Interfaces:**

- Produces: `updateProfile({ name, bio?, avatar }): Promise<AuthUser>`（`PATCH /profile`）。路由 `/profile`，**无 `meta.permission`**，仅需登录。

- [ ] **Step 1: api 与命名空间**

`PATCH /profile`（带 Bearer）；`REQUIRED_NAMESPACES` 追加 `profile`（并有单测断言列表内容）。

- [ ] **Step 2: 表单与头像**

姓名 2–60、bio ≤280（发送时 `bio || undefined`，与 React 一致）、邮箱只读；头像选择限 `image/png|jpeg|webp` 且 ≤2 MB，用 `createImageBitmap` + canvas 缩到 256² 转 data URL；「Remove avatar」发送 `avatar: null`。

- [ ] **Step 3: 三张信息卡与退出登录**

Profile 卡（角色徽标 / 邮箱 / id）、Effective permissions 卡（`*`、空、列表三种分支，标签取 `roles:permissionItems.*`）、Session 卡（退出登录 → `/login` 并清空查询缓存）。保存成功写回 store、失效 `['users']`、`role="status"` 提示 `profile:saveSuccess`。

- [ ] **Step 4: 单测**

覆盖渲染（角色/权限列表/`*` 分支）、姓名过短、bio 超长、保存成功写回 store、头像类型错误文案、无头像时 Remove 不显示、退出登录跳转。

- [ ] **Step 5: 验证与提交**

```bash
pnpm exec prettier --check apps/vue-template/src/features/profile apps/vue-template/src/router.ts apps/vue-template/src/lib/i18n.ts
pnpm lint && pnpm typecheck && pnpm test:vue-template
git add apps/vue-template/src/features/profile apps/vue-template/src/router.ts apps/vue-template/src/lib/i18n.ts
git commit -m "feat(vue-template): add the profile page"
```

Expected: 全部退出码 0。

---

### Task 9: Security 页

**Files:**

- Create: `src/features/security/{api.ts,queries.ts,SecurityPage.vue,SecurityPage.test.ts}`
- Modify: `src/router.ts`、`src/lib/i18n.ts`（追加 `security`）

**Interfaces:**

- Produces: `changePassword`、`getSessions`、`revokeSession`、`revokeOtherSessions`、`setupTwoFactor`、`enableTwoFactor`、`disableTwoFactor`；`sessionsQueryOptions`（`queryKey: ['auth','sessions']`）。路由 `/security`，无权限键。

- [ ] **Step 1: api 与查询**

七个端点按 React 逐字对齐；会话查询 `staleTime` 沿用应用默认。

- [ ] **Step 2: 改密码卡**

三个 `PasswordInput` + 强度条；`validate()` 复刻 `createChangePasswordSchema`（当前必填、新密码 ≥8 含字母数字、两次一致）；错误映射 `INVALID_PASSWORD` / `PASSWORD_UNCHANGED` / `WEAK_PASSWORD`；成功后清空表单、提示 `security:password.success`、失效会话查询。

- [ ] **Step 3: 会话卡**

四态（骨架/错误+重试/空/列表）；当前会话不显示撤销按钮；「Revoke others」在其他会话为 0 时禁用；单个撤销与批量撤销都用 `AlertDialog`，确认后失效查询并提示。

- [ ] **Step 4: 2FA 卡**

状态徽标 + 启用/停用按钮；启用流程：`POST /auth/2fa/setup` → 对话框显示 secret（可复制）+ 固定演示码提示 + `OtpInput`，6 位才允许确认；停用流程：密码对话框 → `POST /auth/2fa/disable`；两者成功后 `refreshUser()` 并提示。错误映射 `INVALID_CODE` / `INVALID_PASSWORD`。

- [ ] **Step 5: 单测**

覆盖改密码校验与三个错误码、会话四态、当前会话不可撤销、撤销确认对话框焦点与 Esc、2FA 启用需 6 位、停用需密码、成功后 `refreshUser` 被调用。

- [ ] **Step 6: 验证与提交**

```bash
pnpm exec prettier --check apps/vue-template/src/features/security apps/vue-template/src/router.ts apps/vue-template/src/lib/i18n.ts
pnpm lint && pnpm typecheck && pnpm test:vue-template
git add apps/vue-template/src/features/security apps/vue-template/src/router.ts apps/vue-template/src/lib/i18n.ts
git commit -m "feat(vue-template): add the account security page"
```

Expected: 全部退出码 0。

---

### Task 10: Settings 页与四个状态页

**Files:**

- Create: `src/features/settings/{api.ts,SettingsPage.vue,SettingsPage.test.ts}`
- Create: `src/pages/{UnauthorizedPage,ServerErrorPage,ServiceUnavailablePage,MaintenancePage}.vue`
- Modify: `src/router.ts`、`src/lib/i18n.ts`（追加 `settings`）

**Interfaces:**

- Produces: `resetDemoData(): Promise<{ ok: boolean }>`（`POST /__mock/reset`）。路由 `/settings`（无权限键）、`/401`、`/500`、`/503`、`/maintenance`（`meta: { public: true }`，不进 `IMPLEMENTED_PATHS`）。

- [ ] **Step 1: api 与命名空间**

`POST /__mock/reset`；`REQUIRED_NAMESPACES` 追加 `settings`。

- [ ] **Step 2: 外观与语言卡**

模式三选一（`aria-pressed`，写 store）；强调色五选一（色块 + `setAccent`）；语言 `Select`（`en` / `zh-CN`）写 `setLanguage`。

- [ ] **Step 3: 其余卡片**

账户安全入口（跳 `/security`）、关于（版本取 `__APP_VERSION__`，技术栈与 `builtWith` 用 Vue 口径文案，**不写 React 字样**）、数据保留折叠面板（`Collapsible`，三行静态值）、状态页预览四张外链卡。**Demo 卡**仅在 `env.enableMock && hasPermission('demo:reset')` 时渲染，确认对话框后 `resetDemoData()` → `queryClient.clear()` + `refreshUser()` + 提示。**不渲染 Shell 卡片**（spec §14 决策 2）。

- [ ] **Step 4: 四个状态页**

`/401`、`/500`、`/503`、`/maintenance` 各一页，复用 `ForbiddenPage.vue` 的结构（大号状态码 + 标题 + 说明 + 返回按钮），文案取 `errors:status.*`（`/maintenance` 复用 `unavailable` 的码与标题）。

- [ ] **Step 5: 单测**

覆盖模式切换写 store、强调色切换写 `dataset.accent`、语言切换调用 `setLanguage`、只读账号看不到 Demo 卡、Demo 确认流程调用 `resetDemoData`、折叠面板 `aria-expanded`、四条外链指向正确路径。

- [ ] **Step 6: 验证与提交**

```bash
pnpm exec prettier --check apps/vue-template/src/features/settings apps/vue-template/src/pages apps/vue-template/src/router.ts apps/vue-template/src/lib/i18n.ts
pnpm lint && pnpm typecheck && pnpm test:vue-template
git add apps/vue-template/src/features/settings apps/vue-template/src/pages apps/vue-template/src/router.ts apps/vue-template/src/lib/i18n.ts
git commit -m "feat(vue-template): add the settings page and the status pages"
```

Expected: 全部退出码 0。

---

### Task 11: 导航收口与跨页面 e2e

**Files:**

- Modify: `src/config/nav.ts`、`src/config/nav.test.ts`
- Modify: `src/router.ts`（认证入口反向守卫）
- Create: `e2e-vue-template/specs/auth-account.spec.ts`

**Interfaces:**

- Produces: `IMPLEMENTED_PATHS` **12 项**（原 9 + `/profile` + `/security` + `/settings`）；`nav.test.ts` 的数量与权限等值断言同步。

- [ ] **Step 1: 扩导航**

`IMPLEMENTED_PATHS` 追加三项。账户组在 `NAV_CONTRACT` 中不带权限键，`findNavGroup` 的高亮要能匹配。`nav.test.ts` 改为断言 12 项、账户组三个路径、以及「每个导航项的权限与路由 `meta.permission` 相等（两边都为 `undefined` 也算相等）」。

- [ ] **Step 2: 认证入口反向守卫**

`router.beforeEach` 增加：`to.meta.authEntry === true && auth.isAuthenticated` → `next('/')`。`/403`、404、4 个状态页不受影响（它们没有 `authEntry`）。

- [ ] **Step 3: e2e 四条**

1. 注册 → 验证邮箱 → 用新账号登录 → Dashboard；
2. 找回密码 → 打开演示重置链接 → 重置 → 用新密码登录；
3. 邀请接受 `?token=fish-demo-invite` → 直达 Dashboard；
4. 设置页切换强调色 → 刷新后 `html[data-accent]` 仍为新值。

- [ ] **Step 4: 验证**

```bash
pnpm exec prettier --check apps/vue-template/src/config apps/vue-template/src/router.ts e2e-vue-template/specs/auth-account.spec.ts
pnpm lint && pnpm typecheck && pnpm test:vue-template
pnpm test:e2e:vue-template
```

Expected: 退出码 0；e2e 由 10 条升到 **14 条**且全过。

- [ ] **Step 5: Commit**

```bash
git add apps/vue-template/src/config apps/vue-template/src/router.ts e2e-vue-template/specs/auth-account.spec.ts
git commit -m "test(vue-template): cover the auth and account surfaces"
```

---

### Task 12: 全量验收、双语文档与人工走查

**Files:**

- Modify: `docs/en/vue-template.md`、`docs/zh-CN/vue-template.md`、`README.md`、`README.zh-CN.md`、`CHANGELOG.md`

- [ ] **Step 1: 文档订正**

路由表补 12 个可达页面 + 4 个状态页；Scope 增加认证链路与账户域；偏差表新增「无 zod / 无 toast 库 / 无 Shell 卡片 / 无 docs 链接」并删除「认证仍只有登录」一行；测试计数按实际输出填写。**en 与 zh-CN 同一提交**，两文件都以 H1 开头、段落一一对应。

- [ ] **Step 2: 全量 gates**

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

Expected: 全部退出码 0；`test:parity:docker` 119/119、`test:parity:vue` 42/42；倒数第二条为空；`git status --short` 为空；三个 Vue 包仍为 `private: true` / `0.1.0`。把真实输出写进 SDD 台账（`task-*/` 日志目录）。

- [ ] **Step 3: 人工走查**

真实浏览器、三个演示账号 + 一个现场注册的新账号，覆盖：注册→验证→登录、找回→重置、邀请接受、2FA 登录（`admin` 先启用 2FA 再重新登录）、账户三页（头像/改名/改密码/撤销会话/切换强调色/重置演示数据）。截图与逐条观察写进台账；**没有真实浏览器证据不得声明通过**；临时脚本放 `.superpowers/`（prettier 已忽略、不进 git）。

- [ ] **Step 4: Commit**

```bash
git add docs/en/vue-template.md docs/zh-CN/vue-template.md README.md README.zh-CN.md CHANGELOG.md
git commit -m "docs(vue-template): document the auth and account surfaces"
```

Expected: 提交成功、工作区干净。**不 push、不打 tag、不 publish。**

- [ ] **Step 5: 合回主仓**

`git -C /c/fish/Study/FishAdmin merge --ff-only workbuddy/main-a7370c6a`（若 `main` 仍是祖先）；确认 `git status --short` 两边都为空。

---

## Self-Review

- **Spec coverage:** §3.1 的认证 6 页、账户 3 页、主题强调色、导航 12 项、4 个状态页、应用级组件、测试与文档在 Task 1–12 均有对应；§3.2 的排除项（壳层三布局、命令面板、通知、tabs、subnav、tour、协作域、图表、`GET /menu`）未被任何任务引入。
- **Placeholder scan:** 每个任务给出具体文件、端点、错误码、验证命令与预期输出；没有 TBD/TODO；不贴未验证的大段代码，实现以对应 React feature 与 `packages/mock` 端点为准。
- **Type consistency:** 请求包装类型在 feature 本地定义、形状对齐 React 同名类型；queryKey 统一 `['auth','sessions']`、`['auth','invite',token]`、`['users']`；`AlertDialog` 的 `variant` 与 `common:actions.cancel` 文案全局一致；`useTransientMessage` 是唯一的成功反馈入口。
- **Known gap:** 本切片后 16 项导航仍有 4 项（协作域）未交付，`/settings` 缺 Shell 卡片，壳层三布局与命令面板等高级能力推迟到 Slice 5；`packages/vue` 的导出面保持 Slice 1 冻结状态。另需注意：Task 7 会**改变既有语义**（Vue 从「不支持 MFA」变为「支持」），这是有意修正，必须在台账与文档中同时记录。
