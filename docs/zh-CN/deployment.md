# 部署

FishAdmin 构建为静态文件。演示构建还会附带 Service Worker（MSW），因此对托管环境有额外要求。按使用场景选择下面的方式。

## 构建命令

| 命令              | Mock API                                           | 用途                           |
| ----------------- | -------------------------------------------------- | ------------------------------ |
| `pnpm build`      | 关闭（除非构建时显式设置 `VITE_ENABLE_MOCK=true`） | 对接真实后端的生产环境         |
| `pnpm build:demo` | 开启                                               | 公开演示、Docker、Preview 部署 |
| `pnpm preview`    | 预览最近一次构建                                   | 本地检查生产产物               |

`pnpm build` 会先执行 `tsc --noEmit`，类型错误会直接导致构建失败。

### 环境变量

Vite 在构建时内联变量。请在托管平台的构建设置或 `.env.*` 文件中配置；修改变量后需要重新构建。

| 变量                | 示例                      | 说明                                       |
| ------------------- | ------------------------- | ------------------------------------------ |
| `VITE_ENABLE_MOCK`  | `true`                    | 在浏览器中启动 MSW，切勿在真实数据环境开启 |
| `VITE_API_BASE_URL` | `https://api.example.com` | 默认 `/api`                                |
| `VITE_MOCK_LATENCY` | `300`                     | 仅 Mock 使用的模拟延迟                     |

## Vercel

这套配置已部署在 <https://fish-admin.vercel.app>。仓库自带 [`vercel.json`](../../vercel.json)：

```json
{
  "buildCommand": "pnpm build:demo",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

步骤：

1. 将仓库推送到 GitHub。
2. 在 Vercel 中选择 **Add New → Project** 并导入。Vercel 会自动识别 Vite 与 pnpm，Node 版本保持 24。
3. 部署完成。每个 Pull Request 都会生成 Preview URL。
4. 对接真实后端时，将构建命令改为 `pnpm build`，设置 `VITE_API_BASE_URL`，并在需要时把 API 域名加入 rewrite 规则。
5. 首次部署后，把 [`index.html`](../../index.html) 中相对路径的 `og:image` 与 `twitter:image` 换成自有域名下的绝对地址，并将 `public/og.png` 上传为仓库的社交预览图。

Rewrite 会把未知路径交给 `index.html`，因此 `/users?status=active` 这类深链接可直接访问。静态资源与 `/mockServiceWorker.js` 会在 rewrite 之前直接返回。

`vercel.json` 还设置了 `Cache-Control`：Service Worker 需要重新验证，带哈希的静态资源可长期缓存。这一点很重要——过期的 worker 会在新版本部署后继续提供旧演示。

## Docker

多阶段 [`Dockerfile`](../../Dockerfile) 使用 Node 24 构建、nginx 提供服务。

```bash
docker compose up --build
# → http://localhost:8080
```

不使用 Compose：

```bash
docker build -t fish-admin .
docker run --rm -p 8080:80 fish-admin
```

构建参数：

| 参数                | 默认值 | 说明                         |
| ------------------- | ------ | ---------------------------- |
| `VITE_ENABLE_MOCK`  | `true` | 设为 `false` 得到仅 API 镜像 |
| `VITE_API_BASE_URL` | `/api` | 打包进产物的基地址           |
| `VITE_MOCK_LATENCY` | `300`  | Mock 延迟                    |

对接真实 API 的示例：

```bash
docker build \
  --build-arg VITE_ENABLE_MOCK=false \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t fish-admin .
```

[`nginx.conf`](../../nginx.conf) 完成四件事：

- 用 `try_files $uri $uri/ /index.html` 支持 SPA 深链接。
- 以 `no-cache` 提供 `/mockServiceWorker.js`，确保浏览器获取新的 worker。
- 因为 Vite 文件名带指纹，对 `/assets/` 使用不可变长缓存。
- 开启基础 gzip 与安全响应头。

容器包含针对 `/` 的健康检查。

## 任意静态托管

把 `dist/` 上传到托管平台，并配置：

1. **SPA 回退**——未知路径以状态码 200 返回 `index.html`。
2. **Service Worker**——从根路径提供 `/mockServiceWorker.js`，响应头为 `Cache-Control: no-cache`。若部署在子路径，MSW 使用 `import.meta.env.BASE_URL` 启动，因此需在 `vite.config.ts` 中设置匹配的 `base`。
3. **静态资源**——`/assets/` 下带哈希的文件可缓存一年。
4. **MIME 类型**——worker 必须以 `text/javascript` 返回（不能是 `text/html`）。回退配置错误导致 worker 返回 HTML 时，Mock 会在控制台给出明确报错。

### 子路径部署

如果应用位于 `https://example.com/admin/`，请在 `vite.config.ts` 中设置 `base: '/admin/'` 并重新构建，同时确保托管平台把 `/admin/*` 回退到 `/admin/index.html`。TanStack Router 的 basepath 使用同一个值，worker 会从 `/admin/mockServiceWorker.js` 获取。

## 打包产物结构

`autoCodeSplitting` 让每个路由都有独立的 chunk，因此工作台依赖的图表库、`/components` 组件目录与 `/ui` 组件 playground 只会在打开这些页面时才发起请求。

| Chunk          | 构建类型          | 体积（gzip） | 加载时机                             |
| -------------- | ----------------- | ------------ | ------------------------------------ |
| `index-*`      | `pnpm build`      | 287 kB (89)  | 首屏：外壳、路由、i18n、会话 store   |
| `index-*`      | `pnpm build:demo` | 293 kB (91)  | 同一外壳加 Mock 入口桩               |
| `charts-*`     | 两者都有          | 384 kB (111) | 仅工作台                             |
| `ui-*`         | 两者都有          | 170 kB (47)  | 仅 `/ui` 组件演练场（三个 chunk）    |
| `components-*` | 两者都有          | 102 kB (26)  | 仅 `/components` 组件目录            |
| `browser-*`    | 演示构建          | 883 kB (326) | MSW 与预置数据库，只在演示构建里出现 |

`browser-*` 只存在于演示构建。`src/main.tsx` 中的 import 被 `VITE_ENABLE_MOCK` 包住，因此 `pnpm build`（开关关闭）会把这条分支整体摇掉，不会产出该 chunk —— `ls dist/assets | grep browser` 与 `grep -r mockServiceWorker dist` 都是空的。构建时 Vite 会为它打印 chunk 体积警告，这属于预期：它是一个懒加载、只在演示中出现的 chunk，不会进入对接真实后端的构建产物。

上线前请执行 `pnpm build && pnpm preview`，并检查 Network 面板：首屏只应加载 shell、auth 与 locale 这几类 chunk。

## 在生产环境关闭 Mock

1. 使用 `VITE_ENABLE_MOCK=false` 构建（`pnpm build` 的默认行为）。
2. 设置 `VITE_API_BASE_URL`。
3. 可选：删除 `src/mocks`、`public/mockServiceWorker.js` 以及 `src/main.tsx` 中的 mock 代码，进一步减小包体。

开关关闭时，`main.tsx` 不会 import mock 模块，MSW 与 Faker 不会进入用户下载的产物。

## 缓存与更新

- 带哈希的资源：`Cache-Control: public, max-age=31536000, immutable`。
- `index.html`：`no-cache`，确保新版本及时生效。
- `/mockServiceWorker.js`：`no-cache`。浏览器在导航时也会检查 worker 更新；该文件很少变化，但过期 worker 在开发中容易造成困惑。
- 开启演示的版本部署后如需强制更新，可在 DevTools → Application → Service Workers 中点击 Update。

## 安全响应头

内置的 nginx 配置设置了 `X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy` 与基础的 `Permissions-Policy`。请按你的基础设施调整，并补充适合 API 源的 Content Security Policy。切记：演示的客户端 RBAC **不是**授权机制，权限必须在服务端执行。

托管的演示还在浏览器中运行 Mock，因此 `/auth/register` 与 `/auth/forgot-password` 会在响应体里直接返回验证令牌和重置令牌，2FA 也使用固定的验证码。对于所有账号都公开的沙箱环境，这是有意为之；真实部署必须通过邮件发送链接、把令牌保留在服务端，并用密钥生成 TOTP 动态码。
