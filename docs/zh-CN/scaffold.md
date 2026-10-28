# 脚手架化：变成你自己的应用

FishAdmin 发布的是一个可运行的演示，而不是空白页。`pnpm scaffold` 会把一份 clone 变成你自己产品的外壳：它重写所有身份信息，并可选地删掉你并不打算使用的部分——多余的语言，以及 mock API 和依赖它的 Playwright 测试套件。

两种起点都被支持：

- **先看演示。** `pnpm install && pnpm dev`，把各个页面走一遍，再手动删除不要的东西，不改任何文件名。
- **先脚手架。** 在一份全新的 clone 里执行下面的步骤，从第一个 commit 起就是你自己的名字。

## 执行

脚本要用到模板自己的依赖（用 Prettier 重排改写过的文件），所以先安装再脚手架：

```bash
git clone <repository-url> my-app && cd my-app
pnpm install
pnpm scaffold
```

交互式会依次询问包名、显示名、副标题，然后是 mock API 以及除 `en`（兜底语言，不可删除）之外每种语言的保留与否。全部按默认值回答，就是一次纯改名。

非交互式使用 `--flag=value`（必须带等号）：

| 参数                    | 默认值     | 作用                                             |
| ----------------------- | ---------- | ------------------------------------------------ |
| `--name=<slug>`         | 目录名     | npm 风格的包名，同时作为 `localStorage` 键前缀   |
| `--display-name=<text>` | 由包名推导 | 侧边栏、启动屏、文档标题与 Open Graph 中的品牌名 |
| `--tagline=<text>`      | 保留原值   | 品牌名下方的副标题；不传则保留模板自带的副标题   |
| `--mock=keep\|drop`     | `keep`     | `drop` 移除演示后端以及所有依赖它的东西          |
| `--locales=en,zh-CN`    | 全部保留   | 保留哪些语言，`en` 不可删除                      |
| `--target=<dir>`        | 当前目录   | 要转换的目录                                     |
| `--dry-run`             | —          | 只打印计划，不写任何文件                         |
| `--yes`                 | —          | 全部采用默认值，不再提问                         |
| `--force`               | —          | 在已存在 `.scaffold.json` 的目录中再次执行       |

`--dry-run` 是动手前先读一遍计划的低成本方式。

## 改了什么

**改名** — `package.json` 的 name 与 description、`index.html` 的 `<title>` 与 6 个 Open Graph / Twitter meta、启动屏、`src/lib/document-title.ts` 里的 `APP_NAME` / `APP_TAGLINE`、每种保留语言里的 `app.name` / `app.tagline`、Vite 插件名、Docker Compose 的服务名与镜像名，以及 `fish-admin:` 存储前缀。

最后这个前缀没法靠手工一次改完：有十个文件读写同一批键——在任何模块之前执行的 `public/theme-bootstrap.js`，i18n、auth、theme 三个 store，保存的视图与用户表偏好，mock 数据库，以及两个 spec。少改一个，已保存的主题就会静默读不回来。

**组件目录不再需要裁剪。** `/components` 与 `/ui` 曾经是可选删除项，脚本里对应一个 `catalog` 步骤；它们现在分别搬到了文档站点与 `@fish-admin/react` 包里，模板本身已经不带这两个路由，所以脚本里也没有这一步了。

**`--locales=<list>`** — 删除被舍弃语言的目录、`src/lib/i18n.ts` 中对应的三个 import、`SUPPORTED_LANGUAGES` 条目与 resources 区块，把 `e2e/i18n-theme.spec.ts` 重写为只保留主题断言，并删掉 `e2e/a11y.spec.ts` 里的中文登录审计。只剩一种语言时，语言切换按钮与命令面板中的切换项会自动隐藏。

**`--mock=drop`** — 删除 `src/mocks`、`public/mockServiceWorker.js`、`src/features/settings/api.ts` 与 `src/config/demo.ts`；移除 `src/main.tsx` 的 MSW 启动代码、`src/config/env.ts` 与 `.env.example` 中的 mock 变量、登录页的演示账号卡片、OTP 页的验证码提示、设置页的「重置演示数据」卡片、Dockerfile 与 Compose 中的 `VITE_ENABLE_MOCK`，以及 `msw` / `@faker-js/faker` 两个 devDependency。

由于 Playwright 套件是驱动着演示后端跑的，去掉 mock 就必须连同整个浏览器子系统一起去掉：`e2e`、两个 Playwright 配置、视觉回归脚本、`test:e2e` / `test:visual*` / `perf` 三个 script，以及 `.github/workflows/ci.yml` 末尾的 `e2e` 与 `visual` 两个 job。剩下的 Vitest、ESLint、typecheck、构建与体积预算仍会照常运行。

## 脚手架之后

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

之后需要手工处理：

- `src/config/nav.ts` — 导航就是应用的地图。改掉保留分组的命名，删掉暂时不做的那些演示页面。
- `pnpm test:visual:update`（在 Docker 里执行 `pnpm test:visual:docker`）— 仓库中提交的基线仍然是 FishAdmin 的品牌。
- `docs/` — 模板文档是双语的，描述的是演示应用。可以精简，也可以在熟悉代码期间先留着。
- `.scaffold.json` — 记录本次应用了哪些步骤的标记文件。想再次执行就删掉它，或者加 `--force`。

## 它不会做什么

- 不会执行 `pnpm install`，也不会联网获取任何东西。
- 不会清空演示数据。mock 数据行会保留，这样页面仍然有内容可看；要不要空数据是产品决定，不是命名问题。
- 不会发布任何东西。`package.json` 保持 `"private": true`，因此 `pnpm create fish-admin` 并不存在——先 clone，再脚手架。
- 不会移除安全声明。登录、RBAC 守卫与 mock API 仍然是客户端体验层，页脚也会继续这么写。在把这些复用到真实后端之前，请先读 [rbac.md](rbac.md)。

## 计划为什么不会腐烂

`scripts/scaffold.test.mjs` 随 `pnpm test` 一起运行，用三种形态校验计划里的每一个锚点是否仍能在模板中命中——只改名、去掉多余语言、连 mock API 一起去掉。如果被锚定的文件被重新格式化或重命名而脚本没同步，测试就会失败，并打印出确切的锚点文本和它的命中次数。同一个校验也让 `--dry-run` 有了意义。在已经脚手架化的产物里，这个文件会自动跳过：它的锚点描述的是模板，不是副本。
