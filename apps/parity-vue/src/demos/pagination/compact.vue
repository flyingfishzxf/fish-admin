<script lang="ts">
export default { name: 'PaginationCompact' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Button, Pagination } from '@fish-admin/vue'

const TOTAL_RESULTS = 128
const PAGE_SIZES = [10, 25, 50]

const page = ref(3)
const pageSize = ref(25)
const totalPages = computed(() => Math.ceil(TOTAL_RESULTS / pageSize.value))
const first = computed(() => (page.value - 1) * pageSize.value + 1)
const last = computed(() => Math.min(page.value * pageSize.value, TOTAL_RESULTS))

function changePageSize(size: number) {
  pageSize.value = size
  page.value = Math.min(page.value, Math.ceil(TOTAL_RESULTS / size))
}
</script>

<template>
  <div class="fish-demo-stack">
    <Pagination v-model:page="page" :page-count="totalPages" aria-label="Compact pagination" />
    <div class="fish-demo-row" style="justify-content: space-between">
      <span class="fish-demo-label" id="demo-pagination-page-size">Rows per page</span>
      <div class="fish-demo-row">
        <Button
          v-for="size in PAGE_SIZES"
          :key="size"
          size="xs"
          :variant="size === pageSize ? 'secondary' : 'outline'"
          :aria-pressed="size === pageSize"
          @click="changePageSize(size)"
        >
          {{ size }}
        </Button>
      </div>
    </div>
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      Reports {{ first }}–{{ last }} of {{ TOTAL_RESULTS }}.
    </p>
  </div>
</template>
