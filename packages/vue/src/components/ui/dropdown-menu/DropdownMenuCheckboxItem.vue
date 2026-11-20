<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import {
  DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
  DropdownMenuItemIndicator,
} from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(
  defineProps<{
    checked?: boolean | 'indeterminate'
    disabled?: boolean
    class?: string
  }>(),
  { checked: false, disabled: false },
)

const emit = defineEmits<{ 'update:checked': [value: boolean] }>()

const classes = computed(() =>
  cn(
    "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    props.class,
  ),
)
</script>

<template>
  <DropdownMenuCheckboxItemPrimitive
    data-slot="dropdown-menu-checkbox-item"
    :model-value="props.checked"
    :disabled="props.disabled"
    :class="classes"
    @update:model-value="emit('update:checked', $event)"
  >
    <span class="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <Check class="size-4" />
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuCheckboxItemPrimitive>
</template>
