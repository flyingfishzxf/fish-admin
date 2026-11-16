# Vue 模板用户表列布局（Slice 14）设计

> 状态：范围已定，待实施。
> 基线：`main` @ `87b0c0e`（Slice 1–13 全部完成并已 `--ff-only` 合并）。
> 本 Spec 是实施计划的绑定权威；实施中的冲突以本文档为准。

## 1. 目标

补上用户表最后一项功能缺口：**列拖拽排序（含键盘）、列宽拖拽调整、布局持久化**。

**成功定义**：管理员在「Columns」弹层里拖动手柄或按 ↑/↓ 重排列，表格立即以新顺序渲染，刷新页面后顺序保持；拖表头右缘的调宽手柄改变列宽，同样持久；不启用调宽的其它表格渲染与行为完全不变。全部门禁通过，`parity/**` 与 `*-linux.png` 零改动，`packages/vue` 导出面不变。

## 2. 背景

- React 侧实现很小：`packages/ui` 的 `column-order.ts`（`moveColumnOrder` 纯函数，9 行）、`data-table-view-options.tsx`（Columns 弹层里的拖拽手柄 + 键盘重排 + 焦点管理，143 行）、`data-table.tsx` 的调宽手柄（`header.getResizeHandler()`，约 15 行）；页面上是 `columnOrder` / `columnSizing` / `columnVisibility` 三个状态 + localStorage 持久化（`fish-admin:users-table-layout`）。
- **Vue 侧已有**：应用层 `ColumnOptions.vue`（只有显示/隐藏，按 group 分组）、`columnVisibility` 状态、密度持久化。缺 order / sizing / 持久化 / 手柄。
- **`packages/vue` 只改 `DataTable.vue` 内部**：表头加调宽手柄（仅在 `column.getCanResize()` 时渲染）与显式宽度。不新增导出，docs 演示未启用调宽所以渲染不变，parity 基线不受影响。

## 3. 关键决策

### 3.1 重排逻辑放应用层，不进包

React 的 `moveColumnOrder` 在 `packages/ui`，Vue 的对应物放进应用层 `features/users/column-order.ts` —— 只有一个消费者（用户表），且 `packages/vue` 导出面冻结。以后有第二张表需要时再提升。

### 3.2 弹层在现有 `ColumnOptions.vue` 上加拖拽，不新建组件

React 的 `DataTableViewOptions` 把可见性与重排放同一个弹层；Vue 的 `ColumnOptions` 已经做了可见性（还多了分组标题）。在每行前加拖拽手柄、复用同一组状态，保持一个入口。

### 3.3 键盘重排与焦点管理照抄 React 的约定

手柄可聚焦、`draggable`，↑/↓ 与相邻列交换后**焦点回到原手柄**（`focusAfterMove` ref），弹层顶部有提示文案（现有键 `table.reorderHint` / `table.reorderColumn`，不新增）。

### 3.4 调宽手柄只在启用时渲染

`DataTable.vue` 的表头在 `column.getCanResize()` 时渲染手柄并设置显式宽度；其余表格（docs 演示、文件/项目列表）不启用，渲染不变。手柄 `tabIndex={-1}`（React 同款：鼠标/触摸操作，键盘不进）。

### 3.5 持久化用 React 同款键与结构

`fish-admin:users-table-layout` 存 `{ visibility, order, sizing }`；读取失败或缺字段时回退到默认。可见性本来就持久化在弹层状态里 —— 统一进这一个键（迁移：读旧键优先，读不到再读新键？React 只有一个键，Vue 侧 visibility 此前没有持久化，所以直接用新键即可）。

### 3.6 初始固定不做交互式 pin

React 只在初始状态把 select + name 固定在左侧（`initialState.columnPinning`），没有用户可操作的固定 UI；而 Vue 的 `DataTable` 没有 sticky 列渲染。**本切片不做 pin**：通过列顺序把 select/name 排在最前已经覆盖了视觉结果，sticky 滚动留待以后。文档偏离表相应更新。

## 4. 范围

**要做**：`column-order.ts` 纯函数 + 测试；`ColumnOptions.vue` 拖拽与键盘重排 + 测试；`UsersPage.vue` 三个状态 + 持久化 + `useVueTable` 接线；`DataTable.vue` 调宽手柄与宽度；e2e（拖拽重排、刷新保持、调宽手柄存在）。文档：偏离表（列拖动/调宽已移植，pin 不做）、计数、CHANGELOG。

**不做**：交互式列固定（sticky 列渲染）、列宽的键盘调整（React 也只有鼠标/触摸）、其它表格启用调宽。

## 5. 验收

1. Columns 弹层每行有手柄；拖到另一行上释放后顺序更新，被拖行半透明、目标行高亮。
2. 手柄聚焦后 ↑/↓ 与相邻列交换，焦点不丢。
3. 表格以新顺序渲染；`localStorage['fish-admin:users-table-layout']` 包含新 order。
4. 重排/调宽后刷新页面，布局恢复。
5. 用户表每个可调列的表头右缘有调宽手柄；拖动改变宽度并持久化。
6. docs 演示与其它表格的表头无手柄、无显式宽度（渲染不变）。
7. `pnpm test:vue-template` 全绿；e2e 67 条；`parity/**`、`packages` 导出面零差异。

## 6. 风险

1. **`getSize()` 默认 150px**：启用调宽后用户表所有列都会得到显式宽度，首屏布局与现状不同 —— 这是 React 的同款行为，接受。
2. **HTML5 drag 事件在 jsdom 里不可用**：组件测试用 `dispatchEvent(new Event('dragstart'))` + `dataTransfer` stub，e2e 用 Playwright 的 `dragTo`。
3. **持久化键与旧键冲突**：无旧键，直接新键。
4. **`useVueTable` 的状态 getter 模式**：order/sizing 必须走 getter（同 `columnVisibility`），否则重排不渲染。
