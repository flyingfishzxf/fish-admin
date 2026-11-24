<script lang="ts">
export default { name: 'DropdownMenuBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/vue'
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'

const lastAction = ref('No action chosen yet')
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            <MoreHorizontal />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="min-w-44">
          <DropdownMenuItem @select="lastAction = 'Edit'">
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem @select="lastAction = 'Duplicate'">
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" @select="lastAction = 'Delete'">
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span class="fish-demo-muted">Last action: {{ lastAction }}</span>
    </div>
    <p class="fish-demo-muted">
      Open with Enter, Space or Arrow Down; Escape closes the menu and returns focus to the trigger.
    </p>
  </div>
</template>
