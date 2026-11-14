# Vue 模板用户 CSV 导入（Slice 9）设计

> 状态：范围已定，待实施。
> 基线：`main` @ `8c34f78`（Slice 1–8 全部完成并已 `--ff-only` 合并）。
> 本 Spec 是实施计划的绑定权威；实施中的冲突以本文档为准。

## 1. 目标

补上 `/users` 的「导入用户」：四步向导（上传 / 映射列 / 复核 / 完成），CSV 解析、自动列匹配、逐行校验、仅提交有效行、把服务端跳过条数反馈出来。

**成功定义**：管理员点「Import users」→ 用样例 CSV 或拖入文件 → 看到列自动映射 → 复核页看到有效/无效行及原因 → 提交后列表刷新、页内提示创建条数；空文件、坏格式、必填列没映射、全行无效都有明确阻碍；`user:create` 缺失时看不到入口。全部门禁通过，`parity/**` 与 `*-linux.png` 零改动。

## 2. 背景

- React 侧：`packages/ui` 的 `ImportWizard`（4 步、`ImportWizardLabels` 全量文案注入）+ `import-wizard-utils.ts`（纯逻辑 91 行）+ `lib/csv.ts` 的 `parseCsvTable`；`users-page.tsx` 负责字段、样例、标签、API 与 toast。
- **`packages/vue` 没有 `ImportWizard`**，导出面冻结；`lib/csv.ts` 只有 `toCsv` / `downloadCsv`，没有解析。所以解析进 `lib/csv.ts`，纯逻辑进 `features/users/import.ts`，UI 用应用层 `ImportWizardDialog.vue`，不抽泛型原语（只有一个消费者）。
- **后端已有**：`POST /users/import`（`user:create`，`{ users: [...] }`，最多 100 行），返回 `{ created: User[], skipped: {email,message}[] }`；重复邮箱、名字过短、邮箱格式不对会被跳过；角色/部门按 id 或名称匹配，落空回退 viewer / Engineering。
- **i18n 键全部已存在**：`users:import.*` 35 个（含 `steps.*`、`field*`、`requiredMessage`、`validCount`、`doneHint` 等）。不新增 locale 键。
- 现有可复用：`Dropzone.vue`（Slice 8）、`Dialog` / `DialogContent` / `DialogTitle` / `DialogDescription`（`packages/vue`）、`useTransientMessage`（页内提示）、`toCsv` / `downloadCsv`（导出）。

## 3. 关键决策

### 3.1 解析与校验逻辑先做成纯函数，UI 只管状态机

`lib/csv.ts` 加 `CsvTable` 与 `parseCsvTable`：**逐字符状态机**，照抄 React 的行为 —— 支持引号内逗号、双引号转义 `""`、CRLF / CR / LF 三种换行、开头 BOM、跳过全空行。纯函数加测试，不依赖 DOM。

`features/users/import.ts` 照抄 React `import-wizard-utils.ts` 的四个纯函数：`autoMapFields`（字段 key / label / aliases 归一化后匹配表头，一列只能用一次）、`missingRequiredFields`、`buildImportRows`（必填、邮箱、数字三类校验，行号从 2 起）、`toImportPayload`（只取有效行）。

理由：这一层是导入最容易出错的地方，也是唯一值得逐条测的地方；把它和 Vue 组件分开，测试不用跟 Reka 的 teleport 打交道。

### 3.2 `ImportWizardDialog.vue` 自带四步，不抽泛型 `ImportWizard`

React 的 `ImportWizard` 因为要进文档站、要被任意业务复用，才把 35 条文案做成 `labels` 注入。这里只有一个消费者，直接 `useT()` 读 `users:import.*`：少一层 35 字段的接口、少一处漏传文案就显示 undefined 的风险。

状态机与 React 一致：`step: 1 | 2 | 3 | 4`、`fileName`、`table`、`mapping`、`parseError`、`importError`、`importing`、`resultCount`。上传后自动 `autoMapFields` 并进第 2 步；第 2 步必填未映射则禁用「下一步」；第 3 步「导入 N 条」在 `validCount === 0` 时禁用；提交失败显示 `importFailed`；第 4 步可「导入另一个文件」重置。

### 3.3 上传用 `Dropzone`，但样例按钮在它外面

`Dropzone.vue` 已有拖拽高亮、点击选择、`accept`、错误文案与预览插槽，直接复用（`:label="users:import.dropTitle"`、`hint`、`accept=".csv,text/csv"`）。「Use sample CSV」是另一个按钮，放在 dropzone 下方：组件本身不提供第二个动作，硬塞进 `#preview` 会破坏它的语义。

样例文案与 React 的 `IMPORT_SAMPLE` 逐字一致（3 行、表头 `name,email,role,department`），文件名 `users.csv`。

### 3.4 只有有效行进请求，服务端跳过也要说清楚

`onImport` 拿到 `toImportPayload()` 的结果后调 `importUsers`，随后 `invalidateQueries({ queryKey: ['users'] })`。`created.length === 0` 时抛错，让向导显示 `importFailed`；`skipped.length > 0` 时由页面额外提示「N 行被跳过」。成功提示也走页面既有的 `useTransientMessage`，不引 toast。

**不把 `skipped` 的具体原因逐条渲染**：React 也只给一个计数，逐条原因会让弹窗在 100 行时变成日志查看器。

### 3.5 入口放在页头，与 React 同位，`user:create` 才显示

`PageHeader` 的 `#actions` 里，在「Add user」左边加一个 outline 按钮（图标 `FileUp`，文案 `users:import.action`）。两者同一个权限 `canCreate`。不放进表格工具栏：工具栏已经有视图、密度、导出、列控制四个控件，再加一个会把搜索框挤没。

### 3.6 弹窗尺寸与台阶标记

`DialogContent` 用 `class="max-h-[90vh] overflow-y-auto sm:max-w-3xl"`，与 React 一致。四步用 `<ol>` + `aria-current="step"`，每步有编号圆点，完成步显示勾。复核表格最多显示 10 行、映射预览最多 3 行，跟 React 相同。

## 4. 范围

**要做**

- `lib/csv.ts`：`CsvTable`、`parseCsvTable`（+ `csv.test.ts` 新增用例）。
- `features/users/import.ts`：四个纯函数与类型（+ `import.test.ts`）。
- `features/users/api.ts`：`importUsers(rows)` 与 `UserImportRow` / `UserImportResult`。
- `features/users/ImportWizardDialog.vue`：四步向导 + 弹窗 + API 接线。
- `features/users/UsersPage.vue`：入口按钮与提示。
- 测试：解析、纯逻辑、向导 4 步与错误分支、列表入口权限。
- e2e：样例导入全流程、无效行被排除、只读角色看不到入口。
- 文档：两份 `docs/*/vue-template.md`、`README`/`README.zh-CN`、`CHANGELOG`。

**不做**

- 列拖动排序 / 列固定 / 列宽拖拽（React 表格的高级列控制，留在后续切片）。
- 导入历史页或「撤销导入」：mock 端点没有对应能力。
- 多行错误逐条展开、导入进度条：React 也没有。
- `.tsv` / Excel：React 只收 `.csv,text/csv`。

## 5. 验收

1. 点「Import users」弹出向导；拖入或选择 CSV、点「Use sample CSV」都能进第 2 步；空文件与读取失败显示对应文案且停在第 1 步。
2. 表头 `name,email,role,department` 自动映射到四个字段；改成 `full name,e-mail,access,team` 也能靠 aliases 命中；手动把必填列设为「Skip」后「下一步」禁用并列出缺哪个字段。
3. 复核页：有效行与无效行分别计数，无效行显示必填/邮箱原因，行号从 2 开始；「导入 N 条」只提交有效行，`toImportPayload` 的输出里没有无效行。
4. 提交成功：请求体是 `{ users: [{name,email,role?,department?}] }`，列表刷新，页内提示创建条数；服务端全部跳过时向导显示 `importFailed`，页面提示跳过条数。
5. 第 4 步显示「Import complete」与创建条数，「Import another file」回到第 1 步且状态清空。
6. `user:create` 缺失时不渲染入口按钮。
7. `pnpm test:vue-template` 全绿；e2e 37 条；`parity/**` 与 `*-linux.png` 零差异；`packages/vue` 导出面与各 `package.json` 未变。

## 6. 风险

1. **CSV 状态机是最容易漏的**：引号内换行、`""` 转义、CRLF、BOM、末尾空行，任何一条错了都会把列映射整体带偏。逐字符实现 + 表驱动测试，不用正则切分行。
2. **jsdom 里 `File.text()` 行为不一致**：测试直接调用 `parseCsvTable(text)`，只用一个测试通过 DataTransfer / 文件输入验证「文件被读到」这一层；不要依赖 `createImageBitmap` 那类浏览器 API。
3. **Reka 的 Dialog teleport**：向导测试要在 `document.body` 上查，`attachTo: document.body`；`Dialog` 的 `open` 受控，关闭时要重置还是保留状态要明确（本切片选择：关闭弹窗即重置，再打开从第 1 步开始，避免上次的文件残留）。
4. **导入后列表分页位置**：失效 `['users']` 会让当前页重新请求；如果用户在最后一页，新用户可能不在当前页，这是服务端排序决定的，不在本切片改分页逻辑。
5. **100 行上限**：mock 端点会拒绝超过 100 行；向导不预先截断，但要把服务端错误显示成 `importFailed` 而不是静默失败。
