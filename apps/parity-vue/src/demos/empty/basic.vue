<script lang="ts">
export default { name: 'EmptyBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, EmptyState } from '@fish-admin/vue'
import { FolderPlus, Inbox, Upload } from 'lucide-vue-next'

const status = ref('No action yet')
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 460px">
    <EmptyState
      class="rounded-xl border border-dashed py-12"
      :icon="Inbox"
      title="No projects yet"
      description="Projects keep boards, documents and reports for one team in one place."
    >
      <template #action>
        <div class="fish-demo-row" style="justify-content: center">
          <Button size="sm" @click="status = 'Create project — open your new-project dialog.'">
            <FolderPlus />
            Create project
          </Button>
          <Button
            size="sm"
            variant="outline"
            @click="status = 'Import — accept a CSV to seed the workspace.'"
          >
            <Upload />
            Import CSV
          </Button>
        </div>
        <p class="fish-demo-muted" style="margin: 0">Last action: {{ status }}</p>
      </template>
    </EmptyState>
    <p class="fish-demo-muted">
      The actions are your own buttons inside the <code>#action</code> slot; the empty state only
      renders the layout.
    </p>
  </div>
</template>
