<script setup lang="ts">
import { TabsContent as TabsContentPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ value: string; class?: string }>()
</script>

<template>
  <TabsContentPrimitive
    v-bind="$attrs"
    data-slot="tabs-content"
    :value="value"
    :class="cn('flex-1 outline-none', props.class)"
  >
    <slot />
  </TabsContentPrimitive>
</template>
