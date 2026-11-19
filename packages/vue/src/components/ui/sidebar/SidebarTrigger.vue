<script setup lang="ts">
import { PanelLeftIcon } from 'lucide-vue-next'

import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { useSidebar } from './context'

const props = defineProps<{ class?: string }>()
const sidebar = useSidebar()
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="cn('size-7', props.class)"
    @click="sidebar.toggleSidebar()"
  >
    <PanelLeftIcon />
    <span class="sr-only">Toggle sidebar</span>
  </Button>
</template>
