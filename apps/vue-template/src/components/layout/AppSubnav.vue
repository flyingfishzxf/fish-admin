<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { NAV_GROUPS, findNavItem, isPathActive } from '../../config/nav'
import { useT } from '../../lib/i18n'
import { filterNavGroups } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'

const t = useT()
const route = useRoute()
const auth = useAuthStore()

const groups = computed(() => filterNavGroups(NAV_GROUPS, auth.user?.permissions ?? []))
const active = computed(() => findNavItem(route.path, groups.value))
const group = computed(() =>
  groups.value.find((candidate) => candidate.items.some((item) => item.to === active.value?.to)),
)
</script>

<template>
  <nav
    v-if="group"
    data-slot="app-subnav"
    :aria-label="t(group.titleKey)"
    class="flex items-center gap-1 overflow-x-auto border-b bg-background/60 px-4 py-1.5 sm:px-6"
  >
    <RouterLink
      v-for="item in group.items"
      :key="item.to"
      :to="item.to"
      :data-subnav-item="item.to"
      :aria-current="isPathActive(route.path, item.to) ? 'page' : undefined"
      class="shrink-0 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors hover:bg-accent/40"
      :class="
        isPathActive(route.path, item.to)
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border text-muted-foreground'
      "
    >
      {{ t(item.titleKey) }}
    </RouterLink>
  </nav>
</template>
