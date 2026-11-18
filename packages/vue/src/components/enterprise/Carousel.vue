<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

export interface CarouselSlide {
  id: string
  title?: string
  description?: string
  image?: string
  alt?: string
}

const props = defineProps<{
  /** Slides in order; an empty array renders the empty state instead. */
  slides: CarouselSlide[]
  /** Accessible name for the carousel region. */
  ariaLabel: string
  /** Accessible name for the previous-slide button. */
  previousLabel: string
  /** Accessible name for the next-slide button. */
  nextLabel: string
  /** Builds the accessible name of a dot, given its 1-based position. */
  goToLabel: (index: number) => string
  /** Copy for the box shown when slides is empty. */
  emptyLabel?: string
  class?: string
}>()

defineSlots<{
  slide?(props: { slide: CarouselSlide; index: number }): unknown
}>()

const index = ref(0)
const activeIndex = computed(() => Math.min(index.value, props.slides.length - 1))

function goTo(next: number) {
  index.value = (next + props.slides.length) % props.slides.length
}

function handleKeyDown(event: globalThis.KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goTo(activeIndex.value - 1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    goTo(activeIndex.value + 1)
  }
}
</script>

<template>
  <div
    v-if="props.slides.length === 0"
    data-slot="carousel-empty"
    :class="
      cn(
        'rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground',
        props.class,
      )
    "
  >
    {{ props.emptyLabel }}
  </div>
  <div
    v-else
    role="region"
    aria-roledescription="carousel"
    :aria-label="props.ariaLabel"
    data-slot="carousel"
    tabindex="0"
    class="relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    @keydown="handleKeyDown"
  >
    <div class="overflow-hidden rounded-lg border bg-muted/20">
      <div
        class="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
        :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      >
        <div
          v-for="(slide, slideIndex) in props.slides"
          :key="slide.id"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${slideIndex + 1} / ${props.slides.length}`"
          :aria-hidden="slideIndex !== activeIndex"
          :inert="slideIndex !== activeIndex"
          class="relative min-w-full shrink-0"
        >
          <slot name="slide" :slide="slide" :index="slideIndex">
            <img
              v-if="slide.image"
              :src="slide.image"
              :alt="slide.alt ?? ''"
              class="aspect-[16/7] w-full object-cover"
            />
            <div
              v-if="slide.title || slide.description"
              :class="
                cn(
                  'space-y-1 p-4',
                  slide.image &&
                    'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-12 py-4 text-white',
                )
              "
            >
              <p v-if="slide.title" class="text-sm font-semibold">{{ slide.title }}</p>
              <p v-if="slide.description" class="text-xs opacity-90">{{ slide.description }}</p>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <template v-if="props.slides.length > 1">
      <Button
        type="button"
        variant="secondary"
        size="icon-xs"
        :aria-label="props.previousLabel"
        class="absolute start-2 top-1/2 -translate-y-1/2 shadow-sm"
        @click="goTo(activeIndex - 1)"
      >
        <ChevronLeft aria-hidden="true" class="size-4 rtl:rotate-180" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon-xs"
        :aria-label="props.nextLabel"
        class="absolute end-2 top-1/2 -translate-y-1/2 shadow-sm"
        @click="goTo(activeIndex + 1)"
      >
        <ChevronRight aria-hidden="true" class="size-4 rtl:rotate-180" />
      </Button>
      <div class="mt-2 flex justify-center gap-1.5" role="group">
        <button
          v-for="(slide, slideIndex) in props.slides"
          :key="slide.id"
          type="button"
          :aria-label="props.goToLabel(slideIndex + 1)"
          :aria-current="slideIndex === activeIndex ? 'true' : undefined"
          :class="
            cn(
              'h-1.5 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              slideIndex === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30',
            )
          "
          @click="goTo(slideIndex)"
        ></button>
      </div>
    </template>
  </div>
</template>
