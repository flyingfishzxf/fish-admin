<script setup lang="ts">
import type { WorkflowDecision, WorkflowDetail } from '@fish-admin/contracts'
import {
  AlertDialog,
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { CheckCheck, CircleX, Forward } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { hasPermission } from '../../lib/permissions'
import { useT } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { decideWorkflow, type WorkflowDecisionInput } from './api'
import { workflowApproversQueryOptions } from './queries'

const props = defineProps<{ detail: WorkflowDetail }>()

const t = useT('workflows')
const auth = useAuthStore()
const queryClient = useQueryClient()

const instance = computed(() => props.detail.instance)
const me = computed(() => auth.user?.id)

/**
 * Three conditions, one place: the form is open, I am the approver it waits on,
 * and my role may approve at all.
 */
const actionable = computed(
  () =>
    instance.value.status === 'pending' &&
    instance.value.currentApproverId === me.value &&
    hasPermission(auth.user?.permissions, 'workflow:approve'),
)

const approvers = useQuery({ ...workflowApproversQueryOptions, enabled: actionable })
const note = ref('')
const transferTo = ref('')
const pendingDecision = ref<WorkflowDecision | null>(null)
const error = ref('')

const targets = computed(() =>
  (approvers.data.value ?? []).filter((approver) => approver.id !== me.value),
)
const selectedApprover = computed(() =>
  targets.value.find((approver) => approver.id === transferTo.value),
)

const mutation = useMutation({
  mutationFn: (input: WorkflowDecisionInput) => decideWorkflow(instance.value.id, input),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['workflows'] })
    await queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    note.value = ''
    transferTo.value = ''
    error.value = ''
  },
  onError: () => {
    error.value = t('actions.failed')
  },
})

const dialogCopy = computed(() => {
  if (pendingDecision.value === 'approve') {
    return { title: t('actions.approveTitle'), description: t('actions.approveDescription') }
  }
  if (pendingDecision.value === 'reject') {
    return { title: t('actions.rejectTitle'), description: t('actions.rejectDescription') }
  }
  return {
    title: t('actions.transferTitle'),
    description: selectedApprover.value
      ? t('actions.transferDescription', { name: selectedApprover.value.name })
      : t('actions.transferPlaceholder'),
  }
})

const confirmLabel = computed(() => {
  if (pendingDecision.value === 'approve') return t('actions.approve')
  if (pendingDecision.value === 'reject') return t('actions.reject')
  return t('actions.transfer')
})

function ask(decision: WorkflowDecision) {
  if (decision === 'transfer' && !selectedApprover.value) return
  pendingDecision.value = decision
}

function close() {
  pendingDecision.value = null
}

function confirm() {
  const decision = pendingDecision.value
  pendingDecision.value = null
  if (!decision) return
  mutation.mutate({
    decision,
    comment: note.value.trim() || undefined,
    transferToId: decision === 'transfer' ? transferTo.value : undefined,
  })
}
</script>

<template>
  <Card
    v-if="actionable"
    :title="t('actions.title')"
    :description="t('actions.description')"
    data-decision-panel
  >
    <div class="space-y-3">
      <textarea
        v-model="note"
        rows="2"
        maxlength="1000"
        :placeholder="t('actions.notePlaceholder')"
        :aria-label="t('actions.note')"
        data-decision-note
        class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />

      <div class="flex flex-wrap items-center gap-2">
        <Button :disabled="mutation.isPending.value" data-approve @click="ask('approve')">
          <CheckCheck class="size-4" aria-hidden="true" />
          {{ t('actions.approve') }}
        </Button>
        <Button
          variant="outline"
          :disabled="mutation.isPending.value"
          data-reject
          @click="ask('reject')"
        >
          <CircleX class="size-4" aria-hidden="true" />
          {{ t('actions.reject') }}
        </Button>

        <Select v-model="transferTo">
          <SelectTrigger
            class="h-9 w-[13rem]"
            :aria-label="t('actions.transferTo')"
            data-transfer-target
          >
            <SelectValue :label="selectedApprover?.name" :placeholder="t('actions.transferTo')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="approver in targets" :key="approver.id" :value="approver.id">
              {{ approver.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          :disabled="!selectedApprover || mutation.isPending.value"
          data-transfer
          @click="ask('transfer')"
        >
          <Forward class="size-4" aria-hidden="true" />
          {{ t('actions.transfer') }}
        </Button>
      </div>

      <p v-if="error" role="alert" class="text-xs text-destructive" data-decision-error>
        {{ error }}
      </p>
    </div>

    <AlertDialog
      :open="pendingDecision !== null"
      :title="dialogCopy.title"
      :description="dialogCopy.description"
      :confirm-label="confirmLabel"
      :cancel-label="t('common:actions.cancel')"
      :pending="mutation.isPending.value"
      :variant="pendingDecision === 'reject' ? 'destructive' : 'default'"
      @update:open="(open) => !open && close()"
      @confirm="confirm"
    />
  </Card>
</template>
