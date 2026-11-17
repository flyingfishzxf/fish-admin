<script setup lang="ts">
import type { ProjectDetail } from '@fish-admin/contracts'
import { Button, Card, Label } from '@fish-admin/vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { Star } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import { useT } from '../../lib/i18n'
import { updateProject } from './api'

const props = defineProps<{ detail: ProjectDetail; canManage: boolean }>()

const t = useT('projects')
const queryClient = useQueryClient()

const project = computed(() => props.detail.project)
const step = ref(0)
const rating = ref(0)
const notes = ref('')
const error = ref('')

const steps = computed(() => [
  t('detail.review.stepFeedback'),
  t('detail.review.stepRate'),
  t('detail.review.stepNotes'),
])

function reset() {
  rating.value = project.value.rating ?? 0
  notes.value = project.value.retro ?? ''
  error.value = ''
}

watch(() => [project.value.rating, project.value.retro, project.value.id], reset, {
  immediate: true,
})

const saveMutation = useMutation({
  mutationFn: () => updateProject(project.value.id, { rating: rating.value, retro: notes.value }),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['projects'] })
    void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    // Land on the summary: the rating the user just saved is the confirmation.
    step.value = 0
  },
  onError: () => {
    error.value = t('detail.review.saveFailed')
  },
})

function rate(value: number) {
  if (!props.canManage) return
  rating.value = value
  error.value = ''
}

function submit() {
  if (rating.value < 1 || rating.value > 5) {
    error.value = t('detail.review.ratingRequired')
    step.value = 1
    return
  }
  saveMutation.mutate()
}
</script>

<template>
  <div class="space-y-4" data-review-tab>
    <div class="space-y-1">
      <h2 class="text-base font-semibold">{{ t('detail.review.title') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('detail.review.description') }}</p>
    </div>

    <ol class="flex flex-wrap items-center gap-2" :aria-label="t('detail.review.stepsLabel')">
      <li v-for="(label, index) in steps" :key="label">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors"
          :class="
            step === index
              ? 'border-primary bg-primary/10 font-medium text-primary'
              : 'text-muted-foreground hover:bg-muted'
          "
          :aria-current="step === index ? 'step' : undefined"
          :data-review-step="index"
          @click="step = index"
        >
          <span
            class="flex size-4 items-center justify-center rounded-full border text-[10px]"
            aria-hidden="true"
          >
            {{ index + 1 }}
          </span>
          {{ label }}
        </button>
      </li>
    </ol>

    <Card>
      <div class="space-y-4">
        <div v-if="step === 0" class="space-y-3">
          <p class="text-sm text-muted-foreground">{{ t('detail.review.stepFeedback') }}</p>
          <div class="space-y-1">
            <p class="text-sm font-medium">{{ t('detail.review.ratingLabel') }}</p>
            <p class="text-sm text-muted-foreground" data-review-summary>{{ rating }} / 5</p>
          </div>
          <p
            v-if="notes"
            class="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap"
            data-review-notes-preview
          >
            {{ notes }}
          </p>
        </div>

        <div v-else-if="step === 1" class="space-y-2">
          <Label>{{ t('detail.review.ratingLabel') }}</Label>
          <div
            class="flex items-center gap-1"
            role="group"
            :aria-label="t('detail.review.ratingLabel')"
          >
            <button
              v-for="value in 5"
              :key="value"
              type="button"
              class="rounded-sm p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
              :aria-label="t('detail.review.rating') + ' ' + value"
              :aria-pressed="rating === value"
              :disabled="!canManage"
              :data-rate="value"
              @click="rate(value)"
            >
              <Star
                class="size-6"
                :class="value <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'"
                aria-hidden="true"
              />
            </button>
          </div>
          <p v-if="error" class="text-xs text-destructive" data-review-error>{{ error }}</p>
        </div>

        <div v-else class="space-y-2">
          <Label for="retro-notes">{{ t('detail.review.notes') }}</Label>
          <textarea
            id="retro-notes"
            v-model="notes"
            rows="5"
            :placeholder="t('detail.review.notesPlaceholder')"
            :disabled="!canManage"
            data-review-notes
            class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
        </div>

        <div class="flex flex-wrap justify-between gap-2 border-t pt-3">
          <Button
            variant="ghost"
            :disabled="step === 0"
            data-review-back
            @click="step = Math.max(0, step - 1)"
          >
            {{ t('common:actions.back') }}
          </Button>
          <div class="flex gap-2">
            <Button v-if="step < 2" data-review-next @click="step = Math.min(2, step + 1)">
              {{ t('common:actions.next') }}
            </Button>
            <Button
              v-if="canManage"
              :disabled="saveMutation.isPending.value"
              data-review-save
              @click="submit"
            >
              {{ t('detail.review.save') }}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
