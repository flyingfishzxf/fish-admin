<script setup lang="ts">
import type { UserStatus } from '@fish-admin/contracts'
import { Badge } from '@fish-admin/vue'

import { useT } from '../../lib/i18n'

defineProps<{ status: UserStatus }>()

const t = useT()

// The list cell and the detail header are the same badge; keeping the two
// variant maps here stops one of them drifting to a different dot colour.
const VARIANTS: Record<UserStatus, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  invited: 'secondary',
  inactive: 'outline',
}

const DOTS: Record<UserStatus, string> = {
  active: 'bg-success',
  invited: 'bg-warning',
  inactive: 'bg-muted-foreground/60',
}
</script>

<template>
  <Badge :variant="VARIANTS[status]" class="gap-1.5 font-normal" data-slot="user-status-badge">
    <span :class="['size-1.5 rounded-full', DOTS[status]]" aria-hidden="true" />
    {{ t(`common:status.${status}`) }}
  </Badge>
</template>
