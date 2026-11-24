<script lang="ts">
export default { name: 'AnchorNavSticky' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { AnchorNav, type AnchorItem } from '@fish-admin/vue'

const SECTIONS: AnchorItem[] = [
  { id: 'demo-anchor-settings-general', label: 'General' },
  { id: 'demo-anchor-settings-members', label: 'Members' },
  { id: 'demo-anchor-settings-billing', label: 'Billing' },
  { id: 'demo-anchor-settings-integrations', label: 'Integrations' },
]

const COPY: Record<string, string> = {
  'demo-anchor-settings-general':
    'Workspace name, URL slug and the default language for new members.',
  'demo-anchor-settings-members': 'Invite people, change roles and set the domain auto-join rule.',
  'demo-anchor-settings-billing': 'Plan, seats and the invoice email that finance keeps on file.',
  'demo-anchor-settings-integrations':
    'Connected apps, API keys and the webhook endpoint used by the incident bot.',
}

const scrollRef = ref<HTMLElement | null>(null)
</script>

<template>
  <div class="fish-demo-stack">
    <div style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden; width: 100%">
      <div
        ref="scrollRef"
        role="region"
        aria-label="Workspace settings content"
        tabindex="0"
        style="height: 248px; overflow-y: auto"
      >
        <div
          style="position: sticky; top: 0; z-index: 1; background: var(--card); padding: 0 0.5rem"
        >
          <AnchorNav
            :items="SECTIONS"
            ariaLabel="Workspace settings sections"
            :root="scrollRef"
            :offset="44"
            orientation="horizontal"
          />
        </div>
        <div style="padding: 0.75rem">
          <section
            v-for="item in SECTIONS"
            :id="item.id"
            :key="item.id"
            style="margin-bottom: 1rem"
          >
            <h4 style="margin: 0; font-size: 0.875rem; font-weight: 600">{{ item.label }}</h4>
            <p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--muted-foreground)">
              {{ COPY[item.id] }}
            </p>
          </section>
          <!-- room after the last section, so it can scroll up under the sticky bar -->
          <div aria-hidden="true" style="height: 160px" />
        </div>
      </div>
    </div>
    <p class="fish-demo-muted">
      The bar sticks to the top of the panel and pages through the same sections with a bottom rule
      instead of a left rail.
    </p>
  </div>
</template>
