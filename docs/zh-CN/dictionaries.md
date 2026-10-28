# 数据字典与参数配置

`/dictionaries` 是两级参照数据的完整示例：左侧字典类型，右侧字典项。表单和筛选按 value 读取，人维护 label、顺序与可用状态。这个页面只负责改数据，不替应用决定某个值在别处意味着什么。

> 它是浏览器里的 Mock。下面的规则是接口契约的演示，不是安全边界。真实后端必须重新执行全部校验，并针对真正存储这些值的表计算引用，见[生产环境注意事项](#生产环境注意事项)。

## 代码位置

| 关注点     | 文件                                                                           |
| ---------- | ------------------------------------------------------------------------------ |
| 类型       | `src/types/index.ts`（`DictionaryType`、`DictionaryItem`、`DictionaryDetail`） |
| 客户端 API | `src/features/dictionaries/api.ts`、`queries.ts`                               |
| 界面       | `src/features/dictionaries/components/*`                                       |
| 路由       | `src/routes/_app/dictionaries.tsx`                                             |
| Mock 规则  | `src/mocks/handlers/dictionaries.ts`、`src/mocks/seed-dictionaries.ts`         |
| 权限       | `src/config/permissions.ts` 中的 `dictionary:read`、`dictionary:manage`        |
| 菜单与图标 | `src/config/nav.ts`、`src/features/navigation/menu-icons.ts`（`book-marked`）  |
| 消费方     | `src/features/users/components/tags-editor.tsx` 读取启用的 `user_tag` 字典项   |

## 页面行为

- 类型列表按创建时间、再按名称排序，加载后默认选中第一项，因此不会停在空面板；选中态不写入 URL。
- 字典项表格展示顺序、label、value、引用、状态与行操作。排序提交的是完整的 id 全排列，而不是一次局部移动。
- 排序支持拖动把手，也支持聚焦把手后按 <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd>。焦点跟随被移动的行，连续按键会继续移动同一项。
- 状态开关写 `enabled`。停用的项仍留在表格里、引用也保留，但消费方必须自行过滤；用户详情的标签建议就是这么做的。
- 类型只有为空时才能删除，种子类型则完全不能删除；种子项可以停用、不能删除。仍有引用的项删除时返回 `409 ITEM_IN_USE`，被引用期间 value 不可修改。
- 引用计数是安全编辑的前提：类型行显示其下所有项的总和，项行显示使用它的有效记录数，计数大于 0 时编辑弹窗会锁定 value 输入框。

页面除了 `canManage` 之外不自己实现菜单、页签或权限逻辑；可见性与 `/403` 由共享壳层负责，Mock handler 在每次写入时独立复核权限。

## 接口契约

所有接口都要求 `Authorization: Bearer <access token>`。读取需要 `dictionary:read`，任何写入都需要 `dictionary:manage`。

### 类型

| 方法     | 路径                | 说明                                                 |
| -------- | ------------------- | ---------------------------------------------------- |
| `GET`    | `/dictionaries`     | `DictionaryType[]`，按 `createdAt`、再按 `name` 排序 |
| `POST`   | `/dictionaries`     | `{ code, name, description? }` → `DictionaryDetail`  |
| `GET`    | `/dictionaries/:id` | 接受 id 或 code → `DictionaryDetail`                 |
| `PATCH`  | `/dictionaries/:id` | `{ name?, description? }` → `DictionaryDetail`       |
| `DELETE` | `/dictionaries/:id` | `204`；拒绝种子类型和非空类型                        |

`code` 必须匹配 `^[a-z][a-z0-9_]{1,31}$`，且创建后不可修改 —— 编辑弹窗不渲染该字段。`name` 为 1–48 字符，`description` 最多 200 字符。重复 code 返回 `409 DICTIONARY_CODE_TAKEN`。创建、编辑、删除分别写入 `dictionary.created` / `dictionary.updated` / `dictionary.deleted` 审计事件，实体类型为 `dictionary`。

### 字典项

| 方法     | 路径                              | 说明                                         |
| -------- | --------------------------------- | -------------------------------------------- |
| `POST`   | `/dictionaries/:id/items`         | `{ label, value, description? }` → 详情      |
| `PATCH`  | `/dictionaries/:id/items/reorder` | `{ ids: string[] }` → 详情                   |
| `PATCH`  | `/dictionaries/:id/items/:itemId` | `{ label?, value?, description?, enabled? }` |
| `DELETE` | `/dictionaries/:id/items/:itemId` | `204`；拒绝种子项和仍被引用的项              |

`label` 为 1–40 字符，`value` 必须匹配 `^[a-z0-9][a-z0-9_-]{0,31}$`；两者在同一类型内（忽略大小写）唯一。新建项追加到末尾（`sortOrder = length`），默认启用。

`reorder` 要求列出全部字典项 id，每个恰好一次；否则返回 `400 VALIDATION_ERROR`。它会重写每个项的 `sortOrder`，并更新类型的 `updatedAt`。

未知 id 返回 `404 DICTIONARY_NOT_FOUND` / `404 ITEM_NOT_FOUND`。

### 数据结构

```ts
interface DictionaryType {
  id: string
  code: string
  name: string
  description: string
  isSystem: boolean
  itemCount: number
  referenceCount: number
  createdAt: string
  updatedAt: string
}

interface DictionaryItem {
  id: string
  dictionaryId: string
  label: string
  value: string
  description: string
  sortOrder: number
  enabled: boolean
  isSystem: boolean
  referenceCount: number
  createdAt: string
  updatedAt: string
}

interface DictionaryDetail {
  dictionary: DictionaryType
  items: DictionaryItem[]
}
```

`isSystem` 标记随种子发布的记录，不是权限。界面用它隐藏删除操作，handler 会独立再校验一次。

## 引用计数的精确定义

Mock 通过扫描"存储了该 value 的有效记录"来计数：

- 只有 `user_tag` 接入了演示页面。它的计数是 `tags` 中包含该 value 且未删除的用户数。
- 其余类型一律返回 `0`，页面也如实写着"仅存档，尚无演示页面消费"。这是刻意的：凭空编一个数字会教 adopter 信任没有意义的保护。
- 类型的 `referenceCount` 是其所有项计数之和。

新增自己的字典时，在 Mock 的 `countReferences` 里实现计数，更重要的是在拥有这些记录的后端实现。约束是单向的：**只要还有一行记录存着旧 value，修改 value 就必须失败**，否则历史数据会静默指向一个已不存在的 label。停用是官方替代方案：它隐藏选项，但不破坏历史。

用户详情只消费启用的项：

```ts
const { data: suggestions = [] } = useDictionaryOptionsQuery('user_tag')
// GET /dictionaries/user_tag → 取 enabled 项 → { label, value }[]
```

资料页已有的标签会从建议中排除。

## 数据与 Mock 数据库

Mock 数据库版本为 `6`。从 v5 迁移时会补上 `dictionaryTypes` 与 `dictionaryItems` 并写入种子，保留用户、角色、会话、协作数据与审批数据；更早的存储沿 v4 → v5 → v6 链路迁移。缺少任一数组的载荷视为不兼容并重置为种子。清掉 `localStorage` 中的 `fish-admin:db:v1` 即可恢复出厂状态。

种子包含三个系统类型：`user_tag`（7 项）、`expense_category`（5 项）、`approval_priority`（4 项）。各类型带不同的创建时间，默认选中顺序因此稳定。

## 生产环境注意事项

- **在事务（或唯一索引）内校验唯一性。** 两个客户端同时创建 `priority` 不能都成功。Mock 的 `toLowerCase()` 比较是大小写不敏感索引的替身。
- **引用计数要查真实表。** 计数是跨所有消费方的查询，不是缓存数字；如果昂贵，就在写入引用行的事务里同步维护。
- **排序必须原子。** 接受任意子集会产生重复位置；像契约一样要求完整 id 列表并一次写入。并发排序应比较版本号或时间戳。
- **被引用的 value 不可变。** 改 label 安全；改 value 会重写既有记录的含义。业务确实需要时，应做显式的数据迁移，而不是在字典里改一下。
- **优先停用，而不是删除。** 历史与审计指向 value。硬删除只应留给从未使用过的项。
- **写入审计。** Mock 记录类型级事件；真实系统应记录改了哪一项、从什么改成什么，尤其是 value 变化。
- **按租户收窄读取。** Mock 对所有拥有 `dictionary:read` 的会话返回全部类型。多租户后端通常按组织划分字典，并允许部分类型全局共享。
- **客户端 RBAC 只是体验层。** 隐藏"新建项"或删除按钮只能避免误操作，拦不住请求。参见[权限系统](./rbac.md)。

## 测试

- `e2e/dictionaries.spec.ts` —— admin 排序后刷新仍在；新建项后在 `/users/user-admin` 看到标签建议；改名后看到新 label；停用后建议消失；viewer 可读但没有新建/编辑入口，也不能切换状态。
- `src/mocks/db/migrate.test.ts` —— v5 → v6 补种并保留原有数据；v4 → v6 串起两次迁移。
- `packages/ui/src/registry.test.ts` —— `switch` 的 `usedIn` 指向 `/dictionaries`，文档页因此始终链接到一个真实存在的路由。
- 视觉基线 —— `dictionaries.png`（选中类型、排序把手与引用徽标）。
