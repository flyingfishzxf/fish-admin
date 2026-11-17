<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { cn } from '../../lib/utils'

export interface AnchorItem {
  id: string
  label: string
}

const props = withDefaults(
  defineProps<{
    /** Sections to link, in document order; each id must exist in the DOM. */
    items: AnchorItem[]
    /** Accessible name for the nav landmark. */
    ariaLabel: string
    /** Scroll container to watch and scroll; defaults to the window. */
    root?: HTMLElement | null
    /** Distance in px between the scroll top and the active boundary. */
    offset?: number
    /** Sticky section bars use the horizontal variant; in-page rails keep the default. */
    orientation?: 'vertical' | 'horizontal'
    class?: string
  }>(),
  { offset: 88, orientation: 'vertical' },
)

const activeId = ref<string | undefined>(props.items[0]?.id)

function update() {
  const root = props.root
  const boundary = (root?.getBoundingClientRect().top ?? 0) + props.offset
  let current = props.items[0]?.id
  for (const item of props.items) {
    const element = document.getElementById(item.id)
    if (!element) continue
    // scrollTo lands within a device pixel of the line; without slack the
    // section just scrolled to can stay one step behind.
    if (element.getBoundingClientRect().top <= boundary + 1) current = item.id
    else break
  }
  activeId.value = current
}

onMounted(() => {
  update()
  const target: HTMLElement | Window = props.root ?? window
  target.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
  onBeforeUnmount(() => {
    target.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
  })
})

function scrollTo(id: string) {
  const element = document.getElementById(id)
  if (!element) return
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  const root = props.root
  if (root) {
    const top =
      root.scrollTop +
      element.getBoundingClientRect().top -
      root.getBoundingClientRect().top -
      props.offset
    root.scrollTo({ top, behavior })
  } else {
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - props.offset,
      behavior,
    })
  }
}
</script>

<template>
  <nav
    data-slot="anchor-nav"
    :data-orientation="props.orientation"
    :aria-label="props.ariaLabel"
    :class="
      cn(
        props.orientation === 'horizontal'
          ? 'flex items-stretch gap-1 overflow-x-auto overflow-y-hidden'
          : 'flex flex-col border-s',
        props.class,
      )
    "
  >
    <button
      v-for="item in props.items"
      :key="item.id"
      type="button"
      :aria-current="activeId === item.id ? 'location' : undefined"
      class="shrink-0 text-sm whitespace-nowrap transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      :class="[
        props.orientation === 'horizontal'
          ? '-mb-px border-b-2 px-3 py-2'
          : '-ms-px border-s-2 px-3 py-1.5 text-start',
        activeId === item.id
          ? 'border-primary font-medium text-primary'
          : 'border-transparent text-muted-foreground',
      ]"
      @click="scrollTo(item.id)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>
