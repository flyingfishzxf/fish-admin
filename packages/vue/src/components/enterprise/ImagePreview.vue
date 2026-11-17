<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import { Button } from '../ui/button'
import Dialog from '../ui/dialog/Dialog.vue'
import DialogContent from '../ui/dialog/DialogContent.vue'
import DialogDescription from '../ui/dialog/DialogDescription.vue'
import DialogTitle from '../ui/dialog/DialogTitle.vue'

export interface PreviewImage {
  src: string
  alt: string
  caption?: string
}

const props = defineProps<{
  /** Thumbnails in display order; an empty array renders the "No data" line. */
  images: PreviewImage[]
  /** Accessible name of the dialog and prefix of every thumbnail name. */
  ariaLabel: string
  class?: string
}>()

const { t } = useUITranslation()
const index = ref<number | null>(null)
const current = computed(() => (index.value === null ? undefined : props.images[index.value]))

function step(delta: number) {
  if (index.value === null || props.images.length === 0) return
  index.value = (index.value + delta + props.images.length) % props.images.length
}
</script>

<template>
  <p v-if="props.images.length === 0" class="text-sm text-muted-foreground">
    {{ t('enterprise.noData') }}
  </p>
  <div
    v-else
    data-slot="image-preview"
    :class="cn('grid grid-cols-2 gap-2 sm:grid-cols-3', props.class)"
  >
    <button
      v-for="(image, imageIndex) in props.images"
      :key="`${image.src}-${imageIndex}`"
      type="button"
      :aria-label="`${props.ariaLabel}: ${image.alt}${image.caption ? ` — ${image.caption}` : ''}`"
      class="group relative aspect-4/3 overflow-hidden rounded-lg border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      @click="index = imageIndex"
    >
      <img
        :src="image.src"
        :alt="image.alt"
        loading="lazy"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span
        v-if="image.caption"
        class="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-start text-xs text-white"
      >
        {{ image.caption }}
      </span>
    </button>

    <Dialog
      :open="index !== null"
      @update:open="
        (open) => {
          if (!open) index = null
        }
      "
    >
      <DialogContent
        class="max-w-3xl p-3 sm:p-4"
        @keydown="
          (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              step(-1)
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              step(1)
            }
          }
        "
      >
        <DialogTitle class="sr-only">{{ props.ariaLabel }}</DialogTitle>
        <figure v-if="current" class="space-y-2">
          <img
            :src="current.src"
            :alt="current.alt"
            class="max-h-[70vh] w-full rounded-md object-contain"
          />
          <figcaption class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{{ current.caption ?? current.alt }}</span>
            <span v-if="props.images.length > 1" class="text-xs tabular-nums">
              {{ (index ?? 0) + 1 }} / {{ props.images.length }}
            </span>
          </figcaption>
          <DialogDescription class="sr-only">{{ current.alt }}</DialogDescription>
        </figure>
        <div v-if="props.images.length > 1" class="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            :aria-label="t('actions.previous')"
            @click="step(-1)"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            :aria-label="t('actions.next')"
            @click="step(1)"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
