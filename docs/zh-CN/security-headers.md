# 安全响应头

FishAdmin 只有一套响应头策略，而所有能把应用发出去的层都发出完全相同的字节：
`vite preview`（端到端测试驱动的就是它）、容器里的 nginx、以及托管演示用的 Vercel。
[`e2e/security.spec.ts`](../../e2e/security.spec.ts) 会在任何一条路径丢失策略时让构建失败，
所以策略不可能一层一层地各自跑偏。

唯一的事实来源是 [`src/config/security-headers.ts`](../../src/config/security-headers.ts)。
nginx 片段（仓库根目录的 `security-headers.conf`）与 [`vercel.json`](../../vercel.json)
重复同一个字符串，`src/config/security-headers.test.ts` 会在每次 `pnpm test` 时把三者做对比。

## 策略内容

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self' data:; worker-src 'self';
connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';
frame-ancestors 'self'
```

| 指令              | 取值                     | 作用                                                                                                                                     |
| ----------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`     | `'self'`                 | 下面没有点名的指令全部回落到它，新增资源类型默认关闭。                                                                                   |
| `script-src`      | `'self'`                 | 禁止内联脚本与 `eval`。为了这条指令，文档外壳做了改动，见下文。                                                                          |
| `style-src`       | `'self' 'unsafe-inline'` | **有意保留的妥协。** React、Radix、recharts 会持续写 `style` 属性，而 CSP 把它们归在同一指令下；去掉它只会弄坏布局，并不会真的收紧什么。 |
| `img-src`         | `'self' data: blob:`     | **有意保留的妥协。** 头像是 base64 data URL，文件预览与 CSV 导出使用 object URL。                                                        |
| `font-src`        | `'self' data:`           | Inter 由 `@fontsource-variable/inter` 打包，所以本项目只用 `'self'`；留出 `data:` 是给集成方内联子集用的。                               |
| `worker-src`      | `'self'`                 | 保留了 mock 的构建里的 MSW service worker。                                                                                              |
| `connect-src`     | `'self'`                 | `fetch` 与 XHR 的目标。对接后端时把它指向你的 API 源。                                                                                   |
| `object-src`      | `'none'`                 | 不允许插件内容。                                                                                                                         |
| `base-uri`        | `'self'`                 | 阻止被劫持的 `<base>` 改写所有相对 URL。                                                                                                 |
| `form-action`     | `'self'`                 | 登录与搜索表单不能被重定向到外站。                                                                                                       |
| `frame-ancestors` | `'self'`                 | 防点击劫持；`X-Frame-Options: SAMEORIGIN` 是给不支持它的旧浏览器的配套。                                                                 |

随之一同发出的还有 `X-Content-Type-Options: nosniff`、
`Referrer-Policy: strict-origin-when-cross-origin` 和
`Permissions-Policy: camera=(), microphone=(), geolocation=()`。

`Strict-Transport-Security` 只在 Vercel 上加，因为只有那一层有 TLS。
`upgrade-insecure-requests` 是刻意不加的：容器在 localhost 上是纯 http，这条指令会把请求
改写成不会应答的 https 源。

## `script-src 'self'` 逼出来的两处代码改动

如果不改这两处就直接开启这条指令，结果要么是一片白屏，要么是刷屏的违规报告。它们是策略的
组成部分，而不是顺带做的重构。

**文档外壳里没有内联 script 和 style。** 用来防止主题闪动的引导脚本现在是
[`public/theme-bootstrap.js`](../../public/theme-bootstrap.js)，在样式表之前同步加载；
启动屏 CSS 现在是 [`public/boot.css`](../../public/boot.css)。两者放在 `public/` 而不是
`src/`，是因为 Vite 的 dev server 会把 `/src/**.css` 以 `text/javascript` 返回，
指向它的 `<link rel="stylesheet">` 会被浏览器静默拒绝——外壳只在开发环境下变成无样式。
单元测试会断言 `index.html` 里仍然没有内联 `<script>` 或 `<style>`，因为把它们放回去只是
一行改动，却只会在生产环境暴露。

**zod 关闭 JIT 编译器。** zod v4 在首次解析时用 `new Function` 编译校验器。它会捕获 CSP 的
拒绝并退回解释执行的解析器，所以表面上一切正常——但浏览器仍会把每次尝试报告为
`securitypolicyviolation`，这一页的最初版本就从 `assets/schemas-*.js` 里数出了三次。
修法是 [`src/config/validation.ts`](../../src/config/validation.ts)：它调用
`z.config({ jitless: true })` 再重新导出 `z`，所有 schema 都从它导入。ESLint 的
`no-restricted-imports` 规则会拒绝直接 `import { z } from 'zod'`，避免这条退路悄悄回来。
表单校验远没有热到需要惦记编译版的路径。

不要用 `'unsafe-eval'` 去“解决”这类违规。去找出那个库。

## 每一层在哪里设置

| 层                 | 文件                                                       | 由谁校验                                                                                                                  |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `vite preview`     | [`vite.config.ts`](../../vite.config.ts) `preview.headers` | `e2e/security.spec.ts`；另外 70 条端到端测试也全程在这套策略下运行。                                                      |
| `vite dev`         | 不发 CSP                                                   | 也发不了：Vite 的开发 HTML 会注入内联的 React Refresh 前导脚本，`script-src 'self'` 会直接停掉热更新。                    |
| nginx（容器）      | [`nginx.conf`](../../nginx.conf) + `security-headers.conf` | 对运行中的容器 `curl -I`；`add_header` 不会继承进自己声明过 header 的 location，所以每个 location 都要 include 这段片段。 |
| Vercel（托管演示） | [`vercel.json`](../../vercel.json)                         | 本地无法校验。推送之后对部署结果 `curl -I` 确认。                                                                         |

## 自己验证一遍

```bash
pnpm build:demo && pnpm exec vite preview --port 4173 --strictPort &
pnpm exec playwright test e2e/security.spec.ts

docker build -t fish-admin:local .
docker run -d --rm -p 8080:8080 --name fish-admin fish-admin:local
curl -sI http://127.0.0.1:8080/ | grep -iE 'content-security|x-content|x-frame|referrer|permissions'
curl -sI http://127.0.0.1:8080/assets/$(ls dist/assets | head -1) | grep -i content-security
curl -sI http://127.0.0.1:8080/no-such-route | grep -i content-security   # 错误响应也有，靠 `always`
docker rm -f fish-admin
```

## 按自己的部署收紧

1. 把 API 源加进 `connect-src`——`'self' https://api.example.com`——或者让应用与 API 同处
   一个源、由反向代理在前面转发，这样就什么都不用改。
2. 静态资源搬去 CDN 时，把那个源加进 `script-src`、`img-src` 和 `font-src`，并且记住 CDN
   必须提供 `Access-Control-Allow-Origin`，因为模块脚本是带 `crossorigin` 取的。
3. 如果你有收集端，先以 `Content-Security-Policy-Report-Only` 灰度：浏览器只记录违规不做
   拦截，可以在变成故障之前找出某个第三方组件依赖的内联样式。
4. 即便放宽了其他指令，也请保留 `object-src 'none'`、`base-uri 'self'` 与
   `frame-ancestors 'self'`。它们不花成本，堵掉的却是最朴素的那些洞。

响应头保护的是文档本身，它并不回答“谁可以做什么”——那仍然是
[RBAC 的边界说明](rbac.md)，对本模板的每一个页面都成立。

相关：[部署](deployment.md) 讲容器与 Vercel 配置，[架构](architecture.md) 讲启动顺序，
[API 对接](api-integration.md) 讲请求客户端。
