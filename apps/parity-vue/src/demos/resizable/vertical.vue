<script lang="ts">
export default { name: 'ResizableVertical' }
</script>

<script setup lang="ts">
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@fish-admin/vue'

const REQUEST_BODY = `{
  "event": "member.invited",
  "workspace": "acme-design",
  "email": "new.teammate@acme.dev"
}`

const RESPONSE_BODY = `{
  "id": "evt_8f31c2",
  "status": "queued",
  "attempt": 1,
  "deliveredAt": null
}`

const PANE = { height: '100%', overflow: 'auto', padding: '0.75rem' }

const CODE = {
  margin: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.72rem',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
}
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 40rem">
    <ResizablePanelGroup
      orientation="vertical"
      style="
        height: 280px;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        overflow: hidden;
      "
    >
      <ResizablePanel :default-size="56" :min-size="30">
        <div :style="PANE" role="region" aria-label="Webhook request body" tabindex="0">
          <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600">
            Request · POST /webhooks/members
          </p>
          <pre :style="CODE">{{ REQUEST_BODY }}</pre>
        </div>
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="44" :min-size="24">
        <div :style="PANE" role="region" aria-label="Webhook response body" tabindex="0">
          <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600">
            Response · <span style="color: var(--muted-foreground)">202 Accepted</span>
          </p>
          <pre :style="CODE">{{ RESPONSE_BODY }}</pre>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    <p class="fish-demo-muted">
      The vertical group stacks panels and swaps the cursor; the grip icon rotates 90 degrees.
    </p>
  </div>
</template>
