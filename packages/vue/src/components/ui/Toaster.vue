<script setup lang="ts">
import {
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount } from 'vue'

import { observeToaster, toast, type ToastTone } from '../../lib/toast'

const props = withDefaults(
  defineProps<{
    /** Match toast.toasterId to render a dedicated stack. */
    toasterId?: string
    /** Screen corner for the stack. */
    position?:
      'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
    /** Cap the number of visible toasts. */
    visibleToasts?: number
  }>(),
  { position: 'bottom-right', visibleToasts: 5 },
)

const store = observeToaster(props.toasterId)
const records = computed(() => store.records.slice(-props.visibleToasts))
// Top stacks enter from above, bottom stacks from below.
const transitionName = computed(() =>
  props.position.startsWith('top') ? 'toast-top' : 'toast-bottom',
)

const POSITION_CLASSES: Record<string, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
}

const TONE_ICONS: Record<ToastTone, typeof InfoIcon> = {
  default: InfoIcon,
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: CircleXIcon,
  loading: Loader2Icon,
}

const TONE_CLASSES: Record<ToastTone, string> = {
  default: 'text-foreground',
  success: 'text-success',
  info: 'text-chart-1',
  warning: 'text-warning',
  error: 'text-destructive',
  loading: 'text-muted-foreground',
}

function runAction(record: { action?: { onClick: () => void }; id: number; toasterId?: string }) {
  record.action?.onClick()
  toast.dismiss(record.id, record.toasterId)
}

onBeforeUnmount(() => toast.dismiss(undefined, props.toasterId))
</script>

<template>
  <div
    data-slot="toaster"
    :class="`pointer-events-none fixed z-[100] flex flex-col gap-2 ${POSITION_CLASSES[props.position]}`"
    aria-live="polite"
  >
    <TransitionGroup :name="transitionName">
      <div
        v-for="record in records"
        :key="record.id"
        data-slot="toast"
        :data-tone="record.tone"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg"
      >
        <component
          :is="TONE_ICONS[record.tone]"
          aria-hidden="true"
          :class="`mt-0.5 size-4 shrink-0 ${TONE_CLASSES[record.tone]} ${record.tone === 'loading' && 'animate-spin'}`"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">{{ record.message }}</p>
          <p v-if="record.description" class="mt-0.5 text-xs text-muted-foreground">
            {{ record.description }}
          </p>
          <button
            v-if="record.action"
            type="button"
            class="mt-1 text-xs font-medium text-primary hover:underline"
            @click="runAction(record)"
          >
            {{ record.action.label }}
          </button>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          class="shrink-0 rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          @click="toast.dismiss(record.id, record.toasterId)"
        >
          <XIcon class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
