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
  <nav aria-label="Breadcrumb" class="hidden items-center gap-1.5 text-sm sm:flex">
    <span
      v-if="onHome"
      aria-current="page"
      class="inline-flex items-center gap-1.5 font-normal text-foreground"
    >
      <House class="size-3.5" />
      {{ t('nav:breadcrumbs.home') }}
    </span>
    <RouterLink
      v-else
      to="/"
      class="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      <House class="size-3.5" />
      <span class="sr-only">{{ t('nav:breadcrumbs.home') }}</span>
    </RouterLink>

    <template v-if="group && item">
      <ChevronRight class="size-3.5 text-muted-foreground" aria-hidden="true" />
      <span aria-current="page" class="hidden text-muted-foreground lg:inline">
        {{ t(group.titleKey) }}
      </span>
      <ChevronRight class="hidden size-3.5 text-muted-foreground lg:block" aria-hidden="true" />
      <span aria-current="page" class="font-normal text-foreground">{{ t(item.titleKey) }}</span>
    </template>
  </nav>
</template>
