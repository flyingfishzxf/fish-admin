<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(defineProps<{ size?: 'sm' | 'default' }>(), { size: 'default' })
const model = defineModel<boolean>({ default: false })

const rootClass = computed(() =>
  cn(
    'peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
  ),
)

const thumbClass = cn(
  'pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=unchecked]:translate-x-0 ltr:data-[state=checked]:translate-x-[calc(100%-2px)] rtl:data-[state=checked]:-translate-x-[calc(100%-2px)] dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground',
)
</script>

<template>
  <SwitchRoot v-model="model" data-slot="switch" :data-size="props.size" :class="rootClass">
    <SwitchThumb data-slot="switch-thumb" :class="thumbClass" />
  </SwitchRoot>
</template>
