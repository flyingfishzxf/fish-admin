<script lang="ts">
export default { name: 'ResizableBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@fish-admin/vue'

const TICKETS = [
  {
    id: 'SUP-1042',
    title: 'Members export stalls',
    requester: 'Ada Lovelace',
    priority: 'High',
    updated: '12 min ago',
    body: 'Exporting the members table to CSV stops at roughly 10,000 rows. The job never finishes and nothing is written to the error log.',
  },
  {
    id: 'SUP-1039',
    title: 'Invite email never arrives',
    requester: 'Grace Hopper',
    priority: 'Normal',
    updated: '1 h ago',
    body: 'Two invitations were sent to the design team this morning. Both addresses are valid but neither inbox shows a message or a spam hit.',
  },
  {
    id: 'SUP-1031',
    title: 'Audit log timezone',
    requester: 'Alan Turing',
    priority: 'Low',
    updated: 'Yesterday',
    body: 'Audit entries show UTC while the rest of the workspace uses the team timezone. Reviewers keep mis-reading the order of events.',
  },
]

const selectedId = ref(TICKETS[0].id)
const selected = () => TICKETS.find((ticket) => ticket.id === selectedId.value) ?? TICKETS[0]

const PANE = { height: '100%', overflow: 'auto', padding: '0.75rem' }
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 44rem">
    <ResizablePanelGroup
      orientation="horizontal"
      style="
        height: 240px;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        overflow: hidden;
      "
    >
      <ResizablePanel :default-size="38" :min-size="26">
        <div :style="PANE" role="region" aria-label="Support queue" tabindex="0">
          <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600">Support queue</p>
          <div style="display: grid; gap: 0.375rem">
            <button
              v-for="ticket in TICKETS"
              :key="ticket.id"
              type="button"
              :style="{
                display: 'grid',
                gap: '0.125rem',
                width: '100%',
                padding: '0.5rem',
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
                cursor: 'pointer',
                borderRadius: '0.375rem',
                border: `1px solid ${ticket.id === selectedId ? 'var(--primary)' : 'var(--border)'}`,
                background: ticket.id === selectedId ? 'var(--muted)' : 'transparent',
              }"
              @click="selectedId = ticket.id"
            >
              <span style="font-size: 0.7rem; color: var(--muted-foreground)">
                {{ ticket.id }} · {{ ticket.priority }}
              </span>
              <span style="font-size: 0.8rem; font-weight: 500">{{ ticket.title }}</span>
            </button>
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="62" :min-size="34">
        <div :style="PANE" role="region" aria-label="Ticket detail" tabindex="0">
          <p style="margin: 0; font-size: 0.7rem; color: var(--muted-foreground)">
            {{ selected().id }} · {{ selected().priority }} priority · {{ selected().updated }}
          </p>
          <p style="margin: 0.25rem 0 0.5rem; font-size: 0.95rem; font-weight: 600">
            {{ selected().title }}
          </p>
          <p class="fish-demo-muted" style="margin: 0 0 0.75rem">
            Requested by {{ selected().requester }}
          </p>
          <p style="margin: 0; font-size: 0.8rem; line-height: 1.55">{{ selected().body }}</p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    <p class="fish-demo-muted">
      Drag the divider, or focus it and use the arrow keys. Double-click resets the panel.
    </p>
  </div>
</template>
