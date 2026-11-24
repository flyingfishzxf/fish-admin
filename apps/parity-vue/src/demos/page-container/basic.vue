<script lang="ts">
export default { name: 'PageContainerBasic' }
</script>

<script setup lang="ts">
import { Button, PageContainer } from '@fish-admin/vue'
import { Download } from 'lucide-vue-next'
</script>

<template>
  <div
    style="
      width: 100%;
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--background);
    "
  >
    <PageContainer
      title="Quarterly revenue"
      description="Invoices issued between July 1 and September 30, 2026, across all workspaces."
    >
      <template #actions>
        <Button type="button" size="sm" variant="outline">
          <Download aria-hidden="true" />
          Export CSV
        </Button>
      </template>
      <div
        style="
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
        "
      >
        <div>
          <span class="fish-demo-label">Gross revenue</span>
          <p style="margin: 0; font-size: 1.25rem; font-weight: 600">$1.28M</p>
        </div>
        <div>
          <span class="fish-demo-label">Invoices paid</span>
          <p style="margin: 0; font-size: 1.25rem; font-weight: 600">238 of 248</p>
        </div>
        <div>
          <span class="fish-demo-label">Overdue</span>
          <p style="margin: 0; font-size: 1.25rem; font-weight: 600">$18,400</p>
        </div>
      </div>
      <p class="fish-demo-muted" style="margin: 0">
        Ten invoices are still open. The oldest one was issued on August 2.
      </p>
    </PageContainer>
  </div>
</template>
