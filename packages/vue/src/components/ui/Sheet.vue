<script setup lang="ts">
import {
  DialogContent as DialogContentPrimitive,
  DialogOverlay as DialogOverlayPrimitive,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import { computed } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'

const props = withDefaults(
  defineProps<{
    open?: boolean
    /** Edge of the viewport the sheet slides in from. */
    side?: 'top' | 'right' | 'bottom' | 'left'
    /** Render the built-in close button in the top corner. */
    showCloseButton?: boolean
    /** Accessible title; rendered visually hidden when no title slot is given. */
    title?: string
    class?: string
  }>(),
  { side: 'right', showCloseButton: true },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { t } = useUITranslation()

// rtl-exempt:start `side` is a physical prop; a right sheet stays on the right in both directions
const SIDE_CLASSES: Record<string, string> = {
  right:
    'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
  top: 'inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom:
    'inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
}
// rtl-exempt:end

const classes = computed(() =>
  cn(
    'fixed z-50 flex flex-col gap-4 bg-background shadow-lg outline-none',
    SIDE_CLASSES[props.side],
    props.class,
  ),
)
</script>

<template>
  <DialogRoot data-slot="sheet" :open="props.open" @update:open="emit('update:open', $event)">
    <DialogTrigger as-child data-slot="sheet-trigger">
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlayPrimitive data-slot="sheet-overlay" class="fixed inset-0 z-50 bg-black/50" />
      <DialogContentPrimitive
        data-slot="sheet-content"
        :class="classes"
        @keydown.escape="emit('update:open', false)"
      >
        <DialogTitle v-if="props.title" class="sr-only">{{ props.title }}</DialogTitle>
        <slot />
        <DialogClose
          v-if="props.showCloseButton"
          class="absolute end-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
          :aria-label="t('actions.close')"
        >
          <X class="size-4" />
          <span class="sr-only">{{ t('actions.close') }}</span>
        </DialogClose>
      </DialogContentPrimitive>
    </DialogPortal>
  </DialogRoot>
</template>
