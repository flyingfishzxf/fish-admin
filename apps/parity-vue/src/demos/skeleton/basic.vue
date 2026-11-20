<script lang="ts">
export default { name: 'SkeletonBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Card, Skeleton } from '@fish-admin/vue'

const loading = ref(true)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button size="sm" variant="outline" @click="loading = !loading">
        {{ loading ? 'Load card' : 'Show skeleton' }}
      </Button>
      <span class="fish-demo-muted">
        {{ loading ? 'The placeholder mirrors the loaded card.' : 'Content replaces every block.' }}
      </span>
    </div>
    <div class="fish-demo-w-72" :aria-busy="loading">
      <Card v-if="loading" title="">
        <div class="fish-demo-stack" style="gap: 8px">
          <Skeleton style="height: 16px; width: 55%" />
          <Skeleton style="height: 12px; width: 80%" />
          <Skeleton style="height: 12px" />
          <Skeleton style="height: 12px" />
          <Skeleton style="height: 12px; width: 70%" />
          <Skeleton style="height: 32px; width: 104px; border-radius: 8px" />
        </div>
      </Card>
      <Card
        v-else
        title="Deploy preview"
        description="Build 4812 passed every check on October 27, 2026."
      >
        <p class="fish-demo-muted" style="margin: 0">api · web · docs · 4 targets</p>
        <template #footer>
          <Button size="sm" variant="outline">Open preview</Button>
        </template>
      </Card>
    </div>
  </div>
</template>
