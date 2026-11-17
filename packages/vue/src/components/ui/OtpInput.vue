<script setup lang="ts">
import { PinInputInput, PinInputRoot } from 'reka-ui'
import { ref, watch } from 'vue'
import { cn } from '@fish-admin/vue'

const props = withDefaults(
  defineProps<{ length?: number; invalid?: boolean; label?: string; disabled?: boolean }>(),
  { length: 6, invalid: false, disabled: false },
)

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [value: string] }>()

// Reka reports the code as an array of characters (and renders an extra hidden
// input), while callers think in plain strings. Keep the array local and expose
// a normalised string model so no caller has to know about the difference.
const slots = ref<string[]>([])

watch(
  () => model.value,
  (next) => {
    if ((next ?? '') !== slots.value.join('')) {
      slots.value = Array.from(next ?? '').slice(0, props.length)
    }
  },
  { immediate: true },
)

function handleUpdate(value: string[] | string) {
  const next = Array.isArray(value) ? value.join('') : value
  slots.value = Array.isArray(value) ? value.map(String) : Array.from(value)
  model.value = next
}

function handleComplete(value: string[] | string) {
  emit('complete', Array.isArray(value) ? value.join('') : value)
}
</script>

<template>
  <PinInputRoot
    :model-value="slots"
    :otp="true"
    type="text"
    inputmode="numeric"
    :disabled="props.disabled"
    :aria-label="props.label"
    :aria-invalid="props.invalid || undefined"
    data-slot="otp"
    class="flex items-center justify-center gap-2"
    @update:model-value="handleUpdate"
    @complete="handleComplete"
  >
    <PinInputInput
      v-for="slot in props.length"
      :key="slot"
      :index="slot - 1"
      data-slot="otp-slot"
      :class="
        cn(
          'size-11 rounded-lg border bg-transparent text-center text-base shadow-xs transition outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40',
          props.invalid && 'border-destructive',
        )
      "
    />
  </PinInputRoot>
</template>
