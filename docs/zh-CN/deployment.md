# 部署

FishAdmin 构建为静态文件。演示构建还会附带 Service Worker（MSW），因此对托管环境有额外要求。按使用场景选择下面的方式。

## 构建命令

| 命令              | Mock API                                           | 用途                    |
| ----------------- | -------------------------------------------------- | ----------------------- |
| `pnpm dev`        | 默认开启                                           | 无后端时的本地开发      |
| `pnpm build`      | 关闭（除非构建时显式设置 `VITE_ENABLE_MOCK=true`） | 对接真实后端的生产环境  |
| `pnpm build:demo` | 开启                                               | 公开演示与 Preview 部署 |
| `pnpm preview`    | 预览最近一次构建                                   | 本地检查生产产物        |

`pnpm build` 会先执行 `tsc --noEmit`，类型错误会直接导致构建失败。

### 环境变量

Vite 在构建时内联变量。请在托管平台的构建设置或 `.env.*` 文件中配置；修改变量后需要重新构建。

仓库只跟踪 [`.env.example`](../../.env.example)。`.env.development`、`.env.production` 已被 git 忽略且不再必要——上述默认值来自 `src/config/env.ts`，它读取变量后按 Vite 模式兜底。想把值同时在开发与构建上固定，就复制该示例为 `.env.local`。

| 变量                | 示例                      | 说明                                                                |
| ------------------- | ------------------------- | ------------------------------------------------------------------- |
| `VITE_ENABLE_MOCK`  | `true`                    | 在浏览器中启动 MSW；不设置时 dev 开、构建关。切勿在真实数据环境开启 |
| `VITE_API_BASE_URL` | `https://api.example.com` | 默认 `/api`                                                         |
| `VITE_MOCK_LATENCY` | `300`                     | 仅 Mock 使用的模拟延迟                                              |

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

多阶段 [`Dockerfile`](../../Dockerfile) 用 Node 24 构建，产物由 nginx 提供；运行时容器以 uid 101 监听 8080，既不用 root，也不占特权端口。两个阶段的基础镜像都按 digest 固定，重建不会悄悄换掉 Node 或 nginx 版本。

直接 `docker build` 得到的是「仅 API」镜像：`VITE_ENABLE_MOCK` 默认为 `false`，`src/main.tsx` 里的 mock 分支会被折叠掉，`dist/` 中不存在 MSW chunk，连从 `public/` 复制出去的 worker 脚本也会被移除。

```bash
docker build -t fish-admin .
docker run --rm -p 8080:8080 fish-admin
```

演示版走 Compose，因为 `docker-compose.yml` 显式传入了这个开关：

```bash
docker compose up --build
# → http://localhost:8080
```

构建参数：

| 参数                | 默认值  | 说明                     |
| ------------------- | ------- | ------------------------ |
| `VITE_ENABLE_MOCK`  | `false` | 设为 `true` 得到演示镜像 |
| `VITE_API_BASE_URL` | `/api`  | 打包进产物的基地址       |
| `VITE_MOCK_LATENCY` | `300`   | Mock 延迟                |

不用 Compose 构建演示镜像：

```bash
docker build \
  --build-arg VITE_ENABLE_MOCK=true \
  -t fish-admin-demo .
```

构建指向自有服务端的仅 API 镜像：

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t fish-admin .
```

[`nginx.conf`](../../nginx.conf) 完成五件事：

- 监听 `8080`，非特权镜像里的 uid 101 才能绑定。
- 用 `try_files $uri $uri/ /index.html` 支持 SPA 深链接。
- 以 `no-cache` 提供 `/mockServiceWorker.js`，确保浏览器获取新的 worker。
- 因为 Vite 文件名带指纹，对 `/assets/` 使用不可变长缓存。
- 开启 gzip，并在每个 `location` 里 `include /etc/nginx/snippets/security-headers.conf`。

最后一条不是装饰。nginx 不会把上层的 `add_header` 继承到自己声明过 `add_header` 的 `location`，所以写在 `server` 层的响应头会在 `/assets/` 和几条 `no-cache` 路由上悄悄消失。这段 snippet 放在 `/etc/nginx/snippets/` 而不是 `conf.d/`，因为 `conf.d/*.conf` 是被 include 进 `http` 上下文的；每一行都以 `always` 结尾，404 因此与 200 携带同样的头。

`GET /healthz` 返回 `ok` 且关闭访问日志，镜像的 `HEALTHCHECK` 就是打这个地址，因此 `docker ps` 显示的健康状态真实可用。

## 任意静态托管

把 `dist/` 上传到托管平台，并配置：

1. **SPA 回退**——未知路径以状态码 200 返回 `index.html`。
2. **Service Worker**——从根路径提供 `/mockServiceWorker.js`，响应头为 `Cache-Control: no-cache`。若部署在子路径，MSW 使用 `import.meta.env.BASE_URL` 启动，因此需在 `vite.config.ts` 中设置匹配的 `base`。
3. **静态资源**——`/assets/` 下带哈希的文件可缓存一年。
4. **MIME 类型**——worker 必须以 `text/javascript` 返回（不能是 `text/html`）。回退配置错误导致 worker 返回 HTML 时，Mock 会在控制台给出明确报错。

### 子路径部署

如果应用位于 `https://example.com/admin/`，请在 `vite.config.ts` 中设置 `base: '/admin/'` 并重新构建，同时确保托管平台把 `/admin/*` 回退到 `/admin/index.html`。TanStack Router 的 basepath 使用同一个值，worker 会从 `/admin/mockServiceWorker.js` 获取。

## 打包产物结构

`autoCodeSplitting` 让每个路由都有独立的 chunk，图表库、`/components` 组件目录、`/ui` 组件演练场与 Mock API 只在真正被用到时才发起请求。`pnpm size` 正是按这个边界做门禁的；下表数字由预算脚本测得（gzip level 9），取自 v1.6.0。

| 指标                                | `pnpm build`  | `pnpm build:demo` | 预算         |
| ----------------------------------- | ------------- | ----------------- | ------------ |
| 首屏：入口 + `modulepreload` + 外壳 | 165.5 kB      | 166.2 kB          | 180 kB       |
| 入口 chunk `index-*`                | 295 kB (90)   | 301 kB (92)       | 已计入上一行 |
| 最大懒加载 chunk `chart-*`          | 322 kB (96)   | 322 kB (96)       | 115 kB       |
| 全部 JavaScript chunk               | 751 kB        | 1,083 kB          | 800 kB       |
| 全部 CSS chunk                      | 145 kB (22.8) | 145 kB (22.8)     | 30 kB        |

这张表里有两处是有意为之的。

其一，首屏预算统计的是入口 chunk、Vite 写进 `dist/index.html` 的每一个 `modulepreload` chunk，再加上首屏阻塞的 `/theme-bootstrap.js` 外壳脚本——v1.6.0 一共 25 个 chunk，浏览器在首次绘制前会把它们全部下载。入口文件本身只有 90 kB，如果只对它设预算，真实首屏成本偷偷涨掉 70 kB 也照样能过。CSS 预算同理，也把 `<link>` 引入的 `/boot.css` 算在内。

其二，预算只作用于 `pnpm build`，不作用于演示构建。演示构建会多出 `browser-*`（907 kB，gzip 327 —— MSW 加上预置的业务数据库种子），单这一块就会同时撑破「最大 chunk」与「JS 总量」两条预算。两种构建的首屏完全一致，因为这个 chunk 是懒加载的，而 `src/main.tsx` 只在 mock 开关打开时 import 它：显式设置的 `VITE_ENABLE_MOCK` 优先，未设置时 dev 开、构建关。`pnpm build` 会把整条分支摇掉，并让 `vite.config.ts` 从产物中删掉 `mockServiceWorker.js`，因此 `ls dist/assets | grep browser`、`ls dist | grep mock` 与 `grep -r mockServiceWorker dist` 都是空的。演示构建里 Vite 仍会为它打印 chunk 体积警告，这属于预期。

其余较大的懒加载 chunk 也在意料之中：`chart-*` 是 recharts，由工作台、`/reports` 以及 `/components` 里的图表演示共用；组件目录与演练场各自拆成独立的演示 chunk。打开 `/users` 时它们一个都不会被下载。

上线前请执行 `pnpm build && pnpm preview`，并检查 Network 面板：首屏只应加载 shell、auth 与 locale 这几类 chunk。

## 在生产环境关闭 Mock

1. 构建时不要设置 `VITE_ENABLE_MOCK`——`pnpm build` 与默认的 `docker build` 都会把它解析为 `false`。如果此前用某个 `.env*` 文件把它固定成 `true`，需要显式改掉。
2. 设置 `VITE_API_BASE_URL`。
3. `dist/` 本身已不含 mock 代码：开关关闭时 `vite.config.ts` 会删除复制出来的 `mockServiceWorker.js`。只有想把源码一并清掉时，才需要删除 `src/mocks` 和 `src/main.tsx` 里的 mock 代码块。

开关关闭时，`main.tsx` 不会 import mock 模块，MSW 与 Faker 不会进入用户下载的产物。

## 缓存与更新

- 带哈希的资源：`Cache-Control: public, max-age=31536000, immutable`。
- `index.html`：`no-cache`，确保新版本及时生效。
- `/mockServiceWorker.js`：`no-cache`。浏览器在导航时也会检查 worker 更新；该文件很少变化，但过期 worker 在开发中容易造成困惑。
- 开启演示的版本部署后如需强制更新，可在 DevTools → Application → Service Workers 中点击 Update。

## 安全响应头

内置 nginx 配置里的头由 [`security-headers.conf`](../../security-headers.conf) 提供，四条 `location` 共用同一段 snippet。响应头的唯一定义源是 [`src/config/security-headers.ts`](../../src/config/security-headers.ts)：`vite preview` 从那里读取，nginx snippet 与 [`vercel.json`](../../vercel.json) 的 `/(.*)` 规则写出同样的字面值，`e2e/security.spec.ts` 负责校验送达结果。每条指令的含义、两处妥协（`style-src 'unsafe-inline'` 与 `img-src data: blob:`）以及 `script-src 'self'` 改掉了哪些代码，见 [docs/zh-CN/security-headers.md](security-headers.md)。

HSTS 是唯一的例外：容器提供的是明文 HTTP，所以 nginx 不发这一条，`vercel.json` 只在 TLS 于边缘终止的 Vercel 部署上添加它。

切记：演示的客户端 RBAC **不是**授权机制，权限必须在服务端执行。CSP 约束的是哪些来源可以运行代码，它不做身份认证。

托管的演示还在浏览器中运行 Mock，因此 `/auth/register` 与 `/auth/forgot-password` 会在响应体里直接返回验证令牌和重置令牌，2FA 也使用固定的验证码。对于所有账号都公开的沙箱环境，这是有意为之；真实部署必须通过邮件发送链接、把令牌保留在服务端，并用密钥生成 TOTP 动态码。
