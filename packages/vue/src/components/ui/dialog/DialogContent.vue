<script setup lang="ts">
import { XIcon } from 'lucide-vue-next'
import { DialogContent as DialogContentPrimitive } from 'reka-ui'

import { useUITranslation } from '../../../i18n'
import { cn } from '../../../lib/utils'

import DialogClose from './DialogClose.vue'
import DialogOverlay from './DialogOverlay.vue'
import DialogPortal from './DialogPortal.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{ showCloseButton?: boolean; class?: string }>(), {
  showCloseButton: true,
})

const { t } = useUITranslation()
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContentPrimitive
      v-bind="$attrs"
      data-slot="dialog-content"
      :class="
        cn(
          'fixed inset-x-0 top-1/2 z-50 mx-auto grid w-full max-w-[calc(100%-2rem)] -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg duration-(--motion-duration-base) ease-(--motion-ease-standard) outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none! motion-reduce:transition-none! sm:max-w-lg',
          props.class,
        )
      "
    >
      <slot />
      <DialogClose
        v-if="showCloseButton"
        class="absolute end-4 top-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <XIcon />
        <span class="sr-only">{{ t('actions.close') }}</span>
      </DialogClose>
    </DialogContentPrimitive>
  </DialogPortal>
</template>
