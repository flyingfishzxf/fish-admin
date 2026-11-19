<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import { computed, ref, useTemplateRef } from 'vue'

import { useUITranslation } from '../../i18n'
import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    /** Selected number of stars; 0 means nothing is selected. */
    value?: number
    /** Number of stars rendered. */
    max?: number
    /** Renders a static display instead of an input. */
    readOnly?: boolean
    /** Lets a click on the already selected star clear the rating back to 0. */
    allowClear?: boolean
    /** Accessible name of the radiogroup; defaults to the localized "Rating". */
    ariaLabel?: string
    class?: string
  }>(),
  { value: 0, max: 5, readOnly: false, allowClear: true },
)

const emit = defineEmits<{ change: [value: number] }>()
const { t } = useUITranslation()

const hovered = ref<number | null>(null)
const buttons = useTemplateRef<HTMLButtonElement[]>('stars')
// A Vue emit is always available, so every non-read-only rating is interactive.
const interactive = computed(() => !props.readOnly)

const active = computed(() => hovered.value ?? props.value)

function select(star: number) {
  if (!interactive.value) return
  emit('change', star === props.value && props.allowClear ? 0 : star)
}

function focusStar(index: number) {
  buttons.value?.[index]?.focus()
}

function onKeydown(event: globalThis.KeyboardEvent, index: number) {
  if (!interactive.value) return
  const last = props.max - 1
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      event.preventDefault()
      focusStar(Math.min(index + 1, last))
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      event.preventDefault()
      focusStar(Math.max(index - 1, 0))
      break
    case 'Home':
      event.preventDefault()
      focusStar(0)
      break
    case 'End':
      event.preventDefault()
      focusStar(last)
      break
  }
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="props.ariaLabel ?? t('enterprise.rating')"
    tabindex="-1"
    data-slot="rate"
    :class="cn('inline-flex items-center gap-0.5', props.class)"
    @mouseleave="hovered = null"
  >
    <button
      v-for="star in props.max"
      :key="star"
      ref="stars"
      type="button"
      role="radio"
      :aria-checked="star === props.value"
      :aria-label="t('enterprise.rateValue', { count: star, max: props.max })"
      :tabindex="interactive && star === (props.value || 1) ? 0 : -1"
      :disabled="!interactive"
      :class="
        cn(
          'rounded-sm p-0.5 text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default',
          star <= active && 'text-warning',
        )
      "
      @mouseenter="interactive && (hovered = star)"
      @focus="interactive && (hovered = star)"
      @blur="hovered = null"
      @click="select(star)"
      @keydown="onKeydown($event, star - 1)"
    >
      <Star aria-hidden="true" :class="cn('size-5', star <= active && 'fill-current')" />
    </button>
  </div>
</template>
