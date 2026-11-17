<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import { cn } from '../../lib/utils'
import {
  ContextMenuContent as ContextMenuContentPrimitive,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator as ContextMenuSeparatorPrimitive,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from 'reka-ui'

export interface ContextMenuEntry {
  id: string
  /** Separators render a rule and need no label. */
  label?: string
  kind?: 'item' | 'separator' | 'label' | 'sub'
  icon?: LucideIcon
  /** `destructive` colours the label for irreversible actions. */
  destructive?: boolean
  disabled?: boolean
  onSelect?: () => void
  /** Nested entries for `kind: 'sub'`. */
  children?: ContextMenuEntry[]
}

const props = defineProps<{
  /** Entries in display order; separators carry only a kind. */
  items: ContextMenuEntry[]
  class?: string
}>()

const itemClass =
  'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]::size-4'
const contentClass =
  'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none'
</script>

<template>
  <ContextMenuRoot data-slot="context-menu">
    <ContextMenuTrigger as-child data-slot="context-menu-trigger">
      <slot name="trigger" />
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContentPrimitive
        data-slot="context-menu-content"
        :class="cn(contentClass, props.class)"
      >
        <template v-for="entry in props.items" :key="entry.id">
          <ContextMenuSeparatorPrimitive
            v-if="entry.kind === 'separator'"
            data-slot="context-menu-separator"
            class="-mx-1 my-1 h-px bg-border"
          />
          <div
            v-else-if="entry.kind === 'label'"
            data-slot="context-menu-label"
            class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
          >
            {{ entry.label }}
          </div>
          <ContextMenuSub v-else-if="entry.kind === 'sub'">
            <ContextMenuSubTrigger
              data-slot="context-menu-sub-trigger"
              class="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0"
            >
              <component :is="entry.icon" v-if="entry.icon" aria-hidden="true" class="size-4" />
              {{ entry.label }}
              <svg
                aria-hidden="true"
                class="ms-auto size-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent :class="contentClass">
                <template v-for="child in entry.children" :key="child.id">
                  <ContextMenuSeparatorPrimitive
                    v-if="child.kind === 'separator'"
                    class="-mx-1 my-1 h-px bg-border"
                  />
                  <div
                    v-else-if="child.kind === 'label'"
                    class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    {{ child.label }}
                  </div>
                  <ContextMenuContentPrimitive
                    v-else
                    as-child
                    :data-variant="child.destructive ? 'destructive' : 'default'"
                    :disabled="child.disabled"
                    @select="child.onSelect?.()"
                  >
                    <div :class="cn(itemClass, child.destructive && 'text-destructive')">
                      <component
                        :is="child.icon"
                        v-if="child.icon"
                        aria-hidden="true"
                        class="size-4"
                      />
                      {{ child.label }}
                    </div>
                  </ContextMenuContentPrimitive>
                </template>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
          <ContextMenuContentPrimitive
            v-else
            as-child
            :data-variant="entry.destructive ? 'destructive' : 'default'"
            :disabled="entry.disabled"
            @select="entry.onSelect?.()"
          >
            <div :class="cn(itemClass, entry.destructive && 'text-destructive')">
              <component :is="entry.icon" v-if="entry.icon" aria-hidden="true" class="size-4" />
              {{ entry.label }}
            </div>
          </ContextMenuContentPrimitive>
        </template>
      </ContextMenuContentPrimitive>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
