# Vue 模板外壳（Slice 2）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建私有 `apps/vue-template`，交付登录、权限导航、主题/语言、Dashboard 与 Users 增删改查的 Vue 3 中后台外壳，并保持 React/Vue 既有 parity 结果不变。

**Architecture:** 独立 Vite + Vue 3 应用，复用 `@fish-admin/vue`、`@fish-admin/contracts`、`@fish-admin/i18n`、`@fish-admin/mock`。Vue Router 守卫 + Pinia 会话；`@tanstack/vue-query` 负责 Dashboard/Users 数据；`@tanstack/vue-table` 提供 `manualPagination`/`manualSorting` 表格；i18next 通过 `language` ref 接入 Vue 响应式。组件层只为 `@fish-admin/vue` 增加 Avatar 与 DropdownMenu 两个 Reka 封装，class 从 React 源码逐字复制（仅 `--radix-*` → `--reka-*`）。

**Tech Stack:** Vue 3.5、Vue Router 4.6、Pinia 3、`@tanstack/vue-query` 5、`@tanstack/vue-table` 8、Reka UI 2.11、lucide-vue-next、Tailwind 4、Vite 8、vue-tsc、Vitest 5 + jsdom、Playwright 1.64（仅功能冒烟）。

**Spec:** `docs/superpowers/specs/2026-11-11-vue-template-shell-design.md`

## Global Constraints

- `packages/ui/**`（React 组件库）只读；不修改 React 模板 `src/**`。
- 新增 Vue 封装的 class 集合从对应 React 源码逐字复制；行为差异必须在第 13 节列出。
- 共享包 `packages/contracts`、`packages/i18n`、`packages/mock` 的 `src` 不新增 React、`@/` 别名或 Lucide 组件依赖。
- 所有 README、docs、界面中的“客户端权限不是安全边界”说明不得弱化或删除；新文档必须包含同一说明。
- 文档双语同步：每改一份 `docs/en/*.md`，同一提交更新对应 `docs/zh-CN/*.md`；README 同理；CHANGELOG 只写英文。
- 工具链：Node >= 22、pnpm 9.1.1；根目录执行命令，Windows 使用 Git Bash。
- 每个任务结束前运行 `pnpm exec prettier --check <changed files>`、`pnpm lint`、相关测试；声明“通过”必须附真实输出。
- 每个任务一个本地 Conventional Commit；不得 `--amend` 已存在提交，不得 `--no-verify`。
- `@fish-admin/vue-template` 与 `@fish-admin/vue` 保持 private，版本 `0.1.0`。

**本会话附加约束（用户原话，逐字保留）**

- “`git push`、远端 tag、`npm publish`、GitHub Release、Vercel 项目设置或部署变更，每一项都需要单独、明确的批准。本计划只产生本地 commit 和本地 annotated tag。”
- “任何任务都不得运行 `--update-snapshots=all`、`test:visual:update` 或 `test:docs:visual:update`。”
- “所有 README、docs、界面文案中的‘客户端权限不是安全边界’说明不得弱化或删除。”
- “共享包必须框架无关：`packages/contracts`、`packages/i18n`、`packages/mock` 的 `src` 中不得出现 `react`、`react-dom`、`@fish-admin/react`、`@/` 别名或 Lucide 组件导入。”
- “不得 `--amend` 已存在的提交，不得 `--no-verify`。”
- “场景 DSL 只使用可访问名称、角色、可见文本和状态，不写 CSS 选择器（`expectCount` 的表格行除外）。”
- “不修改 React 包：`packages/ui/**` 在本计划中只读。Vue 组件的 class 集合从 React 源码逐字复制。”
- “文档双语同步：每改动一份 `docs/en/*.md`，必须同一提交内更新对应的 `docs/zh-CN/*.md`；README 的英文与 `README.zh-CN.md` 同理。CHANGELOG 只写英文条目。”
- “工具链固定：Node >= 22、pnpm 9.1.1。所有命令在仓库根目录执行；Windows 上使用 Git Bash。”
- “每个任务结束前至少运行 `pnpm exec prettier --check <changed files>`、`pnpm lint`、相关测试；任务声明‘通过’之前必须附上真实命令输出。”
- “提交粒度：每个任务一个本地 commit，使用 Conventional Commits。”

---

## File Structure

```
apps/vue-template/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
  public/mockServiceWorker.js
  src/
    main.ts
    App.vue
    router.ts
    vite-env.d.ts
    config/env.ts
    config/nav.ts
    config/theme.ts
    lib/api-client.ts
    lib/api-error.ts
    lib/auth-redirect.ts
    lib/format.ts
    lib/i18n.ts
    lib/initials.ts
    lib/permissions.ts
    lib/query-client.ts
    stores/auth.ts
    stores/theme.ts
    stores/ui.ts
    components/layout/AppShell.vue
    components/layout/AppSidebar.vue
    components/layout/AppHeader.vue
    components/layout/AppBreadcrumbs.vue
    components/layout/UserMenu.vue
    components/layout/ThemeToggle.vue
    components/layout/LanguageToggle.vue
    components/common/BrandMark.vue
    components/common/PageHeader.vue
    components/common/ErrorState.vue
    components/common/EmptyState.vue
    features/auth/api.ts
    features/auth/LoginPage.vue
    features/auth/LoginPage.test.ts
    features/dashboard/api.ts
    features/dashboard/queries.ts
    features/dashboard/DashboardPage.vue
    features/dashboard/KpiCards.vue
    features/dashboard/ActivityList.vue
    features/users/api.ts
    features/users/queries.ts
    features/users/search.ts
    features/users/form.ts
    features/users/columns.ts
    features/users/UsersPage.vue
    features/users/UsersPage.test.ts
    features/users/UserFormDialog.vue
    features/users/UserFormDialog.test.ts
    features/users/DeleteUserDialog.vue
    features/users/DeleteUserDialog.test.ts
    pages/ForbiddenPage.vue
    pages/NotFoundPage.vue
    styles/index.css
  test/setup.ts
playwright.vue-template.config.ts
e2e-vue-template/specs/smoke.spec.ts
docs/en/vue-template.md
docs/zh-CN/vue-template.md
```

`packages/vue` 增量：`src/components/ui/avatar/`、`src/components/ui/dropdown-menu/`、`src/components/pro/DataTable.vue`、`src/components/pro/ProTable.vue`、`src/components/pro/types.ts`、`src/index.ts`。

---

### Task 1: 应用脚手架与根脚本

**Files:**

- Create: `apps/vue-template/{package.json,tsconfig.json,vite.config.ts,vitest.config.ts,index.html,src/vite-env.d.ts,src/styles/index.css,test/setup.ts,src/main.ts,src/App.vue}`
- Create: `apps/vue-template/public/mockServiceWorker.js`（从根 `public/mockServiceWorker.js` 原样 `cp`）
- Modify: root `package.json`（scripts）
- Modify: `pnpm-lock.yaml`（`pnpm install` 自动生成）

**Interfaces:**

- Produces: workspace package `@fish-admin/vue-template`（private，`0.1.0`），dev/preview 端口 4177，全局常量 `__APP_VERSION__`，`pnpm dev:vue-template` / `build:vue-template` / `test:vue-template` / `test:e2e:vue-template`。

- [ ] **Step 1: 创建 `apps/vue-template/package.json`**

```json
{
  "name": "@fish-admin/vue-template",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 4177 --strictPort",
    "build": "vue-tsc -p tsconfig.json --noEmit && vite build",
    "preview": "vite preview --port 4177 --strictPort",
    "test": "vitest run",
    "typecheck": "vue-tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@fish-admin/contracts": "workspace:*",
    "@fish-admin/i18n": "workspace:*",
    "@fish-admin/mock": "workspace:*",
    "@fish-admin/tokens": "workspace:*",
    "@fish-admin/vue": "workspace:*",
    "@fontsource-variable/inter": "^5.3.0",
    "@tanstack/vue-query": "^5.104.5",
    "@tanstack/vue-table": "^8.21.3",
    "i18next": "^26.5.3",
    "lucide-vue-next": "^1.0.0",
    "pinia": "^3.0.0",
    "vue": "^3.5.45",
    "vue-router": "^4.6.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-vue": "^6.0.10",
    "@vue/test-utils": "^2.5.1",
    "jsdom": "^30.1.3",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.9.3",
    "vite": "^8.3.4",
    "vitest": "^5.0.5",
    "vue-tsc": "^3.3.14"
  }
}
```

- [ ] **Step 2: 创建 `tsconfig.json`（复制 `apps/parity-vue/tsconfig.json` 并保留 include 四项）**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "types": ["vite/client"]
  },
  "include": ["src", "test", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: 创建 `vite.config.ts`、`vitest.config.ts`、`index.html`**

```ts
// apps/vue-template/vite.config.ts
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import rootPackage from '../../package.json'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(rootPackage.version) },
  server: { port: 4177, strictPort: true },
  preview: { port: 4177, strictPort: true },
})
```

```ts
// apps/vue-template/vitest.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
})
```

```html
<!-- apps/vue-template/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#fcfbfd" />
    <title>FishAdmin · Vue template</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 4: 创建 `src/vite-env.d.ts` 与 `src/styles/index.css`**

```ts
/// <reference types="vite/client" />

declare const __APP_VERSION__: string
```

```css
@import '@fontsource-variable/inter';
@import '@fish-admin/vue/styles/index.css';
@import 'tailwindcss/preflight.css' layer(base);

/* Tailwind preflight resets `border: 0 solid`; restore the package border token. */
@layer base {
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--border);
  }
}

@source '../';
/* Four levels up lands on the repo root; `packages/vue/src` must be scanned too. */
@source '../../../../packages/vue/src';
```

- [ ] **Step 5: 复制 `test/setup.ts`（与 `apps/parity-vue/test/setup.ts` 逐字一致）**

```ts
import { vi } from 'vitest'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub)
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

Element.prototype.scrollIntoView = vi.fn()
Element.prototype.hasPointerCapture = vi.fn(() => false)
Element.prototype.setPointerCapture = vi.fn()
Element.prototype.releasePointerCapture = vi.fn()
```

- [ ] **Step 6: 创建最小挂载 `src/App.vue` 与 `src/main.ts`（Task 8 会替换）**

```vue
<template>
  <div id="bootstrap">FishAdmin Vue template</div>
</template>
```

```ts
import { createApp } from 'vue'

import App from './App.vue'
import './styles/index.css'

createApp(App).mount('#app')
```

- [ ] **Step 7: 复制 worker 并追加根脚本**

```bash
cp public/mockServiceWorker.js apps/vue-template/public/mockServiceWorker.js
```

在根 `package.json` 的 `scripts` 中、`"test:vue"` 之后插入：

```json
"dev:vue-template": "pnpm --filter @fish-admin/vue-template dev",
"build:vue-template": "pnpm --filter @fish-admin/vue-template build",
"test:vue-template": "pnpm --filter @fish-admin/vue-template test",
"test:e2e:vue-template": "playwright test -c playwright.vue-template.config.ts",
```

并把 `"typecheck"` 中 `... && pnpm --filter @fish-admin/parity-vue typecheck && pnpm --filter @fish-admin/docs typecheck` 改为：

```text
... && pnpm --filter @fish-admin/parity-vue typecheck && pnpm --filter @fish-admin/vue-template typecheck && pnpm --filter @fish-admin/docs typecheck
```

- [ ] **Step 8: 安装依赖并验证脚手架**

Run:

```bash
pnpm install
pnpm --filter @fish-admin/vue-template typecheck
pnpm --filter @fish-admin/vue-template exec vitest run --passWithNoTests
pnpm exec prettier --check apps/vue-template package.json pnpm-lock.yaml
pnpm lint
```

Expected: install 成功并更新 `pnpm-lock.yaml`；typecheck 退出码 0；Vitest 输出 `No test files found` 但退出码 0（`--passWithNoTests`）；prettier/lint 通过。

- [ ] **Step 9: Commit**

```bash
git add apps/vue-template package.json pnpm-lock.yaml
git commit -m "feat(vue-template): scaffold the private Vue 3 admin app"
```

---

### Task 2: Vue 组件增量与表格 a11y

**Files:**

- Create: `packages/vue/src/components/ui/avatar/{Avatar,AvatarImage,AvatarFallback}.vue`
- Create: `packages/vue/src/components/ui/dropdown-menu/{DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator}.vue`
- Create: `packages/vue/src/components/ui/avatar/avatar.test.ts`
- Create: `packages/vue/src/components/ui/dropdown-menu/dropdown-menu.test.ts`
- Modify: `packages/vue/src/index.ts`
- Modify: `packages/vue/src/components/pro/DataTable.vue`
- Modify: `packages/vue/src/components/pro/ProTable.vue`
- Modify: `packages/vue/src/components/pro/types.ts`
- Modify: `packages/vue/src/components/pro/pro-table.test.ts`

**Interfaces:**

- Produces: `Avatar`, `AvatarImage`, `AvatarFallback`, `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` from `@fish-admin/vue`; `DataTable` prop `tableLabel?: string`; `ProTable` prop `tableLabel?: string`; sortable `<th>` emits `aria-sort`.

- [ ] **Step 1: 写 Avatar 失败测试**

```ts
// packages/vue/src/components/ui/avatar/avatar.test.ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import Avatar from './Avatar.vue'
import AvatarFallback from './AvatarFallback.vue'
import AvatarImage from './AvatarImage.vue'

describe('Avatar', () => {
  it('writes the size preset to data-size', () => {
    const wrapper = mount(Avatar, { props: { size: 'sm' } })
    expect(wrapper.attributes('data-slot')).toBe('avatar')
    expect(wrapper.attributes('data-size')).toBe('sm')
    expect(wrapper.classes()).toContain('rounded-full')
  })

  it('renders the fallback when no image is supplied', () => {
    const wrapper = mount(Avatar, {
      slots: { default: () => h(AvatarFallback, null, { default: () => 'AD' }) },
    })
    expect(wrapper.text()).toContain('AD')
    expect(wrapper.get('[data-slot="avatar-fallback"]').classes()).toContain('bg-muted')
  })

  it('falls back after the image fails to load', async () => {
    const wrapper = mount(Avatar, {
      slots: {
        default: () => [
          h(AvatarImage, { src: '/missing.png', alt: '' }),
          h(AvatarFallback, null, { default: () => 'AD' }),
        ],
      },
    })
    await wrapper.get('img').trigger('error')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('AD')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm --filter @fish-admin/vue exec vitest run src/components/ui/avatar/avatar.test.ts`
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 实现 Avatar 三个文件**

```vue
<!-- Avatar.vue -->
<script setup lang="ts">
import { AvatarRoot } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(defineProps<{ size?: 'default' | 'sm' | 'lg'; class?: string }>(), {
  size: 'default',
})

const classes = computed(() =>
  cn(
    'group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6',
    props.class,
  ),
)
</script>

<template>
  <AvatarRoot data-slot="avatar" :data-size="size" :class="classes">
    <slot />
  </AvatarRoot>
</template>
```

```vue
<!-- AvatarImage.vue -->
<script setup lang="ts">
import { AvatarImage as AvatarImagePrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = defineProps<{ src?: string; alt?: string; class?: string }>()
const classes = computed(() => cn('aspect-square size-full', props.class))
</script>

<template>
  <AvatarImagePrimitive data-slot="avatar-image" :src="src" :alt="alt" :class="classes" />
</template>
```

```vue
<!-- AvatarFallback.vue -->
<script setup lang="ts">
import { AvatarFallback as AvatarFallbackPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
const classes = computed(() =>
  cn(
    'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs',
    props.class,
  ),
)
</script>

<template>
  <AvatarFallbackPrimitive data-slot="avatar-fallback" :class="classes">
    <slot />
  </AvatarFallbackPrimitive>
</template>
```

- [ ] **Step 4: 写 DropdownMenu 失败测试**

```ts
// packages/vue/src/components/ui/dropdown-menu/dropdown-menu.test.ts
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'

import DropdownMenu from './DropdownMenu.vue'
import DropdownMenuContent from './DropdownMenuContent.vue'
import DropdownMenuItem from './DropdownMenuItem.vue'
import DropdownMenuTrigger from './DropdownMenuTrigger.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function mountMenu(onSelect: () => void) {
  return mount(DropdownMenu, {
    slots: {
      default: () => [
        h(DropdownMenuTrigger, { asChild: true }, () => h('button', { type: 'button' }, 'Actions')),
        h(DropdownMenuContent, { align: 'end' }, () => [
          h(DropdownMenuItem, { onSelect }, () => 'Edit'),
          h(DropdownMenuItem, { variant: 'destructive', onSelect }, () => 'Delete'),
        ]),
      ],
    },
    attachTo: document.body,
  })
}

describe('DropdownMenu', () => {
  it('opens from the trigger and invokes the item handler', async () => {
    const onSelect = vi.fn()
    wrapper = mountMenu(onSelect)

    const trigger = wrapper.get('button')
    await trigger.trigger('keydown', { key: 'Enter' })
    await nextTick()

    const items = document.body.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"]')
    expect(items).toHaveLength(2)
    items[0]?.click()
    await vi.waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1))
  })

  it('marks destructive items and closes on select', async () => {
    wrapper = mountMenu(() => {})
    await wrapper.get('button').trigger('keydown', { key: 'Enter' })
    await nextTick()

    const destructive = document.body.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-item"][data-variant="destructive"]',
    )
    expect(destructive?.className).toContain('text-destructive')

    destructive?.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('[data-slot="dropdown-menu-content"]')).toBeNull()
    })
  })
})
```

- [ ] **Step 5: 运行测试确认失败**

Run: `pnpm --filter @fish-admin/vue exec vitest run src/components/ui/dropdown-menu/dropdown-menu.test.ts`
Expected: FAIL — 模块不存在。

- [ ] **Step 6: 实现 DropdownMenu 六个文件**

```vue
<!-- DropdownMenu.vue -->
<script setup lang="ts">
import { DropdownMenuRoot } from 'reka-ui'

withDefaults(defineProps<{ open?: boolean; defaultOpen?: boolean; modal?: boolean }>(), {
  open: undefined,
  defaultOpen: undefined,
  modal: true,
})

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <DropdownMenuRoot
    data-slot="dropdown-menu"
    :open="open"
    :default-open="defaultOpen"
    :modal="modal"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </DropdownMenuRoot>
</template>
```

```vue
<!-- DropdownMenuTrigger.vue -->
<script setup lang="ts">
import { DropdownMenuTrigger as DropdownMenuTriggerPrimitive } from 'reka-ui'

withDefaults(defineProps<{ asChild?: boolean }>(), { asChild: false })
</script>

<template>
  <DropdownMenuTriggerPrimitive data-slot="dropdown-menu-trigger" :as-child="asChild">
    <slot />
  </DropdownMenuTriggerPrimitive>
</template>
```

```vue
<!-- DropdownMenuContent.vue -->
<script setup lang="ts">
import { DropdownMenuContent as DropdownMenuContentPrimitive, DropdownMenuPortal } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(
  defineProps<{
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
    class?: string
  }>(),
  { align: 'center', sideOffset: 4 },
)

const classes = computed(() =>
  cn(
    'z-50 max-h-(--reka-dropdown-menu-content-available-height) min-w-[8rem] origin-(--reka-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md duration-(--motion-duration-fast) ease-(--motion-ease-standard) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none!',
    props.class,
  ),
)
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContentPrimitive
      data-slot="dropdown-menu-content"
      :align="align"
      :side-offset="sideOffset"
      :class="classes"
    >
      <slot />
    </DropdownMenuContentPrimitive>
  </DropdownMenuPortal>
</template>
```

```vue
<!-- DropdownMenuItem.vue -->
<script setup lang="ts">
import { DropdownMenuItem as DropdownMenuItemPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(
  defineProps<{
    inset?: boolean
    variant?: 'default' | 'destructive'
    disabled?: boolean
    class?: string
    onSelect?: (event: Event) => void
  }>(),
  { inset: false, variant: 'default', disabled: false },
)

const emit = defineEmits<{ select: [event: Event] }>()
const classes = computed(() =>
  cn(
    "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:ps-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
    props.class,
  ),
)
</script>

<template>
  <DropdownMenuItemPrimitive
    data-slot="dropdown-menu-item"
    :data-inset="inset || undefined"
    :data-variant="variant"
    :disabled="disabled"
    :class="classes"
    @select="
      (event) => {
        emit('select', event)
        onSelect?.(event)
      }
    "
  >
    <slot />
  </DropdownMenuItemPrimitive>
</template>
```

```vue
<!-- DropdownMenuLabel.vue -->
<script setup lang="ts">
import { DropdownMenuLabel as DropdownMenuLabelPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(defineProps<{ inset?: boolean; class?: string }>(), { inset: false })
const classes = computed(() => cn('px-2 py-1.5 text-sm font-medium data-[inset]:ps-8', props.class))
</script>

<template>
  <DropdownMenuLabelPrimitive
    data-slot="dropdown-menu-label"
    :data-inset="inset || undefined"
    :class="classes"
  >
    <slot />
  </DropdownMenuLabelPrimitive>
</template>
```

```vue
<!-- DropdownMenuSeparator.vue -->
<script setup lang="ts">
import { DropdownMenuSeparator as DropdownMenuSeparatorPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
const classes = computed(() => cn('-mx-1 my-1 h-px bg-border', props.class))
</script>

<template>
  <DropdownMenuSeparatorPrimitive data-slot="dropdown-menu-separator" :class="classes" />
</template>
```

- [ ] **Step 7: 导出新组件**

在 `packages/vue/src/index.ts` 的 `Button` 导出后追加：

```ts
export { default as Avatar } from './components/ui/avatar/Avatar.vue'
export { default as AvatarImage } from './components/ui/avatar/AvatarImage.vue'
export { default as AvatarFallback } from './components/ui/avatar/AvatarFallback.vue'
export { default as DropdownMenu } from './components/ui/dropdown-menu/DropdownMenu.vue'
export { default as DropdownMenuTrigger } from './components/ui/dropdown-menu/DropdownMenuTrigger.vue'
export { default as DropdownMenuContent } from './components/ui/dropdown-menu/DropdownMenuContent.vue'
export { default as DropdownMenuItem } from './components/ui/dropdown-menu/DropdownMenuItem.vue'
export { default as DropdownMenuLabel } from './components/ui/dropdown-menu/DropdownMenuLabel.vue'
export { default as DropdownMenuSeparator } from './components/ui/dropdown-menu/DropdownMenuSeparator.vue'
```

- [ ] **Step 8: 扩展 DataTable 与 ProTable**

`DataTable.vue`：props 增加 `tableLabel?: string`；`<table>` 增加 `:aria-label="tableLabel"`；`<th>` 增加：

```ts
function ariaSort(column: { getIsSorted: () => false | 'asc' | 'desc' }) {
  const sorted = column.getIsSorted()
  return sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
}
```

```html
:aria-sort="header.column.getCanSort() ? ariaSort(header.column) : undefined"
```

`ProTable.vue`：`<DataTable ... :table-label="tableLabel" />`。`types.ts` 的 `ProTableProps` 增加 `tableLabel?: string`。

- [ ] **Step 9: 扩展 `pro-table.test.ts`**

把 `mountTable` 改为返回 `{ wrapper, table }`，并新增两个用例：

```ts
it('labels the table region', () => {
  const wrapper = mount(DataTable as never, {
    props: { table: makeTable(), tableLabel: 'Members' },
  })
  expect(wrapper.get('table').attributes('aria-label')).toBe('Members')
})

it('exposes aria-sort on sortable headers', async () => {
  const { wrapper, table } = mountTable()
  table.getColumn('name')?.toggleSorting(false)
  await nextTick()
  expect(wrapper.get('thead th').attributes('aria-sort')).toBe('ascending')
  table.getColumn('name')?.toggleSorting(true)
  await nextTick()
  expect(wrapper.get('thead th').attributes('aria-sort')).toBe('descending')
})
```

同时把 `columns` 中的 name 列设为 `{ accessorKey: 'name', header: 'Name', enableSorting: true }`，并在测试文件引入 `nextTick`。

- [ ] **Step 10: 验证并提交**

Run:

```bash
pnpm --filter @fish-admin/vue test
pnpm --filter @fish-admin/vue typecheck
pnpm --filter @fish-admin/parity-vue test
pnpm exec prettier --check packages/vue/src
pnpm lint
```

Expected: `@fish-admin/vue` 与 `parity-vue` 全绿；typecheck 0；prettier/lint 通过。

```bash
git add packages/vue/src
git commit -m "feat(vue): add avatar and dropdown-menu wrappers with table a11y"
```

---

### Task 3: 配置、i18n、主题、格式化

**Files:**

- Create: `apps/vue-template/src/config/env.ts`
- Create: `apps/vue-template/src/config/env.test.ts`
- Create: `apps/vue-template/src/config/theme.ts`
- Create: `apps/vue-template/src/lib/i18n.ts`
- Create: `apps/vue-template/src/lib/i18n.test.ts`
- Create: `apps/vue-template/src/lib/format.ts`
- Create: `apps/vue-template/src/lib/format.test.ts`
- Create: `apps/vue-template/src/stores/theme.ts`
- Create: `apps/vue-template/src/stores/theme.test.ts`
- Modify: `packages/i18n/locales/en/auth.json`、`zh-CN/auth.json`、`en/common.json`、`zh-CN/common.json`

**Interfaces:**

- Produces: `env`（`apiBaseUrl`、`enableMock`、`mockLatency`、`requestTimeout`）；`applyTheme`、`THEME_MODES`、`ThemeMode`、`STORAGE_KEY`、`readStoredTheme`；`language`、`i18n`、`i18nReady`、`useT`、`setLanguage`、`toggleLanguage`；`useThemeStore`；日期/数字格式化函数。

- [ ] **Step 1: 写失败测试**

`lib/i18n.test.ts`：

```ts
import { beforeEach, describe, expect, it } from 'vitest'

import { i18nReady, language, setLanguage, useT } from './i18n'

describe('i18n', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    localStorage.clear()
  })

  it('updates the ref, html lang and persistence key on change', async () => {
    await setLanguage('zh-CN')
    expect(language.value).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(localStorage.getItem('fish-admin:lang')).toBe('zh-CN')
  })

  it('re-renders translations from the language ref', async () => {
    const t = useT('common')
    expect(t('actions.save')).toBe('Save')
    await setLanguage('zh-CN')
    expect(t('actions.save')).toBe('保存')
  })
})
```

`config/env.test.ts`：

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('env', () => {
  it('uses documented defaults', async () => {
    const { env } = await import('./env')
    expect(env.apiBaseUrl).toBe('/api')
    expect(env.mockLatency).toBe(300)
    expect(env.requestTimeout).toBe(15000)
  })

  it('trims a trailing slash and rejects an unparseable timeout', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/v1/api/')
    const { env } = await import('./env')
    expect(env.apiBaseUrl).toBe('/v1/api')

    vi.resetModules()
    vi.stubEnv('VITE_REQUEST_TIMEOUT', 'soon')
    await expect(import('./env')).rejects.toThrow(/VITE_REQUEST_TIMEOUT/)
  })
})
```

`stores/theme.test.ts`：

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_KEY } from '../config/theme'
import { useThemeStore } from './theme'

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    setActivePinia(createPinia())
  })

  it('reads the React-compatible stored shape', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { mode: 'dark', accent: 'cyan' }, version: 1 }),
    )
    const store = useThemeStore()
    expect(store.mode).toBe('dark')
    expect(store.resolvedMode).toBe('dark')
  })

  it('persists mode with the zustand-compatible envelope', () => {
    const store = useThemeStore()
    store.setMode('dark')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      state: { mode: 'dark', accent: 'violet' },
      version: 1,
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('tracks the system preference until disposed', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined
    const remove = vi.fn()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: (_: string, next: (event: MediaQueryListEvent) => void) => {
          listener = next
        },
        removeEventListener: remove,
      })),
    )

    const store = useThemeStore()
    store.init()
    listener?.({ matches: true } as MediaQueryListEvent)
    expect(store.resolvedMode).toBe('dark')
    store.dispose()
    expect(remove).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 运行确认失败**

```bash
pnpm --filter @fish-admin/vue-template exec vitest run src/lib/i18n.test.ts src/config/env.test.ts src/stores/theme.test.ts
```

Expected: FAIL — 模块不存在。

- [ ] **Step 3: 实现 `config/env.ts`**

复制 `src/config/env.ts` 的 `readNumber`/`readBoolean`，只保留四个变量：

```ts
function readNumber(
  label: string,
  value: string | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (value === undefined || value.trim() === '') return fallback
  const parsed = Number(value.trim())
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid ${label}="${value}" — expected an integer between ${min} and ${max}.`)
  }
  return parsed
}

function readBoolean(label: string, value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === '') return fallback
  const normalized = value.trim()
  if (normalized !== 'true' && normalized !== 'false') {
    throw new Error(`Invalid ${label}="${value}" — expected "true" or "false".`)
  }
  return normalized === 'true'
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = (rawBaseUrl ? rawBaseUrl : '/api').replace(/\/+$/, '')

export const env = {
  apiBaseUrl,
  enableMock: readBoolean(
    'VITE_ENABLE_MOCK',
    import.meta.env.VITE_ENABLE_MOCK,
    import.meta.env.MODE === 'development',
  ),
  mockLatency: readNumber('VITE_MOCK_LATENCY', import.meta.env.VITE_MOCK_LATENCY, 0, 60_000, 300),
  requestTimeout: readNumber(
    'VITE_REQUEST_TIMEOUT',
    import.meta.env.VITE_REQUEST_TIMEOUT,
    1_000,
    300_000,
    15_000,
  ),
} as const
```

- [ ] **Step 4: 实现 `config/theme.ts`**

```ts
export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]
export type Accent = 'violet'
export const STORAGE_KEY = 'fish-admin:theme'

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value)
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'> = localStorage) {
  const fallback = { mode: 'system' as ThemeMode, accent: 'violet' as Accent }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as { state?: { mode?: unknown } }
    return {
      mode: isThemeMode(parsed.state?.mode) ? parsed.state.mode : fallback.mode,
      accent: fallback.accent,
    }
  } catch {
    return fallback
  }
}

export function applyTheme(mode: ThemeMode, accent: Accent = 'violet') {
  if (typeof window === 'undefined') return
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark)
  const root = document.documentElement

  root.classList.toggle('dark', isDark)
  root.dataset.accent = accent
  root.style.colorScheme = isDark ? 'dark' : 'light'
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? '#191820' : '#fcfbfd')
}
```

- [ ] **Step 5: 实现 `lib/format.ts`**

逐字复制 React `src/lib/format.ts` 的 `toIntlLocale` 与 `formatDate` / `formatDateTime` / `formatNumber` / `formatCompactNumber` / `formatCurrency` / `formatPercent` / `formatRelativeTime`。测试：

```ts
import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatPercent, formatRelativeTime } from './format'

describe('format', () => {
  it('uses the zh-CN locale for zh languages', () => {
    expect(formatDate('2026-11-11T00:00:00Z', 'zh-CN', { dateStyle: 'medium' })).toContain('2026')
    expect(formatCurrency(1200, 'en')).toBe('$1,200')
    expect(formatPercent(12.34, 'en')).toBe('12.3%')
  })

  it('formats relative time with Intl.RelativeTimeFormat', () => {
    expect(formatRelativeTime(Date.now() - 60_000, 'en')).toContain('minute')
  })
})
```

- [ ] **Step 6: 实现 `lib/i18n.ts`**

```ts
import {
  currentLanguage,
  ensureNamespaces,
  nextLanguage,
  setupI18n,
  type SupportedLanguage,
} from '@fish-admin/i18n'
import type { TOptions } from 'i18next'
import { ref } from 'vue'

const setup = setupI18n({ storageKey: 'fish-admin:lang' })

export const i18n = setup.i18n
export const language = ref<SupportedLanguage>(setup.initialLanguage)
export const i18nReady = setup.ready.then(() =>
  ensureNamespaces(['auth', 'dashboard', 'users', 'validation']),
)

i18n.on('languageChanged', () => {
  language.value = currentLanguage()
})

export function setLanguage(next: SupportedLanguage) {
  return setup.changeLanguage(next)
}

export async function toggleLanguage() {
  const next = nextLanguage(language.value)
  if (next) await setLanguage(next)
}

export function useT(namespace?: string) {
  return (key: string, options?: TOptions) => {
    // Reading the ref registers the template's dependency on language changes.
    void language.value
    return i18n.t(key, namespace ? { ...options, ns: namespace } : options)
  }
}
```

- [ ] **Step 7: 实现 `stores/theme.ts`**

```ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { applyTheme, readStoredTheme, STORAGE_KEY, type ThemeMode } from '../config/theme'

export const useThemeStore = defineStore('theme', () => {
  const stored = readStoredTheme()
  const mode = ref<ThemeMode>(stored.mode)
  const systemDark = ref(false)
  let media: MediaQueryList | null = null

  const resolvedMode = computed<'light' | 'dark'>(() =>
    mode.value === 'system' ? (systemDark.value ? 'dark' : 'light') : mode.value,
  )

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { mode: mode.value, accent: 'violet' }, version: 1 }),
    )
  }

  function apply() {
    applyTheme(resolvedMode.value, 'violet')
  }

  function handleChange(event: MediaQueryListEvent) {
    systemDark.value = event.matches
    apply()
  }

  function setMode(next: ThemeMode) {
    mode.value = next
    persist()
    apply()
  }

  function init() {
    media = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = media.matches
    media.addEventListener('change', handleChange)
    apply()
  }

  function dispose() {
    media?.removeEventListener('change', handleChange)
    media = null
  }

  return { mode, systemDark, resolvedMode, setMode, init, dispose }
})
```

- [ ] **Step 8: 新增两个双语键**

`packages/i18n/locales/en/auth.json` 的 `"invalidCredentials"` 之后加：

```json
"mfaUnsupported": "Two-factor sign-in isn't supported in this Vue demo. Use a demo account without 2FA.",
```

`zh-CN/auth.json` 对应位置：

```json
"mfaUnsupported": "此 Vue 演示暂不支持两步验证登录，请使用未开启 2FA 的演示账号。",
```

`en/common.json` 的 `footer` 块加 `"builtWithVue": "Built with Vue 3, Vue Router and Pinia."`；`zh-CN/common.json` 加 `"builtWithVue": "基于 Vue 3、Vue Router 与 Pinia 构建。"`。

- [ ] **Step 9: 验证并提交**

```bash
pnpm --filter @fish-admin/vue-template exec vitest run src/lib/i18n.test.ts src/config/env.test.ts src/stores/theme.test.ts src/lib/format.test.ts
pnpm --filter @fish-admin/vue-template typecheck
pnpm --filter @fish-admin/i18n test
pnpm exec prettier --check apps/vue-template packages/i18n/locales
pnpm lint
```

Expected: 全部退出码 0；i18n 现有测试不回归。

```bash
git add apps/vue-template packages/i18n/locales
git commit -m "feat(vue-template): add env, i18n, theme and formatting foundation"
```

---

### Task 4: API 客户端、认证状态与权限导航

**Files:**

- Create: `apps/vue-template/src/lib/api-error.ts`
- Create: `apps/vue-template/src/lib/api-client.ts`
- Create: `apps/vue-template/src/lib/api-client.test.ts`
- Create: `apps/vue-template/src/lib/auth-redirect.ts`
- Create: `apps/vue-template/src/lib/auth-redirect.test.ts`
- Create: `apps/vue-template/src/lib/permissions.ts`
- Create: `apps/vue-template/src/lib/permissions.test.ts`
- Create: `apps/vue-template/src/lib/query-client.ts`
- Create: `apps/vue-template/src/config/nav.ts`
- Create: `apps/vue-template/src/config/nav.test.ts`
- Create: `apps/vue-template/src/features/auth/api.ts`
- Create: `apps/vue-template/src/stores/auth.ts`
- Create: `apps/vue-template/src/stores/auth.test.ts`

**Interfaces:**

- Produces: `ApiError(status, code, message)`；`configureApi({ getAccessToken, refreshSession, onSessionExpired })`、`apiRequest<T>(path, options)`；`sanitizeRedirect`、`loginRedirect`；`hasPermission`、`filterNavGroups`；`NAV_GROUPS`、`IMPLEMENTED_PATHS`、`findNavItem`、`findNavGroup`、`isPathActive`；`queryClient`；`loginRequest`/`refreshRequest`/`logoutRequest`/`meRequest`/`TokenPair`/`LoginResponse`/`isMfaRequired`；`useAuthStore`。

- [ ] **Step 1: 写失败测试**

`lib/auth-redirect.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { sanitizeRedirect } from './auth-redirect'

describe('sanitizeRedirect', () => {
  it('keeps in-app paths', () => {
    expect(sanitizeRedirect('/users?page=2')).toBe('/users?page=2')
  })

  it.each([
    undefined,
    '',
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login',
    '/login?redirect=/users',
  ])('rejects %s', (value) => {
    expect(sanitizeRedirect(value)).toBeUndefined()
  })
})
```

`lib/permissions.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { filterNavGroups, hasPermission } from './permissions'
import type { NavGroup } from '../config/nav'

const groups: NavGroup[] = [
  {
    titleKey: 'nav:groups.overview',
    items: [
      { titleKey: 'nav:items.dashboard', to: '/', icon: {} as never, permission: 'dashboard:read' },
      {
        titleKey: 'nav:items.reports',
        to: '/reports',
        icon: {} as never,
        permission: 'report:read',
      },
    ],
  },
  {
    titleKey: 'nav:groups.account',
    items: [{ titleKey: 'nav:items.profile', to: '/profile', icon: {} as never }],
  },
]

describe('permissions', () => {
  it('supports the * wildcard and resource wildcards', () => {
    expect(hasPermission(['*'], 'user:delete')).toBe(true)
    expect(hasPermission(['user:*'], 'user:delete')).toBe(true)
    expect(hasPermission(['user:read'], 'user:delete')).toBe(false)
  })

  it('filters items and drops empty groups', () => {
    const filtered = filterNavGroups(groups, ['dashboard:read'])
    expect(filtered).toHaveLength(2)
    expect(filtered[0]?.items.map((item) => item.to)).toEqual(['/', '/profile'])
  })
})
```

`stores/auth.test.ts`：

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../lib/api-error'
import { queryClient } from '../lib/query-client'
import {
  isMfaRequired,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
} from '../features/auth/api'
import { useAuthStore } from './auth'

vi.mock('../features/auth/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/auth/api')>()),
  loginRequest: vi.fn(),
  refreshRequest: vi.fn(),
  logoutRequest: vi.fn(),
  meRequest: vi.fn(),
}))

const user = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@fish.dev',
  roleId: 'r1',
  roleName: 'Admin',
  permissions: ['*'],
  emailVerified: true,
  twoFactorEnabled: false,
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(loginRequest).mockReset()
    vi.mocked(refreshRequest).mockReset()
    vi.mocked(logoutRequest).mockReset()
    vi.mocked(meRequest).mockReset()
  })

  it('logs in, loads the user and persists only tokens', async () => {
    vi.mocked(loginRequest).mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' })
    vi.mocked(meRequest).mockResolvedValue(user)
    const store = useAuthStore()

    await store.login('ada@fish.dev', 'secret')

    expect(store.status).toBe('authenticated')
    expect(store.user?.name).toBe('Ada')
    expect(JSON.parse(localStorage.getItem('fish-admin:session') ?? '{}')).toEqual({
      state: { accessToken: 'a1', refreshToken: 'r1' },
      version: 1,
    })
    expect(isMfaRequired({ accessToken: 'x', refreshToken: 'y' })).toBe(false)
  })

  it('clears the session when login fails', async () => {
    vi.mocked(loginRequest).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'nope'))
    const store = useAuthStore()
    await expect(store.login('a@b.c', 'x')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(store.status).toBe('anonymous')
    expect(store.accessToken).toBeNull()
  })

  it('restores a cached access token on bootstrap', async () => {
    localStorage.setItem(
      'fish-admin:session',
      JSON.stringify({
        state: { accessToken: 'cached', refreshToken: 'r1' },
        version: 1,
      }),
    )
    vi.mocked(meRequest).mockResolvedValue(user)
    const store = useAuthStore()

    await store.bootstrap()

    expect(store.status).toBe('authenticated')
    expect(meRequest).toHaveBeenCalledWith('cached')
  })

  it('shares one refresh request between concurrent callers', async () => {
    localStorage.setItem(
      'fish-admin:session',
      JSON.stringify({
        state: { accessToken: 'old', refreshToken: 'r1' },
        version: 1,
      }),
    )
    let resolve!: (value: { accessToken: string; refreshToken: string }) => void
    vi.mocked(refreshRequest).mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    const store = useAuthStore()

    const first = store.refreshSession()
    const second = store.refreshSession()
    resolve({ accessToken: 'new', refreshToken: 'r2' })

    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
    expect(refreshRequest).toHaveBeenCalledTimes(1)
    expect(store.accessToken).toBe('new')
  })

  it('logs out locally even when the network call fails', async () => {
    vi.mocked(loginRequest).mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' })
    vi.mocked(meRequest).mockResolvedValue(user)
    vi.mocked(logoutRequest).mockRejectedValue(new Error('offline'))
    const clear = vi.spyOn(queryClient, 'clear')
    const store = useAuthStore()
    await store.login('ada@fish.dev', 'secret')

    await store.logout()

    expect(store.status).toBe('anonymous')
    expect(store.accessToken).toBeNull()
    expect(clear).toHaveBeenCalled()
  })
})
```

`config/nav.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { findNavItem, IMPLEMENTED_PATHS, NAV_GROUPS } from './nav'

describe('nav', () => {
  it('only exposes implemented paths', () => {
    const paths = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to))
    expect(paths.sort()).toEqual([...IMPLEMENTED_PATHS].sort())
  })

  it('finds the active item', () => {
    expect(findNavItem('/users')?.to).toBe('/users')
    expect(findNavItem('/')?.to).toBe('/')
    expect(findNavItem('/reports')).toBeUndefined()
  })
})
```

- [ ] **Step 2: 运行确认失败**

```bash
pnpm --filter @fish-admin/vue-template exec vitest run src/lib/auth-redirect.test.ts src/lib/permissions.test.ts src/stores/auth.test.ts src/config/nav.test.ts
```

- [ ] **Step 3: 实现 `lib/api-error.ts` 与 `lib/api-client.ts`**

```ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

`api-client.ts`：复制 React `src/lib/api-client.ts` 的 `parseError`/`performFetch`/401 重试逻辑，但用注入配置代替 store：

```ts
import { env } from '../config/env'
import { ApiError } from './api-error'

interface ApiClientConfig {
  getAccessToken: () => string | null
  refreshSession: () => Promise<boolean>
  onSessionExpired: () => void
}

export interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  auth?: boolean
  token?: string
  retry?: boolean
  timeoutMs?: number
}

let config: ApiClientConfig | null = null
export function configureApi(next: ApiClientConfig) {
  config = next
}

function requireConfig() {
  if (!config)
    throw new ApiError(0, 'API_NOT_CONFIGURED', 'configureApi must run before the first request.')
  return config
}

async function parseError(response: Response) {
  /* 逐字复制 React 实现 */
}

async function performFetch(path: string, options: RequestOptions, accessToken: string | null) {
  const {
    method = 'GET',
    body,
    headers: extraHeaders,
    signal,
    timeoutMs = env.requestTimeout,
  } = options
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  try {
    return await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...extraHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeoutSignal.aborted)
      throw new ApiError(0, 'REQUEST_TIMEOUT', `Request to ${path} timed out after ${timeoutMs}ms.`)
    throw new ApiError(0, 'NETWORK_ERROR', `Request to ${path} never reached the API.`)
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, retry = true, token } = options
  const client = auth ? requireConfig() : null
  const accessToken = token ?? (client ? client.getAccessToken() : null)
  const response = await performFetch(path, options, accessToken)

  if (response.status === 401 && client) {
    if (retry && (await client.refreshSession())) {
      return apiRequest<T>(path, { ...options, retry: false })
    }
    client.onSessionExpired()
    throw await parseError(response)
  }
  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
```

`api-client.test.ts`：

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api-error'
import { apiRequest, configureApi } from './api-client'

const onSessionExpired = vi.fn()
const refreshSession = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  configureApi({ getAccessToken: () => 'token-1', refreshSession, onSessionExpired })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('apiRequest', () => {
  it('attaches the injected bearer', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await apiRequest('/users')
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer token-1',
    })
  })

  it('refreshes once on 401 and retries', async () => {
    refreshSession.mockResolvedValue(true)
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
    await expect(apiRequest('/users')).resolves.toEqual({ ok: true })
    expect(refreshSession).toHaveBeenCalledTimes(1)
  })

  it('expires the session when refresh fails', async () => {
    refreshSession.mockResolvedValue(false)
    vi.mocked(fetch).mockResolvedValue(new Response('{"code":"TOKEN_EXPIRED"}', { status: 401 }))
    await expect(apiRequest('/users')).rejects.toBeInstanceOf(ApiError)
    expect(onSessionExpired).toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: 实现 `lib/auth-redirect.ts`、`lib/permissions.ts`、`lib/query-client.ts`**

```ts
export function sanitizeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\'))
    return undefined
  if (value === '/login' || value.startsWith('/login?')) return undefined
  return value
}

export function loginRedirect(path: string) {
  return `/login?redirect=${encodeURIComponent(path)}`
}
```

```ts
import { hasPermission } from '@fish-admin/contracts'

import type { NavGroup } from '../config/nav'

export { hasPermission }

export function filterNavGroups(groups: NavGroup[], granted: readonly string[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(granted, item.permission)),
    }))
    .filter((group) => group.items.length > 0)
}
```

```ts
import { QueryClient } from '@tanstack/vue-query'
import { ApiError } from './api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false
        if (error instanceof ApiError) return error.status >= 500 || error.status === 0
        return true
      },
    },
    mutations: { retry: false },
  },
})
```

- [ ] **Step 5: 实现 `config/nav.ts`**

```ts
import { NAV_CONTRACT } from '@fish-admin/contracts'
import {
  BarChart3,
  Bell,
  BookMarked,
  Boxes,
  CircleDot,
  FolderKanban,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Palette,
  Plug,
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Workflow,
} from 'lucide-vue-next'
import type { Component } from 'vue'

export interface NavItem {
  titleKey: string
  to: string
  icon: Component
  permission?: string
}
export interface NavGroup {
  titleKey: string
  items: NavItem[]
}

const ICONS: Record<string, Component> = {
  'bar-chart-3': BarChart3,
  bell: Bell,
  'book-marked': BookMarked,
  boxes: Boxes,
  'circle-dot': CircleDot,
  'folder-kanban': FolderKanban,
  'folder-open': FolderOpen,
  'key-round': KeyRound,
  'layout-dashboard': LayoutDashboard,
  'lock-keyhole': LockKeyhole,
  network: Network,
  palette: Palette,
  plug: Plug,
  'scroll-text': ScrollText,
  'settings-2': Settings2,
  'shield-check': ShieldCheck,
  'user-round': UserRound,
  users: Users,
  workflow: Workflow,
}

export const IMPLEMENTED_PATHS = new Set(['/', '/users'])

export const NAV_GROUPS: NavGroup[] = NAV_CONTRACT.map((group) => ({
  titleKey: group.titleKey,
  items: group.items
    .filter((item) => IMPLEMENTED_PATHS.has(item.to))
    .map((item) => ({
      titleKey: item.titleKey,
      to: item.to,
      icon: ICONS[item.icon] ?? CircleDot,
      ...(item.permission ? { permission: item.permission } : {}),
    })),
})).filter((group) => group.items.length > 0)

export function isPathActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function findNavItem(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  return groups.flatMap((group) => group.items).find((item) => isPathActive(pathname, item.to))
}

export function findNavGroup(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  const item = findNavItem(pathname, groups)
  return item ? groups.find((group) => group.items.includes(item)) : undefined
}
```

- [ ] **Step 6: 实现 `features/auth/api.ts`**

只保留本切片需要的五个导出，形状与 React 一致：

```ts
import { apiRequest } from '../../lib/api-client'
import type { AuthUser } from '@fish-admin/contracts'

export interface TokenPair {
  accessToken: string
  refreshToken: string
}
export interface MfaRequiredResponse {
  mfaRequired: true
  challengeId: string
  expiresAt: string
}
export type LoginResponse = TokenPair | MfaRequiredResponse

export function isMfaRequired(result: LoginResponse): result is MfaRequiredResponse {
  return 'mfaRequired' in result && result.mfaRequired === true
}

export function loginRequest(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}
export function refreshRequest(refreshToken: string) {
  return apiRequest<TokenPair>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  })
}
export function logoutRequest(refreshToken: string) {
  return apiRequest<void>('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false })
}
export function meRequest(accessToken: string) {
  return apiRequest<AuthUser>('/auth/me', { token: accessToken, auth: false })
}
```

- [ ] **Step 7: 实现 `stores/auth.ts`**

```ts
import type { AuthUser } from '@fish-admin/contracts'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import {
  isMfaRequired,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  type LoginResponse,
  type TokenPair,
} from '../features/auth/api'
import { ApiError } from '../lib/api-error'
import { queryClient } from '../lib/query-client'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'
const SESSION_KEY = 'fish-admin:session'

function readStoredSession() {
  const empty = { accessToken: null as string | null, refreshToken: null as string | null }
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as { state?: { accessToken?: unknown; refreshToken?: unknown } }
    return {
      accessToken: typeof parsed.state?.accessToken === 'string' ? parsed.state.accessToken : null,
      refreshToken:
        typeof parsed.state?.refreshToken === 'string' ? parsed.state.refreshToken : null,
    }
  } catch {
    return empty
  }
}

let refreshInFlight: Promise<boolean> | null = null
let bootstrapInFlight: Promise<void> | null = null

export const useAuthStore = defineStore('auth', () => {
  const stored = readStoredSession()
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(stored.accessToken)
  const refreshToken = ref<string | null>(stored.refreshToken)
  const status = ref<AuthStatus>('idle')

  watch([accessToken, refreshToken], () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        state: { accessToken: accessToken.value, refreshToken: refreshToken.value },
        version: 1,
      }),
    )
  })

  function clearSession() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    status.value = 'anonymous'
  }

  async function completeLogin(tokens: TokenPair) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    status.value = 'loading'
    try {
      user.value = await meRequest(tokens.accessToken)
      status.value = 'authenticated'
      queryClient.clear()
    } catch (error) {
      clearSession()
      throw error
    }
  }

  async function login(email: string, password: string): Promise<LoginResponse> {
    status.value = 'loading'
    try {
      const result = await loginRequest(email, password)
      if (isMfaRequired(result)) {
        throw new ApiError(200, 'MFA_NOT_SUPPORTED', 'Two-factor sign-in is not supported.')
      }
      await completeLogin(result)
      return result
    } catch (error) {
      clearSession()
      throw error
    }
  }

  async function logout() {
    const token = refreshToken.value
    clearSession()
    queryClient.clear()
    if (token) {
      try {
        await logoutRequest(token)
      } catch {
        // The local session is already gone; a failed network call is harmless.
      }
    }
  }

  async function bootstrap() {
    if (bootstrapInFlight) return bootstrapInFlight
    bootstrapInFlight = (async () => {
      status.value = 'loading'
      if (!refreshToken.value) {
        status.value = 'anonymous'
        return
      }
      if (accessToken.value) {
        try {
          user.value = await meRequest(accessToken.value)
          status.value = 'authenticated'
          return
        } catch {
          // Expired or rejected; refresh below.
        }
      }
      if (!(await refreshSession())) {
        status.value = 'anonymous'
        return
      }
      if (!accessToken.value) {
        status.value = 'anonymous'
        return
      }
      try {
        user.value = await meRequest(accessToken.value)
        status.value = 'authenticated'
      } catch {
        clearSession()
      }
    })().finally(() => {
      bootstrapInFlight = null
    })
    return bootstrapInFlight
  }

  async function refreshSession() {
    if (refreshInFlight) return refreshInFlight
    const current = refreshToken.value
    if (!current) return false
    refreshInFlight = (async () => {
      try {
        const tokens = await refreshRequest(current)
        accessToken.value = tokens.accessToken
        refreshToken.value = tokens.refreshToken
        return true
      } catch {
        accessToken.value = null
        refreshToken.value = null
        return false
      }
    })().finally(() => {
      refreshInFlight = null
    })
    return refreshInFlight
  }

  return {
    user,
    accessToken,
    refreshToken,
    status,
    login,
    logout,
    bootstrap,
    refreshSession,
    clearSession,
  }
})
```

- [ ] **Step 8: 验证并提交**

```bash
pnpm --filter @fish-admin/vue-template exec vitest run src/lib src/config src/stores
pnpm --filter @fish-admin/vue-template typecheck
pnpm exec prettier --check apps/vue-template
pnpm lint
```

Expected: 全部通过。

```bash
git add apps/vue-template
git commit -m "feat(vue-template): add api client, auth store and permission nav"
```

---

### Task 5: 外壳与通用组件

**Files:**

- Create: `apps/vue-template/src/components/common/{BrandMark,PageHeader,EmptyState,ErrorState}.vue`
- Create: `apps/vue-template/src/components/layout/{AppShell,AppSidebar,AppHeader,AppBreadcrumbs,UserMenu,ThemeToggle,LanguageToggle}.vue`
- Create: `apps/vue-template/src/components/layout/AppSidebar.test.ts`
- Create: `apps/vue-template/src/stores/ui.ts`
- Create: `apps/vue-template/src/lib/initials.ts`

**Interfaces:**

- Produces: `useUiStore`（`collapsed`、`mobileOpen`、`toggleCollapsed`、`openMobile`、`closeMobile`）；`getInitials`；`AppShell`（默认插槽）；侧边栏 `#sidebar-trigger` 供焦点回收。

- [ ] **Step 1: 写 AppSidebar 失败测试**

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import AppSidebar from './AppSidebar.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/users', component: Stub },
    ],
  })
}

function seedUser(permissions: string[]) {
  const auth = useAuthStore()
  auth.user = {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions,
    emailVerified: true,
    twoFactorEnabled: false,
  }
  auth.status = 'authenticated'
}

describe('AppSidebar', () => {
  beforeEach(async () => {
    await i18nReady
    setActivePinia(createPinia())
    localStorage.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('filters items by permission and marks the active route', async () => {
    seedUser(['dashboard:read', 'user:read'])
    const router = makeRouter()
    await router.push('/users')

    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })

    const links = wrapper.findAll('nav a[data-sidebar-link]')
    expect(links.map((link) => link.text())).toEqual(['Dashboard', 'Users'])
    expect(wrapper.get('a[aria-current="page"]').attributes('href')).toBe('/users')
  })

  it('hides users without user:read', () => {
    seedUser(['dashboard:read'])
    const wrapper = mount(AppSidebar, { global: { plugins: [makeRouter()] } })
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).not.toContain('Users')
  })

  it('closes the mobile drawer with Escape and restores focus', async () => {
    seedUser(['dashboard:read'])
    const router = makeRouter()
    await router.push('/')
    const trigger = document.createElement('button')
    trigger.id = 'sidebar-trigger'
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })
    const ui = useUiStore()
    ui.openMobile()
    await flushPromises()

    const drawer = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(drawer).toBeTruthy()
    expect(document.activeElement?.getAttribute('data-sidebar-link')).not.toBeNull()

    drawer?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()

    expect(ui.mobileOpen).toBe(false)
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })
})
```

- [ ] **Step 2: 实现 `lib/initials.ts` 与 `stores/ui.ts`**

```ts
export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
```

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const collapsed = ref(false)
  const mobileOpen = ref(false)
  const toggleCollapsed = () => {
    collapsed.value = !collapsed.value
  }
  const openMobile = () => {
    mobileOpen.value = true
  }
  const closeMobile = () => {
    mobileOpen.value = false
  }
  return { collapsed, mobileOpen, toggleCollapsed, openMobile, closeMobile }
})
```

- [ ] **Step 3: 实现通用组件**

`BrandMark.vue`：`bg-brand shadow-glow flex size-9 shrink-0 items-center justify-center rounded-xl text-white` + `<Fish class="size-5" :stroke-width="2.2" />`，接受 `class` 合并。

`PageHeader.vue`：

```vue
<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold tracking-tight sm:text-2xl">{{ title }}</h1>
      <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
```

`EmptyState.vue` 与 `ErrorState.vue` 逐字使用 React `src/components/common/empty-state.tsx` / `error-state.tsx` 的 class；`ErrorState` 的重试按钮文案用 `useT('common')('actions.retry')`。

- [ ] **Step 4: 实现两个切换器**

`ThemeToggle.vue`：`DropdownMenu` + ghost icon Button（`size-9`、`aria-label=t('theme.toggle')`）+ `Sun`（`dark:hidden`）/`Moon`（`hidden dark:block`）；内容 `align="end" class="w-44"`，Label `theme.label`，分隔线，遍历 `THEME_MODES`，图标 `Sun/Moon/Monitor`，选中时 `Check class="ms-auto size-4"`；点击 `useThemeStore().setMode(option)`。

`LanguageToggle.vue`：ghost icon Button（`aria-label=t('language.switch')`）+ `Languages`；内容遍历 `SUPPORTED_LANGUAGES`，`language.value === code` 显示 Check，点击 `void setLanguage(code)`。

- [ ] **Step 5: 实现 `UserMenu.vue`**

- 触发器：`DropdownMenuTrigger as-child` + `Button variant="ghost" class="h-9 gap-2 px-1.5 md:pe-2"`，`aria-label="\`${getInitials(user.name)} ${user.name} — ${t('common:header.account')}\`"`。
- 头像 `Avatar class="size-7" aria-hidden="true"`，Fallback `bg-primary/12 text-[11px] font-semibold text-accent-foreground`。
- 姓名 `hidden max-w-28 truncate text-sm font-medium lg:block`；`ChevronDown hidden size-3.5 text-muted-foreground lg:block`。
- 内容 `align="end" class="w-60"`；Label `class="font-normal"` 内姓名/邮箱/角色 pill（`mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-accent-foreground`）。
- 只有一项：`DropdownMenuItem variant="destructive" @select="signOut"`，`LogOut class="size-4"`，文案 `t('common:userMenu.signOut')`。
- `signOut`：`await auth.logout(); await router.replace('/login')`。

- [ ] **Step 6: 实现 `AppBreadcrumbs.vue`、`AppHeader.vue`、`AppShell.vue`**

`AppBreadcrumbs`：`<nav aria-label="Breadcrumb" class="hidden items-center gap-1.5 text-sm sm:flex">`；Home 用 `RouterLink to="/"` + `House class="size-3.5"`；当前页与分组用 `aria-current="page"`；分组标题仅在 `lg` 显示。

`AppHeader`：

```vue
<header
  class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6"
>
  <Button id="sidebar-trigger" variant="ghost" size="icon" class="-ms-1.5 size-9" :aria-label="t('common:header.toggleSidebar')" @click="toggleSidebar">
    <PanelLeft class="size-4" />
  </Button>
  <span class="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
  <AppBreadcrumbs />
  <div class="ms-auto flex items-center gap-0.5 sm:gap-1">
    <ThemeToggle />
    <LanguageToggle />
    <span class="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
    <UserMenu />
  </div>
</header>
```

`toggleSidebar()`：`window.matchMedia('(min-width: 1024px)').matches ? ui.toggleCollapsed() : ui.openMobile()`。

`AppShell.vue`：

```vue
<template>
  <div class="flex min-h-svh bg-background">
    <AppSidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />
      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <slot />
      </main>
      <footer
        class="mt-auto flex flex-col gap-1 border-t px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <span>{{ t('common:footer.builtWithVue') }}</span>
        <span>{{ __APP_VERSION__ }} · {{ t('common:footer.license') }}</span>
      </footer>
    </div>
  </div>
</template>
```

- [ ] **Step 7: 实现 `AppSidebar.vue`**

桌面：`<aside class="hidden border-e bg-sidebar text-sidebar-foreground lg:flex lg:flex-col" :class="ui.collapsed ? 'w-16' : 'w-64'">`；品牌链接 `/`（`flex items-center gap-2.5 px-1.5 py-1`），折叠时隐藏文字；`<nav :aria-label="t('common:sidebar.mobileTitle')" class="flex-1 space-y-3 overflow-y-auto px-2 py-4">`；分组标题 `px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase`；链接 class `flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`，激活 `bg-sidebar-accent text-sidebar-accent-foreground font-medium`，并加 `aria-current="page"`、`data-sidebar-link`、折叠时 `:title="t(item.titleKey)"`。底部 demo 卡片 class `rounded-xl border border-sidebar-border/60 bg-sidebar-accent/60 p-2.5` 与版本 `text-[11px] text-muted-foreground`（折叠时隐藏）。

移动抽屉：

```vue
<Teleport to="body">
  <div v-if="ui.mobileOpen" class="fixed inset-0 z-50 lg:hidden">
    <div class="absolute inset-0 bg-black/50" @click="ui.closeMobile" />
    <aside
      ref="drawer"
      role="dialog"
      aria-modal="true"
      :aria-label="t('common:sidebar.mobileTitle')"
      class="absolute inset-y-0 start-0 flex w-72 flex-col border-e bg-sidebar text-sidebar-foreground shadow-xl"
      @keydown.esc="ui.closeMobile"
    >
      <!-- 与桌面相同的品牌、nav、footer；链接同样带 data-sidebar-link -->
    </aside>
  </div>
</Teleport>
```

`watch(() => ui.mobileOpen, async (open) => { await nextTick(); if (open) drawer.value?.querySelector<HTMLElement>('[data-sidebar-link]')?.focus(); else document.getElementById('sidebar-trigger')?.focus() })`。链接点击后调用 `ui.closeMobile()`。

- [ ] **Step 8: 运行测试并提交**

```bash
pnpm --filter @fish-admin/vue-template exec vitest run src/components/layout/AppSidebar.test.ts
pnpm --filter @fish-admin/vue-template typecheck
pnpm exec prettier --check apps/vue-template/src
pnpm lint
```

```bash
git add apps/vue-template/src
git commit -m "feat(vue-template): add the sidebar shell and shared chrome"
```

---

### Task 6: Dashboard

**Files:**

- Create: `apps/vue-template/src/features/dashboard/{api,queries,DashboardPage,KpiCards,ActivityList}.{ts,vue}`

**Interfaces:**

- Produces: `fetchDashboard(range, signal)`、`dashboardQueryOptions(range)`；`DashboardPage` 无 props；KPI 卡 `<article>` 4 个；活动列表取前 8 条。

- [ ] **Step 1: 实现 `api.ts` 与 `queries.ts`**

```ts
import type { DashboardData, DashboardRange } from '@fish-admin/contracts'
import { apiRequest } from '../../lib/api-client'

export function fetchDashboard(range: DashboardRange, signal?: AbortSignal) {
  return apiRequest<DashboardData>(`/dashboard?range=${range}`, { signal })
}
```

```ts
import type { DashboardRange } from '@fish-admin/contracts'
import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import { fetchDashboard } from './api'

export function dashboardQueryOptions(range: MaybeRef<DashboardRange>) {
  return queryOptions({
    queryKey: computed(() => ['dashboard', unref(range)]),
    queryFn: ({ signal }) => fetchDashboard(unref(range), signal),
    placeholderData: keepPreviousData,
  })
}
```

- [ ] **Step 2: 实现 `KpiCards.vue`**

移动 React 的 `KPI_META`（Wallet/Users/UserPlus/Target，tile class、format），用 `formatCurrency/formatNumber/formatPercent` 与 `language.value`。每张卡：

```vue
<article
  :aria-label="t(`kpis.${kpi.id}`)"
  class="shadow-soft overflow-hidden rounded-xl border bg-card text-card-foreground"
>
  <div class="relative p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <p class="text-sm font-medium text-muted-foreground">{{ t(`kpis.${kpi.id}`) }}</p>
        <p class="text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.65rem]">{{ formatValue(kpi) }}</p>
      </div>
      <span :class="cn('flex size-10 shrink-0 items-center justify-center rounded-xl', meta.tile)">
        <component :is="meta.icon" class="size-5" aria-hidden="true" />
      </span>
    </div>
    <div class="mt-4 flex items-center gap-1.5 text-xs">
      <span :class="cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium', positive ? 'bg-success/12 text-success' : 'bg-destructive/10 text-destructive')">
        <TrendingUp v-if="positive" class="size-3" aria-hidden="true" />
        <TrendingDown v-else class="size-3" aria-hidden="true" />
        {{ positive ? '+' : '' }}{{ formatPercent(kpi.change, language) }}
      </span>
      <span class="text-muted-foreground">{{ t('common:units.vsPrevious') }}</span>
    </div>
  </div>
</article>
```

网格 `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`；loading 时渲染 4 个 `Skeleton` 的同构卡片。

- [ ] **Step 3: 实现 `ActivityList.vue`**

逐字移动 React 的 `ACTION_ICONS` / `ACTION_TILES`，列表 `divide-y divide-border`，项 `flex items-start gap-3 py-3 first:pt-0 last:pb-0`，tile `mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg`，文案 `t('activity.*', { actor, target })`，时间 `formatRelativeTime(item.createdAt, language.value)`；空态 `EmptyState :title="t('activity.empty')" class="py-10"`。

- [ ] **Step 4: 实现 `DashboardPage.vue`**

```vue
<script setup lang="ts">
import type { DashboardRange } from '@fish-admin/contracts'
import { useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'

import PageHeader from '../../components/common/PageHeader.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import { useT } from '../../lib/i18n'
import ActivityList from './ActivityList.vue'
import KpiCards from './KpiCards.vue'
import { dashboardQueryOptions } from './queries'

const t = useT('dashboard')
const range = ref<DashboardRange>(7)
const query = useQuery(dashboardQueryOptions(range))
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="t('title')" :description="t('subtitle')">
      <template #actions>
        <div class="flex items-center gap-1 rounded-lg border bg-card p-1">
          <button
            v-for="option in [7, 30] as const"
            :key="option"
            type="button"
            :aria-pressed="range === option"
            :class="
              range === option
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            "
            class="rounded-md px-3 py-1 text-xs font-medium transition"
            @click="range = option"
          >
            {{ t(`range.${option}`) }}
          </button>
        </div>
      </template>
    </PageHeader>

    <div v-if="query.isPending.value" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="index in 4"
        :key="index"
        class="h-32 animate-pulse rounded-xl border bg-muted/40"
      />
    </div>
    <ErrorState
      v-else-if="query.isError.value"
      :title="t('errors.title')"
      :description="t('errors.description')"
      @retry="query.refetch()"
    />
    <template v-else>
      <KpiCards :kpis="query.data.value?.kpis ?? []" />
      <section class="shadow-soft rounded-xl border bg-card p-5 text-card-foreground">
        <div class="mb-4 space-y-1">
          <h2 class="leading-none font-semibold">{{ t('charts.activity.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ t('charts.activity.description') }}</p>
        </div>
        <ActivityList :items="(query.data.value?.activity ?? []).slice(0, 8)" />
      </section>
    </template>
  </div>
</template>
```

不渲染 revenue/traffic/channels，不引入 Tour。

- [ ] **Step 5: 验证并提交**

```bash
pnpm --filter @fish-admin/vue-template typecheck
pnpm exec prettier --check apps/vue-template/src/features/dashboard
pnpm lint
```

```bash
git add apps/vue-template/src/features/dashboard
git commit -m "feat(vue-template): add the dashboard KPIs and activity feed"
```

---

### Task 7: Users 列表与增删改

**Files:**

- Create: `apps/vue-template/src/features/users/{api,queries,search,form,columns}.ts`
- Create: `apps/vue-template/src/features/users/{UsersPage,UserFormDialog,DeleteUserDialog}.vue`
- Create: `apps/vue-template/src/features/users/{UsersPage,UserFormDialog,DeleteUserDialog}.test.ts`

**Interfaces:**

- Produces: `fetchUsers`/`fetchRoleOptions`/`fetchDepartments`/`createUser`/`updateUser`/`deleteUser`；`usersQueryOptions(params)`、`userOptionsQueryOptions`；`DEFAULT_USERS_SEARCH`、`UsersSearch`、`UserSortKey`、`SortOrder`；`validateUserForm`、`toUserInput`；`createUserColumns(options)`。

- [ ] **Step 1: 实现 `api.ts`、`search.ts`、`queries.ts`**

`api.ts`：复制 React 的 `UserListParams` 与 URLSearchParams 构造（去掉 `roleId`/`departmentId`/`includeDescendants`/`dataset` 以外未用的参数，保留 `page/pageSize/q/status/sort/order`），再追加：

```ts
import type {
  Department,
  PaginatedResult,
  RoleOption,
  User,
  UserInput,
} from '@fish-admin/contracts'

export function fetchRoleOptions(signal?: AbortSignal) {
  return apiRequest<RoleOption[]>('/roles/options', { signal })
}
export function fetchDepartments(signal?: AbortSignal) {
  return apiRequest<{ items: Department[] }>('/departments', { signal })
}
export function createUser(input: UserInput) {
  return apiRequest<User>('/users', { method: 'POST', body: input })
}
export function updateUser(id: string, input: UserInput) {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
}
export function deleteUser(id: string) {
  return apiRequest<void>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
export type { PaginatedResult }
```

`search.ts`：逐字复制 React `src/features/users/search.ts`，删除 `roleId`、`lastActiveAt` 与 `dataset`：

```ts
export type UserSortKey = 'name' | 'createdAt'
export type SortOrder = 'asc' | 'desc'
export interface UsersSearch {
  page: number
  pageSize: number
  q?: string
  status?: UserStatus
  sort: UserSortKey
  order: SortOrder
}
export const DEFAULT_USERS_SEARCH: UsersSearch = {
  page: 1,
  pageSize: 10,
  sort: 'createdAt',
  order: 'desc',
}
```

`queries.ts`：

```ts
import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import { fetchDepartments, fetchRoleOptions, fetchUsers, type UserListParams } from './api'

export function usersQueryOptions(params: MaybeRef<UserListParams>) {
  return queryOptions({
    queryKey: computed(() => ['users', unref(params)]),
    queryFn: ({ signal }) => fetchUsers(unref(params), signal),
    placeholderData: keepPreviousData,
  })
}

export const userOptionsQueryOptions = queryOptions({
  queryKey: ['users', 'options'],
  queryFn: async ({ signal }) => {
    const [roles, departments] = await Promise.all([
      fetchRoleOptions(signal),
      fetchDepartments(signal),
    ])
    return { roles, departments: departments.items }
  },
})
```

- [ ] **Step 2: 实现 `form.ts` 与 `columns.ts`**

```ts
import type { UserInput, UserStatus } from '@fish-admin/contracts'

export interface UserFormValues {
  name: string
  email: string
  roleId: string
  status: UserStatus
  departmentId: string
}
export type Translate = (key: string, options?: Record<string, unknown>) => string

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateUserForm(values: UserFormValues, t: Translate) {
  const errors: Partial<Record<keyof UserFormValues, string>> = {}
  if (!values.name.trim()) errors.name = t('validation:required', { field: t('users:form.name') })
  if (!values.email.trim())
    errors.email = t('validation:required', { field: t('users:form.email') })
  else if (!EMAIL.test(values.email.trim())) errors.email = t('validation:email')
  if (!values.roleId) errors.roleId = t('validation:required', { field: t('users:form.role') })
  if (!values.departmentId)
    errors.departmentId = t('validation:required', { field: t('users:form.department') })
  return errors
}

export function toUserInput(values: UserFormValues): UserInput {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    roleId: values.roleId,
    status: values.status,
    departmentId: values.departmentId,
  }
}
```

`columns.ts` 使用 `h()` 生成六列（用户、邮箱、角色、状态、加入时间、操作）。名称与加入时间可排序；表头按钮调用 `column.toggleSorting(column.getIsSorted() === 'asc')`，按钮 class `inline-flex items-center gap-1 uppercase`，排序图标 `ArrowUp/ArrowDown` `size-3`。用户单元格：`Avatar class="size-9"` + Fallback `bg-brand-soft text-xs font-semibold text-primary`；角色 `Badge variant="secondary" class="font-normal"`；状态映射 `active→default`、`invited→secondary`、`inactive→outline`，内部 dot `active:bg-success`、`invited:bg-warning`、`inactive:bg-muted-foreground/60`；加入时间 `formatDate(value, language, { dateStyle: 'medium' })`。操作列仅在 `canEdit || canDelete` 时加入：ghost `size="icon-sm"` 的 `ms-auto` 触发器（`aria-label=t('users:columns.actions')`、`MoreHorizontal size-4`），内容 `align="end"`，编辑项 `Pencil`，删除项 `variant="destructive"` + `Trash2`，`disabled: user.id === currentUserId`，无权限的项不渲染。

- [ ] **Step 3: 实现 `UserFormDialog.vue`**

```vue
<script setup lang="ts">
import type { Department, RoleOption, User, UserStatus } from '@fish-admin/contracts'
import { useQueryClient } from '@tanstack/vue-query'
import { Loader2 } from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'

import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import { createUser, updateUser } from './api'
import { toUserInput, validateUserForm, type UserFormValues } from './form'

const props = defineProps<{
  open: boolean
  user: User | null
  roles: RoleOption[]
  departments: Department[]
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [action: 'created' | 'updated']
}>()
const t = useT()
const queryClient = useQueryClient()
const values = reactive<UserFormValues>({
  name: '',
  email: '',
  roleId: '',
  status: 'active',
  departmentId: '',
})
const errors = ref<Partial<Record<keyof UserFormValues, string>>>({})
const error = ref<string | null>(null)
const submitting = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    values.name = props.user?.name ?? ''
    values.email = props.user?.email ?? ''
    values.roleId = props.user?.roleId ?? ''
    values.status = props.user?.status ?? 'active'
    values.departmentId = props.user?.departmentId ?? ''
    errors.value = {}
    error.value = null
  },
)

function resolveError(cause: unknown) {
  if (!(cause instanceof ApiError)) return t('errors:api.unknown')
  if (cause.code === 'EMAIL_TAKEN') return t('users:emailTaken')
  if (cause.code === 'CANNOT_DEACTIVATE_SELF') return t('users:deactivateSelf')
  if (cause.code === 'CANNOT_CHANGE_OWN_ROLE') return t('users:changeRoleSelf')
  return t('errors:api.unknown')
}

async function submit() {
  errors.value = validateUserForm(values, t)
  if (Object.keys(errors.value).length > 0) return
  submitting.value = true
  error.value = null
  try {
    if (props.user) await updateUser(props.user.id, toUserInput(values))
    else await createUser(toUserInput(values))
    await queryClient.invalidateQueries({ queryKey: ['users'] })
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
    emit('saved', props.user ? 'updated' : 'created')
    emit('update:open', false)
  } catch (cause) {
    error.value = resolveError(cause)
  } finally {
    submitting.value = false
  }
}
</script>
```

模板：`Dialog :open="open" @update:open="emit('update:open', $event)"` + `DialogContent class="sm:max-w-lg"`；标题 `users:form.createTitle|editTitle`、描述；`form class="space-y-4" @submit.prevent="submit"`；姓名/邮箱用 `Label for` + `Input id`，错误 `p class="text-xs text-destructive"`；角色/状态/部门用 `Label` + `Select`（`SelectTrigger :aria-label="..."`）；底部 `Button variant="outline"` 取消 + `Button type="submit" :disabled="submitting"`（`Loader2` + `users:addUser` 或 `common:actions.save`）；错误 `<p role="alert" class="text-sm text-destructive">`。

- [ ] **Step 4: 实现 `DeleteUserDialog.vue`**

`Dialog` 由 `:open="user !== null"` 控制；标题 `t('users:delete.title', { name: user?.name })`；描述 `users:delete.description`；确认按钮 `variant="destructive"`（提交中 `Loader2`），文案 `users:delete.confirm`；`deleteUser(user.id)` 成功后 `invalidateQueries({ queryKey: ['users'] })`、`invalidateQueries({ queryKey: ['roles'] })`、`emit('deleted')`；错误码 `CANNOT_DELETE_SELF` / 403 → 对应 `users:deleteSelf` / `noPermission`，其余 `users:deleteError`，放在 `role="alert"`。

- [ ] **Step 5: 实现 `UsersPage.vue`**

状态与查询：

```ts
const search = reactive<UsersSearch>({ ...DEFAULT_USERS_SEARCH })
const searchValue = ref('')
const params = computed<UserListParams>(() => ({
  page: search.page,
  pageSize: search.pageSize,
  q: search.q,
  status: search.status,
  sort: search.sort,
  order: search.order,
}))
const usersQuery = useQuery(usersQueryOptions(params))
const optionsQuery = useQuery(userOptionsQueryOptions)
const rows = computed(() => usersQuery.data.value?.items ?? [])
const total = computed(() => usersQuery.data.value?.total ?? 0)
const pageCount = computed(() => Math.max(usersQuery.data.value?.pageCount ?? 1, 1))
```

搜索防抖：`watch(searchValue, ...)` 300ms，trim 后写 `search.q` 并把 `page` 置 1；`onBeforeUnmount` 清理计时器。

表格：

```ts
const sorting = computed<SortingState>(() => [{ id: search.sort, desc: search.order === 'desc' }])
const columns = computed(() =>
  createUserColumns({
    t,
    language: language.value,
    currentUserId: auth.user?.id,
    canEdit: canEdit.value,
    canDelete: canDelete.value,
    onEdit: (user) => {
      editing.value = user
      formOpen.value = true
    },
    onDelete: (user) => {
      deleting.value = user
    },
  }),
)
const table = useVueTable({
  data: rows,
  columns,
  state: { sorting },
  manualSorting: true,
  manualPagination: true,
  pageCount: pageCount.value,
  getCoreRowModel: getCoreRowModel(),
  onSortingChange: (updater) => {
    const next = typeof updater === 'function' ? updater(sorting.value) : updater
    const first = next[0]
    if (!first) return
    search.sort = first.id as UserSortKey
    search.order = first.desc ? 'desc' : 'asc'
    search.page = 1
  },
})
```

模板：

- `PageHeader` + `users:title/subtitle`；`#actions` 中仅 `canCreate` 渲染 `Button`（`Plus size-4` + `users:addUser`）。
- 页面级反馈：`<p v-if="feedback" role="status" class="text-sm text-success">`，3 秒后清空；`<p v-if="actionError" role="alert" class="text-sm text-destructive">`。
- `ErrorState`（仅 `usersQuery.isError && !usersQuery.data`）带重试。
- `ProTable :table="table" :loading="usersQuery.isPending.value" :fetching="usersQuery.isFetching.value && !usersQuery.isPending.value" :fetching-label="t('common:states.loading')" :table-label="t('users:tableRegion')"`；`search` prop 绑定 `searchValue` / `t('users:searchPlaceholder')` / `t('common:actions.search')` / `t('common:actions.clearSearch')`；`#filters` 放状态 Select：

```vue
<Select :model-value="search.status ?? 'all'" @update:model-value="setStatus">
  <SelectTrigger class="h-9 w-[8.5rem]" :aria-label="t('users:filters.status')">
    <SelectValue :placeholder="t('users:filters.allStatuses')" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">{{ t('users:filters.allStatuses') }}</SelectItem>
    <SelectItem value="active">{{ t('common:status.active') }}</SelectItem>
    <SelectItem value="invited">{{ t('common:status.invited') }}</SelectItem>
    <SelectItem value="inactive">{{ t('common:status.inactive') }}</SelectItem>
  </SelectContent>
</Select>
```

`setStatus(value)`：`search.status = value === 'all' ? undefined : value as UserStatus; search.page = 1`。

- `#empty`：有搜索/筛选时用 `EmptyState` + `users:noResults.*` + 清除按钮；否则 `users:empty.*`。
- 表格外分页：

```vue
<div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
  <span>{{ t('common:table.pageOf', { page: search.page, pageCount }) }}</span>
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" :disabled="search.page <= 1" :aria-label="t('common:table.previous')" @click="goToPage(search.page - 1)">←</Button>
    <Button variant="outline" size="sm" :disabled="search.page >= pageCount" :aria-label="t('common:table.next')" @click="goToPage(search.page + 1)">→</Button>
  </div>
</div>
```

- `UserFormDialog v-model:open="formOpen" :user="editing" :roles="optionsQuery.data.value?.roles ?? []" :departments="optionsQuery.data.value?.departments ?? []" @saved="handleSaved"`；`DeleteUserDialog :user="deleting" @update:user="deleting = $event" @deleted="handleDeleted"`（组件 emit `update:user` 设 `null`）。
- `handleSaved('created') → feedback = t('users:createSuccess')`；`'updated'` → `updateSuccess`；`handleDeleted → feedback = t('users:deleteSuccess', { name })`；均 3 秒清空。

- [ ] **Step 6: 写 Users 测试**

`UserFormDialog.test.ts`：mock `./api`；mount with Pinia + `VueQueryPlugin`（`new QueryClient({ defaultOptions: { queries: { retry: false } } })`）；传 `open=true`、`roles=[{id:'r1',name:'Admin'}]`、`departments=[{id:'d1',name:'Engineering',...}]`；填 `#user-name`、`#user-email`，触发两个 Select 的 `update:modelValue`；点提交；断言 `createUser` 收到 `{name,email,roleId:'r1',status:'active',departmentId:'d1'}`，并 `expect(queryClient.invalidateQueries).toHaveBeenCalled`（`vi.spyOn`）。另一用例填 `bad-email`，断言出现 `validation:email` 文案且 `createUser` 未调用。

`DeleteUserDialog.test.ts`：mock `deleteUser`，mount，点 `users:delete.confirm`，断言调用 id、`update:user` 发出 `null`，并刷新 `['users']`。

`UsersPage.test.ts`：mock `./api` 的 `fetchUsers`（返回 `pageCount: 2`）、`fetchRoleOptions`、`fetchDepartments`；mount with Pinia + QueryClient；把 `auth.user` 设为 admin 后 `await vi.waitFor(() => expect(wrapper.text()).toContain('Ada'))`。覆盖：

1. 搜索：`setValue('Avery')` 后 `vi.waitFor(() => expect(fetchUsers).toHaveBeenCalledWith(expect.objectContaining({ q: 'Avery', page: 1 }), expect.anything()))`。
2. 状态：`wrapper.findComponent(Select).vm.$emit('update:modelValue', 'inactive')`，等待 `status: 'inactive'`。
3. 分页：点 `[aria-label="Next page"]`，等待 `page: 2`。
4. 排序：点包含 `Joined` 的按钮，等待 `order: 'asc'`（默认 `createdAt desc`）。
5. 权限：viewer（只有 `user:read`）不出现 `Add user` 与操作列；manager（`user:read/user:update`，无 delete）打开行菜单后 `document.body.textContent` 不含 `Delete user`。

- [ ] **Step 7: 验证并提交**

```bash
pnpm --filter @fish-admin/vue-template exec vitest run src/features/users
pnpm --filter @fish-admin/vue-template typecheck
pnpm exec prettier --check apps/vue-template/src/features/users
pnpm lint
```

```bash
git add apps/vue-template/src/features
git commit -m "feat(vue-template): add the users table and CRUD dialogs"
```

---

### Task 8: 路由、登录页与入口

**Files:**

- Create: `apps/vue-template/src/router.ts`
- Create: `apps/vue-template/src/features/auth/LoginPage.vue`
- Create: `apps/vue-template/src/features/auth/LoginPage.test.ts`
- Create: `apps/vue-template/src/pages/{ForbiddenPage,NotFoundPage}.vue`
- Modify: `apps/vue-template/src/App.vue`
- Modify: `apps/vue-template/src/main.ts`

**Interfaces:**

- Produces: named routes `login`/`dashboard`/`users`/`forbidden`/`not-found`；守卫规则；`App.vue` 提供 `provideUILocale`；完整启动顺序。

- [ ] **Step 1: 写 LoginPage 失败测试**

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { loginRequest, meRequest } from '../auth/api'
import LoginPage from './LoginPage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  loginRequest: vi.fn(),
  meRequest: vi.fn(),
}))

function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage },
      { path: '/users', component: { template: '<div>users</div>' } },
      { path: '/', component: { template: '<div>home</div>' } },
    ],
  })
  return { router, wrapper: mount(LoginPage, { global: { plugins: [router] } }) }
}

describe('LoginPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    setActivePinia(createPinia())
  })

  it('validates required fields and email format', async () => {
    const { wrapper } = mountPage()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Email is required.')
    expect(wrapper.text()).toContain('Password is required.')

    await wrapper.get('#login-email').setValue('not-an-email')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(loginRequest).not.toHaveBeenCalled()
  })

  it('fills the form from a demo account', async () => {
    const { wrapper } = mountPage()
    await wrapper.get('button[data-demo="admin"]').trigger('click')
    expect((wrapper.get('#login-email').element as HTMLInputElement).value).toBe('admin@fish.dev')
    expect((wrapper.get('#login-password').element as HTMLInputElement).value).toBe('Admin123!')
  })

  it('shows the mapped server error', async () => {
    vi.mocked(loginRequest).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'nope'))
    const { wrapper } = mountPage()
    await wrapper.get('#login-email').setValue('ada@fish.dev')
    await wrapper.get('#login-password').setValue('secret123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Incorrect email or password.')
  })

  it('disables the submit button while signing in', async () => {
    vi.mocked(loginRequest).mockReturnValue(new Promise(() => {}))
    const { wrapper } = mountPage()
    await wrapper.get('#login-email').setValue('ada@fish.dev')
    await wrapper.get('#login-password').setValue('secret123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').text()).toContain('Signing in')
  })

  it('returns to the sanitized redirect after login', async () => {
    vi.mocked(loginRequest).mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' })
    vi.mocked(meRequest).mockResolvedValue({
      id: 'u1',
      name: 'Ada',
      email: 'ada@fish.dev',
      roleId: 'r1',
      roleName: 'Admin',
      permissions: ['*'],
      emailVerified: true,
      twoFactorEnabled: false,
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: LoginPage },
        { path: '/users', component: { template: '<div>users</div>' } },
        { path: '/', component: { template: '<div>home</div>' } },
      ],
    })
    await router.push('/login?redirect=/users')
    await router.isReady()
    const wrapper = mount(LoginPage, { global: { plugins: [router] } })
    await wrapper.get('#login-email').setValue('ada@fish.dev')
    await wrapper.get('#login-password').setValue('secret123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/users')
  })
})
```

- [ ] **Step 2: 实现 `LoginPage.vue`**

结构对齐 `src/features/auth/components/auth-shell.tsx` + `login-page.tsx`：

- 根 `flex min-h-svh bg-background`；左栏 `bg-brand relative hidden overflow-hidden p-10 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between`，标题 `text-3xl leading-tight font-semibold tracking-tight text-balance`，描述 `text-sm leading-relaxed text-white/80`，三条能力 `flex items-center gap-3 text-sm text-white/90` + tile `flex size-8 items-center justify-center rounded-lg bg-white/12 backdrop-blur`，免责声明 `text-xs leading-relaxed text-white/60`。
- 右侧 `relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8`；右上 `absolute end-4 top-4 flex items-center gap-1` 放 ThemeToggle + LanguageToggle；卡片 `shadow-soft rounded-3xl border bg-card p-6 sm:p-8`；标题 `text-2xl font-semibold tracking-tight`。
- 表单：`#login-email`、`#login-password`（`type` 在 password/text 间切换，切换按钮 `aria-label` 用 `showPassword/hidePassword`）；必填与邮箱校验；`role="alert"` 错误；提交按钮 `w-full`、`size="lg"`、加载时 `Loader2` + `auth:signingIn`。
- demo 网格 `grid gap-2 sm:grid-cols-3`，按钮 `data-demo` 为 `admin|manager|viewer`，class `group rounded-xl border bg-background/60 p-3 text-start transition hover:border-primary/40 hover:bg-primary/5`，标题 `text-xs font-semibold`，邮箱 `mt-1 block truncate text-[11px] text-muted-foreground`，`ArrowUpRight` class `size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100`；填充 `DEMO_ACCOUNTS`。
- 底部 `auth:footer.demoNote` + `lg:hidden` 的 `auth:demo.disclaimer`。
- 提交成功：`await router.replace(sanitizeRedirect(route.query.redirect as string) ?? '/')`；错误映射 `INVALID_CREDENTIALS`/`ACCOUNT_LOCKED`/`EMAIL_NOT_VERIFIED`/`ACCOUNT_INACTIVE`/`MFA_NOT_SUPPORTED`/其他。

- [ ] **Step 3: 实现 403/404 与 `router.ts`**

403：`PageHeader` 风格标题、说明、`Button` 返回 Dashboard + `variant="outline"` 切换账号（`await logout(); router.replace('/login')`）。
404：标题、说明、返回 Dashboard。

```ts
// router.ts
import { hasPermission } from './lib/permissions'
import { sanitizeRedirect } from './lib/auth-redirect'
import { useAuthStore } from './stores/auth'
import AppShell from './components/layout/AppShell.vue'
import DashboardPage from './features/dashboard/DashboardPage.vue'
import LoginPage from './features/auth/LoginPage.vue'
import UsersPage from './features/users/UsersPage.vue'
import ForbiddenPage from './pages/ForbiddenPage.vue'
import NotFoundPage from './pages/NotFoundPage.vue'
import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardPage,
          meta: { permission: 'dashboard:read' },
        },
        { path: 'users', name: 'users', component: UsersPage, meta: { permission: 'user:read' } },
        { path: '403', name: 'forbidden', component: ForbiddenPage },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.status === 'idle') await auth.bootstrap()

  if (to.meta.public !== true && auth.status !== 'authenticated') {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.status === 'authenticated') {
    return { path: sanitizeRedirect(to.query.redirect as string) ?? '/' }
  }
  const permission = to.meta.permission as string | undefined
  if (permission && !hasPermission(auth.user?.permissions, permission)) {
    return { name: 'forbidden' }
  }
  return true
})
```

- [ ] **Step 4: 替换 `App.vue` 与 `main.ts`**

```vue
<script setup lang="ts">
import { provideUILocale, type UILocale } from '@fish-admin/vue'
import { ref, watch } from 'vue'

import { language } from './lib/i18n'

const uiLocale = ref<UILocale>(language.value === 'zh-CN' ? 'zh-CN' : 'en')
watch(language, (value) => {
  uiLocale.value = value === 'zh-CN' ? 'zh-CN' : 'en'
})
provideUILocale(uiLocale)
</script>

<template>
  <RouterView />
</template>
```

`main.ts` 严格按 Spec §5.3：

```ts
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { env } from './config/env'
import { i18nReady } from './lib/i18n'
import { configureApi } from './lib/api-client'
import { queryClient } from './lib/query-client'
import { router } from './router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import './styles/index.css'

async function start() {
  await i18nReady

  const mockFlag = import.meta.env.VITE_ENABLE_MOCK
  const mocksEnabled =
    mockFlag === undefined ? import.meta.env.MODE === 'development' : mockFlag === 'true'

  if (mocksEnabled) {
    try {
      const { createMockWorker } = await import('@fish-admin/mock/browser')
      const worker = await createMockWorker({
        apiBaseUrl: env.apiBaseUrl,
        latency: env.mockLatency,
      })
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      })
    } catch (error) {
      console.error('Mock API failed to start', error)
    }
  }

  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()

  configureApi({
    getAccessToken: () => auth.accessToken,
    refreshSession: () => auth.refreshSession(),
    onSessionExpired: () => {
      auth.clearSession()
      queryClient.clear()
      if (router.currentRoute.value.path !== '/login') {
        void router.replace({
          name: 'login',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }
    },
  })

  useThemeStore().init()
  await auth.bootstrap()

  const app = createApp(App).use(pinia).use(router).use(VueQueryPlugin, { queryClient })
  await router.isReady()
  app.mount('#app')
}

void start()
```

- [ ] **Step 5: 验证并提交**

```bash
pnpm --filter @fish-admin/vue-template test
pnpm --filter @fish-admin/vue-template typecheck
pnpm exec prettier --check apps/vue-template/src
pnpm lint
```

```bash
git add apps/vue-template/src
git commit -m "feat(vue-template): add router guards and the login experience"
```

---

### Task 9: Playwright 功能冒烟

**Files:**

- Create: `playwright.vue-template.config.ts`
- Create: `e2e-vue-template/specs/smoke.spec.ts`

**Interfaces:**

- Produces: `pnpm test:e2e:vue-template` 运行 6 条功能用例；无截图、无 `*-linux.png`。

- [ ] **Step 1: 创建配置**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-vue-template',
  testMatch: ['specs/*.spec.ts'],
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: 'test-results/vue-template',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/vue-template' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4177',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter @fish-admin/vue-template dev',
    url: 'http://127.0.0.1:4177',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_ENABLE_MOCK: 'true', VITE_MOCK_LATENCY: '0' },
  },
})
```

- [ ] **Step 2: 创建 6 条用例**

```ts
import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Administrator' | 'Manager' | 'Viewer') {
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

test('redirects signed-out users and returns to the requested page', async ({ page }) => {
  await page.goto('/users')
  await expect(page).toHaveURL(/\/login\?redirect=%2Fusers|\/login\?redirect=\/users/)
  await loginAs(page, 'Administrator')
  await expect(page).toHaveURL(/\/users$/)
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
})

test('shows four KPIs and refetches when the range changes', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')
  await expect(page.getByRole('article')).toHaveCount(4)
  const request = page.waitForResponse((response) => response.url().includes('/dashboard?range=30'))
  await page.getByRole('button', { name: 'Last 30 days' }).click()
  await request
  await expect(page.getByRole('button', { name: 'Last 30 days' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('search, status filter and pagination change the table', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')
  await page.getByRole('link', { name: 'Users' }).click()

  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Inactive' }).click()
  await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('Inactive')

  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'All statuses' }).click()
  await page.getByPlaceholder('Search by name or email…').fill('avery')
  await expect(page.getByRole('cell', { name: /Avery/i }).first()).toBeVisible()

  await page.getByPlaceholder('Search by name or email…').fill('')
  await expect(page.getByText('Page 1 of 6')).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('Page 2 of 6')).toBeVisible()
})

test('creates, edits and deletes a user', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')
  await page.getByRole('link', { name: 'Users' }).click()

  const stamp = Date.now()
  const name = `Harper Vue ${stamp}`
  const email = `harper.${stamp}@example.com`

  await page.getByRole('button', { name: 'Add user' }).click()
  const createDialog = page.getByRole('dialog')
  await createDialog.getByLabel('Full name').fill(name)
  await createDialog.getByLabel('Email').fill(email)
  await createDialog.getByRole('combobox', { name: 'Role' }).click()
  await page.getByRole('option').first().click()
  await createDialog.getByRole('combobox', { name: 'Department' }).click()
  await page.getByRole('option', { name: 'Engineering' }).click()
  await createDialog.getByRole('button', { name: 'Add user' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'User created.' })).toBeVisible()

  await page.getByPlaceholder('Search by name or email…').fill(name)
  const row = page.getByRole('row').filter({ hasText: email })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Actions' }).click()
  await page.getByRole('menuitem', { name: 'Edit user' }).click()
  const editDialog = page.getByRole('dialog')
  await editDialog.getByLabel('Full name').fill(`${name} edited`)
  await editDialog.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'User updated.' })).toBeVisible()
  await expect(page.getByText(`${name} edited`)).toBeVisible()

  await page
    .getByRole('row')
    .filter({ hasText: email })
    .getByRole('button', { name: 'Actions' })
    .click()
  await page.getByRole('menuitem', { name: 'Delete user' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete user' }).click()
  await expect(page.getByRole('status').filter({ hasText: /deleted/ })).toBeVisible()
  await expect(page.getByText(`${name} edited`)).toHaveCount(0)
})

test('manager cannot see the delete action', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Manager')
  await page.getByRole('link', { name: 'Users' }).click()
  await page
    .getByRole('row')
    .filter({ hasText: '@' })
    .first()
    .getByRole('button', { name: 'Actions' })
    .click()
  await expect(page.getByRole('menuitem', { name: 'Edit user' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Delete user' })).toHaveCount(0)
})

test('persists language and theme, then signs out', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')

  await page.getByRole('button', { name: 'Change language' }).click()
  await page.getByRole('menuitem', { name: '简体中文' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')

  await page.getByRole('button', { name: '切换主题' }).click()
  await page.getByRole('menuitem', { name: '深色' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('button', { name: /账户菜单|Account menu/ }).click()
  await page.getByRole('menuitem', { name: '退出登录' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/users')
  await expect(page).toHaveURL(/\/login/)
})
```

如果中文主题按钮的可访问名称不是 `切换主题`，以 `common:theme.toggle` 的 zh-CN 实际值为准（`packages/i18n/locales/zh-CN/common.json`），不得用 CSS 选择器替代。

- [ ] **Step 3: 运行并提交**

```bash
pnpm exec prettier --check playwright.vue-template.config.ts e2e-vue-template
pnpm lint
pnpm test:e2e:vue-template
```

Expected: `6 passed`。若本机 4177 已被旧进程占用，先 `netstat -ano | findstr :4177` + `taskkill //PID <pid> //F`，再重跑。

```bash
git add playwright.vue-template.config.ts e2e-vue-template
git commit -m "test(vue-template): add six functional smoke tests"
```

---

### Task 10: 双语文档、README、CHANGELOG 与全量验收

**Files:**

- Create: `docs/en/vue-template.md`、`docs/zh-CN/vue-template.md`
- Modify: `README.md`、`README.zh-CN.md`、`CHANGELOG.md`

**Interfaces:**

- Produces: 双语使用文档（含路由、demo 账号、命令、偏差表、权限边界说明）；README 应用树与脚本表；CHANGELOG `[Unreleased] / Added`。

- [ ] **Step 1: 写 `docs/en/vue-template.md`**

````markdown
# Vue template shell

`apps/vue-template` is a private Vue 3 admin shell for FishAdmin. It reuses the
framework-neutral contracts, i18n resources and MSW mock API, and the
`@fish-admin/vue` component port. It is a demonstration template, not a
published package.

> Client-side permissions are a UX layer, not a security boundary. Every route
> guard and button check can be bypassed in the browser; a real deployment must
> enforce authorization on the server.

## Scope

- Sign-in, sign-out, session restore and access-token refresh.
- Permission-filtered sidebar, route guards and button-level permission checks.
- Light / dark / system theme and en / zh-CN language, both persisted.
- Dashboard: 7/30 day range, four KPI cards, recent activity.
- Users: search, status filter, server pagination and sorting, row actions,
  create/edit dialog and delete confirmation.

Not included: the header/mixed layouts, command palette, notifications,
profile/security/settings pages, registration/recovery/OTP, dashboard charts,
CSV import/export, saved views, bulk actions or pixel parity.

## Routes

| Path               | Page      | Access                            |
| ------------------ | --------- | --------------------------------- |
| `/login`           | Sign in   | public; signed-in users go to `/` |
| `/`                | Dashboard | signed in + `dashboard:read`      |
| `/users`           | Users     | signed in + `user:read`           |
| `/403`             | Forbidden | signed in                         |
| `/:pathMatch(.*)*` | Not found | public                            |

## Demo accounts

| Role          | Email              | Password      |
| ------------- | ------------------ | ------------- |
| Administrator | `admin@fish.dev`   | `Admin123!`   |
| Manager       | `manager@fish.dev` | `Manager123!` |
| Viewer        | `viewer@fish.dev`  | `Viewer123!`  |

## Commands

```bash
pnpm dev:vue-template
pnpm build:vue-template
pnpm test:vue-template
pnpm test:e2e:vue-template
```
````

## Deviations from the React template

| Area                                                             | React                                                                      | Vue template                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| Shell                                                            | sidebar / header / mixed + density and width settings                      | sidebar only                              |
| Navigation                                                       | all 21 contracted pages                                                    | only Dashboard and Users                  |
| Command palette / notifications / offline banner / tabs / subnav | yes                                                                        | no                                        |
| Authentication                                                   | sign in, register, recovery, invite, OTP, 2FA                              | sign in and session restore only          |
| Dashboard                                                        | KPIs, three charts, product tour                                           | KPIs and activity feed; no charts or tour |
| Users                                                            | column controls, density, saved views, CSV, bulk, import, detail, activity | search, status, paging, sorting, CRUD     |
| Profile / security / settings                                    | yes                                                                        | no entry; the account menu only signs out |
| Theme                                                            | light/dark/system + accent                                                 | light/dark/system, accent fixed to violet |
| Remaining pages                                                  | 21 features                                                                | Dashboard and Users only                  |

The DropdownMenu wrapper renames the CSS variables from `--radix-*` to
`--reka-*`; all other classes are copied verbatim from the React source.

## Tests

Vitest covers redirects, permissions, auth/session, i18n, theme, login, users
and the sidebar. Six Playwright smoke tests cover the golden paths; they do not
produce or compare screenshots.

## Client-side permission boundary

RBAC in this template is presentation only. Hiding a button or redirecting a
route never protects an API. The mock server is inside the browser and is not a
security boundary either.

````

- [ ] **Step 2: 写对应中文文档**

逐段翻译以上内容，保留代码块、表格结构和所有英文键名，标题改为“Vue 模板外壳”；必须保留原文的边界说明：

```markdown
> 客户端权限是体验层，不是安全边界。路由守卫和按钮检查都可以在浏览器中被绕过；
> 真实部署必须在服务端执行授权校验。
````

- [ ] **Step 3: 更新 README 与 CHANGELOG**

`README.md` 与 `README.zh-CN.md` 的应用树中加入：

```text
apps/vue-template/   # Private Vue 3 admin shell (login, dashboard, users)
```

脚本表加入三行（英文与中文说明各自对应）：

```text
pnpm dev:vue-template      # run the Vue template on port 4177
pnpm test:vue-template     # Vitest for the Vue template
pnpm test:e2e:vue-template # six Playwright functional smoke tests
```

`CHANGELOG.md` 的 `[Unreleased]` → `Added` 加英文条目：

```markdown
- **Vue template shell:** a private Vue 3 admin app with sign-in, permission-filtered navigation, theme and language switching, a dashboard and a users CRUD page; adds Avatar and DropdownMenu wrappers to `@fish-admin/vue`.
```

- [ ] **Step 4: 全量验收（必须附真实输出）**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
pnpm --filter @fish-admin/vue-template build
pnpm test:shared
pnpm test:ui
pnpm test:vue
pnpm test:vue-template
pnpm test:e2e:vue-template
pnpm test:parity:docker
pnpm test:parity:vue
git diff --name-only -- 'parity/**' '*-linux.png'
git status --short
```

Expected: 所有命令退出码 0；`test:parity:docker` 119/119；`test:parity:vue` 42/42；`git diff --name-only -- 'parity/**' '*-linux.png'` 无输出；两个包仍为 `private: true`、版本 `0.1.0`。

- [ ] **Step 5: 人工走查（ego lite / Playwright 交互）**

按 Spec §11.6 逐项验证并记录：三个账号登录；导航随权限变化；Dashboard 7/30；Users 搜索/筛选/分页/排序/增删改；light/dark × en/zh；360px 移动抽屉（Esc、遮罩、焦点回收）；刷新后主题/语言/会话保持。没有真实浏览器证据时，不得声明该步骤通过。

- [ ] **Step 6: Commit**

```bash
git add docs/en/vue-template.md docs/zh-CN/vue-template.md README.md README.zh-CN.md CHANGELOG.md
git commit -m "docs(vue-template): document the Vue shell and its deviations"
```

---

## Self-Review

- **Spec coverage:** 应用/路由/认证/权限/外壳/主题/语言/Dashboard/Users/组件增量/测试/文档/根脚本均有对应任务；§3.2 排除项未被引入。
- **Placeholder scan:** 所有代码步骤均给出具体文件与代码；复制类步骤标明源文件。未使用 “TBD/TODO”。
- **Type consistency:** `UsersSearch.sort` 只含 `name | createdAt`；`tableLabel` 从 Task 2 贯穿到 Task 7；`theme` 持久化结构、会话键、`sanitizeRedirect` 签名在各任务中一致；`UserFormValues` 与 `UserInput` 字段一致。
- **Known gap:** i18n 懒命名空间在 `i18nReady` 中显式加载 `auth/dashboard/users/validation`，否则登录页与业务页首屏会出现原始键名。
