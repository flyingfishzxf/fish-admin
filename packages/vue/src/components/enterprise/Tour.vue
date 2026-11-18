<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { useUITranslation } from '../../i18n'
import { Button } from '../ui/button'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

/** One highlight of the product tour: a CSS anchor plus localized copy. */
export interface TourStep {
  target: string
  title: string
  description?: string
  placement?: TourPlacement
}

const props = withDefaults(
  defineProps<{
    open: boolean
    steps: TourStep[]
    /** Label overrides; every control falls back to the package locales. */
    labels?: { next?: string; previous?: string; skip?: string; finish?: string; step?: string }
    onFinish?: () => void
  }>(),
  {},
)
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { t } = useUITranslation()

const labels = computed(() => ({
  next: props.labels?.next ?? t('tour.next'),
  previous: props.labels?.previous ?? t('tour.previous'),
  skip: props.labels?.skip ?? t('tour.skip'),
  finish: props.labels?.finish ?? t('tour.finish'),
  step: (current: number, total: number) =>
    props.labels?.step
      ? props.labels.step
          .replace('{{current}}', String(current))
          .replace('{{total}}', String(total))
      : t('tour.step', { current, total }),
}))

const POPOVER_WIDTH = 320
const GAP = 10

const index = ref(0)
const popover = ref<HTMLElement | null>(null)
const rect = ref<{ top: number; left: number; width: number; height: number } | null>(null)
const popoverPos = ref<{ top: number; left: number } | null>(null)
let restoreFocus: HTMLElement | null = null

const step = computed(() => props.steps[index.value])

function targetOf(candidate: TourStep | undefined) {
  if (!candidate || typeof document === 'undefined') return null
  return document.querySelector<HTMLElement>(candidate.target)
}

/**
 * Some steps point at chrome a layout may not render (the sidebar is absent in
 * the header layout). A missing anchor advances instead of breaking the tour.
 */
function skipMissing(): boolean {
  let cursor = index.value
  while (cursor < props.steps.length && !targetOf(props.steps[cursor])) cursor += 1
  if (cursor >= props.steps.length) {
    close()
    return false
  }
  index.value = cursor
  return true
}

function measure() {
  const target = targetOf(step.value)
  if (!target) {
    rect.value = null
    popoverPos.value = null
    return
  }
  const bounds = target.getBoundingClientRect()
  rect.value = {
    top: bounds.top,
    left: bounds.left,
    width: bounds.width,
    height: bounds.height,
  }

  const placement = step.value?.placement ?? 'bottom'
  let top = bounds.bottom + GAP
  let left = bounds.left

  if (placement === 'top') top = bounds.top - GAP - 190
  if (placement === 'right') {
    top = bounds.top
    left = bounds.right + GAP
  }
  if (placement === 'left') {
    top = bounds.top
    left = bounds.left - GAP - POPOVER_WIDTH
  }

  // Keep the popover on screen; a highlight off the edge is better than a
  // popover the user cannot read.
  const maxLeft = Math.max(GAP, window.innerWidth - POPOVER_WIDTH - GAP)
  const maxTop = Math.max(GAP, window.innerHeight - 190 - GAP)
  popoverPos.value = {
    top: Math.min(Math.max(GAP, top), maxTop),
    left: Math.min(Math.max(GAP, left), maxLeft),
  }
}

function close() {
  emit('update:open', false)
}

function next() {
  if (index.value >= props.steps.length - 1) {
    close()
    return
  }
  index.value += 1
}

function previous() {
  if (index.value === 0) return
  index.value -= 1
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      restoreFocus?.focus()
      restoreFocus = null
      rect.value = null
      popoverPos.value = null
      return
    }

    restoreFocus = document.activeElement as HTMLElement | null
    index.value = 0
    if (!skipMissing()) return

    window.addEventListener('keydown', onKeydown)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    await nextTick()
    measure()
    popover.value?.focus()
  },
  { immediate: true },
)

watch([index, () => props.open], async () => {
  if (!props.open) return
  if (!skipMissing()) return
  await nextTick()
  measure()
  popover.value?.focus()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', measure)
  window.removeEventListener('scroll', measure, true)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open && step && rect && popoverPos" data-slot="tour">
      <div class="fixed inset-0 z-[80] bg-black/45" aria-hidden="true" @click="close" />
      <div
        class="pointer-events-none fixed z-[81] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
        :style="{
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }"
        aria-hidden="true"
      />
      <div
        ref="popover"
        role="dialog"
        aria-modal="true"
        :aria-label="step?.title"
        tabindex="-1"
        data-slot="tour-popover"
        class="fixed z-[82] w-80 space-y-2 rounded-lg border bg-background p-4 shadow-lg outline-none"
        :style="{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px` }"
      >
        <p class="text-sm font-semibold">{{ step?.title }}</p>
        <p class="text-xs text-muted-foreground">{{ step?.description }}</p>
        <div class="flex items-center justify-between pt-1">
          <span class="text-[11px] text-muted-foreground">
            {{ labels.step(index + 1, steps.length) }}
          </span>
          <div class="flex items-center gap-1">
            <Button variant="ghost" size="sm" @click="close">{{ labels.skip }}</Button>
            <Button
              v-if="index > 0"
              variant="outline"
              size="sm"
              data-tour-action="previous"
              @click="previous"
            >
              {{ labels.previous }}
            </Button>
            <Button size="sm" data-tour-action="next" @click="next">
              {{ index === steps.length - 1 ? labels.finish : labels.next }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
