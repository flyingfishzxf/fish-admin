<script setup lang="ts">
import type { Department } from '@fish-admin/contracts'
import { ChevronRight } from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'

const props = defineProps<{
  items: Department[]
  modelValue: string | null
  label: string
  emptyLabel: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

interface TreeNode {
  department: Department
  children: TreeNode[]
  depth: number
  parentId: string | null
}

// The API returns a depth-first flat list with parents before children, so one
// pass is enough. A record whose parent is missing, or part of a cycle, becomes
// a root instead of disappearing (the mock handler keeps those visible too).
const tree = computed<TreeNode[]>(() => {
  const nodes = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const item of props.items) {
    const node: TreeNode = { department: item, children: [], depth: 0, parentId: null }
    nodes.set(item.id, node)
    const parent = item.parentId ? nodes.get(item.parentId) : undefined
    if (parent) {
      parent.children.push(node)
      node.parentId = parent.department.id
    } else {
      roots.push(node)
    }
  }

  const setDepth = (list: TreeNode[], depth: number) => {
    for (const node of list) {
      node.depth = depth
      setDepth(node.children, depth + 1)
    }
  }
  setDepth(roots, 0)
  return roots
})

const collapsed = ref<Set<string>>(new Set())
const focusedId = ref<string | null>(props.modelValue)
const treeElement = ref<HTMLElement | null>(null)

// A flat `role="tree"` with `aria-level` is a valid WAI-ARIA tree pattern and
// avoids a recursive component. Collapsed branches contribute no nodes at all.
const visibleNodes = computed(() => {
  const result: TreeNode[] = []
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      result.push(node)
      if (node.children.length && !collapsed.value.has(node.department.id)) walk(node.children)
    }
  }
  walk(tree.value)
  return result
})

// Collapsing a branch can hide the focused descendant. Fall back to the first
// visible node so exactly one tree item keeps tabindex=0 and keys still work.
const activeId = computed(() => {
  const candidate = focusedId.value
  if (candidate && visibleNodes.value.some((node) => node.department.id === candidate)) {
    return candidate
  }
  return visibleNodes.value[0]?.department.id ?? null
})

function isExpanded(node: TreeNode) {
  return node.children.length > 0 && !collapsed.value.has(node.department.id)
}

function isDescendant(node: TreeNode, id: string): boolean {
  return node.children.some((child) => child.department.id === id || isDescendant(child, id))
}

function toggle(node: TreeNode) {
  if (!node.children.length) return
  const collapsing = !collapsed.value.has(node.department.id)
  const next = new Set(collapsed.value)
  if (collapsing) next.add(node.department.id)
  else next.delete(node.department.id)
  collapsed.value = next

  // A focused descendant is about to leave the DOM after a mouse-driven
  // collapse. Move DOM focus to the branch root so keys still reach the tree.
  if (collapsing && focusedId.value && isDescendant(node, focusedId.value)) {
    focusNode(node.department.id)
  }
}

function focusNode(id: string) {
  focusedId.value = id
  void nextTick(() => {
    const elements = treeElement.value?.querySelectorAll<HTMLElement>('[data-dept-id]') ?? []
    for (const element of elements) {
      if (element.dataset.deptId === id) {
        element.focus()
        break
      }
    }
  })
}

function select(id: string) {
  focusedId.value = id
  emit('update:modelValue', id)
}

function moveTo(index: number) {
  const node = visibleNodes.value[index]
  if (!node) return
  focusNode(node.department.id)
  select(node.department.id)
}

function onKeydown(event: KeyboardEvent) {
  const index = visibleNodes.value.findIndex((node) => node.department.id === activeId.value)
  const node = visibleNodes.value[index]
  if (!node) return

  const handled = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', ' ']
  if (!handled.includes(event.key)) return
  event.preventDefault()

  switch (event.key) {
    case 'ArrowDown':
      moveTo(Math.min(index + 1, visibleNodes.value.length - 1))
      break
    case 'ArrowUp':
      moveTo(Math.max(index - 1, 0))
      break
    case 'Home':
      moveTo(0)
      break
    case 'End':
      moveTo(visibleNodes.value.length - 1)
      break
    case 'ArrowRight':
      if (node.children.length && !isExpanded(node)) toggle(node)
      else if (node.children.length) moveTo(index + 1)
      break
    case 'ArrowLeft':
      if (node.children.length && isExpanded(node)) toggle(node)
      else if (node.parentId) {
        const parentIndex = visibleNodes.value.findIndex(
          (candidate) => candidate.department.id === node.parentId,
        )
        if (parentIndex >= 0) moveTo(parentIndex)
      }
      break
    case 'Enter':
    case ' ':
      select(node.department.id)
      break
  }
}
</script>

<template>
  <div ref="treeElement">
    <ul
      v-if="visibleNodes.length"
      role="tree"
      :aria-label="label"
      class="space-y-0.5"
      @keydown="onKeydown"
    >
      <li
        v-for="node in visibleNodes"
        :key="node.department.id"
        role="treeitem"
        :data-dept-id="node.department.id"
        :aria-level="node.depth + 1"
        :aria-selected="modelValue === node.department.id"
        :aria-expanded="node.children.length ? isExpanded(node) : undefined"
        :tabindex="activeId === node.department.id ? 0 : -1"
        :style="{ paddingInlineStart: `${node.depth * 1.25}rem` }"
        class="flex cursor-default items-center gap-1 rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-accent aria-selected:font-medium"
        @click="select(node.department.id)"
      >
        <span
          v-if="node.children.length"
          class="inline-flex size-4 items-center justify-center"
          @click.stop="toggle(node)"
        >
          <ChevronRight
            class="size-3.5 transition-transform"
            :class="isExpanded(node) ? 'rotate-90' : ''"
            aria-hidden="true"
          />
        </span>
        <span v-else class="size-4 shrink-0" aria-hidden="true"></span>
        <span class="truncate">{{ node.department.name }}</span>
      </li>
    </ul>
    <p v-else class="px-2 py-6 text-sm text-muted-foreground">{{ emptyLabel }}</p>
  </div>
</template>
