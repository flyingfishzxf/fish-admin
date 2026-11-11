<script setup lang="ts">
import { DialogTrigger as DialogTriggerPrimitive } from 'reka-ui'

defineProps<{ asChild?: boolean }>()
</script>

<template>
  <DialogTriggerPrimitive data-slot="dialog-trigger" :as-child="asChild">
    <slot />
  </DialogTriggerPrimitive>
</template>
