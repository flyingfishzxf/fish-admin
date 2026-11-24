<script lang="ts">
export default { name: 'PaginationBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Pagination } from '@fish-admin/vue'

const TOTAL_RESULTS = 128
const PAGE_SIZE = 10
const TOTAL_PAGES = Math.ceil(TOTAL_RESULTS / PAGE_SIZE)

const page = ref(2)
const first = computed(() => (page.value - 1) * PAGE_SIZE + 1)
const last = computed(() => Math.min(page.value * PAGE_SIZE, TOTAL_RESULTS))
</script>

<template>
  <div class="fish-demo-stack">
    <Pagination v-model:page="page" :page-count="TOTAL_PAGES" aria-label="Reports pagination" />
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      Page {{ page }} of {{ TOTAL_PAGES }} — reports {{ first }}–{{ last }} of {{ TOTAL_RESULTS }}.
    </p>
  </div>
</template>
