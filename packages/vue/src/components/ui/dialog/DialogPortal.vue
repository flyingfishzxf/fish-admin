<script setup lang="ts">
import { DialogPortal as DialogPortalPrimitive } from 'reka-ui'

defineProps<{ to?: string | HTMLElement }>()
</script>

<template>
  <DialogPortalPrimitive data-slot="dialog-portal" :to="to">
    <slot />
  </DialogPortalPrimitive>
</template>
