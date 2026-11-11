<script setup lang="ts">
import { SelectContent as SelectContentPrimitive, SelectPortal, SelectViewport } from 'reka-ui'

import { cn } from '../../../lib/utils'

import SelectScrollDownButton from './SelectScrollDownButton.vue'
import SelectScrollUpButton from './SelectScrollUpButton.vue'

const props = withDefaults(
  defineProps<{
    position?: 'item-aligned' | 'popper'
    align?: 'start' | 'center' | 'end'
    class?: string
  }>(),
  { position: 'item-aligned', align: 'center' },
)

const base = cn(
  'relative z-50 max-h-(--reka-select-content-available-height) min-w-[8rem] origin-(--reka-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
  props.position === 'popper' &&
    'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
  props.class,
)
</script>

<template>
  <SelectPortal>
    <SelectContentPrimitive
      data-slot="select-content"
      :position="position"
      :align="align"
      :class="base"
    >
      <SelectScrollUpButton />
      <SelectViewport
        :class="
          cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--reka-select-trigger-height)] w-full min-w-[var(--reka-select-trigger-width)] scroll-my-1',
          )
        "
      >
        <slot />
      </SelectViewport>
      <SelectScrollDownButton />
    </SelectContentPrimitive>
  </SelectPortal>
</template>
