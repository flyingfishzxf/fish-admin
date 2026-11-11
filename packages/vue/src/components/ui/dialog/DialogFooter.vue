<script setup lang="ts">
import { useUITranslation } from '../../../i18n'
import { cn } from '../../../lib/utils'

import { Button } from '../button'
import DialogClose from './DialogClose.vue'

const props = withDefaults(defineProps<{ showCloseButton?: boolean; class?: string }>(), {
  showCloseButton: false,
})

const { t } = useUITranslation()
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', props.class)"
  >
    <slot />
    <DialogClose v-if="showCloseButton" as-child>
      <Button variant="outline">{{ t('actions.close') }}</Button>
    </DialogClose>
  </div>
</template>
