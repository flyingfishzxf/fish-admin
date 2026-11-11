<script setup lang="ts">
import { FlaskConical } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { NAV_GROUPS, isPathActive } from '../../config/nav'
import { useT } from '../../lib/i18n'
import { filterNavGroups } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import BrandMark from '../common/BrandMark.vue'

const t = useT()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const groups = computed(() => filterNavGroups(NAV_GROUPS, auth.user?.permissions ?? []))
const drawer = ref<HTMLElement | null>(null)
const appVersion = __APP_VERSION__

function isActive(to: string) {
  return isPathActive(route.path, to)
}

// The drawer is the only place focus is moved by us: opening it hands focus to
// the first link, closing it hands focus back to the header trigger.
watch(
  () => ui.mobileOpen,
  async (open) => {
    await nextTick()
    if (open) drawer.value?.querySelector<HTMLElement>('[data-sidebar-link]')?.focus()
    else document.getElementById('sidebar-trigger')?.focus()
  },
)
</script>

<template>
  <aside
    class="hidden border-e bg-sidebar text-sidebar-foreground lg:flex lg:flex-col"
    :class="ui.collapsed ? 'w-16' : 'w-64'"
  >
    <RouterLink
      to="/"
      :aria-label="t('common:app.name')"
      class="flex items-center gap-2.5 px-1.5 py-1"
      @click="ui.closeMobile()"
    >
      <BrandMark />
      <div class="min-w-0 leading-tight" :class="ui.collapsed ? 'hidden' : 'grid'">
        <span class="truncate text-sm font-semibold tracking-tight">{{
          t('common:app.name')
        }}</span>
        <span class="truncate text-[11px] text-muted-foreground">
          {{ t('common:app.tagline') }}
        </span>
      </div>
    </RouterLink>

    <nav
      :aria-label="t('common:sidebar.mobileTitle')"
      class="flex-1 space-y-3 overflow-y-auto px-2 py-4"
    >
      <div v-for="group in groups" :key="group.titleKey" class="space-y-0.5">
        <p
          :data-sidebar-group="group.titleKey"
          class="px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          :class="ui.collapsed ? 'hidden' : undefined"
        >
          {{ t(group.titleKey) }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          data-sidebar-link
          :title="ui.collapsed ? t(item.titleKey) : undefined"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          :class="
            isActive(item.to)
              ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
              : undefined
          "
          @click="ui.closeMobile()"
        >
          <component :is="item.icon" class="size-4 shrink-0" />
          <span :class="ui.collapsed ? 'hidden' : undefined">{{ t(item.titleKey) }}</span>
        </RouterLink>
      </div>
    </nav>

    <div class="flex flex-col gap-1.5 p-2">
      <div
        class="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/60 p-2.5"
        :class="ui.collapsed ? 'hidden' : undefined"
      >
        <p class="flex items-center gap-2 text-xs font-semibold">
          <FlaskConical class="size-3.5 text-primary" />
          {{ t('common:sidebar.demoTitle') }}
        </p>
        <p class="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          {{ t('common:sidebar.demoDescription') }}
        </p>
      </div>
      <p
        class="px-2 pb-0.5 text-[11px] text-muted-foreground"
        :class="ui.collapsed ? 'hidden' : undefined"
      >
        {{ t('common:sidebar.version', { version: appVersion }) }}
      </p>
    </div>
  </aside>

  <Teleport to="body">
    <div v-if="ui.mobileOpen" class="fixed inset-0 z-50 lg:hidden">
      <div class="absolute inset-0 bg-black/50" @click="ui.closeMobile" />
      <aside
        ref="drawer"
        role="dialog"
        aria-modal="true"
        :aria-label="t('common:sidebar.mobileTitle')"
        class="absolute inset-y-0 start-0 flex w-72 flex-col border-e bg-sidebar text-sidebar-foreground shadow-xl"
        @keydown.esc="ui.closeMobile"
      >
        <RouterLink
          to="/"
          :aria-label="t('common:app.name')"
          class="flex items-center gap-2.5 px-1.5 py-1"
          @click="ui.closeMobile()"
        >
          <BrandMark />
          <div class="grid min-w-0 leading-tight">
            <span class="truncate text-sm font-semibold tracking-tight">
              {{ t('common:app.name') }}
            </span>
            <span class="truncate text-[11px] text-muted-foreground">
              {{ t('common:app.tagline') }}
            </span>
          </div>
        </RouterLink>

        <nav
          :aria-label="t('common:sidebar.mobileTitle')"
          class="flex-1 space-y-3 overflow-y-auto px-2 py-4"
        >
          <div v-for="group in groups" :key="group.titleKey" class="space-y-0.5">
            <p class="px-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {{ t(group.titleKey) }}
            </p>
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              data-sidebar-link
              :aria-current="isActive(item.to) ? 'page' : undefined"
              class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              :class="
                isActive(item.to)
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : undefined
              "
              @click="ui.closeMobile()"
            >
              <component :is="item.icon" class="size-4 shrink-0" />
              <span>{{ t(item.titleKey) }}</span>
            </RouterLink>
          </div>
        </nav>

        <div class="flex flex-col gap-1.5 p-2">
          <div class="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/60 p-2.5">
            <p class="flex items-center gap-2 text-xs font-semibold">
              <FlaskConical class="size-3.5 text-primary" />
              {{ t('common:sidebar.demoTitle') }}
            </p>
            <p class="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {{ t('common:sidebar.demoDescription') }}
            </p>
          </div>
          <p class="px-2 pb-0.5 text-[11px] text-muted-foreground">
            {{ t('common:sidebar.version', { version: appVersion }) }}
          </p>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
