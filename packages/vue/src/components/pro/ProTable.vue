<script setup lang="ts" generic="TData">
import { Loader2, Search, X } from 'lucide-vue-next'
import { computed, useSlots } from 'vue'

import { Button } from '../ui/button'
import Input from '../ui/input/Input.vue'

import BulkActionsBar from './BulkActionsBar.vue'
import DataTable from './DataTable.vue'
import type { ProTableProps } from './types'

const props = defineProps<ProTableProps<TData>>()
const slots = useSlots()

const hasDefaultToolbar = computed(() =>
  Boolean(props.search || props.fetching || slots.filters || slots.actions),
)
const showBulk = computed(() => Boolean(props.selection && props.selection.count > 0))
const bulkLabel = computed(() => props.selection?.label ?? '')
const bulkRegionLabel = computed(() => props.selection?.regionLabel)
const bulkClearLabel = computed(() => props.selection?.clearLabel ?? '')

function clearSelection() {
  props.selection?.onClear()
}
</script>

<template>
  <div data-slot="pro-table">
    <DataTable
      :table="table"
      :table-label="tableLabel"
      :loading="loading"
      :on-row-click="onRowClick"
    >
      <template v-if="slots.toolbar" #toolbar>
        <slot name="toolbar" />
      </template>
      <template v-else-if="hasDefaultToolbar" #toolbar>
        <div
          data-slot="pro-table-toolbar"
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div v-if="search" class="relative w-full min-w-0 sm:w-auto sm:max-w-xs sm:flex-1">
              <Search
                aria-hidden="true"
                class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                :model-value="search.value"
                :placeholder="search.placeholder"
                :aria-label="search.ariaLabel"
                class="h-9 ps-9"
                @update:model-value="search.onChange"
              />
              <Button
                v-if="search.value"
                type="button"
                variant="ghost"
                size="icon-xs"
                class="absolute end-2 top-1/2 -translate-y-1/2"
                :aria-label="search.clearLabel"
                @click="search.onChange('')"
              >
                <X aria-hidden="true" class="size-3.5" />
              </Button>
            </div>
            <slot name="filters" />
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span v-if="fetching" role="status" class="inline-flex items-center">
              <Loader2 aria-hidden="true" class="size-4 animate-spin text-muted-foreground" />
              <span class="sr-only">{{ fetchingLabel ?? 'Loading' }}</span>
            </span>
            <slot name="actions" />
          </div>
        </div>
      </template>
      <template #empty>
        <slot name="empty" />
      </template>
    </DataTable>

    <BulkActionsBar
      v-if="showBulk"
      :label="bulkLabel"
      :region-label="bulkRegionLabel"
      :clear-label="bulkClearLabel"
      @clear="clearSelection"
    >
      <slot name="selection-actions" />
    </BulkActionsBar>
  </div>
</template>
