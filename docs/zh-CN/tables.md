# 大表格

`ProTable` 是所有业务列表共用的外壳。这一页说明 1.7.0 新增的三件事——窗口化行、分组表头与列固定，
以及只存在于 Mock 的 5 000 行演示数据。

虚拟滚动是**按需开启**的。`/users` 与 `/workflows` 已打开，其余表格维持默认的全量渲染，
六行的列表不必为永远用不上的滚动容器付出代价。

## 窗口化行

```tsx
<ProTable
  virtualized
  virtualRowHeight={64}
  virtualMaxHeight={800}
  scrollLabel={t('users:tableRegion')}
  table={table}
  /* … */
/>
```

- 行高固定。`virtualRowHeight` 必须容得下最高的单元格；两行内容也要塞进去，
  因为占位行与滚动换算都用这个值。
- 容器以 `virtualMaxHeight` 封顶并独占滚动。`ui/table.tsx` 接受 `container={false}`，
  避免再套一层滚动框。
- 视口上下各保留 6 行 overscan。React 侧的行模型仍是完整的，只有 DOM 被窗口化。
- 表头吸顶：分组行贴 `top: 0`，叶子表头贴 `top: 32px`。吸顶需要不透明背景，
  所以虚拟滚动时表头用 `bg-muted`，而不是默认的半透明色。
- 只有虚拟滚动表渲染 `<colgroup>`。固定布局需要这些宽度，列固定的偏移才能对齐；
  其他页面继续使用自动布局，不受影响。
- 滚动容器可获得焦点（`tabIndex={0}`），并把 `scrollLabel` 暴露为 `region` 的标签，
  键盘用户可以滚动，读屏用户可以定位；虚拟滚动表还会写 `aria-rowcount`（含表头行）
  与正文行的 `aria-rowindex`。
- 首尾行 id 变化时滚动位置归零。翻页、筛选、排序都会回到顶部，
  不会把视口留在空占位行上。

## 分组表头

给每个可见叶子列补上 `meta.group` 与 `meta.groupLabel`：

```ts
meta: {
  label: t('users:columns.status'),
  group: 'access',
  groupLabel: t('users:columnGroups.access'),
}
```

相邻、同组的可见列合成一段。表头每次渲染时现算，显隐、拖动排序、列宽变化都会自动重排，
不需要额外状态。只要有一个可见叶子列缺 group，`DataTable` 就完全不渲染分组行——
这正是其他页面保持原样的原因。排序把同组列拆开后，会变成两段同名分组。

分组行来自 `table.getVisibleLeafColumns()`，没有第二个表格实例。一段分组只有在整段固定方向
一致时才整体吸顶；否则各列按自己的固定设置处理，分组标题随内容滚动。

## 列固定与布局持久化

固定复用 TanStack 的列固定：

```ts
initialState: {
  columnPinning: {
    left: ['select', 'name']
  }
}
```

固定单元格获得 `position: sticky`，偏移来自 `column.getStart('left')`。用户页把显隐、列序与列宽
保存在 `fish-admin:users-table-layout`：

```json
{ "visibility": { "department": false }, "order": ["…"], "sizing": { "name": 310 } }
```

挂载时读一次，之后每次变更写回。字段残缺或 JSON 损坏时回退默认值；存储被禁用只是丢失持久化，
当前会话照常工作。拖拽列宽走 `onColumnSizingChange`，现有**列设置**浮层无需改动。

## 5 000 行演示数据集

打开 `/users?dataset=large`。这是 Mock 专属能力：

- 路由校验器强制 `pageSize=5000`，该模式下隐藏分页。工具栏徽标与 `aria-rowcount` 都按 5 000 行显示。
- 行由 `src/mocks/db/synthetic-users.ts` 在**内存**中按固定 faker 种子生成，不写进 `localStorage`，
  也不进入种子库；常规列表仍然只返回存储中的用户。
- 批量改状态、删除与恢复只改内存数组，刷新即还原。其他写操作仍作用于存储库，
  因此不要把合成行当成持久记录。
- E2E 断言 DOM 中正文行数不超过 80，滚到最后一条合成行，勾选并通过批量栏改状态。

从 URL 去掉 `dataset=large` 即回到正常分页列表。

## 真实后端要承担什么

虚拟滚动是渲染策略，不是取数策略。

- 不要一次返回 5 000 行。用 offset 或 keyset 游标分页，筛选与排序放在服务端；
  Mock 的单页捷径只是为了让数据量可见。
- 返回准确的总数（或 `hasMore`），滚动条与 `aria-rowcount` 才不会说谎。
- 逐条鉴权。宽表格仍然是「调用者有权读取的记录列表」。
- 批量接口要有明确上限。Mock 把单次选择限制在 100 个 id；真实服务应校验归属、
  按 id 返回失败原因，并为每次状态变更写审计记录。

## 测试清单

- `e2e/users-large-dataset.spec.ts` —— 5 000 行、DOM 正文行数 ≤ 80、滚到末尾、勾选并批量改状态。
- `e2e/users-bulk.spec.ts` —— 固定列、拖拽列宽，且宽度在刷新后保留。
- `e2e/users-columns.spec.ts` —— 列序与显隐在刷新后保留。
- `e2e/workflows.spec.ts` —— 分组、固定、虚拟滚动的审批队列，包含中文队列与详情流程。
- 视觉基线覆盖 `/users` 与 `/workflows`，两张图都多了分组表头行。
