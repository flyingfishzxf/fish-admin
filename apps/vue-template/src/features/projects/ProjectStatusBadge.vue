<script setup lang="ts">
import type { ProjectStatus } from '@fish-admin/contracts'
import { Badge } from '@fish-admin/vue'

import { useT } from '../../lib/i18n'
import { STATUS_CLASSES } from './ProjectBadges'

defineProps<{ status: ProjectStatus }>()
const t = useT('projects')
</script>

<template>
  <Badge variant="outline" :class="STATUS_CLASSES[status]" data-project-status>
    {{ t(`status.${status}`) }}
  </Badge>
</template>
