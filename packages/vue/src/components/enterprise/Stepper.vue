<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

export interface StepperStep {
  id: string
  title: string
  description?: string
}

const props = defineProps<{
  /** Ordered steps; each needs a stable id used as the list key. */
  steps: StepperStep[]
  /** Zero-based index of the current step. */
  current: number
  /** Makes every step up to current a button. Later steps stay inert. */
  onStepClick?: (index: number) => void
  /** Accessible name of the ordered list. */
  ariaLabel: string
  class?: string
}>()

function stateOf(index: number) {
  return index < props.current ? 'complete' : index === props.current ? 'current' : 'upcoming'
}

function circleClass(state: string) {
  return cn(
    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
    state === 'complete' && 'border-primary bg-primary text-primary-foreground',
    state === 'current' && 'border-primary text-primary',
    state === 'upcoming' && 'border-border text-muted-foreground',
  )
}

function titleClass(state: string) {
  return cn('block text-sm font-medium', state === 'upcoming' && 'text-muted-foreground')
}
</script>

<template>
  <ol
    :aria-label="props.ariaLabel"
    :class="cn('flex flex-col gap-4 sm:flex-row sm:gap-0', props.class)"
  >
    <li
      v-for="(step, index) in props.steps"
      :key="step.id"
      :aria-current="stateOf(index) === 'current' ? 'step' : undefined"
      class="relative flex flex-1 items-start gap-3"
    >
      <span
        v-if="index < props.steps.length - 1"
        aria-hidden="true"
        class="absolute start-8 end-2 top-4 hidden h-px bg-border sm:block"
      />
      <button
        v-if="typeof props.onStepClick === 'function' && index <= props.current"
        type="button"
        class="relative z-10 flex flex-1 items-start gap-3 rounded-md text-start outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        @click="props.onStepClick?.(index)"
      >
        <span :class="circleClass(stateOf(index))">
          <Check v-if="stateOf(index) === 'complete'" class="size-4" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="min-w-0 space-y-0.5">
          <span :class="titleClass(stateOf(index))">{{ step.title }}</span>
          <span v-if="step.description" class="block text-xs text-muted-foreground">
            {{ step.description }}
          </span>
        </span>
      </button>
      <div v-else class="relative z-10 flex flex-1 items-start gap-3">
        <span :class="circleClass(stateOf(index))">
          <Check v-if="stateOf(index) === 'complete'" class="size-4" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="min-w-0 space-y-0.5">
          <span :class="titleClass(stateOf(index))">{{ step.title }}</span>
          <span v-if="step.description" class="block text-xs text-muted-foreground">
            {{ step.description }}
          </span>
        </span>
      </div>
    </li>
  </ol>
</template>
