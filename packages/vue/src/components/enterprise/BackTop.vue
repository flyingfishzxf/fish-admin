<script setup lang="ts">
import { ArrowUp } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import { Button } from '../ui/button'

const props = withDefaults(
  defineProps<{
    /** Scroll container to watch and scroll; defaults to the window. */
    target?: HTMLElement | null
    /** Scroll distance in px before the button appears. */
    threshold?: number
    /** Accessible name; falls back to the localized "back to top" string. */
    label?: string
    class?: string
  }>(),
  { threshold: 400 },
)

const { t } = useUITranslation()
const visible = ref(false)

function onScroll() {
  visible.value = (props.target ? props.target.scrollTop : window.scrollY) > props.threshold
}

onMounted(() => {
  onScroll()
  const target: HTMLElement | Window = props.target ?? window
  target.addEventListener('scroll', onScroll, { passive: true })
  onBeforeUnmount(() => target.removeEventListener('scroll', onScroll))
})

function scrollTop() {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  if (props.target) props.target.scrollTo({ top: 0, behavior })
  else window.scrollTo({ top: 0, behavior })
}
</script>

<template>
  <Button
    v-if="visible"
    type="button"
    size="icon-lg"
    :aria-label="props.label ?? t('enterprise.backToTop')"
    data-slot="back-top"
    :class="cn('fixed end-6 bottom-6 z-40 rounded-full shadow-lg', props.class)"
    @click="scrollTop"
  >
    <ArrowUp aria-hidden="true" />
  </Button>
</template>
