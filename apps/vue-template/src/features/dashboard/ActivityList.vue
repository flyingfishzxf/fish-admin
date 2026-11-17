<script setup lang="ts">
import type { ActivityAction, ActivityItem } from '@fish-admin/contracts'
import { LogIn, Pencil, RotateCcw, ShieldCheck, Trash2, UserPlus, UserRound } from 'lucide-vue-next'
import type { Component } from 'vue'

import { EmptyState } from '@fish-admin/vue'
import { formatRelativeTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'

const ACTION_ICONS: Record<ActivityAction, Component> = {
  'user.created': UserPlus,
  'user.updated': Pencil,
  'user.deleted': Trash2,
  'user.restored': RotateCcw,
  'role.updated': ShieldCheck,
  'auth.login': LogIn,
  'profile.updated': UserRound,
}

const ACTION_TILES: Record<ActivityAction, string> = {
  'user.created': 'bg-chart-3/14 text-chart-3-foreground',
  'user.updated': 'bg-chart-1/12 text-chart-1-foreground',
  'user.deleted': 'bg-destructive/10 text-destructive',
  'user.restored': 'bg-chart-3/14 text-chart-3-foreground',
  'role.updated': 'bg-chart-4/16 text-chart-4-foreground',
  'auth.login': 'bg-chart-2/14 text-chart-2-foreground',
  'profile.updated': 'bg-muted text-muted-foreground',
}

defineProps<{ items: ActivityItem[] }>()

const t = useT('dashboard')
</script>

<template>
  <EmptyState v-if="items.length === 0" :title="t('activity.empty')" class="py-10" />
  <ul v-else class="divide-y divide-border">
    <li
      v-for="item in items"
      :key="item.id"
      class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
    >
      <span
        :class="`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${ACTION_TILES[item.action]}`"
      >
        <component :is="ACTION_ICONS[item.action]" class="size-4" />
      </span>
      <div class="min-w-0 flex-1 space-y-0.5">
        <p class="text-sm leading-snug">
          {{ t(`activity.${item.action}`, { actor: item.actorName, target: item.target }) }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ formatRelativeTime(item.createdAt, language) }}
        </p>
      </div>
    </li>
  </ul>
</template>
