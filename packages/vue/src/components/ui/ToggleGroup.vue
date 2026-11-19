<script setup lang="ts">
import { provide, reactive, watchEffect } from 'vue'

import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    type?: 'single' | 'multiple'
    /** Gap between items in spacing units; 0 joins them into one control. */
    spacing?: number
    class?: string
  }>(),
  { type: 'single', spacing: 0 },
)

const model = defineModel<string | string[] | undefined>({ default: undefined })

function toggle(value: string) {
  if (props.type === 'multiple') {
    const current = Array.isArray(model.value) ? model.value : []
    const next: string[] = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    model.value = next
  } else {
    const next: string | undefined = model.value === value ? undefined : value
    model.value = next
  }
}

const context = reactive<{
  value: string | string[] | undefined
  type: 'single' | 'multiple'
  toggle: (value: string) => void
}>({ value: model.value, type: props.type, toggle })
watchEffect(() => {
  context.value = model.value
  context.type = props.type
})
provide('toggle-group', context)
</script>

<template>
  <div
    role="group"
    data-slot="toggle-group"
    :data-type="props.type"
    :data-spacing="props.spacing"
    :style="{ '--gap': props.spacing }"
    :class="cn('flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md', props.class)"
  >
    <slot />
  </div>
</template>
