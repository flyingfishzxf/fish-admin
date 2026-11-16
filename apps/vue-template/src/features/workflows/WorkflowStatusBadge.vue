<script setup lang="ts">
import type { WorkflowStatus } from '@fish-admin/contracts'
import { Badge } from '@fish-admin/vue'

import { useT } from '../../lib/i18n'
import { STATUS_CLASSES } from './workflow-badges'

defineProps<{ status: WorkflowStatus }>()
const t = useT('workflows')
</script>

<template>
  <Badge variant="outline" :class="STATUS_CLASSES[status]" data-workflow-status>
    {{ t(`status.${status}`) }}
  </Badge>
</template>
