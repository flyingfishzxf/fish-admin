<script lang="ts">
export default { name: 'AnchorNavBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { AnchorNav, type AnchorItem } from '@fish-admin/vue'

const SECTIONS: AnchorItem[] = [
  { id: 'demo-anchor-report-summary', label: 'Summary' },
  { id: 'demo-anchor-report-headcount', label: 'Headcount' },
  { id: 'demo-anchor-report-spend', label: 'Spend' },
  { id: 'demo-anchor-report-risks', label: 'Risks' },
]

const COPY: Record<string, string> = {
  'demo-anchor-report-summary':
    'Revenue closed at $4.82M for the quarter, 6% above plan. Enterprise renewals landed ahead of schedule.',
  'demo-anchor-report-headcount':
    '142 people across nine squads. Three backend roles opened this week and interviews start on Monday.',
  'demo-anchor-report-spend':
    'Cloud spend is tracking 4% under budget after the October rightsizing pass.',
  'demo-anchor-report-risks':
    'Two vendor contracts expire in December; legal review starts next sprint.',
}

const scrollRef = ref<HTMLElement | null>(null)
</script>

<template>
  <div class="fish-demo-stack">
    <div
      style="display: grid; grid-template-columns: 8.5rem minmax(0, 1fr); gap: 1rem; width: 100%"
    >
      <AnchorNav :items="SECTIONS" ariaLabel="Report sections" :root="scrollRef" :offset="8" />
      <div
        ref="scrollRef"
        role="region"
        aria-label="Report sections content"
        tabindex="0"
        style="
          height: 232px;
          overflow-y: auto;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem;
        "
      >
        <section v-for="item in SECTIONS" :id="item.id" :key="item.id" style="margin-bottom: 1rem">
          <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600">{{ item.label }}</h4>
          <p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--muted-foreground)">
            {{ COPY[item.id] }}
          </p>
        </section>
        <!-- room after the last section, so it can scroll up to the offset line -->
        <div aria-hidden="true" style="height: 160px" />
      </div>
    </div>
    <p class="fish-demo-muted">
      Scroll the panel: the rail marks the last section whose top has crossed the offset line.
    </p>
  </div>
</template>
