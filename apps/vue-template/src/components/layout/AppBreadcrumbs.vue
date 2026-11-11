<script setup lang="ts">
import { ChevronRight, House } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { findNavGroup, findNavItem } from '../../config/nav'
import { useT } from '../../lib/i18n'

const t = useT()
const route = useRoute()
const group = computed(() => findNavGroup(route.path))
const item = computed(() => findNavItem(route.path))
const onHome = computed(() => item.value?.to === '/')
</script>

<template>
  <nav :aria-label="t('common:breadcrumb.label')">
    <ol class="hidden items-center gap-1.5 text-sm sm:flex">
      <li v-if="onHome">
        <span
          aria-current="page"
          class="inline-flex items-center gap-1.5 font-normal text-foreground"
        >
          <House class="size-3.5" />
          {{ t('nav:breadcrumbs.home') }}
        </span>
      </li>
      <li v-else>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <House class="size-3.5" />
          <span class="sr-only">{{ t('nav:breadcrumbs.home') }}</span>
        </RouterLink>
      </li>

      <template v-if="group && item">
        <li aria-hidden="true">
          <ChevronRight class="size-3.5 text-muted-foreground" aria-hidden="true" />
        </li>
        <li class="hidden lg:inline">
          <span class="text-muted-foreground">{{ t(group.titleKey) }}</span>
        </li>
        <li aria-hidden="true" class="hidden lg:inline">
          <ChevronRight class="size-3.5 text-muted-foreground" aria-hidden="true" />
        </li>
        <li>
          <span aria-current="page" class="font-normal text-foreground">{{
            t(item.titleKey)
          }}</span>
        </li>
      </template>
    </ol>
  </nav>
</template>
