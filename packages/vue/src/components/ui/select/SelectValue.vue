<script setup lang="ts">
defineProps<{ label?: string; placeholder?: string }>()
</script>

<template>
  <span data-slot="select-value">{{ label ?? placeholder }}</span>
</template>
