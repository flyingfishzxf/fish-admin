<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'
import { buttonVariants, type ButtonVariants } from './variants'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    asChild?: boolean
    class?: string
  }>(),
  { variant: 'default', size: 'default', asChild: false },
)

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
)
</script>

<template>
  <Primitive
    as="button"
    :as-child="asChild"
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :class="classes"
  >
    <slot />
  </Primitive>
</template>
