<script setup lang="ts">
import type { WorkflowInstance } from '@fish-admin/contracts'
import { Button } from '@fish-admin/vue'
import { ChevronRight } from 'lucide-vue-next'

import { formatCurrency, formatRelativeTime } from '../../lib/format'
import { useT } from '../../lib/i18n'
import WorkflowStatusBadge from './WorkflowStatusBadge.vue'
import WorkflowTypeBadge from './WorkflowTypeBadge.vue'

const props = defineProps<{ rows: WorkflowInstance[]; language: string }>()
const emit = defineEmits<{ open: [instance: WorkflowInstance] }>()

const t = useT('workflows')
</script>

<template>
  <div class="overflow-x-auto rounded-xl border" data-workflow-table>
    <table class="w-full text-sm">
      <thead class="bg-muted/40 text-xs text-muted-foreground">
        <tr>
          <th class="px-3 py-2 text-start font-medium">{{ t('columns.request') }}</th>
          <th class="px-3 py-2 text-start font-medium">{{ t('columns.type') }}</th>
          <th class="px-3 py-2 text-start font-medium">{{ t('columns.status') }}</th>
          <th class="px-3 py-2 text-start font-medium">{{ t('columns.initiator') }}</th>
          <th class="px-3 py-2 text-start font-medium">{{ t('columns.approver') }}</th>
          <th class="px-3 py-2 text-end font-medium">{{ t('columns.amount') }}</th>
          <th class="px-3 py-2 text-start font-medium">{{ t('columns.updated') }}</th>
          <th class="px-3 py-2 text-end">
            <span class="sr-only">{{ t('columns.open') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in props.rows"
          :key="row.id"
          class="cursor-pointer border-t transition-colors hover:bg-muted/40"
          :data-workflow-row="row.id"
          @click="emit('open', row)"
        >
          <td class="px-3 py-2">
            <div class="min-w-0 space-y-0.5">
              <p class="truncate font-medium">{{ row.title }}</p>
              <p class="font-mono text-xs text-muted-foreground">{{ row.code }}</p>
            </div>
          </td>
          <td class="px-3 py-2"><WorkflowTypeBadge :type="row.type" /></td>
          <td class="px-3 py-2"><WorkflowStatusBadge :status="row.status" /></td>
          <td class="px-3 py-2">
            <span class="block truncate">{{ row.initiatorName }}</span>
          </td>
          <td class="px-3 py-2">
            <span class="block truncate">
              {{
                row.status === 'pending' ? (row.currentApproverName ?? '—') : t('columns.closed')
              }}
            </span>
          </td>
          <td class="px-3 py-2 text-end tabular-nums">
            {{ row.amount === undefined ? '—' : formatCurrency(row.amount, props.language) }}
          </td>
          <td class="px-3 py-2 whitespace-nowrap text-muted-foreground">
            {{ formatRelativeTime(row.updatedAt, props.language) }}
          </td>
          <td class="px-3 py-2 text-end">
            <Button
              variant="ghost"
              size="icon-sm"
              :aria-label="`${t('columns.open')}: ${row.title}`"
              :data-open="row.id"
              @click.stop="emit('open', row)"
            >
              <ChevronRight class="size-4" aria-hidden="true" />
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
