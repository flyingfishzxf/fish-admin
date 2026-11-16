<script setup lang="ts">
import type { ProjectBudgetItem, ProjectDetail } from '@fish-admin/contracts'
import { Button, Input } from '@fish-admin/vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import Card from '../../components/ui/Card.vue'
import ProgressBar from '../../components/ui/ProgressBar.vue'
import { formatCurrency } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { updateProject } from './api'
import { budgetTotals } from './utils'

const props = defineProps<{ detail: ProjectDetail; canManage: boolean }>()

const t = useT('projects')
const queryClient = useQueryClient()

const project = computed(() => props.detail.project)
const rows = ref<ProjectBudgetItem[]>([])

function reset() {
  rows.value = project.value.budgetItems.map((item) => ({ ...item }))
}

// The server is the source of truth: a saved edit comes back through the query
// and replaces the draft.
watch(() => project.value.budgetItems, reset, { immediate: true, deep: true })
watch(() => project.value.id, reset)

const totals = computed(() => budgetTotals(rows.value, project.value.budget))

const saveMutation = useMutation({
  mutationFn: () =>
    updateProject(project.value.id, {
      budgetItems: rows.value.map((row) => ({
        id: row.id,
        label: row.label.trim(),
        amount: Number(row.amount) || 0,
      })),
    }),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['projects'] })
    void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
  },
})

function addRow() {
  rows.value = [
    ...rows.value,
    { id: `draft-${Math.random().toString(36).slice(2, 9)}`, label: '', amount: 0 },
  ]
}

function removeRow(id: string) {
  rows.value = rows.value.filter((row) => row.id !== id)
}

function setLabel(id: string, value: string) {
  rows.value = rows.value.map((row) => (row.id === id ? { ...row, label: value } : row))
}

function setAmount(id: string, value: string) {
  const amount = Number(value)
  rows.value = rows.value.map((row) =>
    row.id === id ? { ...row, amount: Number.isFinite(amount) ? amount : 0 } : row,
  )
}
</script>

<template>
  <div class="space-y-4" data-budget-tab>
    <div class="space-y-1">
      <h2 class="text-base font-semibold">{{ t('detail.budget.title') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('detail.budget.description') }}</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <Card :title="t('detail.budget.budgeted')">
        <p class="text-2xl font-semibold">{{ formatCurrency(project.budget, language) }}</p>
      </Card>
      <Card :title="t('detail.budget.spent')">
        <p class="text-2xl font-semibold">{{ formatCurrency(totals.spent, language) }}</p>
        <div class="flex items-center gap-2 pt-2">
          <ProgressBar
            :value="Math.min(totals.utilization, 100)"
            :ariaLabel="t('detail.budget.utilization')"
            :tone="totals.utilization > 100 ? 'warning' : 'default'"
          />
          <span class="text-xs text-muted-foreground">{{ totals.utilization }}%</span>
        </div>
      </Card>
      <Card :title="t('detail.budget.remaining')">
        <p
          class="text-2xl font-semibold"
          :class="totals.remaining < 0 && 'text-destructive'"
          data-budget-remaining
        >
          {{ formatCurrency(totals.remaining, language) }}
        </p>
      </Card>
    </div>

    <div class="overflow-x-auto rounded-xl border" data-budget-table>
      <table class="w-full text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 text-start font-medium">{{ t('detail.budget.label') }}</th>
            <th class="px-3 py-2 text-end font-medium">{{ t('detail.budget.amount') }}</th>
            <th class="px-3 py-2 text-end font-medium">{{ t('detail.budget.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t" :data-budget-row="row.id">
            <td class="px-3 py-2">
              <Input
                :model-value="row.label"
                :aria-label="t('detail.budget.label')"
                :disabled="!canManage"
                :data-budget-label="row.id"
                @update:modelValue="setLabel(row.id, String($event))"
              />
            </td>
            <td class="px-3 py-2">
              <Input
                type="number"
                min="0"
                step="100"
                class="text-end"
                :model-value="String(row.amount)"
                :aria-label="t('detail.budget.amount')"
                :disabled="!canManage"
                :data-budget-amount="row.id"
                @update:modelValue="setAmount(row.id, String($event))"
              />
            </td>
            <td class="px-3 py-2 text-end">
              <Button
                v-if="canManage"
                variant="ghost"
                size="icon-sm"
                :aria-label="t('detail.budget.delete')"
                :data-budget-remove="row.id"
                @click="removeRow(row.id)"
              >
                <Trash2 class="size-4" aria-hidden="true" />
              </Button>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="3" class="px-3 py-6 text-center text-sm text-muted-foreground">
              {{ t('detail.budget.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="canManage" class="flex flex-wrap items-center justify-between gap-2">
      <Button variant="outline" data-budget-add @click="addRow">
        <Plus class="size-4" aria-hidden="true" />
        {{ t('detail.budget.add') }}
      </Button>
      <Button
        :disabled="saveMutation.isPending.value"
        data-budget-save
        @click="saveMutation.mutate()"
      >
        {{ t('detail.budget.save') }}
      </Button>
    </div>
  </div>
</template>
