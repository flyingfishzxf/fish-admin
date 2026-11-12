<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@fish-admin/vue'

defineProps<{ open: boolean; title: string; description?: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

// Controlled component: the parent must apply `update:open` back to `open`, or
// Escape and the close button will not dismiss the drawer. Reka UI captures the
// element focused when the dialog opens and restores focus to it on close, so
// callers should open the drawer from a focused control, not with focus on body.
// `DialogContent` is a centred modal by default; these overrides pin it to the
// end edge and keep a scrollable body under a fixed header.
const DRAWER_CLASS =
  'inset-y-0! start-auto! end-0! top-0! mx-0! flex h-full! w-full! max-w-md! translate-y-0! flex-col gap-4 rounded-none! p-6 sm:max-w-md!'
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent :class="DRAWER_CLASS" role="dialog" aria-modal="true">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <!-- Reka UI warns when a dialog has no description. Keep one registered
             even without a visible summary, but hide it from sighted users. -->
        <DialogDescription :class="description ? undefined : 'sr-only'">
          {{ description ?? title }}
        </DialogDescription>
      </DialogHeader>
      <div class="min-h-0 flex-1 overflow-auto">
        <slot />
      </div>
    </DialogContent>
  </Dialog>
</template>
