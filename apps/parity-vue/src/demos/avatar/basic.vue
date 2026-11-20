<script lang="ts">
export default { name: 'AvatarBasic' }
</script>

<script setup lang="ts">
import { Avatar, AvatarFallback } from '@fish-admin/vue'

const SIZES = [
  { size: 'sm', initials: 'AL', name: 'Ada Lovelace', label: 'sm · 24 px' },
  { size: 'default', initials: 'GH', name: 'Grace Hopper', label: 'default · 32 px' },
  { size: 'lg', initials: 'KJ', name: 'Katherine Johnson', label: 'lg · 40 px' },
] as const
</script>

<template>
  <div class="fish-demo-stack">
    <div v-for="item in SIZES" :key="item.size" class="fish-demo-row">
      <Avatar :size="item.size" role="img" :aria-label="item.name">
        <AvatarFallback>{{ item.initials }}</AvatarFallback>
      </Avatar>
      <span class="fish-demo-label">{{ item.label }}</span>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      <code>AvatarFallback</code> shows the initials until an <code>AvatarImage</code> finishes
      loading, and keeps them if the image fails. Fallback text is 14 px, or 12 px at the sm size.
    </p>
  </div>
</template>
