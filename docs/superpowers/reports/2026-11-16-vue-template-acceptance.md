# Vue 模板移植验收报告（2026-11-16）

> 范围：Slice 1–14 全部成果 + 整仓库门禁全量复跑。
> 结论：**全部通过**。复跑发现并修复了一个历史遗留缺陷（见「发现」）。
> 基线：主分支 `977a170`；验收后追加 `952f38a`（scaffold 修正）。

## 1. 交付清单

| 部分     | 内容                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 页面     | `NAV_CONTRACT` 16 个导航页全部移植：仪表盘、报表、通知、项目、审批流、文件、用户、部门、角色、权限矩阵、字典、审计日志、集成、资料、安全、设置（含 `/projects/:id`、`/workflows/:id`、`/users/:id`、`/roles/matrix` 等子路由） |
| 功能     | 认证/会话、RBAC、URL 与内存两种列表状态、CSV 导出、批量操作、四步 CSV 导入、文件夹树与上传队列、项目 KPI 与四页签、审批决策面板、用户表列布局（拖拽/调宽/持久化）                                                              |
| 基础设施 | 页面契约审计（16 路由 × axe + 控制台）、壳层无障碍修正、i18n（zh-CN/en）、暗色与五强调色、密体切换、命令面板、页签、离线横幅、导览                                                                                             |

## 2. 门禁矩阵（本报告当日的全量复跑）

### 静态

| 门禁                          | 结果                                      |
| ----------------------------- | ----------------------------------------- |
| `pnpm lint`                   | 通过（仅 `apps/docs/theme` 1 条既有警告） |
| `pnpm format:check`           | 通过                                      |
| `pnpm typecheck`              | 通过（10 个目标）                         |
| `pnpm check:package`          | 83 个组件导出逐一验证                     |
| `pnpm check:maturity`         | 83 组件全部 stable，0 缺测试 / 0 缺 demo  |
| `pnpm check:rtl`              | 0 处未处理物理类；253 个文件              |
| `pnpm check:tokens`           | 48 个 token 声明，无越界重复              |
| `pnpm gen-api:check`          | JSDoc 覆盖 78.80%（下限 78.70%）          |
| `pnpm check:parity:freeze`    | 460 个文件与 manifest 一致                |
| `pnpm check:parity:contract`  | 通过                                      |
| `pnpm check:parity:scenarios` | 6 个场景对应 6 个 pilot                   |

### 单元

| 套件                            | 结果                                |
| ------------------------------- | ----------------------------------- |
| React 应用（`pnpm test`）       | **383 通过 / 50 文件**              |
| Vue 模板（`test:vue-template`） | **644 通过 / 92 文件**              |
| `test:ui`                       | 303 通过                            |
| `test:shared`                   | contracts 9 + i18n 4 + mock 18      |
| `test:vue`                      | `@fish-admin/vue` 38 + parity-vue 4 |
| `test:tokens`                   | 94 通过                             |

### 构建

| 门禁                          | 结果                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `pnpm build`（React，含 tsc） | 通过                                                        |
| `pnpm build:vue-template`     | 通过                                                        |
| `pnpm size`                   | 体积预算通过                                                |
| `pnpm docs:check`             | 83 registry / 83 documented / 167 demos / 24 template pages |
| docs（Rspress）构建           | 通过                                                        |

### 端到端

| 套件                                 | 结果                                              |
| ------------------------------------ | ------------------------------------------------- |
| React 应用 `test:e2e`                | **78 通过**                                       |
| Vue 模板 `test:e2e:vue-template`     | **67 通过**                                       |
| `test:docs`                          | 106 通过 / 166 跳过（平台与语言门控，属套件常态） |
| `test:visual:docker`（应用组件基线） | 16 通过 / 4 跳过                                  |
| `test:docs:visual:docker`            | 180 通过                                          |
| `test:parity:docker`（React 目标）   | **119 通过**                                      |
| `test:parity:vue`（Vue 目标）        | **42 通过**                                       |

### 只读面复核

`git diff` 对以下路径为零差异：`parity/**` 与全部 `*-linux.png`、`src/**`（React 应用）、`packages/{ui,contracts,i18n,mock}/**`、`apps/{parity-vue,docs}/**`、各 `package.json`。`packages/vue` 仅改 `DataTable.vue` 内部（调宽手柄），`index.ts` 与导出面不变。

## 3. 发现与修复

**`--mock=drop` 脚手架留下孤儿脚本**（已修，`952f38a`）。

- 现象：React 单测 `scripts/scaffold.test.mjs` 首次失败——`--mock=drop` 计划删除 `scripts/parity-docker.mjs`，却留下仍然调用它的 `test:parity:vue`，脚手架产物会在运行时报 MODULE_NOT_FOUND。
- 根因：vue pilot 目标切片（`62132b9`）给 `package.json` 加了 `test:parity:vue`，没有同步教会 drop 计划；而这一单测从那时起没再跑过——**本次验收是它第一次在完整矩阵里执行**。
- 修复：drop 计划的脚本清单补上 `test:parity:vue`，14 个用例全绿。
- 教训：新增 package.json 脚本时，凡是调 `node scripts/*.mjs` 的，都要对照 scaffold 的 drop 计划过一遍；验收复查的价值正在于把「没再跑过」的测试捞回来。

另：`format:check` 首跑失败、复跑通过——是 `.superpowers` 下临时探针文件的写入竞态，非缺陷；`test:docs` 后台首跑失败是与前台构建并发写 `dist` 所致，串行复跑通过。两者均不复现。

## 4. 尚未覆盖（如实声明）

1. **像素级页面 parity**：刻意不做。两套实现是不同的设计，跨应用截图 diff 比较的是设计而非构建。现状为两层替代：`parity/` 冻结的组件视觉基线（React 119 / Vue 42）+ 页面契约审计（结构、语义、axe、控制台）。
2. **用户表交互式列固定**：React 也只做初始固定（复选框与姓名列），且 Vue 表格无 sticky 列渲染。
3. **`test:docs` 的 166 个跳过用例**：平台与语言门控所致，属套件自身设计，非失败。

## 5. 总量

| 维度       | 数量                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Vitest     | 383（React）+ 644（Vue 模板）+ 303（ui）+ 94（tokens）+ 49（shared/contracts/i18n/mock）+ 42（vue 包与 parity-vue）= **1,515** |
| Playwright | 78（React e2e）+ 67（Vue e2e）+ 106（docs）+ 16 + 180（视觉）+ 161（parity 双目标）= **608**                                   |
| 提交       | 主分支自基线以来 60+ 个提交，14 个切片台账与走查齐备于 `.superpowers/sdd/`                                                     |
