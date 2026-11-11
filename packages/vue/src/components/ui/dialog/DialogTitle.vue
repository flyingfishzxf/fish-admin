<script setup lang="ts">
import { DialogTitle as DialogTitlePrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <DialogTitlePrimitive
    data-slot="dialog-title"
    :class="cn('text-lg leading-none font-semibold', props.class)"
  >
    <slot />
  </DialogTitlePrimitive>
</template>
