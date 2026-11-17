<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import { cn } from '../../lib/utils'
import Spinner from './Spinner.vue'

const props = withDefaults(
  defineProps<{
    /** Whether the overlay is shown; mirrored as `aria-busy` on the wrapper. */
    loading: boolean
    /** Accessible name announced by the spinner inside the overlay. */
    label?: string
    /** Milliseconds before the overlay appears, so fast loads never flash it. */
    delay?: number
    class?: string
  }>(),
  { delay: 0 },
)

const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.loading,
  (loading) => {
    if (timer) clearTimeout(timer)
    if (!loading) {
      visible.value = false
      return
    }
    if (props.delay <= 0) {
      visible.value = true
      return
    }
    timer = setTimeout(() => (visible.value = true), props.delay)
  },
  { immediate: true },
)

onBeforeUnmount(() => timer && clearTimeout(timer))
</script>

<template>
  <div data-slot="loading-overlay" :aria-busy="props.loading" :class="cn('relative', props.class)">
    <slot />
    <div
      v-if="props.loading && visible"
      data-slot="loading-overlay-content"
      class="absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-background/70 backdrop-blur-sm"
    >
      <Spinner :label="props.label" />
    </div>
  </div>
</template>
