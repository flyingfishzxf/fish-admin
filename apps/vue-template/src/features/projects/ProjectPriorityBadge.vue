<script setup lang="ts">
import type { ProjectPriority } from '@fish-admin/contracts'
import { Badge } from '@fish-admin/vue'

import { useT } from '../../lib/i18n'
import { PRIORITY_CLASSES } from './ProjectBadges'

defineProps<{ priority: ProjectPriority }>()
const t = useT('projects')
</script>

<template>
  <Badge variant="outline" :class="PRIORITY_CLASSES[priority]" data-project-priority>
    {{ t(`priority.${priority}`) }}
  </Badge>
</template>
