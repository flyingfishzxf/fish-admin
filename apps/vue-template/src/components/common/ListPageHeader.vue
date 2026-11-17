<script setup lang="ts">
import { PageHeader } from '@fish-admin/vue'

defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="space-y-4">
    <PageHeader :title="title" :description="description">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </PageHeader>
    <!-- `toolbar`, not `filters`: ProTable already owns a `#filters` slot. -->
    <div v-if="$slots.toolbar" class="flex flex-wrap items-center gap-2">
      <slot name="toolbar" />
    </div>
  </div>
</template>
