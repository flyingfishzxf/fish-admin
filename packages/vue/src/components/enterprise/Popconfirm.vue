<script setup lang="ts">
import {
  PopoverContent as PopoverContentPrimitive,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { nextTick, ref, watch } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import { Button } from '../ui/button'

const props = withDefaults(
  defineProps<{
    /** Question shown in the popover; used as the alertdialog's name. */
    title: string
    /** Consequence of confirming, linked through aria-describedby. */
    description?: string
    /** Confirm button text; defaults to the localized "Confirm". */
    confirmLabel?: string
    /** Footer button text; defaults to the localized "Cancel". */
    cancelLabel?: string
    /** Disables Confirm and sets aria-busy while an operation is in flight. */
    pending?: boolean
    /** Confirm button style: destructive for deletes and revocations. */
    destructive?: boolean
    /** Blocks opening and marks the trigger aria-disabled. */
    disabled?: boolean
    /** Preferred side of the trigger. */
    side?: 'top' | 'right' | 'bottom' | 'left'
    /** Alignment along the chosen side. */
    align?: 'start' | 'center' | 'end'
    class?: string
  }>(),
  { pending: false, destructive: false, disabled: false, side: 'top', align: 'center' },
)

const emit = defineEmits<{ confirm: [] }>()

const { t } = useUITranslation()
const open = ref(false)

// Reka hardcodes `role="dialog"` on its popover content, so the static
// attribute below never reaches the DOM. The React surface announces the
// confirm panel as an alertdialog; force the role after every render that
// could reset it (open toggles, pending flips) through a plain fallthrough
// marker attribute.
watch([open, () => props.pending], async () => {
  await nextTick()
  document
    .querySelector<HTMLElement>('[data-popconfirm-content]')
    ?.setAttribute('role', 'alertdialog')
})
</script>

<template>
  <PopoverRoot
    :open="open"
    @update:open="
      (next) => {
        if (!props.disabled) open = next
      }
    "
  >
    <PopoverTrigger as-child :aria-disabled="props.disabled || undefined">
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContentPrimitive
        data-popconfirm-content
        :side="props.side"
        :align="props.align"
        :side-offset="6"
        role="alertdialog"
        :aria-busy="props.pending || undefined"
        :class="
          cn(
            'z-50 w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-none',
            props.class,
          )
        "
      >
        <div class="flex flex-col gap-1">
          <p class="text-sm font-semibold">{{ props.title }}</p>
          <p v-if="props.description" class="text-sm">{{ props.description }}</p>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" @click="open = false">
            {{ props.cancelLabel ?? t('actions.cancel') }}
          </Button>
          <Button
            type="button"
            :variant="props.destructive ? 'destructive' : 'default'"
            size="sm"
            :disabled="props.pending"
            @click="
              () => {
                emit('confirm')
                if (!props.pending) open = false
              }
            "
          >
            {{ props.confirmLabel ?? t('actions.confirm') }}
          </Button>
        </div>
      </PopoverContentPrimitive>
    </PopoverPortal>
  </PopoverRoot>
</template>
