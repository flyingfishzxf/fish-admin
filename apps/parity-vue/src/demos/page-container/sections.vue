<script lang="ts">
export default { name: 'PageContainerSections' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, PageContainer, Segmented } from '@fish-admin/vue'
import { Settings2 } from 'lucide-vue-next'

const TAB_BODY: Record<string, string> = {
  overview: '18 members have access, 4 as billing owners and 2 as workspace admins.',
  pending: '3 invitations are waiting: grace@fish.dev, alan@fish.dev and edsger@fish.dev.',
  audit: 'The last access change was a role upgrade for ada@fish.dev on October 26, 2026.',
}

const tab = ref('overview')
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
      eyebrow="Workspace"
      title="Team members"
      description="Manage who can access the Acme workspace and what they can do."
      tabs
      footer
    >
      <template #actions>
        <Button type="button" size="sm" variant="outline">
          <Settings2 aria-hidden="true" />
          Manage roles
        </Button>
      </template>
      <template #tabs>
        <div style="padding-bottom: 0.5rem">
          <Segmented
            aria-label="Member views"
            size="sm"
            v-model="tab"
            :options="[
              { value: 'overview', label: 'Overview' },
              { value: 'pending', label: 'Pending invites' },
              { value: 'audit', label: 'Access log' },
            ]"
          />
        </div>
      </template>
      <p style="margin: 0">{{ TAB_BODY[tab] }}</p>
      <template #footer>
        <p class="fish-demo-muted" style="margin: 0">
          Last synced with Okta at 09:41 UTC. Changes are logged for 90 days.
        </p>
      </template>
    </PageContainer>
  </div>
</template>
