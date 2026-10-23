# FishAdmin

**一个可直接开工的 React 后台模板：RBAC、国际化、主题、图表与真实感 Mock API 全部接好。**

[English](./README.md) · 简体中文

[![CI](https://github.com/flyingfishzxf/fish-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/flyingfishzxf/fish-admin/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](./LICENSE)

FishAdmin 不是又一个页面展示集。它是一套可以 clone 下来登录、故意越权试试、再换成自己后端的 starter：认证、菜单/路由/按钮三级权限、数据表格、图表、主题与中英双语已经串成一条完整链路。

> **安全声明：** 客户端 RBAC 只是交互层，**不是安全边界**。修改 JavaScript 或直接调用 API 都能绕过本项目的权限判断。真实权限必须由服务端校验。Mock API 对无权限的写操作返回 `403`，用于演示这一契约。

**在线演示：<https://fish-admin.vercel.app>** —— 使用 `pnpm build:demo` 构建，MSW Mock API 完全跑在你的浏览器里。可直接登录下面的[演示账号](#演示账号)；数据保存在 `localStorage`，清除站点数据即可恢复初始状态。线上的权限判断同样只是体验层，不是安全边界。

## 预览

![FishAdmin 工作台](docs/assets/dashboard.png)

| 768px 下的用户列表                              | 375px 下的角色页                              | 1440px 下的组件演练场                               |
| ----------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| ![768px 用户表格](docs/assets/users-tablet.png) | ![375px 角色页](docs/assets/roles-mobile.png) | ![1440px 组件演练场](docs/assets/ui-playground.png) |

## 功能

- **完整账号生命周期** —— 登录、注册与邮箱验证、忘记密码/重置、邀请链接、两步验证登录（TOTP 风格）、连续五次失败锁定、修改密码与多设备会话列表。会话恢复包含单飞刷新令牌轮换、登录后深链回跳与全局 401 处理。
- **三级 RBAC** —— 导航、路由守卫与按钮级 `<Can>` 全部由同一份权限注册表派生。14 个权限码覆盖用户、角色、部门与审计，管理员、经理、访客三种账号可一键切换对比。
- **真实感 Mock API** —— MSW + 固定种子的内存数据库（同步到 `localStorage`），60 个用户分布在 10 个部门节点，160 条审计事件，支持分页、筛选、排序、假 JWT、刷新令牌、`403` 与演示数据重置。
- **高级用户表格** —— URL 驱动搜索、筛选、排序、分页；行选择与批量改状态、批量删除/恢复（Toast 可撤销）；列显隐、列拖动排序、列固定与列宽拖拽；两种行高密度；行右键菜单；保存视图；CSV 导出；Drawer 表单（RHF + Zod）；加载、空态与错误态齐全。
- **用户详情与动态** —— `/users/$id` 汇总概览、标签即时编辑、头像拖拽上传与该用户的活动时间线，未知 ID 显示 Result 空状态。
- **组织架构树** —— `/departments` 提供可键盘导航的部门树、成员计数，以及新建子部门 / 重命名与可深链的选中态。
- **角色治理** —— 系统角色与自定义角色、两步创建向导，以及 `/roles/matrix` 权限矩阵：分组勾选、冻结表头与显式保存条。
- **审计日志** —— `/audit-logs` 支持 URL 同步筛选、日期区间预设、详情抽屉与关联事件，并可跳转到受影响的用户、角色或部门。
- **可见的异常处理** —— `401`、`403`、`500`、`503` 与维护页各有专页，断网时显示离线横幅并在恢复后提示，路由错误由 error boundary 兜底，设置页与组件库页提供直达预览入口。
- **工作台** —— KPI 卡片、收入面积图、流量柱状图、渠道环形图、最近活动，支持 7/30 天切换；图表随路由懒加载。
- **41 个 shadcn/ui 组件、9 个企业组件与 `/ui` 组件库页** —— 日期区间、描述列表、树 / 树选择、穿梭框、标签输入、步骤条、拖拽上传、结果页与时间线位于 `src/components/enterprise/` 并接入真实页面；所有原语、状态与浮层集中在一页展示，可先确认主题与译文再用到业务页面。
- **明快产品风设计系统** —— 亮色、暗色、跟随系统，5 套强调色，oklch 语义变量，轻量分层阴影，首屏无闪烁。
- **中英双语** —— i18next 按 namespace 懒加载，`Intl` 处理日期/数字，校验文案随语言切换。
- **命令面板** —— `Ctrl/⌘ K` 打开导航与快捷动作，按当前角色过滤。
- **响应式** —— 移动端侧边栏 Sheet、表格自适应、窄屏抽屉，375 / 768 / 1440 三档可用。
- **工程化齐全** —— 严格 TypeScript、Vitest + Testing Library、Playwright、ESLint、Prettier、Husky、lint-staged、commitlint、GitHub Actions、Docker 与 Vercel 配置。

## 快速开始

环境要求：**Node.js >= 22**（推荐 24 LTS）、**pnpm 9.1.1**（`corepack enable` 即可）。

```bash
git clone <repository-url>
cd fish-admin
pnpm install
pnpm dev
```

打开 http://localhost:5173。开发环境会自动启动 Mock API。

### 演示账号

| 角色   | 邮箱               | 密码          | 能力                                             |
| ------ | ------------------ | ------------- | ------------------------------------------------ |
| 管理员 | `admin@fish.dev`   | `Admin123!`   | 全部权限：删除用户与角色、编辑权限矩阵、重置数据 |
| 经理   | `manager@fish.dev` | `Manager123!` | 管理用户、部门与自定义角色，编辑权限，查看审计   |
| 访客   | `viewer@fish.dev`  | `Viewer123!`  | 只读工作台、用户、部门与审计日志                 |

登录页支持一键填充。Mock 数据保存在浏览器的 `fish-admin:db:v1` 中，可在 **设置 → 重置演示数据** 或清除站点存储恢复初始状态。这些账号只存在于浏览器 Mock 中，请勿用于真实后端。

还可以试试：

- **两步验证** —— 在 `/security` 开启 2FA，登出后重新登录即进入验证码步骤。演示验证码是 `246810`；真实应用应由 TOTP 密钥生成。
- **邀请链接** —— 打开 `/accept-invite?token=fish-demo-invite` 以经理身份加入，再次访问可看到邀请已使用的提示。
- **找回密码** —— `/forgot-password` 会直接返回演示重置链接，无需真实邮件即可走完流程。
- **权限矩阵** —— 以管理员身份打开 `/roles/matrix`，勾选权限、保存并刷新；管理员列始终不可修改。
- **审计日志** —— `/audit-logs` 可按动作、对象与日期区间筛选，演示中的每次变更都会记录在案。
- **组织架构** —— `/departments?dept=dept-engineering` 可深链到节点，并分页查看其成员（含后代部门）。
- **异常页** —— `/401`、`/500`、`/503`、`/maintenance` 均可直接访问；在开发者工具中断网会出现离线横幅。

## 项目内容

### 路由

| 路径                 | 说明                                     | 所需权限          |
| -------------------- | ---------------------------------------- | ----------------- |
| `/`                  | 工作台：KPI、图表、活动                  | `dashboard:read`  |
| `/ui`                | 组件库页：全部组件、状态与浮层           | 已登录            |
| `/users`             | 用户表格、CRUD 与批量操作                | `user:read`       |
| `/users/$id`         | 用户概览、标签、头像与动态时间线         | `user:read`       |
| `/departments`       | 部门树、成员与新建/重命名                | `department:read` |
| `/roles`             | 角色卡片与权限编辑                       | `role:read`       |
| `/roles/matrix`      | 跨角色权限矩阵                           | `role:read`       |
| `/permissions`       | 只读权限注册表                           | `permission:read` |
| `/audit-logs`        | 可筛选审计日志与详情抽屉                 | `audit:read`      |
| `/profile`           | 个人资料与头像上传演示                   | 已登录            |
| `/security`          | 密码、两步验证与活动会话                 | 已登录            |
| `/settings`          | 主题、强调色、语言、异常页预览、重置数据 | 已登录            |
| `/403`               | 带应用外壳的无权限页                     | 已登录            |
| `/login`             | 登录（账号开启 2FA 时进入验证码步骤）    | 公开              |
| `/register`          | 注册并验证邮箱                           | 公开              |
| `/verify-email`      | 消费验证 token                           | 公开              |
| `/forgot-password`   | 申请重置链接                             | 公开              |
| `/reset-password`    | 设置新密码并登出其他会话                 | 公开              |
| `/accept-invite`     | 用邀请 token 创建经理账号                | 公开              |
| `/otp`               | 密码通过后的第二步验证                   | 公开              |
| `/401` `/500` `/503` | 会话过期、服务端错误、服务不可用         | 公开              |
| `/maintenance`       | 计划停机页                               | 公开              |

未知路径在登录状态下显示外壳内的 404；未登录访问受保护页面会跳转 `/login?redirect=…`，登录后回到原地址。所有页面守卫都写在 `beforeLoad` 中；路由渲染抛错时由 error boundary 展示可重试的兜底页，而不是白屏。

### 角色与权限

权限采用 `resource:action` 格式，注册表位于 [`src/config/permissions.ts`](src/config/permissions.ts)。菜单、按钮和路由都由这份注册表派生。

| 角色   | 权限                                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 管理员 | `*`                                                                                                                                                                             |
| 经理   | `dashboard:read`、`user:read`、`user:create`、`user:update`、`role:read`、`role:create`、`role:update`、`audit:read`、`department:read`、`department:manage`、`permission:read` |
| 访客   | `dashboard:read`、`user:read`、`audit:read`、`department:read`                                                                                                                  |

路由守卫位于各叶子路由的 `beforeLoad`；菜单在 [`src/config/nav.ts`](src/config/nav.ts) 中按权限过滤；按钮使用 `<Can permission="user:delete">`。新增权限的四步说明见 [docs/zh-CN/rbac.md](docs/zh-CN/rbac.md)。

### Mock API

演示完全运行在浏览器中，由 Service Worker 拦截请求。

| 方法     | 端点                         | 说明                                                                                               |
| -------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `POST`   | `/api/auth/login`            | 返回令牌；账号开启 2FA 时返回验证挑战                                                              |
| `POST`   | `/api/auth/mfa/verify`       | 用挑战 ID 与六位验证码换取令牌                                                                     |
| `POST`   | `/api/auth/register`         | 创建未验证的访客账号，返回演示用验证 token                                                         |
| `POST`   | `/api/auth/verify-email`     | 标记邮箱已验证                                                                                     |
| `POST`   | `/api/auth/forgot-password`  | 无论账号是否存在都返回 200；命中账号时给出演示重置 token                                           |
| `POST`   | `/api/auth/reset-password`   | 设置新密码并吊销其他会话                                                                           |
| `GET`    | `/api/auth/invites/:token`   | 邀请预览                                                                                           |
| `POST`   | `/api/auth/accept-invite`    | 创建被邀请用户并直接登录                                                                           |
| `POST`   | `/api/auth/refresh`          | 轮换 refresh token                                                                                 |
| `POST`   | `/api/auth/logout`           | 吊销 refresh token                                                                                 |
| `GET`    | `/api/auth/me`               | 当前用户及有效权限                                                                                 |
| `GET`    | `/api/auth/sessions`         | 当前用户的活动会话                                                                                 |
| `DELETE` | `/api/auth/sessions/:id`     | 吊销单个会话（不能吊销当前设备）                                                                   |
| `DELETE` | `/api/auth/sessions`         | 退出其他全部会话                                                                                   |
| `POST`   | `/api/auth/change-password`  | 需要校验当前密码                                                                                   |
| `POST`   | `/api/auth/2fa/setup`        | 返回演示密钥与验证码                                                                               |
| `POST`   | `/api/auth/2fa/enable`       | 校验验证码并开启 2FA                                                                               |
| `POST`   | `/api/auth/2fa/disable`      | 校验密码并关闭 2FA                                                                                 |
| `GET`    | `/api/users`                 | `page`、`pageSize`、`q`、`roleId`、`status`、`departmentId`、`includeDescendants`、`sort`、`order` |
| `POST`   | `/api/users`                 | 需要 `user:create`                                                                                 |
| `GET`    | `/api/users/:id`             | 需要 `user:read`                                                                                   |
| `PATCH`  | `/api/users/:id`             | 需要 `user:update`；支持 `departmentId`、`jobTitle`、`tags`、`avatar`                              |
| `DELETE` | `/api/users/:id`             | 需要 `user:delete`；软删除，不能删除自己                                                           |
| `POST`   | `/api/users/bulk-status`     | 需要 `user:update`；跳过无权操作的对象                                                             |
| `POST`   | `/api/users/bulk-delete`     | 需要 `user:delete`；返回真正被删除的 ID                                                            |
| `POST`   | `/api/users/restore`         | 需要 `user:delete`；供 Toast 撤销使用                                                              |
| `GET`    | `/api/roles`                 | 角色及用户数、权限数                                                                               |
| `GET`    | `/api/roles/options`         | 轻量角色选项                                                                                       |
| `POST`   | `/api/roles`                 | 需要 `role:create`；重名返回 409 `ROLE_NAME_TAKEN`                                                 |
| `PATCH`  | `/api/roles/:id`             | 需要 `role:update`；系统角色返回 `PROTECTED_ROLE`                                                  |
| `DELETE` | `/api/roles/:id`             | 需要 `role:delete`；仍有成员时返回 `ROLE_IN_USE`                                                   |
| `PUT`    | `/api/roles/:id/permissions` | 需要 `role:update`                                                                                 |
| `GET`    | `/api/departments`           | 扁平部门列表，含直属与含后代人数                                                                   |
| `POST`   | `/api/departments`           | 需要 `department:manage`；重名返回 409 `DEPARTMENT_NAME_TAKEN`                                     |
| `PATCH`  | `/api/departments/:id`       | 需要 `department:manage`；重命名或换父级，拒绝成环                                                 |
| `GET`    | `/api/audit-events`          | 需要 `audit:read`；`page`、`pageSize`、`q`、`action`、`entityType`、`entityId`、`from`、`to`       |
| `GET`    | `/api/audit-events/:id`      | 需要 `audit:read`；返回事件及 5 条关联事件                                                         |
| `GET`    | `/api/permissions`           | 权限注册表                                                                                         |
| `GET`    | `/api/dashboard?range=7\|30` | 工作台数据                                                                                         |
| `PATCH`  | `/api/profile`               | 当前用户资料                                                                                       |
| `POST`   | `/api/__mock/reset`          | 重置用户、角色、部门与审计事件，保留当前会话                                                       |

假 JWT 有效期 15 分钟，refresh token 有效期 7 天，验证 token 24 小时，重置 token 30 分钟；同一邮箱连续五次密码错误会锁定一分钟。客户端遇到 401 只做一次刷新并重试；失败则清空会话并跳转登录。真实部署建议改用 `httpOnly` Cookie，并且不要在响应体里返回验证或重置 token，详见 [docs/zh-CN/api-integration.md](docs/zh-CN/api-integration.md)。

### 技术栈

| 层              | 选型                                                            |
| --------------- | --------------------------------------------------------------- |
| 运行时 / 包管理 | Node 24 LTS、pnpm 9.1.1                                         |
| 构建            | Vite 8、React 19、TypeScript（strict）                          |
| 样式            | Tailwind CSS 4、shadcn/ui（new-york）、Radix UI、Lucide         |
| 路由            | TanStack Router 1（文件路由、类型安全 search params、路由守卫） |
| 数据            | TanStack Query 5、Zustand 5                                     |
| 表单            | React Hook Form、Zod 4                                          |
| 表格 / 图表     | TanStack Table 8、Recharts 3                                    |
| 国际化          | i18next、react-i18next                                          |
| Mock            | MSW 2、Faker（固定种子）                                        |
| 测试            | Vitest、React Testing Library、Playwright                       |
| 质量            | ESLint 9、Prettier、Husky、lint-staged、commitlint              |

## 目录结构

```text
src/
├─ routes/                 # 文件路由；routeTree.gen.ts 自动生成
├─ features/               # auth、dashboard、users、roles、permissions、departments、audit、profile、security、settings、playground
├─ components/
│  ├─ ui/                  # 41 个 shadcn/ui 组件
│  ├─ enterprise/          # 树/树选择、穿梭框、日期区间、描述列表、标签输入、步骤条、拖拽上传、结果页、时间线
│  ├─ layout/              # AppShell、侧边栏、Header、面包屑、命令面板、离线横幅
│  ├─ data-table/          # 表格、分页、列显隐与列排序
│  └─ common/              # Can、PageHeader、EmptyState、StatusScreen、主题/语言切换
├─ config/                 # env、权限、审计动作、导航、主题预设、演示数据
├─ lib/                    # API 客户端、鉴权、i18n、格式化、CSV、在线状态
├─ stores/                 # 会话、主题、UI 状态
├─ locales/{en,zh-CN}/     # 懒加载语言包
├─ mocks/                  # MSW handlers、种子数据库、假鉴权
└─ styles/index.css
e2e/                       # Playwright 用例
docs/{en,zh-CN}/           # 文档
```

## 常用命令

| 命令                                | 说明                                  |
| ----------------------------------- | ------------------------------------- |
| `pnpm dev`                          | 启动开发服务器（Mock 开启）           |
| `pnpm build`                        | 类型检查并构建生产包（默认关闭 Mock） |
| `pnpm build:demo`                   | 开启 Mock 构建演示包                  |
| `pnpm preview`                      | 预览生产构建                          |
| `pnpm lint` / `pnpm lint:fix`       | 运行 ESLint                           |
| `pnpm format` / `pnpm format:check` | 运行 Prettier                         |
| `pnpm typecheck`                    | 仅跑 TypeScript 检查                  |
| `pnpm test` / `pnpm test:watch`     | 单元测试                              |
| `pnpm test:coverage`                | 带覆盖率的单元测试                    |
| `pnpm test:e2e`                     | 构建演示包并运行 Playwright           |

## 接入真实后端

1. 设置 `VITE_ENABLE_MOCK=false` 与 `VITE_API_BASE_URL=https://your-api.example.com`。
2. 删除 `src/main.tsx` 中的 Mock 启动块，然后删除 `src/mocks` 与 `public/mockServiceWorker.js`。
3. 按 [docs/zh-CN/api-integration.md](docs/zh-CN/api-integration.md) 实现接口。开发阶段可先保持响应结构，只替换 base URL。
4. 在服务端校验所有权限。前端判断只改善体验，不能保护数据。

如果要在生产构建中保留演示 Mock，请在构建时设置 `VITE_ENABLE_MOCK=true`，并确保 `/mockServiceWorker.js` 从应用根路径提供且不被缓存。

## 部署

- **Vercel** —— 导入仓库即可。[`vercel.json`](vercel.json) 使用 `pnpm build:demo` 构建，配置 SPA rewrite，并让 Service Worker 保持可重新验证。接入真实 API 时改用 `pnpm build`。
- **Docker** —— `docker compose up --build`，打开 http://localhost:8080。镜像默认开启演示 Mock；传入 `--build-arg VITE_ENABLE_MOCK=false` 可构建纯 API 版本。
- **任意静态托管** —— 部署 `dist/`，将未知路径 rewrite 到 `index.html`，且不要缓存 `mockServiceWorker.js`。

子路径部署与常见 Service Worker 坑见 [docs/zh-CN/deployment.md](docs/zh-CN/deployment.md)。

## 文档

- [架构说明](docs/zh-CN/architecture.md) —— 启动流程、路由、数据流、主题与国际化。
- [权限系统](docs/zh-CN/rbac.md) —— 权限模型、守卫、新增权限步骤。
- [账号生命周期](docs/zh-CN/account-lifecycle.md) —— 注册、邮箱验证、二次验证、会话、异常页面与离线处理。
- [接入 API](docs/zh-CN/api-integration.md) —— 接口契约、鉴权流程、替换 Mock。
- [部署指南](docs/zh-CN/deployment.md) —— Vercel、Docker、nginx 与 Service Worker 注意事项。
- [English docs](docs/en/architecture.md)

## 参与贡献

欢迎提交 PR。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，提交前运行 `pnpm lint && pnpm typecheck && pnpm test`，并遵循 Conventional Commits。安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。

## 许可证

[MIT](./LICENSE) © FishAdmin contributors
