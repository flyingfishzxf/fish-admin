<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import { cn } from '@fish-admin/vue'
import { UploadCloud } from 'lucide-vue-next'
import { ref, useId } from 'vue'

import { useT } from '../../lib/i18n'

const props = withDefaults(
  defineProps<{
    /** Primary instruction; also the accessible name of the hidden input. */
    label: string
    accept?: string
    hint?: string
    disabled?: boolean
    error?: string
    class?: string
  }>(),
  {
    accept: undefined,
    hint: undefined,
    disabled: false,
    error: undefined,
    class: undefined,
  },
)

const emit = defineEmits<{ file: [file: File] }>()

const commonT = useT('common')
const inputId = useId()
const field = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
// Dragenter/dragleave fire for the children too; a counter keeps the highlight
// from flickering while the pointer crosses the icon or the label.
let dragDepth = 0

function enter(event: DragEvent) {
  event.preventDefault()
  if (props.disabled) return
  dragDepth += 1
  dragging.value = true
}

function leave(event: DragEvent) {
  event.preventDefault()
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragging.value = false
}

function drop(event: DragEvent) {
  event.preventDefault()
  dragDepth = 0
  dragging.value = false
  if (props.disabled) return
  const first = event.dataTransfer?.files?.[0]
  if (first) emit('file', first)
}

function change(event: Event) {
  const input = event.target as HTMLInputElement
  const first = input.files?.[0]
  // Clearing the value allows the same file to be picked again after a retry.
  input.value = ''
  if (first) emit('file', first)
}

function browse() {
  field.value?.click()
}
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
        disabled && 'opacity-60',
        props.class,
      )
    "
    :aria-disabled="disabled || undefined"
    data-slot="dropzone"
    @dragenter="enter"
    @dragover.prevent
    @dragleave="leave"
    @drop="drop"
  >
    <slot name="preview" />

    <span
      class="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground"
    >
      <UploadCloud class="size-5" aria-hidden="true" />
    </span>
    <p class="text-sm font-medium">{{ label }}</p>
    <p v-if="hint" class="max-w-xs text-xs text-muted-foreground">{{ hint }}</p>

    <input
      :id="inputId"
      ref="field"
      type="file"
      class="sr-only"
      :aria-label="label"
      :accept="accept"
      :disabled="disabled"
      data-slot="dropzone-file"
      @change="change"
    />
    <Button type="button" variant="outline" size="sm" :disabled="disabled" @click="browse">
      {{ commonT('enterprise.browse') }}
    </Button>
    <p v-if="error" role="alert" class="text-xs text-destructive" data-slot="dropzone-error">
      {{ error }}
    </p>
  </div>
</template>
