<script setup lang="ts">
import { DialogClose as DialogClosePrimitive } from 'reka-ui'

defineProps<{ asChild?: boolean }>()
</script>

<template>
  <DialogClosePrimitive data-slot="dialog-close" :as-child="asChild">
    <slot />
  </DialogClosePrimitive>
</template>
