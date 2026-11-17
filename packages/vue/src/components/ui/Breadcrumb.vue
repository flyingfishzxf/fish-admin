<script setup lang="ts">
import { ChevronRight, MoreHorizontal } from 'lucide-vue-next'
import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'

export interface BreadcrumbEntry {
  label: string
  /** Renders the entry as a router link; omit it for the current page. */
  to?: string
  /** Collapses the entry into an ellipsis. */
  ellipsis?: boolean
}

const props = defineProps<{
  /** Trail in document order; the last non-ellipsis entry is the current page. */
  items: BreadcrumbEntry[]
  class?: string
}>()

const { t } = useUITranslation()
const entries = props.items
const lastIndex = entries.reduce((last, item, index) => (item.ellipsis ? last : index), 0)
</script>

<template>
  <nav :aria-label="t('breadcrumb.label')" data-slot="breadcrumb">
    <ol
      data-slot="breadcrumb-list"
      :class="
        cn(
          'flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5',
          props.class,
        )
      "
    >
      <template v-for="(item, index) in entries" :key="`${item.label}-${index}`">
        <li
          v-if="index > 0"
          data-slot="breadcrumb-separator"
          role="presentation"
          aria-hidden="true"
          class="[&>svg]:size-3.5"
        >
          <ChevronRight />
        </li>
        <li
          v-if="item.ellipsis"
          data-slot="breadcrumb-ellipsis"
          role="presentation"
          aria-hidden="true"
          class="flex size-9 items-center justify-center"
        >
          <MoreHorizontal class="size-4" />
          <span class="sr-only">{{ t('breadcrumb.more') }}</span>
        </li>
        <li v-else data-slot="breadcrumb-item" class="inline-flex items-center gap-1.5">
          <a
            v-if="item.to"
            data-slot="breadcrumb-link"
            :href="item.to"
            class="transition-colors hover:text-foreground"
          >
            {{ item.label }}
          </a>
          <span
            v-else-if="index === lastIndex"
            data-slot="breadcrumb-page"
            role="link"
            aria-disabled="true"
            aria-current="page"
            class="font-normal text-foreground"
          >
            {{ item.label }}
          </span>
          <span v-else data-slot="breadcrumb-link" class="transition-colors hover:text-foreground">
            {{ item.label }}
          </span>
        </li>
      </template>
    </ol>
  </nav>
</template>
