<script lang="ts">
export default { name: 'DropdownMenuSelections' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@fish-admin/vue'
import { Link2, Mail, Settings2 } from 'lucide-vue-next'

const gridLines = ref(true)
const inlineHints = ref(false)
const density = ref('comfortable')
const shareStatus = ref('Nothing shared yet')
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            <Settings2 />
            View options
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="min-w-52">
          <DropdownMenuLabel>Show</DropdownMenuLabel>
          <DropdownMenuCheckboxItem :checked="gridLines" @update:checked="gridLines = $event">
            Grid lines
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem :checked="inlineHints" @update:checked="inlineHints = $event">
            Inline hints
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup :model-value="density" @update:model-value="density = $event">
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem @select="shareStatus = 'Link copied'">
                <Link2 />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem @select="shareStatus = 'Email draft created'">
                <Mail />
                Send by email
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <p class="fish-demo-muted">
      Density: {{ density }} · Grid lines: {{ gridLines ? 'on' : 'off' }} · Inline hints:
      {{ inlineHints ? 'on' : 'off' }}
    </p>
    <p class="fish-demo-muted">Share: {{ shareStatus }}</p>
  </div>
</template>
