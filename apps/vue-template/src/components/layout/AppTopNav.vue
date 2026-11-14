<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/vue'
import { ChevronDown } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { findNavItem, isPathActive, NAV_GROUPS } from '../../config/nav'
import { useT } from '../../lib/i18n'
import { filterNavGroups } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import BrandMark from '../common/BrandMark.vue'
import HeaderActions from './HeaderActions.vue'

const t = useT()
const route = useRoute()
const auth = useAuthStore()

const groups = computed(() => filterNavGroups(NAV_GROUPS, auth.user?.permissions ?? []))
const active = computed(() => findNavItem(route.path, groups.value))
</script>

<template>
  <header
    data-tour="topnav"
    class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-1 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6"
  >
    <RouterLink
      to="/"
      :aria-label="t('common:app.name')"
      class="flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-start transition-colors hover:bg-muted/60"
    >
      <BrandMark />
      <span class="hidden text-sm font-semibold tracking-tight lg:block">
        {{ t('common:app.name') }}
      </span>
    </RouterLink>

    <nav class="ms-2 flex min-w-0 items-center gap-0.5 overflow-x-auto">
      <DropdownMenu v-for="group in groups" :key="group.titleKey">
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            :class="
              group.items.some((item) => item.to === active?.to)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground'
            "
          >
            {{ t(group.titleKey) }}
            <ChevronDown class="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-56">
          <DropdownMenuLabel class="text-xs font-normal text-muted-foreground">
            {{ t(group.titleKey) }}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="item in group.items"
            :key="item.to"
            as-child
            :class="isPathActive(route.path, item.to) ? 'bg-accent' : undefined"
          >
            <RouterLink :to="item.to">
              <component :is="item.icon" class="size-4" />
              {{ t(item.titleKey) }}
            </RouterLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>

    <HeaderActions />
  </header>
</template>
