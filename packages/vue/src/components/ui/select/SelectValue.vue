<script setup lang="ts">
import { injectSelectRootContext } from 'reka-ui'
import { onMounted, ref } from 'vue'

defineProps<{ label?: string; placeholder?: string }>()

// Standalone usage (e.g. unit tests) has no Select root; fall back to `null` instead of throwing.
const rootContext = injectSelectRootContext(null)
const valueElement = ref<HTMLElement | null>(null)

// Reka's item-aligned positioner measures this node, so register it like Reka's own SelectValue does.
onMounted(() => {
  if (rootContext && valueElement.value) {
    rootContext.onValueElementChange(valueElement.value)
  }
})
</script>

<template>
  <span ref="valueElement" data-slot="select-value">{{ label ?? placeholder }}</span>
</template>
