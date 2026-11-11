<script setup lang="ts">
import { DropdownMenuTrigger as DropdownMenuTriggerPrimitive } from 'reka-ui'

withDefaults(defineProps<{ asChild?: boolean }>(), { asChild: false })
</script>

<template>
  <DropdownMenuTriggerPrimitive data-slot="dropdown-menu-trigger" :as-child="asChild">
    <slot />
  </DropdownMenuTriggerPrimitive>
</template>
