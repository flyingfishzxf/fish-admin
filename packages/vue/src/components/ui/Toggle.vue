<script setup lang="ts">
import { computed, inject } from 'vue'

import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    value?: string
    variant?: 'default' | 'outline'
    size?: 'default' | 'sm' | 'lg'
    class?: string
  }>(),
  { variant: 'default', size: 'default' },
)

const model = defineModel<boolean>({ default: false })
const group = inject<{
  value: string | string[] | undefined
  type: 'single' | 'multiple'
  toggle: (value: string) => void
} | null>('toggle-group', null)

const on = computed(() => {
  if (!group) return model.value
  return Array.isArray(group.value)
    ? group.value.includes(props.value ?? '')
    : group.value === props.value
})

function activate() {
  if (group) group.toggle(props.value ?? '')
  else model.value = !model.value
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0'
const VARIANTS: Record<string, string> = {
  default: 'bg-transparent',
  outline:
    'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
}
const SIZES: Record<string, string> = {
  default: 'h-9 min-w-9 px-2',
  sm: 'h-8 min-w-8 px-1.5',
  lg: 'h-10 min-w-10 px-2.5',
}
</script>

<template>
  <button
    type="button"
    data-slot="toggle"
    :data-state="on ? 'on' : 'off'"
    :aria-pressed="on"
    :class="cn(BASE, VARIANTS[props.variant], SIZES[props.size], props.class)"
    @click="activate"
  >
    <slot />
  </button>
</template>
