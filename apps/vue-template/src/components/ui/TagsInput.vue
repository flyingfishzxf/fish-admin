<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import { X } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    /** Hard ceiling — the hint text promises a number, so the input enforces it. */
    max?: number
    placeholder?: string
    ariaLabel?: string
    disabled?: boolean
    /** Offered values; those already picked are filtered out here. */
    suggestions?: string[]
    class?: string
  }>(),
  {
    max: 8,
    placeholder: undefined,
    ariaLabel: undefined,
    disabled: false,
    suggestions: () => [],
    class: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  /** Fired when a commit is rejected, so a caller can explain why. */
  full: []
}>()

const draft = ref('')
const field = ref<HTMLInputElement | null>(null)

function focusField() {
  field.value?.focus()
}

const remaining = computed(() => props.max - props.modelValue.length)
const available = computed(() =>
  props.suggestions.filter(
    (value) => !props.modelValue.some((tag) => tag.toLowerCase() === value.toLowerCase()),
  ),
)
const canAdd = computed(() => !props.disabled && remaining.value > 0)

function commit(raw: string) {
  // Commas split too: pasting "a, b, c" is the common way in, and rejecting it
  // would leave one useless tag called "a, b, c".
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) return

  const next = [...props.modelValue]
  for (const part of parts) {
    if (next.length >= props.max) {
      emit('full')
      break
    }
    // Case-insensitive de-duplication, but the spelling the user typed wins.
    if (next.some((tag) => tag.toLowerCase() === part.toLowerCase())) continue
    next.push(part)
  }

  if (next.length !== props.modelValue.length) emit('update:modelValue', next)
  draft.value = ''
}

function removeAt(index: number) {
  if (props.disabled) return
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    // Enter inside a form would submit it, and the comma would land in the
    // draft before the split could claim it.
    event.preventDefault()
    commit(draft.value)
    return
  }
  if (event.key === 'Backspace' && draft.value === '' && props.modelValue.length > 0) {
    event.preventDefault()
    removeAt(props.modelValue.length - 1)
  }
}

function pick(value: string) {
  if (!canAdd.value) return
  commit(value)
}
</script>

<template>
  <div :class="props.class" data-slot="tags-root">
    <div
      :class="
        cn(
          'flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 shadow-xs transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          disabled && 'cursor-not-allowed opacity-60',
        )
      "
      data-slot="tags-input"
      @click="focusField"
    >
      <span
        v-for="(tag, index) in modelValue"
        :key="`${tag}-${index}`"
        class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
        data-slot="tag"
      >
        {{ tag }}
        <button
          v-if="!disabled"
          type="button"
          class="rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          :aria-label="`Remove ${tag}`"
          data-tag-remove
          @click.stop="removeAt(index)"
        >
          <X class="size-3" aria-hidden="true" />
        </button>
      </span>

      <input
        ref="field"
        v-model="draft"
        type="text"
        :class="
          cn(
            'h-6 min-w-[7rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground',
          )
        "
        :placeholder="modelValue.length === 0 ? placeholder : undefined"
        :aria-label="ariaLabel"
        :disabled="disabled"
        :maxlength="40"
        data-slot="tag-field"
        @keydown="onKeydown"
        @blur="commit(draft)"
      />
    </div>

    <div v-if="available.length > 0 && canAdd" class="flex flex-wrap gap-1.5 pt-1.5">
      <button
        v-for="value in available"
        :key="value"
        type="button"
        class="rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        data-tag-suggestion
        @click="pick(value)"
      >
        {{ value }}
      </button>
    </div>
  </div>
</template>
