<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    /** Decimal places fixed on the value after it is committed. */
    precision?: number
    id?: string
    ariaLabel?: string
  }>(),
  {
    min: undefined,
    max: undefined,
    step: 1,
    precision: undefined,
    id: undefined,
    ariaLabel: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function clamp(value: number) {
  const lower = props.min ?? Number.NEGATIVE_INFINITY
  const upper = props.max ?? Number.POSITIVE_INFINITY
  return Math.min(Math.max(value, lower), upper)
}

function commit(value: string | number) {
  // `Number('')` is 0, so an emptied field would silently reset the value
  // instead of being ignored.
  const text = String(value).trim()
  if (text === '') return
  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return
  const bounded = clamp(parsed)
  emit(
    'update:modelValue',
    props.precision === undefined ? bounded : Number(bounded.toFixed(props.precision)),
  )
}
</script>

<template>
  <div
    data-slot="input-number"
    class="flex h-8 items-center overflow-hidden rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring/40"
  >
    <input
      :id="props.id"
      type="number"
      data-input-number
      class="h-full w-full min-w-0 bg-transparent px-2 text-sm tabular-nums outline-none"
      :value="props.modelValue"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :aria-label="props.ariaLabel"
      @change="commit(($event.target as HTMLInputElement).value)"
    />
    <div class="flex h-full shrink-0 flex-col border-l">
      <button
        type="button"
        data-input-number-step="up"
        class="grid h-1/2 w-6 place-items-center text-muted-foreground hover:bg-muted"
        :aria-label="`+${props.step}`"
        @click="commit(props.modelValue + props.step)"
      >
        <ChevronUp class="size-3" />
      </button>
      <button
        type="button"
        data-input-number-step="down"
        class="grid h-1/2 w-6 place-items-center border-t text-muted-foreground hover:bg-muted"
        :aria-label="`-${props.step}`"
        @click="commit(props.modelValue - props.step)"
      >
        <ChevronDown class="size-3" />
      </button>
    </div>
  </div>
</template>
