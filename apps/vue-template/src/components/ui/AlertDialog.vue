<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import { Loader2 } from 'lucide-vue-next'
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'

// Cancel comes first in the DOM on purpose: Reka focuses the first tabbable
// element, so the safe action wins the initial focus without a manual handler.
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel: string
    cancelLabel: string
    variant?: 'default' | 'destructive'
    pending?: boolean
  }>(),
  { variant: 'destructive', pending: false },
)

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in"
      />
      <AlertDialogContent
        data-slot="alert-dialog"
        :class="
          cn(
            'fixed start-1/2 top-1/2 z-50 grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-card p-6 shadow-lg',
          )
        "
      >
        <div class="space-y-1">
          <AlertDialogTitle class="text-lg font-semibold tracking-tight">{{
            props.title
          }}</AlertDialogTitle>
          <AlertDialogDescription v-if="props.description" class="text-sm text-muted-foreground">
            {{ props.description }}
          </AlertDialogDescription>
        </div>

        <div v-if="$slots.default" class="text-sm">
          <slot />
        </div>

        <div class="flex justify-end gap-2">
          <AlertDialogCancel
            data-action="cancel"
            :disabled="props.pending"
            class="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {{ props.cancelLabel }}
          </AlertDialogCancel>
          <!--
            Deliberately not `AlertDialogAction`: Reka implements it as
            `DialogClose`, so it closes before the caller can await its mutation.
            A plain button keeps `open` under the caller's control, which is what
            the React `event.preventDefault()` pattern achieved.
          -->
          <button
            type="button"
            data-action="confirm"
            :disabled="props.pending"
            :class="
              cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-xs transition-colors disabled:pointer-events-none disabled:opacity-50',
                props.variant === 'destructive'
                  ? 'bg-destructive text-white hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
              )
            "
            @click="emit('confirm')"
          >
            <Loader2 v-if="props.pending" class="size-4 animate-spin" aria-hidden="true" />
            {{ props.confirmLabel }}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
