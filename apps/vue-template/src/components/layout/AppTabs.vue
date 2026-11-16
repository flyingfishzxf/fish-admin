<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/vue'
import { Pin, PinOff, RefreshCw, X } from 'lucide-vue-next'
import { computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter, type LocationQuery } from 'vue-router'

import { NAV_GROUPS, findNavItem } from '../../config/nav'
import { useT } from '../../lib/i18n'
import { filterNavGroups } from '../../lib/permissions'
import { queryClient } from '../../lib/query-client'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'

const t = useT('common')
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

/** Vue Router query values are strings or arrays of strings; tabs keep one string. */
function normalizeQuery(query: LocationQuery): Record<string, string> | undefined {
  const search: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    const first = Array.isArray(value) ? value[0] : value
    if (typeof first === 'string' && first !== '') search[key] = first
  }
  return Object.keys(search).length > 0 ? search : undefined
}

const reachable = computed(() =>
  filterNavGroups(NAV_GROUPS, auth.user?.permissions ?? []).flatMap((group) =>
    group.items.map((item) => item.to),
  ),
)

// A role switch can strip pages from the menu; their tabs must go with them.
watch(reachable, (allowed) => ui.keepOnlyTabs(allowed), { immediate: true })

watch(
  () => route.path,
  (path) => {
    if (!reachable.value.includes(path)) return
    ui.openTab({ to: path, search: normalizeQuery(route.query), pinned: false })
  },
  { immediate: true },
)

const tabs = computed(() => ui.tabs)

function label(to: string) {
  const item = findNavItem(to)
  return item ? t(item.titleKey) : to
}

function tabTarget(tab: { to: string; search?: Record<string, string> }) {
  return { path: tab.to, query: tab.search ?? {} }
}

/** Closing the active tab must land somewhere sensible, never on a blank page. */
function goAfterClose(closed: string) {
  if (route.path !== closed) return
  const remaining = ui.tabs.filter((tab) => tab.to !== closed)
  const next = remaining[remaining.length - 1]
  void router.push(next ? tabTarget(next) : '/')
}

function closeTab(to: string) {
  ui.closeTab(to)
  goAfterClose(to)
}

function closeOthers(to: string) {
  ui.closeOtherTabs(to)
  void router.push(tabTarget(ui.tabs.find((tab) => tab.to === to) ?? { to }))
}

function closeToRight(to: string) {
  ui.closeTabsToRight(to)
  if (!ui.tabs.some((tab) => tab.to === route.path)) void router.push(tabTarget({ to }))
}

function closeAll() {
  ui.closeAllTabs()
  if (ui.tabs.some((tab) => tab.to === route.path)) return
  const first = ui.tabs[0]
  void router.push(first ? tabTarget(first) : '/')
}

function reload(tab: { to: string; search?: Record<string, string> }) {
  if (tab.to === route.path) {
    void queryClient.invalidateQueries()
    return
  }
  void router.push(tabTarget(tab))
}
</script>

<template>
  <!-- These tabs navigate between routes, so they are links, not an ARIA tab
       widget: a `tablist` may only own `tab` children, and each tab would owe a
       `tabpanel`. `nav` + `aria-current` describes what they actually do. -->
  <nav
    v-if="tabs.length > 0"
    :aria-label="t('tabs.label')"
    data-slot="app-tabs"
    class="flex items-center gap-0.5 overflow-x-auto border-b bg-background/60 px-2 py-1.5"
  >
    <div
      v-for="tab in tabs"
      :key="tab.to"
      class="group flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors"
      :class="
        tab.to === route.path
          ? 'border-primary/40 bg-primary/5 text-foreground'
          : 'border-transparent text-muted-foreground hover:bg-muted/60'
      "
    >
      <RouterLink
        :to="tabTarget(tab)"
        :data-tab="tab.to"
        :aria-current="tab.to === route.path ? 'page' : undefined"
        class="max-w-40 truncate px-1 py-0.5"
      >
        {{ label(tab.to) }}
      </RouterLink>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="grid size-5 place-items-center rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted focus-visible:opacity-100"
            :data-tab-action="`menu:${tab.to}`"
            :aria-label="t('tabs.menu', { title: label(tab.to) })"
          >
            <Pin v-if="tab.pinned" class="size-3" />
            <span v-else class="text-[10px] leading-none">•••</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-48">
          <DropdownMenuItem @select="ui.toggleTabPin(tab.to)">
            <PinOff v-if="tab.pinned" class="size-4" />
            <Pin v-else class="size-4" />
            {{ tab.pinned ? t('tabs.unpin') : t('tabs.pin') }}
          </DropdownMenuItem>
          <DropdownMenuItem @select="reload(tab)">
            <RefreshCw class="size-4" />
            {{ t('tabs.reload') }}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @select="closeTab(tab.to)">
            {{ t('tabs.close') }}
          </DropdownMenuItem>
          <DropdownMenuItem @select="closeOthers(tab.to)">
            {{ t('tabs.closeOthers') }}
          </DropdownMenuItem>
          <DropdownMenuItem @select="closeToRight(tab.to)">
            {{ t('tabs.closeRight') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        class="grid size-5 place-items-center rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted focus-visible:opacity-100"
        :data-tab-action="`close:${tab.to}`"
        :aria-label="t('tabs.closeTitle', { title: label(tab.to) })"
        @click="closeTab(tab.to)"
      >
        <X class="size-3" />
      </button>
    </div>

    <Button
      variant="ghost"
      size="sm"
      class="ms-auto shrink-0 text-xs text-muted-foreground"
      data-tab-action="close-all"
      @click="closeAll"
    >
      {{ t('tabs.closeAll') }}
    </Button>
  </nav>
</template>
