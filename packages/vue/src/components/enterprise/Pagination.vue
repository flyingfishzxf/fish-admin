<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-vue-next'
import { computed } from 'vue'

import { clampToPageCount } from '../../lib/list-page'

type PageToken = number | 'start-ellipsis' | 'end-ellipsis'

// Ported from the React template so both pagers show the same window: not the
// naive "current ± 2", which slides by one at each end and looks broken.
function pageTokens(current: number, count: number): PageToken[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)

  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  const tokens: PageToken[] = [1]
  if (start > 2) tokens.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) tokens.push(page)
  if (end < count - 1) tokens.push('end-ellipsis')
  tokens.push(count)
  return tokens
}

const props = defineProps<{ page: number; pageCount: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

const current = computed(() => clampToPageCount(props.page, props.pageCount))
const tokens = computed(() => pageTokens(current.value, props.pageCount))

const LINK_CLASS =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors'

function go(page: number) {
  const next = clampToPageCount(page, props.pageCount)
  if (next === props.page) return
  emit('update:page', next)
}
</script>

<template>
  <nav
    v-if="props.pageCount > 1"
    data-slot="pagination"
    class="flex items-center justify-center gap-1"
  >
    <button
      type="button"
      data-page-action="prev"
      :disabled="current <= 1"
      aria-label="Previous page"
      :class="cn(LINK_CLASS, 'hover:bg-accent disabled:pointer-events-none disabled:opacity-50')"
      @click="go(current - 1)"
    >
      <ChevronLeft class="size-4" aria-hidden="true" />
    </button>

    <template v-for="token in tokens" :key="String(token)">
      <span
        v-if="typeof token !== 'number'"
        data-page-ellipsis
        aria-hidden="true"
        :class="cn(LINK_CLASS, 'text-muted-foreground')"
      >
        <MoreHorizontal class="size-4" />
      </span>
      <button
        v-else
        type="button"
        :data-page="token"
        :aria-current="token === current ? 'page' : undefined"
        :class="
          cn(
            LINK_CLASS,
            token === current
              ? 'border bg-background shadow-xs'
              : 'text-muted-foreground hover:bg-accent',
          )
        "
        @click="go(token)"
      >
        {{ token }}
      </button>
    </template>

    <button
      type="button"
      data-page-action="next"
      :disabled="current >= props.pageCount"
      aria-label="Next page"
      :class="cn(LINK_CLASS, 'hover:bg-accent disabled:pointer-events-none disabled:opacity-50')"
      @click="go(current + 1)"
    >
      <ChevronRight class="size-4" aria-hidden="true" />
    </button>
  </nav>
</template>
