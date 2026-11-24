<script setup lang="ts">
import {
  DialogClose as DrawerClose,
  DialogContent,
  DialogOverlay as DrawerOverlay,
  DialogPortal as DrawerPortal,
  DialogRoot,
} from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    open?: boolean
    direction?: 'top' | 'right' | 'bottom' | 'left'
    class?: string
  }>(),
  { direction: 'bottom' },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

// Drawer sides are physical; a bottom drawer stays at the bottom in both directions.
const DIRECTION_CLASSES: Record<string, string> = {
  top: 'inset-x-0 top-0 mb-24 max-h-[80vh] rounded-b-lg border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom:
    'inset-x-0 bottom-0 mt-24 max-h-[80vh] rounded-t-lg border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
  right:
    'inset-y-0 right-0 w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
  left: 'inset-y-0 left-0 w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
}

const contentClass = computed(() =>
  cn(
    'group/drawer-content fixed z-50 flex h-auto flex-col bg-background transition ease-(--motion-ease-standard) data-[state=closed]:animate-out data-[state=closed]:duration-(--motion-duration-base) data-[state=open]:animate-in data-[state=open]:duration-(--motion-duration-slow) motion-reduce:animate-none! motion-reduce:transition-none!',
    DIRECTION_CLASSES[props.direction],
    props.class,
  ),
)
</script>

<template>
  <DialogRoot data-slot="drawer" :open="props.open" @update:open="emit('update:open', $event)">
    <slot name="trigger" />
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay
        data-slot="drawer-overlay"
        class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none!"
      />
      <DialogContent
        data-slot="drawer-content"
        :data-direction="props.direction"
        :class="contentClass"
      >
        <div
          v-if="props.direction === 'bottom'"
          class="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[direction=bottom]/drawer-content:block"
        ></div>
        <slot />
        <DrawerClose as-child>
          <slot name="close" />
        </DrawerClose>
      </DialogContent>
    </DrawerPortal>
  </DialogRoot>
</template>
