<script lang="ts">
export default { name: 'BreadcrumbOverflow' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Breadcrumb, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@fish-admin/vue'
import { MoreHorizontal } from 'lucide-vue-next'

const opened = ref('No hidden folder opened yet')
</script>

<template>
  <div class="fish-demo-stack">
    <Breadcrumb
      :items="[
        { label: 'Files', to: '#files' },
        { label: 'Hidden folders', ellipsis: true },
        { label: 'Design', to: '#design' },
        { label: 'Q4 report' },
      ]"
    />
    <div class="fish-demo-row">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" aria-label="Show hidden folders">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem @select="opened = 'Documents'">Documents</DropdownMenuItem>
          <DropdownMenuItem @select="opened = 'Images'">Images</DropdownMenuItem>
          <DropdownMenuItem @select="opened = 'Archive'">Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p class="fish-demo-muted" aria-live="polite">{{ opened }}</p>
    </div>
    <p class="fish-demo-muted">
      The collapsed middle segment is static; the dropdown next to the trail shows how the hidden
      levels are chosen.
    </p>
  </div>
</template>
