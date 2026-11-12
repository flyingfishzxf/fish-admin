# Vue 模板外壳

`apps/vue-template` 是 FishAdmin 的私有 Vue 3 管理后台外壳。它复用框架无关的 contracts、i18n 资源与 MSW Mock API，以及 `@fish-admin/vue` 组件移植。它是演示模板，不是发布包。

> 客户端权限是体验层，不是安全边界。路由守卫和按钮检查都可以在浏览器中被绕过；
> 真实部署必须在服务端执行授权校验。

## 范围

- 登录、登出、会话恢复与 access token 刷新。
- 按权限过滤的侧边栏、路由守卫与按钮级权限检查。
- 浅色 / 深色 / 跟随系统主题，en / zh-CN 两种语言，均持久化。
- 工作台：7/30 天区间、四张 KPI 卡片、最近活动。
- 用户：搜索、状态筛选、服务端分页与排序、行操作、新建/编辑弹窗与删除确认。

不包含：顶栏/混合布局、命令面板、通知、个人资料/安全/设置页、注册/找回密码/OTP、工作台图表、CSV 导入导出、保存视图、批量操作，也不做像素级 parity。

## 路由

| 路径               | 页面   | 访问条件                  |
| ------------------ | ------ | ------------------------- |
| `/login`           | 登录   | 公开；已登录用户跳转 `/`  |
| `/`                | 工作台 | 已登录 + `dashboard:read` |
| `/users`           | 用户   | 已登录 + `user:read`      |
| `/403`             | 无权限 | 已登录                    |
| `/:pathMatch(.*)*` | 未找到 | 公开                      |

## 演示账号

| 角色   | 邮箱               | 密码          |
| ------ | ------------------ | ------------- |
| 管理员 | `admin@fish.dev`   | `Admin123!`   |
| 经理   | `manager@fish.dev` | `Manager123!` |
| 访客   | `viewer@fish.dev`  | `Viewer123!`  |

## 命令

```bash
pnpm dev:vue-template
pnpm build:vue-template
pnpm test:vue-template
pnpm test:e2e:vue-template
```

## 与 React 模板的偏差

| 领域                                       | React                                               | Vue 模板                              |
| ------------------------------------------ | --------------------------------------------------- | ------------------------------------- |
| 外壳                                       | 侧边栏 / 顶栏 / 混合 + 密度与宽度设置               | 仅侧边栏                              |
| 导航                                       | 契约中的全部 21 个页面                              | 仅工作台与用户                        |
| 命令面板 / 通知 / 离线横幅 / 页签 / 子导航 | 有                                                  | 无                                    |
| 认证                                       | 登录、注册、找回密码、邀请、OTP、2FA                | 仅登录与会话恢复                      |
| 工作台                                     | KPI、三张图表、产品导览                             | KPI 与活动流；无图表与导览            |
| 用户                                       | 列控制、密度、保存视图、CSV、批量、导入、详情、动态 | 搜索、状态、分页、排序、增删改        |
| 个人资料 / 安全 / 设置                     | 有                                                  | 无入口；账号菜单只能登出              |
| 主题                                       | 浅色/深色/跟随系统 + 强调色                         | 浅色/深色/跟随系统，强调色固定 violet |
| 其余页面                                   | 21 个功能                                           | 仅工作台与用户                        |

DropdownMenu 包装组件把 CSS 变量从 `--radix-*` 改名为 `--reka-*`；其余 class 逐字复制 React 源码。

以下实现细节同样与 React 模板不同：

- `DropdownMenuItem` 与 `DropdownMenuLabel` 绑定 `:data-inset="inset || undefined"`，因此非 inset 项不渲染 `data-inset` 属性，而 React 渲染 `data-inset="false"`。
- 面包屑的分组标签是 `<li>` 内的普通 `<span>`，不带 `aria-current`；只有当前页那一项带。
- KPI 卡片省略了 React 的 `py-6` 内边距 class —— class 字符串来自计划，因此纵向内边距略有差异。本切片没有新增或改动任何像素基线。
- 路由使用 `ShellLayout` 包装组件渲染 `AppShell` 加 `<RouterView>`，因为 `AppShell` 本身没有 `RouterView`（React 外壳的路由嵌套方式不同）。
- `eslint.config.js` 有一条只针对 `apps/vue-template/src/main.ts` 的覆盖，关闭 `react-hooks/rules-of-hooks`；该规则会对组件外的 Pinia `use*Store()` 调用误报。

## 测试

Vitest 覆盖重定向、权限、认证/会话、i18n、主题、登录、用户与侧边栏：14 个文件共 54 条用例。六条 Playwright 冒烟用例覆盖主流程；它们不生成也不比对截图。

## 客户端权限边界

本模板的 RBAC 只作用于展示层。隐藏按钮或重定向路由都不能保护 API。Mock 服务跑在浏览器内部，同样不是安全边界。
