<script setup lang="ts">
import type { WorkflowComment } from '@fish-admin/contracts'
import { Button } from '@fish-admin/vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { MessageSquare } from 'lucide-vue-next'
import { ref } from 'vue'

import Card from '../../components/ui/Card.vue'
import { formatRelativeTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { addWorkflowComment } from './api'

const props = defineProps<{ instanceId: string; comments: WorkflowComment[] }>()

const t = useT('workflows')
const queryClient = useQueryClient()
const body = ref('')
const error = ref('')

const mutation = useMutation({
  mutationFn: (text: string) => addWorkflowComment(props.instanceId, text),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['workflows'] })
    body.value = ''
    error.value = ''
  },
  onError: () => {
    error.value = t('comments.failed')
  },
})

function submit() {
  const text = body.value.trim()
  if (!text) return
  mutation.mutate(text)
}
</script>

<template>
  <Card :title="t('comments.title')" :description="t('comments.description')">
    <div class="space-y-4" data-workflow-comments>
      <p v-if="props.comments.length === 0" class="text-sm text-muted-foreground">
        {{ t('comments.empty') }}
      </p>
      <ul v-else class="space-y-4">
        <li
          v-for="comment in props.comments"
          :key="comment.id"
          class="flex gap-3"
          :data-comment="comment.id"
        >
          <span
            class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <MessageSquare class="size-4" aria-hidden="true" />
          </span>
          <div class="min-w-0 flex-1 space-y-0.5">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="text-sm font-medium">{{ comment.authorName }}</p>
              <span class="text-xs text-muted-foreground">
                {{ formatRelativeTime(comment.createdAt, language) }}
              </span>
            </div>
            <p class="text-sm break-words text-muted-foreground">{{ comment.body }}</p>
          </div>
        </li>
      </ul>

      <form class="space-y-2 border-t pt-4" @submit.prevent="submit">
        <textarea
          v-model="body"
          rows="2"
          maxlength="1000"
          :placeholder="t('comments.placeholder')"
          :aria-label="t('comments.label')"
          data-comment-input
          class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <p v-if="error" role="alert" class="text-xs text-destructive" data-comment-error>
          {{ error }}
        </p>
        <div class="flex justify-end">
          <Button
            type="submit"
            size="sm"
            :disabled="!body.trim() || mutation.isPending.value"
            data-comment-submit
          >
            {{ t('comments.submit') }}
          </Button>
        </div>
      </form>
    </div>
  </Card>
</template>
