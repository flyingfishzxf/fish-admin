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
    /** Defaults to the shared enterprise label; a page may name its own action. */
    browseLabel?: string
    /** Accepts a batch and emits `files` instead of `file`. */
    multiple?: boolean
    disabled?: boolean
    error?: string
    class?: string
  }>(),
  {
    accept: undefined,
    hint: undefined,
    browseLabel: undefined,
    multiple: false,
    disabled: false,
    error: undefined,
    class: undefined,
  },
)

const emit = defineEmits<{ file: [file: File]; files: [files: File[]] }>()

function accepted(files: File[]) {
  if (files.length === 0) return
  const list = files
  // Single mode keeps its original contract; batches go out as `files`.
  if (props.multiple) emit('files', list)
  else emit('file', list[0]!)
}

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
  accepted(Array.from(event.dataTransfer?.files ?? []))
}

function change(event: Event) {
  const input = event.target as HTMLInputElement
  // Copy before clearing: `input.files` is a live list, and resetting the value
  // empties it, which would hand the caller zero files.
  const picked = Array.from(input.files ?? [])
  // Clearing the value lets the same file be picked again after a retry.
  input.value = ''
  accepted(picked)
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
      :multiple="multiple"
      :disabled="disabled"
      data-slot="dropzone-file"
      @change="change"
    />
    <Button type="button" variant="outline" size="sm" :disabled="disabled" @click="browse">
      {{ browseLabel ?? commonT('enterprise.browse') }}
    </Button>
    <p v-if="error" role="alert" class="text-xs text-destructive" data-slot="dropzone-error">
      {{ error }}
    </p>
  </div>
</template>
