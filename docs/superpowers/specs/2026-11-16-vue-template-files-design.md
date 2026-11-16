# Vue 模板文件页（Slice 10）设计

> 状态：范围已定，待实施。
> 基线：`main` @ `9bd60e8`（Slice 1–9 全部完成并已 `--ff-only` 合并）。
> 本 Spec 是实施计划的绑定权威；实施中的冲突以本文档为准。

## 1. 目标

新增 `/files`：**文件夹树侧栏、面包屑、搜索 / 类型 / 可见性 / 更新日期 / 收藏筛选、网格与列表两种视图、行选择与批量删除、右侧预览面板（改图、元数据、移动、切换可见性、重命名、删除、本文件夹图片缩略）、上传面板（目标文件夹、队列、进度、重试、预览）**。

**成功定义**：`file:manage` 用户能上传 3 个文件到某个文件夹、在网格与列表间切换、选中并批量删除、把文件移到别的文件夹、改名、切私有/团队、收藏；`file:read` 只读用户能看到一切但没有任何写入口；空文件夹、上传失败、超限文件都有明确文案。全部门禁通过，`parity/**` 与 `*-linux.png` 零改动。

## 2. 背景

- React 侧 `features/files` 1,961 行：`files-page.tsx` 661、`file-list.tsx` 376、`file-preview-panel.tsx` 292、`file-upload-drawer.tsx` 195，加 api / queries / search / file-meta / folder-utils。
- **后端已全部就绪**：`GET /file-folders`（返回 `folders` 带 `fileCount`、`total`、`favorites`）、`GET /files`（page/pageSize/folderId/q/kind/visibility/favorite/sort/order/updatedAfter）、`POST /files`、`PATCH /files/:id`、`DELETE /files/:id`、`POST /files/bulk-delete`；`file:manage` 控制写入。
- **i18n 键全部已存在**（`files` 命名空间 100 个键，含 `filters.*`、`list.*`、`preview.*`、`upload.*`、`toasts.*`、`errors.*`）。不新增 locale 键。
- **`packages/vue` 缺少本页需要的一批企业级原语**：`Tree`、`AutoComplete`、`Combobox`、`DatePicker`、`Cascader`、`Carousel`、`JsonViewer`、`Watermark`、`Upload`、`ResizablePanelGroup`、`ScrollArea`、`Popconfirm`、`Pagination`。导出面冻结，全部在应用层替代（见 §3）。
- 已有可复用：`Dropzone.vue`、`DetailDrawer.vue`、`Card.vue`、`Segmented.vue`、`Pagination.vue`、`AlertDialog.vue`、`EmptyState.vue`、`ErrorState.vue`、`PageHeader.vue`、`useTransientMessage`、`lib/format.ts`。

## 3. 关键决策

### 3.1 缺的原语用应用层等价物替代，逐项记录

| React                              | 这里                                                                  | 理由                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Tree`（roving tabindex + 方向键） | `FolderTree.vue`：递归按钮列表，缩进表示层级，`aria-current` 标记选中 | 文件夹树只有「点一层看一层」一个动作；方向键导航需要一整套键盘状态机，收益远小于成本 |
| `AutoComplete` 搜索                | `Input` + 防抖                                                        | 文件名的历史建议不是本页的价值所在；搜索是服务端过滤                                 |
| `Combobox`（可搜下拉）             | `Select`                                                              | 类型只有 4 项、可见性只有 3 项，搜索框是噪音                                         |
| `DatePicker`                       | 原生 `<input type="date">`，加一个清除按钮                            | 日期库是另一个依赖；原生控件在键盘与移动端都更好                                     |
| `Cascader`（移动文件）             | `Select` + `flattenFolders()` 的「A / B / C」路径                     | 同样是一次选择，路径字符串已经足够表达层级                                           |
| `JsonViewer`（元数据）             | `<dl>` 两列                                                           | 元数据是固定的 10 个字段，不是任意 JSON                                              |
| `Watermark` + `Carousel`           | 纯 `img` + 缩略图行                                                   | 水印是演示插件；轮播的核心是用缩略图切图，`grid` 三列就够                            |
| `ResizablePanelGroup`              | `lg:grid-cols-[minmax(0,1fr)_360px]`，预览栏 `sticky`                 | 拖拽分栏是锦上添花；固定 360px 在 1280/1440 都合适                                   |
| `Drawer`（窄屏预览 / 上传）        | 既有 `DetailDrawer.vue`                                               | 已经是右滑抽屉，受控 API 与 React 的 `Drawer` 同形                                   |
| `Upload`（拖拽 + 队列）            | `Dropzone` 加 `multiple`，队列在 `FileUploadDialog.vue` 里渲染        | 队列状态必须跟上传流程绑定，抽成通用组件只有一个消费者                               |
| `Popconfirm`（行内确认）           | 既有 `AlertDialog.vue`                                                | 删除确认走对话框，与用户页一致                                                       |
| `Pagination`                       | 既有 `Pagination.vue`                                                 | 已实现同款页码逻辑                                                                   |

### 3.2 URL 不承载筛选状态，与用户页保持一致

用户页、审计页都把筛选留在内存里，本页照做。代价是「把某个文件夹的筛选发给同事」不能直接深链；换来的是不需要为网格/列表、日期、收藏这些状态写一整套序列化与校验。React 用 URL 驱动，这在官方文档的偏离表里已有记录，本切片追加一行。

### 3.3 权限：`file:read` 进页面，`file:manage` 才有一切写入口

路由 `meta.permission = 'file:read'`；上传按钮、收藏按钮、预览面板的移动/改名/可见性/删除、批量删除、行内删除全部看 `file:manage`。只读用户看到的是一份可浏览的资料库。

### 3.4 网格是默认视图，列表是 `<table>` 而不是 `DataTable`

React 的列表视图没有排序、没有列控制，只是 6 列的静态表；用 `DataTable` 会为了 `getCoreRowModel` 引入一层 tanstack 状态，却不用它的任何能力。直接 `<table>` + 表头 + 行，行高与用户表一致（`h-10` 表头、`py-2` 单元格）。

### 3.5 选中态以 id 集合维护，查询变化即清空

与用户页批量操作同一约定：筛选、文件夹、页码任何一项变化都清空选择，否则「删除所选」会作用到看不见的行上。

### 3.6 上传队列自己维护，进度是诚实的近似值

`fetch` 拿不到上传进度（没有 XHR），所以队列只呈现三个状态：`uploading`（20→65→100 的占位进度条）、`done`、`error`。这与 React 一致（那边也是 `UploadItem.progress` 的占位值），不假装有字节级进度。

图片只有在 **≤256 KB** 时才转 data URL 作为预览（与 React 相同的 `MAX_DATA_URL`）；大于 25 MB 的文件在入队前就被拒。

### 3.7 预览：桌面右侧常驻，窄屏走抽屉

`lg` 以上预览在右栏 `sticky top-4`，点击文件即切换；`lg` 以下点击文件打开 `DetailDrawer`。这样窄屏不会出现「下方莫名其妙多出一块」的问题，也不用实现可拖拽分栏。

## 4. 范围

**要做**

- `router.ts`：`/files` 路由，`file:read`；`config/nav.ts` 的 `IMPLEMENTED_PATHS` 加 `/files`（`nav.test.ts` 会校验两侧一致）。
- `features/files/search.ts`：`FilesSearch` 与 `validateFilesSearch`（照抄 React 的边界：pageSize 6–48、`updatedAfter` 只收 `YYYY-MM-DD`）。
- `features/files/file-meta.ts`：`formatFileSize`、`fileKindOf`、`fileIcon`、`fileExtension`、`isPreviewable`。
- `features/files/folder-utils.ts`：`flattenFolders`、`folderPathIds`、`folderBreadcrumb`。
- `features/files/api.ts`、`queries.ts`：与 React 同名同参。
- `components/ui/FolderTree.vue`：递归文件夹列表。
- `components/ui/Dropzone.vue`：加 `multiple` 与 `files` 事件（既有单文件行为不变）。
- `features/files/FilesPage.vue`、`FileGrid.vue`、`FileListTable.vue`、`FilePreviewPanel.vue`、`FileUploadDialog.vue`。
- 测试：纯函数（size/kind/icon/extension、flatten、path、search 校验）、页面（加载/空/错误/权限/筛选/视图切换/选择与批量/分页）、预览（改名/移动/可见性/删除）、上传（队列/成功/失败/重试/超限）、`FolderTree`、`Dropzone` 多文件。
- e2e：上传三个文件并在网格里看到、切列表视图并批量删除、只读角色没有上传按钮。
- 文档：两份 `docs/*/vue-template.md`（功能清单、路由表、偏离表、页面计数 13→14）、`README`/`README.zh-CN`（导航页数、e2e 计数）、`CHANGELOG`。

**不做**

- 拖拽分栏、水印、轮播、JSON 树、可搜下拉、日期选择器、级联选择器（§3.1 的替代品）。
- 右键菜单（`ContextMenu`）：React 的文件卡有，Vue 没有 `ContextMenu` 原语；卡片上的收藏/删除按钮与预览面板覆盖同样动作。
- 上传的字节级进度、断点续传。
- URL 深链筛选状态（§3.2）。

## 5. 验收

1. `/files` 直接访问可用；未登录跳登录，无 `file:read` 跳 403；侧栏出现 Files 且高亮。
2. 文件夹树显示「All files」+ 各级文件夹与文件数，点击切换列表；选中项有 `aria-current`；面包屑显示完整路径且可逐级回退。
3. 搜索、类型、可见性、更新日期、收藏五个筛选各自改变请求参数（URLSearchParams 断言）；任意筛选变化把页码重置为 1 并清空选择。
4. 网格与列表切换不重新请求（只有渲染方式变化）；列表有全选复选框（含 indeterminate），网格每卡有复选框。
5. 选择后出现批量条，确认后调用 `POST /files/bulk-delete` 并提示删除条数；单文件删除走确认对话框。
6. 预览面板显示图片或类型图标、10 项元数据、移动到其他文件夹、团队/私有开关、重命名对话框、删除；窄屏点击文件打开抽屉。
7. 上传：目标文件夹默认当前文件夹；一次选 3 个文件产生 3 行队列，全部 `done` 后提示并刷新列表；失败行可重试；超过 25 MB 的文件在入队前被拒并给出文案。
8. `file:read` 用户看不到上传、收藏、删除、改名、移动、可见性、批量删除中的任何一个。
9. `pnpm test:vue-template` 全绿；e2e 40 条；`parity/**` 与 `*-linux.png` 零差异；`packages/vue` 导出面与各 `package.json` 未变。

## 6. 风险

1. **`Dropzone` 加 `multiple` 不能破坏既有调用方**：用户详情页传单文件、`file` 事件必须保持原样；多文件走新的 `files` 事件，两者互斥。
2. **数据 URL 会撑爆列表**：60 个种子文件里只有小图带 `dataUrl`；网格用 `img` 直接渲染 `dataUrl`，不做额外解码，避免 60 张图把主线程占满。
3. **`Pagination.vue` 的分页形状**：它按 `page/pageCount` 工作，而文件列表的 `pageSize` 是 12 且 6–48 可调；本切片不暴露页大小切换（React 也没有），只验证页码边界与「最后一页删空回退」。
4. **`AlertDialog` 是受控的**：批量删除与单文件删除都要把 `open` 写回，否则按 Escape 关不掉。
5. **上传失败的可重试性**：`File` 对象只在上传会话内有效，失败后要保留在内存里（`Map<id, File>`），刷新页面后重试要提示「重新选择文件」。
