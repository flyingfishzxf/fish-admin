<script setup lang="ts">
import type { WorkflowType } from '@fish-admin/contracts'
import { Badge } from '@fish-admin/vue'

import { useT } from '../../lib/i18n'
import { TYPE_CLASSES } from './workflow-badges'

defineProps<{ type: WorkflowType }>()
const t = useT('workflows')
</script>

<template>
  <Badge variant="outline" :class="TYPE_CLASSES[type]" data-workflow-type>
    {{ t(`types.${type}`) }}
  </Badge>
</template>
