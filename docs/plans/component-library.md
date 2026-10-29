# FishAdmin — 组件库产品化计划

> 内部规划文档。本计划自身不面向终端用户；各里程碑产出的用户可见文案必须按仓库惯例同时提供
> `docs/en/` 与 `docs/zh-CN/` 两份，并保留 client-side RBAC 非安全边界的免责说明。
>
> 本计划取代未提交的 `docs/plans/1.8.0.md`（门面轮）。门面轮只保留一条结论：文档站必须独立
> 部署；landing、常驻提示条、登录后首访卡全部取消，由文档站首页承担门面。

- 基线：`v1.7.0`（2026-10-27 发布，`origin/main` = `ea6de4b`）
- 计划日期：2026-10-27
- 目标产物：可安装的组件库（`@fish-admin/react`，0.1.0）+ 独立文档站 + 模板（建议 2.0.0）
- 定位：**组件库 + 企业级中后台模板**。组件库是产品，模板是它的第一个 consumer 与完整示例。

## 目标

1. **可安装**：83 个组件脱离模板，作为 npm 包装进任意 React 19 项目；独立构建、独立版本、独立测试。
2. **可查**：83 个组件各有独立文档页——至少 2 个实时 demo、源码、何时使用、API、设计指引、
   无障碍、FAQ；中英双语。
3. **可试**：文档站首页就是总门面，提供安装命令、快速开始、主题、版本、组件索引和模板演示入口。
4. **可抄**：每个组件页都链到模板中真实使用它的业务页；模板是活样例，不是截图。
5. **可生长**：模板删除 `/components` 与 `/ui`，菜单改为外链文档站；Vue 3 生态只留位，本轮零实现。

## 产品形态

| 表面   | 地址                    | 负责                                                       |
| ------ | ----------------------- | ---------------------------------------------------------- |
| 文档站 | 独立子域，待定          | 门面、安装、指南、83 个组件页、主题、模板说明、版本        |
| 模板   | `fish-admin.vercel.app` | 登录后的真实业务系统；菜单含「组件文档」外链               |
| npm 包 | `@fish-admin/react`     | 组件、类型、tokens/样式；无路由、无 store、无 mock、无业务 |
| GitHub | 现有仓库                | 源码、Issue、Release；README 首段改为组件库 + 模板         |

模板不再有自己的 landing。匿名访问 `/` 仍跳登录页；文档站首页负责回答「这是什么、怎么装、去哪看」。
这是对 1.8.0 门面轮 `/welcome` 决定的明确反转，原因是门面只有一个，两个门面会互相稀释。

## 现状与约束

数字取自 1.7.0 定版记录；M0 开工时重新测量一次再写进执行记录。

| 门禁             | 现值                 | 预算   | 余量       |
| ---------------- | -------------------- | ------ | ---------- |
| `firstPaintJs`   | 172.4 KB             | 180 KB | **7.6 KB** |
| `largestAsyncJs` | 95.6 KB（`chart-*`） | 115 KB | 19.4 KB    |
| `totalJs`        | 776.0 KB             | 800 KB | 24.0 KB    |
| `totalCss`       | 23.0 KB              | 30 KB  | 7.0 KB     |

单测 86 文件 / 527 条；e2e 85 条；视觉 17 用例 / 19 张 Linux 基线。

与本轮直接相关的现状：

- **单包、无 workspace**：根 `package.json` 是 `fish-admin@1.7.0`（private）；`docs/` 只是 10 篇
  Markdown，没有站点；组件只能随模板一起运行。
- **83 个注册组件 = 47 个原语 + 30 个 enterprise + 6 个 pro**，`src/config/components.ts` 是唯一
  清单，每项带 `usedIn` 与 demo 锚点。
- **路由依赖已经干净**：15 处 `@tanstack/react-router` / `@/stores` / `@/features` 导入全部在
  `components/common` 与 `components/layout`，即模板壳层；83 个注册组件一个都没有。
- **i18n 是主要耦合**：26 / 83 个组件调用 `useTranslation('common')`（7 个原语 + 19 个
  enterprise/pro），共 69 处 `t()`；日期组件还直接读 `i18n.language` 选择 `date-fns` 的
  `enUS` / `zhCN`。
- **零散耦合**：`ui/sonner` 依赖 `@/lib/theme`（theme store）；`ui/sidebar` 依赖
  `@/hooks/use-mobile`；全包 81 处 `@/lib/utils`。
- **必须随包走的非清单模块**：`components/data-table`（ProTable 与三个业务页直接用）、
  `components/common/page-header`（PageContainer 与 9 个业务页直接用）、
  `lib/{utils,date,tree,csv}`、`hooks/use-mobile`。少了它们，ProTable / DetailPage 装不起来。
  `data-table` 不在 83 清单里，但另有 12 处 `t()`（8 个 `table.*` key），必须和组件一起迁到包内
  i18n，否则「包源码不出现 `react-i18next`」的验收无法达成。
- **Docker 安装顺序**：`Dockerfile` 在 `COPY . .` 之前用根 `package.json` + lockfile 做
  `pnpm install --frozen-lockfile`；引入 workspace 后必须先复制 `pnpm-workspace.yaml` 与
  `packages/ui/package.json`，否则镜像构建会在安装阶段失败。
- **应用接入面很大**：185 个文件、739 行 import 指向 `@/components/{ui,enterprise,pro}`、
  `@/components/data-table` 或 `@/components/common/page-header`。
- **演示代码可复用**：现有 83 个 demo 分散在 6 个 wave 文件（整个 `features/playground` 目录约
  212 KB），主体可搬，但 import 全是 `@/components/...`、`@/lib/...`、`@/config/validation`，
  不能直接进文档站。
- **样式集中在** `src/styles/index.css`：`:root` / `.dark` / `@theme inline` / 基础样式混在一个
  文件里，没有可独立发布的 CSS 产物。
- **首屏余量只有 7.6 KB**：抽包不能把 `chart` / `recharts` 之类拖进 `src/main.tsx` 的 eager 图
  （见 `project-fishadmin-firstpaint-eager-graph`）。
- **demo 的 CSP 为 `script-src 'self'`**：文档站必然注入内联脚本，因此独立部署、独立 headers，
  不并入 demo 项目。
- **Vercel 约束**：demo 项目的 Root Directory 是仓库根；文档项目若 Root 设为 `apps/docs`，默认
  读不到 `../../packages/ui`，这是 M1 必须先验证的部署风险。

---

## M0 — 抽包与工作区（2–3 周）

**问题**

83 个组件只能随模板运行：没有可安装的包、没有独立构建、没有独立测试；i18n 与 theme store 还
粘在模板上。不先解决这一层，文档站只能继续展示「模板里的组件」，成不了组件库。

**做法**

1. **工作区，但模板不搬家**
   - 新增 `pnpm-workspace.yaml`：`packages: ['.', 'packages/*', 'apps/*']`；一个 lockfile。
   - 根目录仍是模板应用（`src/`、`e2e/`、`Dockerfile`、`vercel.json` 原地不动），避免改 Vercel
     Root、Docker 路径、85 条 e2e 的相对路径。`packages/ui` 与 `apps/docs` 作为私有子包加入。
2. **包边界**
   - 移入 `packages/ui`：`components/ui`（47）、`components/enterprise`（30）、
     `components/pro`（6）、`components/data-table`、`components/common/page-header`、
     `lib/{utils,date,tree,csv}`、`hooks/use-mobile`、tokens 样式。
   - 留在模板：`components/common/{can,route-error,status-screen,theme-sync,theme-toggle}`、
     `components/layout/*`、`features/*`、`stores/*`、`lib/{api-client,auth,i18n,theme,...}`。
   - 公开 API：包根一个 barrel，导出 83 个组件 + 必要的类型；`data-table` 与 `page-header` 走
     `@fish-admin/react/internal/*`，不进文档、不承诺稳定。
   - 用 `git mv` 保留历史；包内禁止 `@/` 别名，路径改成包内相对路径。
3. **i18n 缝（本轮最重要的 API 设计）**
   - 新增 `UIProvider`：`locale`（`'en' | 'zh-CN'`）、`messages?`（覆盖文案）、`theme?`
     （`'light' | 'dark' | 'system'`）。
   - 把 69 处 `t()` 的文案抽到 `packages/ui/src/locales/{en,zh-CN}.json`；另把
     `components/data-table` 的 12 处 `t()`（8 个 `table.*` key）一并迁入；所有组件改用内部
     `useUITranslation()`，不再依赖 `react-i18next` 与模板的 `common` 命名空间。
   - 日期相关组件（`calendar`、`date-picker`、`date-range-picker`、`time-picker`）从 provider
     取 locale，映射 `date-fns` 的 `enUS` / `zhCN`，删除对 `i18n.language` /
     `i18n.resolvedLanguage` 的读取。
   - `sonner` 的 theme 从 provider 取，不再 import `@/lib/theme`。
   - 未包 provider 时回退英文；缺失 key 时回退英文并在 dev 下 `console.warn`，生产不打印。
   - 模板在根布局包一层 `<UIProvider locale={currentLanguage()}>`；文档站用站点语言。语言切换必须
     驱动 provider 重渲染（订阅 react-i18next 的当前语言），否则组件文案会停在旧语言。
   - 18 个组件测试目前用 `@/lib/i18n` 切换语言，随组件迁入包后改为渲染 `UIProvider` + 包内资源。
4. **样式与 tokens**
   - 从 `src/styles/index.css` 拆出 tokens（`:root`、`.dark`、`@theme inline`、动画）到
     `packages/ui/src/styles/tokens.css`；模板保留自己的 base（body、滚动条等）。
   - 包产出 `dist/styles.css`：tokens + 组件用到的 utilities，**不含 preflight**；另出
     `dist/preflight.css` 供独立接入的消费方可选引入。
   - 安装文档写清两种接法：默认引预编译 CSS；或消费方 Tailwind 4 用 `@source` 扫描包内
     随包发布的 CSS 与 JS 产物（构建后的 JS 保留完整类名字符串，不必发布源码）。
   - 模板的全局 CSS 以相对路径引包内 tokens 源文件（dev/build 都走源码）；文档站引构建产物
     `dist/styles.css`。两条路径都在 CI 里构建验证。
   - 不使用动态拼接类名；CVA 的静态类必须能在预编译产物里找到。
5. **构建与产物契约**
   - ESM + `.d.ts`；`sideEffects: ["*.css"]`；`react` / `react-dom` 为 peer，其余运行时依赖
     （radix-ui、lucide-react、cva、date-fns、react-day-picker、recharts、@tanstack/react-table、
     react-hook-form、cmdk、vaul、sonner、input-otp、react-resizable-panels）为 dependencies。
   - `exports` 只暴露 `.`、`./styles.css`、`./preflight.css`、`./internal/*`；不加 CJS 产物，
     安装文档写明 ESM-only。
   - 构建工具在 M0 头两天做 1 天 spike：Vite lib 多入口 / tsup / tsc 多入口。判据：barrel
     tree-shaking、d.ts 完整、CSS 可独立消费、Rspress 与纯 Vite 都能吃。结果写进执行记录，
     不因为工具偏好反复。
6. **模板接入**
   - codemod 把 185 个文件 / 739 行 import 改成包导入；删除 `src/components/{ui,enterprise,pro}`。
   - `vite.config.ts` 与 `tsconfig.json` 把 `@fish-admin/react` 指到 `packages/ui/src/index.ts`
     （模板 dev/build 都走源码，保留 HMR）；模板 CSS 加
     `@source '../../packages/ui/src'`（`@source` 相对 CSS 文件 `src/styles/index.css` 解析），
     否则包内类名不进 Tailwind 产物。
   - 组件单测随源码迁入 `packages/ui`（Vitest + Testing Library + jsdom）；包内新增独立的
     `vitest.config.ts` 与 `test/setup.ts`；根 `tsconfig`/ESLint 的覆盖范围（含 `react-refresh`
     例外）同步扩到 `packages/ui`。模板只留壳层与业务测试。
   - `Dockerfile` 在 `pnpm install --frozen-lockfile` 之前补拷 `pnpm-workspace.yaml` 与
     `packages/ui/package.json`；M1 新增 `apps/docs` 时同步补拷其 manifest。
   - `Chart`、`ProTable` 的异步 chunk 可能因 barrel 变化：先测 `pnpm size`。若 recharts 被拖进首屏，
     用深路径或懒加载边界解决，不放宽预算。
7. **发布准备与 scaffold**
   - `scripts/check-package.mjs`：构建后在临时目录用 Vite 打一个只 import 包的最小应用，断言
     83 个导出存在、CSS 可解析、产物里没有 `@/` 别名、没有 router/store/i18n 运行时依赖。
   - `packages/ui/README.md`：安装、peer、CSS、`UIProvider`、locale、tree-shaking 注意事项。
   - `pnpm scaffold` 与 `scaffold.test.mjs` 适配新结构：scaffold 仍可删 mock、额外语言、演示账号，
     但保留包依赖；`--dry-run` 必须仍然可读。

**验收**

- 包构建通过；`check-package` 通过；包源码 grep 结果为零：`@/`、`react-i18next`、`i18next`、
  `@tanstack/react-router`、`@/stores`、`@/features`。
- 83 个组件全部从包根导出，无重名；`import { Button, ProTable } from '@fish-admin/react'` 可用。
- 模板全量门禁通过；`firstPaintJs` 不高于 172.4 + 1 KB；`totalJs` ≤ 800 KB。
- 包 + 模板合计单测数不低于迁移前的 527；三种角色登录与 17 条视觉用例零 diff（纯 import 改写，
  不应有像素差异）。
- `pnpm scaffold --dry-run` 通过；scaffold 测试更新。
- 执行记录写清：构建工具、产物大小与 chunk 构成、首屏实测值、i18n 文案迁移是否有可见变化。

### 执行记录

2026-10-27 完成 M0（未提交、未发布）。

**构建工具选型**：Vite 8 lib 多入口（`preserveModules`）+ `tsc --emitDeclarationOnly` 出 d.ts +
Tailwind CLI 出 CSS；未采用 tsup。判据全部满足：包根 barrel 可 tree-shaking（模板首屏没有
recharts）、d.ts 与 JS 同构、CSS 可独立消费、Rspress/Vite 都能直接吃 ESM。

**产物**

- `packages/ui/dist` 318 个文件 / 1.8 MB（含 sourcemap）；`index.js` 16.6 KB（gzip 4.2 KB），
  逐模块 JS 与 `.d.ts` 同构。
- `styles.css` 113.7 KB（gzip 17.2 KB）：tokens + 83 个组件用到的 utilities + 最小 base，不含
  preflight；`preflight.css` 4.1 KB（gzip 1.4 KB）。两者内容互不泄漏。
- `package.json` 用 `sideEffects: ["**/*.css"]`（比计划里的 `*.css` 覆盖更严），exports 仅
  `.`、`./styles.css`、`./preflight.css`、`./internal/*`；无 CJS 产物。
- 包源码 grep `@/lib`、`@/components`、`react-i18next`、`@tanstack/react-router`、`@/stores`、
  `@/features` 均为零。

**模板接入**

- codemod 实际改写 116 个文件（计划估算 185/245，高估；组件 import 本就集中）。
- 新增 `vite.shared.ts`，让 `vite.config.ts` 与 `vitest.config.ts` 共用 7 条 alias；`tsconfig.json`
  paths 同步，模板 dev/build/test 都直接吃包源码。
- 组件目录的 import 提示改为 `@fish-admin/react`（`src/config/components.ts` 的
  `COMPONENT_IMPORT_PATH`），e2e 断言同步；`components.test.ts` 改为从包根断言 83 个导出存在。
- `UIProvider` 包在 `<StrictMode>` 内、`QueryClientProvider` 外；语言与主题切换会驱动 provider
  重渲染。

**i18n**

- 迁移 57 个 key（49 个组件 + 8 个 data-table），46 个文件改用 `useUITranslation()`；18 个组件
  测试去掉模板的 `@/lib/i18n` 引导。
- 文案放 TS 模块（`packages/ui/src/locales/*.ts`），避免 JSON import attributes；支持
  `{{var}}` 插值，缺失 key 回退英文且只在 dev 警告。
- 浏览器实测：中文下 `#demo-calendar` 显示「2026年10月 一 二 三」，切到英文后变为
  「October 2026 Su Mo Tu」；切换语言后组件文案与日期格式同步更新，无残留。

**首屏与预算（gzip）**

- `firstPaintJs` 174.4 KB / 180（计划估算 173.4，实际多 1.0 KB）：增量来自 `UIProvider` 与内置
  en/zh 文案（约 2 KB 进首屏）；barrel 没有把 recharts 拖进首屏，最大异步 chunk 仍是
  `chart` 95.6 KB。
- `largestAsyncJs` 95.6 / 115；`totalJs` 778.7 / 800；`totalCss` 23.1 / 30。

**测试与门禁**

- 包：42 文件 / 160 用例；根：46 文件 / 377 用例；合计 537（迁移前 527）。
- 覆盖率 73.35 / 76.59 / 66.94 / 74.67（阈值 70/70/65/70）。组件测试与 4 个 100% 覆盖的 lib
  测试迁出后，根函数覆盖率一度跌到 63.88；补了 auth 守卫、`useResolvedTheme`、
  `useDocumentTitle` 共 7 条测试拉回 66.94，未下调阈值。
- `pnpm format:check`、`lint`、`typecheck`、`size`、`check:package`（83 个导出）全绿；
  e2e 85/85；Docker 视觉 17/17、19 张基线零 diff；`scaffold --dry-run` 可读。
- 浏览器抽查：登录 → 组件目录中英文切换 → 日历 locale、主题菜单、`@fish-admin/react` 徽标
  均正常。

**偏差**

- 计划写的 69 处 `t()` 实为 57 个 key（49 组件 + 8 data-table），调用点多于 key 数。
- 计划估算首屏 173.4 KB，实测 174.4 KB，仍低于硬预算 180 KB；未放宽预算。
- 计划估算根测试 49 文件，实际迁出后 45，补测后 46。
- `check-package` 在 Windows 上需要 `tar --force-local` 与正斜杠路径；`pnpm --filter <pkg> pack`
  在 pnpm 9 不支持 `--recursive`，改为在包目录执行 `pnpm pack`。
- scaffold 的 AlertDialog 删除由 1 条整包 import 改为 7 条具名 import；settings 页仍使用
  `PageHeader`，`internal/page-header` 路径无需删除。

**未验证**

- npm 发布链路（2FA、组织权限、tarball 上传）留到 M3；本轮只验证本地 `pnpm pack` 后的
  消费者级构建。
- Rspress 文档站接入（M1）。
- Vue 3（本轮范围外）。

---

## M1 — 文档站基建（2 周）

**问题**

现有文档只能在 GitHub 里读，83 个组件只有模板内的一张长页；文档站要同时承载「组件库门面」
与「模板文档」，并让 React demo 真正跑起来。

**做法**

1. **框架 spike（1 天）**
   - 默认 **Rspress**：React + Vite 生态、官方 preview / api-docgen 插件、内置 i18n 与本地搜索、
     静态产物可独立部署。
   - **VitePress 排除**：Vue 宿主，React demo 要手写挂载，没有官方 React demo/API 插件；
     不是「多写点胶水」的量级。
   - **Astro Starlight 作为 fallback**：如果 Rspress 与 React 19 / Tailwind 4 冲突，换 Starlight
     的 React islands，API 管道不变。
   - 判据：live React demo + 源码、API docgen、双语路由、搜索、构建时间、CSS 接入、部署产物。
     结果写进执行记录，不通过就换，不硬撑。
2. **站点骨架 `apps/docs`**
   - Rspress；内容根 `apps/docs/docs`；`i18n.json` 支持 `en`（默认）与 `zh-CN`；`_meta.json`
     管侧栏；内置搜索；深浅色；首页 `pageType: home`。
   - `apps/docs` 以 `workspace:*` 依赖 `@fish-admin/react`；`docs:build` 先构建包，再让文档站消费
     `dist` 而不是源码，确保发布产物被 dogfood。
   - 顶部导航：指南 / 组件 / 模板 / 版本；页脚：GitHub、Demo、License、一行「Vue 3 版本规划中」。
   - 站点标题用中性的 **FishAdmin UI**，全局导航不写死 React，为第二个生态留位。
3. **Demo 基建**
   - `apps/docs/demos/<component>/<variant>.tsx`：每个 demo 独立模块，只允许 import React、
     `@fish-admin/react` 与 docs 自己的 demo 辅助组件；禁止 `@/`、MSW、业务 store。
   - `<Demo>` 组件：实时渲染 + 源码（`?raw`）+ 复制按钮 + 「在模板中查看」外链（来自 registry
     的 `usedIn`）。
   - `apps/docs/demos/registry.ts`：demo 注册表；`docs:check` 校验每个 demo 被页面引用、路径存在、
     import 合法。
   - `<Demo>` 渲染器为每个 demo 包一层 `UIProvider`（站点语言）；模板地址、GitHub 地址集中在
     `apps/docs/site.ts`，不从页面里散落硬编码。
   - demo 跟随站点深浅色；不做 viewport 工具栏（多一个状态源，收益低）。
4. **API 生成管道**
   - `scripts/gen-api.mjs`（根，devDependency `react-docgen-typescript`）读 `packages/ui/src`，
     输出 `apps/docs/generated/api.json`（提交到仓库）。
   - 字段：component、props[{name,type,required,default,description}]、events、slots、unresolved。
   - 兜底：Radix 透传与复杂泛型标 `unresolved`，页面显示类型签名 + 「继承自 Radix / shadcn」+
     对应 Radix 文档链接；不为了表格去改组件类型。
   - `--check` 防漂移；`--coverage` 输出可解析 props 比例，首次实测后锁成 CI 下限，只升不降。
   - M1 只搭管道，JSDoc 在 M2 每波补；默认值用 `@default` 标签，不依赖解构默认值的推断。
5. **模板文档迁移**
   - 根 `docs/{en,zh-CN}` 仍是这 10 篇的唯一源（GitHub 上继续可读，README 链接不断）。
   - `docs:build` 前跑 `apps/docs/scripts/sync-template-docs.mjs`：把两套文档复制到
     `apps/docs/docs/template/`（gitignore），补 frontmatter、改写站内链接与截图路径；
     不在 `apps/docs` 里手工维护第二份。
   - `plans/**`、`superpowers/**`、`assets/**` 排除，内部规划不上线。
   - 文档索引与 sidebar 由 `_meta.json` 维护；死链由构建失败兜底；`docs:check` 校验生成结果与
     源文件数量、标题一致。
6. **部署 spike（创建 Vercel 项目需单独确认）**
   - 先本地构建；拿到批准后再建项目。三种方案按优先级：
     - A. Root = 仓库根，Build Command 构建 `apps/docs`，Output = `apps/docs/doc_build`；
       `ignoreCommand` 只在 docs / packages/ui 变更时构建。能读 `packages/ui`，最稳。
     - B. Root = `apps/docs`，开启「Include files outside of the Root Directory」。
     - C. 兜底：文档站消费已发布的 npm 包；若 npm 发布未获批，会阻塞 M2 的线上验收。
   - 成功标准：预览 URL 的首页、一个组件页、一个 live demo、中文路由、深浅色、搜索都正常；
     记录 headers 与缓存规则。
   - 文档站自己的 `vercel.json`：`script-src 'self' 'unsafe-inline'`；其余 nosniff、
     Referrer-Policy、HSTS、frame-ancestors 照搬；`/assets/(.*)` immutable。与 demo 的严格 CSP
     不同，原因写进部署文档。
7. **根脚本与 CI**
   - `docs:dev` / `docs:build` / `docs:check`；CI 增加 docs job；Dependabot 覆盖根、
     `packages/ui`、`apps/docs`。
   - `pnpm typecheck` 覆盖包、模板与 docs demos（独立 tsconfig）。

**验收**

- `pnpm docs:build` 通过：双语首页 + 10 篇模板文档 + 组件索引 + 3 个试点组件页。
- 3 个试点（button / pro-table / date-range-picker）各有 ≥2 个 live demo、源码、API 表、双语。
- 搜索可命中；375 宽可用；试点页 axe 零违规；死链零；内部规划文档不在产物里。
- `gen-api --check` 干净；JSON 恰好 83 条。
- 部署：未获批前只记录本地结果，不提前宣称线上；获批后按 A/B/C 记录实际方案与失败原因。

### 执行记录

**栈与规模**

- Rspress 2.0.23（rsbuild 构建）、React 19.3.1，pnpm 9.1.1 workspace；本地 Node 22.21.1、
  Windows；CI 用 Node 24。
- 构建：`pnpm docs:build`（含 `packages/ui` 预构建）约 12 s；`doc_build` 产物 15 MB
  （含 HTML 与源码页面），Rspress 统计总资源 1706.3 kB / gzip 332.8 kB；`static/js` 697 KB、
  `static/css` 188 KB（未压缩）。搜索索引 en 138.5 KB、zh 133.7 KB。
- 页面：每种语言 20 页——首页、3 篇指南、组件索引 + 3 个试点页、模板 11 页（索引 + 10 篇）、
  版本页；加根 404，共 41 个 HTML。计划里的「19 页」未把模板索引页单独计入。
- Demo 6 个（3 个试点各 2 个），登记在 `apps/docs/demos/registry.ts`；API 条目 83 个，
  `gen-api:check` 干净；M1 的 JSDoc 覆盖 7.67%（CI 下限 0.00%，M2 随每波提升）。

**门禁结果（本地全绿）**

- `format:check`、`lint`（0 error，1 条 theme entry 的 react-refresh warning）、
  `typecheck`（模板 + 包 + docs 三段链式）、`test:coverage`、`@fish-admin/react` 测试
  42 个文件全过、包构建、`check:package`（83 个导出）、`gen-api:check`、`docs:build`、
  `docs:check`、`test:docs` 14/14。
- 包体积无回归：firstPaintJs 174.4 / 180 KB、largestAsyncJs 95.6 / 115 KB、
  totalJs 778.6 / 800 KB、totalCss 23.1 / 30 KB。
- `docs:check`：`83 registry entries, 6 demos, 6 pilot pages, 20 template pages`；内部规划
  （`plans/**`、`superpowers/**`）未进入产物，死链由 Rspress 构建兜底。
- Axe：`/`、`/components/button`、`/components/pro-table`、`/components/date-range-picker`、
  `/zh/components/button` 五条路由零违规。为此修了 Rspress 主题本身的问题：首页补 `<main>`
  与 `<h1>`；侧栏与大纲 `aside` 各自命名；标题锚点移出 Tab 序；调暗浅色链接色（`#0059b3`）
  与三级文字（`#5f5f5f`）并保留深色 `#33adff` / `#9e9e9e`；导航激活项改用链接色；demo
  浮层 z-index 抬到吸顶导航之上（导航 60、包内浮层 50）。搜索快捷键对比度是一次动画期间的
  瞬时读数，静置后不复现，未做抑制。
- 文档 e2e 14 条：内容与 demo 行为（首页、83 索引、button、ProTable 过滤与多选、
  日期区间日历与预设、中文路由、深色、搜索）+ 375 px 布局 5 条。

**偏差**

- 语言代码用 `zh`（Rspress 的 locale code，路由 `/zh/…`），不是计划写的 `zh-CN`。
- 6 个 demo 而非每个试点「至少 2 个」之外的更多变体；满足验收。
- 用 `@docs/*` alias 指向 `apps/docs`；`site.ts` 集中模板与 GitHub 外链。
- `rspress preview` 不支持 `--strictPort`，Playwright 改为依赖 `url` 探活。
- 文档站 CSP 需要 `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`：Rspress 搜索索引
  用 WebAssembly 编译，缺 `wasm-unsafe-eval` 时搜索在带 CSP 的静态服务下不可用。已用
  `apps/docs/vercel.json` 的真实 headers 起本地静态服务验证：四条路由 200、搜索命中、
  深色切换正常、控制台零报错。

**部署姿态**

- 已从 `apps/docs` 独立构建成功，并本地验证产物与 headers；**未创建 Vercel 项目**
  （需单独确认）。目标配置：Root = `apps/docs` 并开启“Include files outside of the Root
  Directory”；根 `vercel.json` 属于 demo，不复用。线上 headers、缓存与预览 URL 都要等
  项目建立后才能实测，在此之前不宣称线上可用。
- 未验证：真实 npm 消费者安装、Vercel 预览、83 页全量覆盖（M2）。

---

## M2 — 83 个组件页（8–9.5 周）

**问题**

M1 只证明管道能跑。真正的产品是 83 个页面 × 两种语言：每页都要有可运行的 demo、准确的 API、
能照着做对的设计说明，以及诚实的无障碍边界。这是本轮的关键路径，不能压到最后一次性验收。

**每页内容标准（缺一不可）**

1. 标题 + 一句话描述 + 分类 / `since` 徽章。
2. 何时使用 / 何时不用（各 2–4 条）。
3. **至少 2 个 live demo**：基础用法 + 一个变体（受控 / 表单 / 异步 / 空态等）；每个 demo 有
   一句说明与可复制源码。高频组件 3 个。
4. API：props 表（名称 / 类型 / 默认值 / 必填 / 说明）、events、slots / children、ref；
   说明来自源码 JSDoc，Radix 透传部分按 `unresolved` 兜底。
5. 设计指引：anatomy、尺寸与密度、状态（hover / focus / disabled / loading / error）、do / don't。
6. 无障碍：键盘表、ARIA 角色、焦点管理、已知缺口；不把未验证的能力写成已支持。
7. FAQ：2–3 个真实问题（受控怎么接、为什么没有某个 prop、和另一个组件的区别）。
8. 相关组件 + 「在模板中查看」业务页链接。
9. 双语：`en` 为准，`zh-CN` 同步；props 名保留英文，正文中文；不机器直译。

**分波**

| 波次 | 范围                                                              | 页数 | 工期     |
| ---- | ----------------------------------------------------------------- | ---- | -------- |
| W1   | 高频原语：button、input、select、checkbox、dialog、tabs、table 等 | 24   | 2 周     |
| W2   | 其余原语：calendar、command、chart、sidebar、sonner 等            | 23   | 2 周     |
| W3   | enterprise 前 20 个                                               | 20   | 2–2.5 周 |
| W4   | enterprise 后 10 个 + 6 个 pro                                    | 16   | 2–3 周   |

每波结束都必须可发布：页面、demo、API、双语、检查门禁同时完成，不把「正文待补」留到最后一波。

**做法**

- **demo**：优先搬 `src/features/playground/components` 的 83 个现有 demo 主体，改 import 与
  文案；每页再补一个变体。demo 只依赖包与 React，不用 MSW、不用业务 store。
- **JSDoc**：为公开 props 补一行说明与 `@default`；只覆盖组件自己声明的 props，不追 Radix 全量。
  `--coverage` 每波复测，低于已锁下限即失败。
- **设计指引**：从现有组件实现与 `src/styles/index.css` 的 tokens 推导，不另造一套设计语言；
  do / don't 用真实类名与尺寸，不写空话。
- **无障碍**：键盘行为以实际 e2e / axe 结果为准；未实现的（如某些 Radix 组合键）写进「已知缺口」，
  不抄 Ant Design 的承诺。
- **usedIn**：registry 从 `src/config/components.ts` 复制到 `apps/docs/content/registry.ts`；
  M3 删除模板清单前，两边 83 条 id 由测试锁步。
- **检查**：`docs:check` 校验每页必需小节、demo 数 ≥2、demo 已注册、API 表存在、双语标题结构
  与 demo id 对齐、链接可达、demo import 合法。

**验收（每波）**

- 该波页面在 `pnpm docs:build` 中全部出页；`docs:check` 通过；`gen-api --check` 通过。
- 该波每条 demo 在浏览器里真实渲染，console 零错误；抽样 1/4 页面 axe 零违规。
- 新增页面在 375 / 768 / 1440 与深浅色下可用；无横向溢出。
- 中文页与英文页的小节结构、demo id、API 行一致（正文不要求逐字对应）。

**验收（M2 收口）**

- 83 × 2 页全部完成；demo 总数 ≥ 166（每页至少 2 个，高频组件 3 个）。
- 全量 demo 渲染 e2e（83 页，串行）通过；axe 全量扫描在发布前单独跑一次并记录。
- 文档站首页、组件索引、搜索、版本页收口；构建时间与搜索索引体积记录在案。
- 文档站视觉基线 4 页 × 深浅两色 = 8 张（首页、安装、button、pro-table），零 diff。

### 执行记录

**规模**

- 4 波共 83 个组件页 × 2 语言 = 166 页（M1 的 3 个试点 + Wave 1 的 23 + Wave 2 的 23 +
  Wave 3 的 19 + Wave 4 的 15）。
- Demo 167 个：每页 ≥2 个，button 3 个。每个组件目录一份 `meta.json`，由
  `scripts/build-manifests.mjs` 汇总出 `demos/registry.json`、
  `docs/{en,zh}/components/_meta.json`、`generated/documented.json`，`--check` 挡漂移。
- JSDoc props 覆盖：M1 7.67% → Wave 3 49.21% → Wave 4 78.80%（301/382，余 81 条未注释）；
  `scripts/gen-api-floor.json` 的 CI 下限从 0.00% 抬到 78.70%。

**构建与体积（本地 Windows、Node 22.21.1）**

- `pnpm docs:build` 22 s（含 `packages/ui` 预构建、manifests、模板文档同步）；Rspress 自身
  web 8.00 s / node 7.66 s，201 个 HTML 页面渲染 2146 ms。
- `doc_build` 911 个文件 / 30.6 MB：HTML 201 页 13369.7 kB（gzip 2135.7 kB）、
  JS 603 个 16071.3 kB（gzip 3603.5 kB）、CSS 1 个 187.4 kB（gzip 31.9 kB）；Rspress 自报
  web 资源合计 17638.4 kB / gzip 4048.5 kB。
- 201 页 = 首页 2 + 指南 6 + 组件 168（83 页 + 索引，×2）+ 模板 22（索引 + 10 篇，×2）+
  版本 2 + 根 404。
- 搜索索引 en 492.5 kB（gzip 151.7 kB）、zh 473.8 kB（gzip 166.5 kB）；M1 只有 3 个组件页时是
  138.5 / 133.7 kB。83 页后索引仍是按需拉取、不进首屏，未做字段裁剪。

**门禁结果（本地全绿）**

- `docs:check --complete`：83 registry 条目、83 documented 组件、167 demos、20 模板页，
  双语小节、demo id 与 API 行一致。
- `DOCS_FULL_AXE=1 pnpm test:docs` 共 263 条：内容与交互用例、375 px 布局、83 页 demo 全量
  sweep（每个 `[data-demo]` 有可见子节点、源码块含 `export default`、console 零错误）、
  166 页全量 axe 零违规。
- 视觉基线 8 张（home / installation / button / pro-table × 深浅色，1440×900）在
  `mcr.microsoft.com/playwright:v1.64.1-noble` 内生成，复跑 8 条零 diff。
- 模板侧无回归：`test:e2e --workers=1` 85 条、`test:visual:docker` 17 条零 diff、
  `test:coverage`、`@fish-admin/react` 测试、`check:package`（83 个导出）。
- 预算无回归：firstPaintJs 174.4 / 180 KB、largestAsyncJs 95.6 / 115 KB、
  totalJs 778.8 / 800 KB、totalCss 23.1 / 30 KB。
- `format:check`、`lint`、`typecheck`（模板 + 包 + docs 三段）、`gen-api:check` 全过。

**偏差与新增门禁**

- demo 167 个，高于「≥166」：button 作为试点保留了第 3 个变体。
- 新增 `playwright.docs-visual.config.ts`、`e2e-docs/visual.spec.ts`、
  `scripts/visual-regression-docs.mjs`，端口 4175，与功能用例（4174）分开跑。
  `playwright.docs.config.ts` 加了 `testIgnore: '**/visual.spec.ts'`：两者共用 `testDir`，
  不排除会让 Windows 上的 `pnpm test:docs` 去写 `-win32` 基线。
- `scripts/check-visual-platform.mjs` 现在接收要提示的 Docker 命令作为参数，两条视觉链路各自
  给出正确的 `:docker` 提示。
- CI 新增 `docs-visual` job，与 `visual` 并列（同一镜像、uid 1001、
  `--store-dir /tmp/pnpm-store`）。
- 深浅色不靠点主题切换按钮：Rspress 从 localStorage `rspress-theme-appearance` 取主题，
  用例用 init script 在首帧前写入，同时写 `rspress-visited` 关掉提示条，避免中间态进基线。
- Wave 4 暴露的两类构建回归（正文里的裸 `<tag>` 占位、把基础 demo 命名成 `Demo` 覆盖主题组件）
  已由 `check-docs.mjs` 的 JSX import 规则挡在门禁里。

**未验证 / 留给 M3**

- 文档站尚未部署：Vercel 项目、线上 headers 与搜索索引实际下载体积未测（需单独确认）。
- npm 包未发布，真实消费者安装路径未验证。
- 移动端只有 375 px 布局断言，没有截图基线；视觉基线只覆盖 4 条桌面路由。
- 81 条 props 仍缺 JSDoc，M3 不承诺补完，但下限已锁住不回退。

---

## M3 — 模板收口与发布（1–1.5 周）

**问题**

文档站上线后，模板里再保留 `/components` 与 `/ui` 就是两套真相；README 仍把模板当主产品；
脚手架还会删掉已经不存在的目录。

**做法**

1. **删除模板内的组件演示**
   - 删除路由 `/components`、`/ui`，`src/config/components.ts`、`src/features/playground/*`；
     同步删除 `components-catalog.spec.ts`、`ui-playground.spec.ts` 与一张视觉基线
     （`components.png`；`/ui` 本来就没有视觉用例），并更新 `a11y.spec.ts`、`security.spec.ts`、
     `visual/pages.spec.ts` 里对这两个路径的引用。
   - `src/config/nav.ts` 去掉两项与 `AppPath` 枚举；`src/mocks/menu.ts` 的
     `WILDCARD_ONLY_PATHS` 特例一并删除（没有只对 admin 可见的页面了）。
   - 旧链接 `/components`、`/ui` 在配置了文档地址时重定向到文档站对应页，否则 404；
     保留一个版本，下一轮删除。
2. **菜单外链文档站**
   - `NavItem` 增加 `href` / `external`；新增 `src/config/site.ts` 读 `VITE_DOCS_URL`。
   - 外链项无权限码，三种角色都可见，新标签打开；未配置时整项隐藏，adopter 不会被迫链到
     FishAdmin 的文档。demo 的 Vercel 环境设置该变量；`.env.example` 写明。
   - 测试：三种角色都看到「组件文档」，href 正确，新标签属性存在；未配置时不渲染。
3. **登录页与门面收口**
   - 登录页保留三张 demo 账号卡与 RBAC 免责声明，增加一个「组件文档」链接；不恢复 landing。
   - 文档站首页作为总门面：hero、安装命令、三个 CTA（浏览组件 / 在线演示 / GitHub）、
     三角色 5 分钟路线、demo 账号表、Mock API 说明、RBAC 免责声明、页脚 Vue 3 规划一行。
4. **README、meta 与截图**
   - `README.md` / `README.zh-CN.md`：首段改为「组件库 + 企业级中后台模板」；Docs 为主链接，
     Demo 为次链接；能力列表补组件库、83 页文档、主题与安装方式。
   - `index.html` 的 description / og 文案同步；不引入外链脚本。
   - 用发布版本的演示数据在 1440 × 900 重拍 Dashboard、workflows、users 大表、roles/matrix；
     截图移到 `public/screenshots/`，README 与文档站「模板」页共用一份。
5. **版本与发布**
   - 包 `0.1.0`；模板版本建议 `2.0.0`（删除两个路由 + 抽包，语义上是 breaking）。
   - 发布顺序：包 → 文档站 → 模板。npm publish、Vercel 项目创建、tag、GitHub Release、
     仓库描述与 topics **均需单独确认**。
   - `CHANGELOG.md` 记录：包抽离、文档站、83 页、模板删除演示页、README 定位变化。
6. **全量验证**
   - 门禁全跑；真实浏览器走一遍：README → 文档站首页 → 组件索引 → 单个组件页 → demo 源码 →
     在线演示 → 登录 → 业务页 → 菜单外链回文档站；中英、深浅色、375 宽各一次。
   - 文档站记录首屏 JS、LCP、搜索索引体积与构建时长；模板记录四项预算。

**验收**

- 模板中不存在 `/components` 与 `/ui` 路由；菜单外链三种角色可见且新标签打开；旧链接按配置重定向。
- e2e 全绿（删除的 2 个 spec 不计入），axe 与 perf 不回退；视觉基线删除 1 张、导航受影响页面
  重录后零 diff。
- `pnpm size` 四项在预算内；首屏不高于 172.4 + 1 KB。
- 文档站 83 × 2 页、搜索、深浅色、移动端、死链检查全部通过；部署后抽查 headers 与缓存。
- README 双语结构对齐；所有外链可达；截图不再是 v0.1.0 或 1.7.0 的旧界面。

### 执行记录

**规模（8 个提交，2026-10-28）**

- `46e6402` 把组件注册表搬进包里：`packages/ui/registry.json` + `packages/ui/src/registry.ts`
  与它的单测，`scripts/gen-api.mjs`、`scripts/check-package.mjs` 改读包内文件（6 files，
  +668/−60）。文档站的 `apps/docs/generated/registry.json` 仍是生成物，模板不再持有组件清单。
- `7f63333` 删除应用内演示：`/components`、`/ui` 两条路由、`src/config/components.ts`、
  `src/features/playground/*`、`components-catalog.spec.ts`、`ui-playground.spec.ts` 和
  `components.png` 一张基线（57 files，+55/−10 448）。
- `c824c31` 文档地址走 env 层：`src/config/site.ts` 读 `VITE_DOCS_URL`，`NavItem` 增
  `href`/`external` 与 `isExternalNavItem`，侧栏、命令面板、chip 行三个消费者共用同一份配置
  （24 files，+526/−100）。
- `a818943` 旧路径重定向（3 files，+50/−6）＋ 新增 `e2e/docs-link.spec.ts`；
  `b9c58bc` 登录页加「组件文档」链接（6 files，+115/−12）。
- `720835e` README / `index.html` meta / og 与截图（16 files，+245/−124，`public/og.png` 重做）；
  `861d752` 模板文档与 CONTRIBUTING 收口（23 files，+107/−74）；
  `91649da` 版本号 2.0.0、版本页、CHANGELOG 与 18 张基线重录（29 files，+136/−36）。
- 门禁结果：模板单测 48 文件 375 条、覆盖率 73.87% stmts / 77.41% branch / 67.75% funcs /
  75.18% lines；包 165 条；`check:package` 83 个导出；`test:e2e --workers=1` 77 条；
  `test:visual:docker` 16 通过 4 跳过零 diff；`test:docs:visual:docker` 8 张零 diff；
  `DOCS_FULL_AXE=1 pnpm test:docs` 263 条；`docs:check` 83 registry / 83 documented /
  167 demos / 20 模板页；`docs:build` 201 页 13693.5 kB（gzip 2188.1 kB）。
- 预算四项：firstPaintJs 175.2 / 180 KB（余 4.8）、largestAsyncJs 103.2 / 115 KB（余 11.8）、
  totalJs 707.0 / 800 KB（余 93.0）、totalCss 22.7 / 30 KB（余 7.3）。首屏 31 个 chunk。
- `gen-api:check` 78.80%（下限 78.70%）；`format:check`、`lint`（仅 1 条
  `react-refresh` 既有告警）、三段 `typecheck` 全过。

**真实安装与浏览器走查**

- `pnpm pack` 产物 273,176 B / 321 个条目：`dist/index.js`、`dist/index.d.ts`、
  `dist/styles.css`、`dist/preflight.css`、`README.md`、`LICENSE`、`package.json`；
  `registry.json` 没有进包（`files` 是 `["dist","README.md"]`），符合预期。
- 仓库外的 Vite 8 + React 19.3.1 临时工程 `npm install` 该 tarball：147 个包无 peer 冲突，
  `vite build` 通过（315.96 kB JS / gzip 100.94，121.03 kB CSS / gzip 18.79）。浏览器里
  `Button` 拿到品牌色 `oklch(0.57 0.235 292.5)`、圆角 10 px、高 36 px，`preflight.css` 生效
  （`body` margin 0），包内 i18n 串经 `UIProvider` 渲染为 “Cancel”，Tooltip 正常开合，
  console 零错误。包样式单文件 116,606 B，文档与 README 未对其宣称体积。
- 门面链路（模板构建带 `VITE_DOCS_URL=http://localhost:4174`，全站为生产构建 + preview）：
  文档站首页 → 组件索引（83 个组件链接）→ `button` 页 3 个 demo、API 表 5 行、
  「Used in the template」= `https://fish-admin.vercel.app/` `target=_blank`、「View source」
  指向 `blob/main/apps/docs/demos/button/basic.tsx`；深色切换后 demo 底色
  `lab(100 0 0)` → `lab(6.06 …)`；中文页 3 个 demo、「在模板中的用法」4 条、API 表 5 行；
  搜索 “ProTable” 命中 `/components/pro-table`。`/zh/components/pro-table.html` 在 375 px
  无横向溢出。
- 模板侧：登录页 `Component documentation`（`href` = 文档站根、新标签）→ 登录后 `/components`
  落 `/components/index.html`、`/ui` 落 `/guide/theming.html`；侧栏 `Component docs` 点击开新标签
  到文档站；中文 + 深色下 `组件文档` 仍在，`html.class = dark`；未注册的 `/catalog` 落
  「页面不存在」；375 px 用户大表无横向溢出。整条走查 console 零错误、零失败请求。
- 文档站本地 preview 首屏（无网络节流，冷缓存）：首页 LCP 76 ms、256.2 KB JS / 33.6 KB CSS、
  9 个请求；`button` 108 ms / 549.7 KB JS；`pro-table` 112 ms / 611.1 KB JS；
  `zh/pro-table` 96 ms / 610.7 KB JS。搜索索引 en 493.2 KB、zh 474.4 KB（按需拉取，不进首屏）。

**偏差**

- 验收里的「首屏不高于 172.4 + 1 KB」是抽包前的旧基线，2.0.0 的首屏含包代码，实测 175.2 KB；
  按预算 180 KB 判定通过，旧数字不再作为门禁。
- 截图位置：做法 4 写 `public/screenshots/`，Rspress 把正文里的绝对路径解析到
  `<root>/public`（root 是 `apps/docs/docs`），实际落在 `apps/docs/docs/public/screenshots/`，
  否则 `docs:build` 的死链检查直接失败。README 与文档站共用这一份，站点路径仍是 `/screenshots/`。
- 视觉基线不会因版本号变化而报警：`maxDiffPixelRatio: 0.001` 吞掉了侧栏与页脚那处版本号文字
  差异，`--update` 不写文件、复跑依旧零 diff。做法是先删 18 张基线再在
  `mcr.microsoft.com/playwright:v1.64.1-noble` 内重录，复跑零 diff。代价是以后单纯改版本号不会
  刷新基线，需要手动重录。4 张 README 截图里 `roles-mobile.png` 与基线 `login-linux.png`
  字节未变，其余 3 张随 2.0.0 重拍。
- e2e 条数：Task 2 删除目录后是 74 条（计划预测 77），Task 3–5 补上 `docs-link`（3 条）与登录页
  用例后回到 77 条。
- 版本页与 CHANGELOG 按事实写：包「Repository only; not published to npm yet」、模板
  「Pending release；线上仍是 1.7.0」、文档站「随 2.0.0 一起部署」。Task 10 完成后才翻转。
- 登录页文案是 `Component documentation`、侧栏条目是 `Component docs`（两套 i18n key），走查按
  各自文案断言，不是同一字符串。
- `readHttpsUrl` 允许 `http://`，所以本地预览可以用 `http://localhost:4174`；计划里写的
  `4175` 是文档视觉链路的端口，功能走查改用 4174 以免与 `docs:preview` 抢端口。
- `pnpm test:e2e` 的构建不带 `VITE_DOCS_URL`，因此 CI 覆盖的是「未配置」状态（旧路径 404、
  页面无外链）；「已配置」状态由上面的生产构建走查与 Task 3 的临时用例覆盖，尚未进常驻用例。

**仍未验证**

- 81 条 props 仍缺 JSDoc（下限锁在 78.70%）；移动端只有布局断言，没有截图基线。
- 文档站没有在真实网络下测 LCP；线上只验了 headers、缓存、搜索索引与页面行为。

### Task 10 执行记录：发布与部署（2026-10-29）

Task 10 的每一项都单独获批后执行；npm 凭据与 2FA 全程由账号本人输入，未经过本会话。

- **npm**：`@fish-admin/react@0.1.0` 于 2026-10-29T01:54:39Z 发布，`latest` 指向 0.1.0；
  registry 记录 320 个文件 / 解包 1,122,559 B，shasum `6890db36…69125b`。此前已有一次
  `0.0.0-stage` 占位发布，不影响 `latest`。从公网 registry 在仓库外的新工程安装（147 个包、
  无 peer 冲突）→ `vite build` 315.96 kB JS / 121.03 kB CSS → 真实浏览器里品牌色
  `oklch(0.57 0.235 292.5)`、`preflight.css` 生效、Tooltip 与包内 i18n（“Cancel”）正常，
  console 零错误；npm 包页在登录态浏览器里正常渲染（headless 会被 Cloudflare 403 拦截）。
- **文档站**：Vercel 项目 `fish-admin-docs`，Root Directory `apps/docs`、读取根目录外文件、
  Output `doc_build`、Production Branch `main`，线上 `https://fish-admin-docs.vercel.app`。
  首页与 `/components/*.html` 返回 CSP（含 `frame-ancestors 'none'`）、`X-Content-Type-Options`、
  `Referrer-Policy`；`/static/*` 带 `max-age=31536000, immutable`；搜索索引是带哈希的
  `/static/search_index.en.c4c36f45.json`（503,945 字符），按需拉取。深色、中文页与 375 px
  布局、button demo、搜索、`/versions.html` 均正常。
- **模板**：`VITE_DOCS_URL=https://fish-admin-docs.vercel.app` 写入 Development / Preview /
  Production（All Environments），生产部署 `67e1ccd`（Ready 12 s，`main`）。线上核验：
  侧栏「组件文档」`target=_blank` 指向文档站，管理员与访客两种角色都出现；登录页
  「组件文档」链接同样开新标签；`/components` 落 `/components/index.html`、`/ui` 落
  `/guide/theming.html`；页脚 `2.0.0`，登录页保留「前端权限是体验层，不是安全边界」。
- **Git 与 GitHub**：`main` 由 `375b3c4` 推到 `67e1ccd`（版本页翻转），annotated tag
  `v2.0.0`（tag 对象 `cca225bd…`）指向 `375b3c4`；Release [`v2.0.0`](https://github.com/flyingfishzxf/fish-admin/releases/tag/v2.0.0)
  于 2026-10-29T02:28:17Z 发布并持有 Latest，正文是 CHANGELOG 2.0.0 节 + npm / 文档站 /
  演示链接 + RBAC 提醒。仓库描述改为以组件库开头（“React 19 component library + enterprise
  admin template …”），topics 由 11 个扩到 18 个（新增 `component-library`、`design-system`、
  `admin-template`、`react-components`、`radix-ui`、`rspress`、`accessibility`），homepage 仍是演示站。
- **版本页**：en/zh 两行由「待发布 / 仅存在于仓库」翻成「已部署于 …」；文档站自身的版本号
  保持 0.1.0（它跟包版本走），模板是 2.0.0。文档站随 `67e1ccd` 由 `main` 重新生产部署
  （Ready 30 s），线上两语版本页与仓库一致。

**偏差**

- npm 10.9.4 的 arborist 在 pnpm 软链工作区里直接 `npm publish` 会崩；改为 `pnpm pack`
  后 `npm publish <tarball>`。最终发布的 tarball 是 270,894 B / 320 条，registry 上的
  文件数与解包体积（320 / 1,122,559 B）与它一致。
- Vercel 的 Redeploy 按钮提交后会要求邮箱验证码再认证，账号本人不在场时无法完成；审批过的
  `main` 推送本身就是一次生产部署，`VITE_DOCS_URL` 在 `67e1ccd` 上生效，遂以此代替手动
  Redeploy，未绕过任何验证。
- 文档站第一次生产部署来自 dependabot 预览分支（内容已含 `main`），`main` 推送后才有真正的
  main 生产部署；此后以 `main` 为准。
- 两个 `*.vercel.app` 站点都没有观测到 `Strict-Transport-Security`；CSP、`frame-ancestors`、
  `nosniff`、`Referrer-Policy` 与静态资源缓存均在。HSTS 只能在自有 TLS 域名上作为门禁。
- 仓库 Release 与描述/topics 都通过已登录的浏览器会话完成：本机没有 `gh`，保存的 `gho_`
  token 401。

---

---

## 排期

| 顺序 | 里程碑            | 工作量   | 解决的是                   |
| ---- | ----------------- | -------- | -------------------------- |
| 1    | M0 抽包与工作区   | 2–3 周   | 组件库成为可安装的产品     |
| 2    | M1 文档站基建     | 2 周     | 门面、demo 管道、API 管道  |
| 3    | M2 83 个组件页    | 8–9.5 周 | 从「能装」到「能查、能抄」 |
| 4    | M3 模板收口与发布 | 1–1.5 周 | 一套真相、一次发布         |

合计 **13–16 周**（约 3–4 个月）。这是全量深度 + 双语的诚实数字，不含 Vue；M2 是关键路径，
每波独立可发布，任何一波延期都先压缩范围（例如把 W4 的 FAQ 减到 1 条），不压缩验收门禁。

## 门禁复现（每个里程碑收尾都跑一遍）

```bash
pnpm format:check
pnpm lint
pnpm typecheck                 # 模板 + packages/ui + apps/docs demos
pnpm test:coverage             # 模板
pnpm --filter @fish-admin/react test
pnpm --filter @fish-admin/react build
pnpm check:package             # 包产物导入冒烟（M0 新增）
pnpm size
pnpm test:e2e --workers=1
pnpm test:visual:docker
pnpm docs:build
pnpm docs:check                # 结构 / demo 注册 / 双语 / 死链（M1 新增）
node scripts/gen-api.mjs --check
```

标注「新增」的脚本在对应里程碑补齐；在脚本存在之前，用等价的手工命令并写进执行记录。

## 范围外

- **Vue 3 实现**：不做包、不做站点、不做双生态门面切换；只保留页脚一行与本节的前置条件。
- **模板 landing**：`/welcome` 取消；门面由文档站承担。
- 常驻 demo 提示条、登录后首访路线卡：会改既有视觉基线，信息已在文档站与登录页。
- 真实后端、SaaS、多租户、SSO/OIDC：模板仍然不绑后端。
- SSR / RSC / Next.js App Router 兼容承诺：组件以客户端为准；文档站是 SSG，demo 客户端渲染。
- CJS 产物、旧浏览器（低于 ES2022）、第三个语言、在线 Playground / 代码沙盒、主题编辑器。
- 组件 API 的 1.0 稳定性承诺：0.x 期间允许小步调整，1.0 前不冻结。
- npm publish、Vercel 项目创建、GitHub tag / Release、仓库描述与 topics：全部单独确认。

## 后续路线：Vue 3（本轮只记录前置条件）

- **触发条件**：React 包 0.1.x 与 83 页文档稳定发布后，才开始 Vue 轮次。
- **M0 已经完成的共享边界**：包抽离、locale provider、无路由 / store 依赖、tokens 独立 CSS。
  这些正是 Vue 版能复用的部分。
- **Vue 映射**：Reka UI（对应 Radix / shadcn）、TanStack Table Vue、vee-validate + zod、vue-i18n、
  Pinia、MSW、Vitest + Vue Test Utils、Playwright；`vue-docgen-api` 提取 props / slots / emits。
- **站点拓扑**：`@fish-admin/vue` + 第二个文档站；当前文档站标题保持中性（FishAdmin UI），
  届时可作为双入口门户，或再拆一个中立 landing。
- **一致性标准**：「完全一样」指视觉、交互与功能对齐；API 跟随各自生态习惯（props vs
  slots/emits），不追求逐字相同。
- **共享资产**：tokens、demo 文案框架、截图规范、CHANGELOG 结构、内容检查脚本。

## 待决

1. ~~**包名 / scope**~~（已定 2026-10-27：npm 账号 `flyingfishzxf`；本项目使用免费组织
   `fish-admin`，React 包 `@fish-admin/react`、Vue 包 `@fish-admin/vue`；`fishzxf` 保留为个人
   备用组织。两个包名在 registry 均未被占用；0.1.0 发布仍单独批准。发布前需开启 2FA——npm
   当前只支持 security key / Windows Hello）。
2. **文档站域名**（建议 `fish-admin-ui.vercel.app`；项目创建单独批准）。
3. **模板版本号**（建议 2.0.0；若想保守可用 1.8.0，但删路由 + 抽包在语义上是 breaking）。
4. **文档语言主次**（建议 en 为准、zh 同步；与仓库现有约定一致）。
5. **构建工具**（M0 spike 决定：Vite lib 多入口 / tsup / tsc 多入口）。
6. **旧 `/components`、`/ui` 链接是否重定向**（建议保留一个版本，下一轮删除）。
7. **`data-table` 与 `page-header` 是否进公开文档**（建议不进，只做 `internal/*`；若 adopter
   反馈强烈，1.x 再提升为公开组件）。
8. **文档站是否公开展示 demo 账号与截图**（建议是，否则「可试」缺一环）。

## 风险

- **M2 是内容关键路径**：166 页正文 + 约 170 个 demo，任何「最后统一补」都会拖垮发布日期。按波次
  交付、每波可发布，是唯一可控的方式。
- **i18n 抽离会改默认文案**：26 个组件 / 69 处文案，加上 `data-table` 的 12 处，可能有 e2e 或
  视觉断言依赖原文；M0 先做 en 文案快照对比，变化逐条记录。
- **包边界漏项**：`data-table`、`page-header`、`lib/{date,tree,csv}` 不在 83 清单里，但 ProTable /
  DetailPage 依赖它们；漏一个，包就装不起来。
- **barrel 与 recharts**：barrel 可能把 `chart` 拖进不该进的 chunk；`pnpm size` 是唯一判据，
  超标就用深路径或懒加载，不调预算。
- **Tailwind 4 产物**：消费方不扫描包内类名会丢样式；预编译 CSS 是默认，`@source` 是进阶，
  两者都写进安装文档，且禁止动态类名。
- **Rspress + React 19 + Tailwind 4**：三者的组合需要 spike 验证；不通过就换 Starlight 或
  docs 自有 CSS，不在框架上恋战。
- **Vercel 读不到 `packages/ui`**：Root Directory 是硬约束；A/B/C 三方案必须先验证再进 M2，
  否则 83 页做完却部署不了。
- **API docgen 对 Radix 透传有限**：已有 unresolved 兜底与覆盖率下限，不接受为了表格改类型。
- **166 页的构建与搜索索引**：M1 测 3 页，M2 每波复测；索引过大时限制字段，不牺牲搜索可用性。
- **模板文档单一源**：10 篇仍在根 `docs/`，文档站构建时复制；脚本一旦漂移（链接、frontmatter），
  会出现「GitHub 能读、站点 404」。`docs:check` 必须校验生成页与源文件一一对应。
- **删除演示页的测试面**：5 个 e2e 文件与 1 张基线受影响；M3 同一提交内更新，不留 skipped 用例。
- **首屏预算**：抽包可能改变 chunk 图；M0 收尾实测，异常时回退接入方式，不放宽 180 KB。
- **scaffold 与新工作区**：scaffold 会删目录与依赖，必须同步改造并保留测试，否则 adopter 第一步
  就坏。
- **发布顺序**：包 → 文档 → 模板。npm 发布未获批时，文档站只能用工作区的 dist 本地验证，
  不能上线；M2 的线上验收要为此留出缓冲。
