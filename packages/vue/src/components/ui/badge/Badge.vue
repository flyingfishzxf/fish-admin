<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'
import { badgeVariants, type BadgeVariants } from './variants'

const props = withDefaults(
  defineProps<{ variant?: BadgeVariants['variant']; asChild?: boolean; class?: string }>(),
  { variant: 'default', asChild: false },
)

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class))
</script>

<template>
  <Primitive
    as="span"
    :as-child="asChild"
    data-slot="badge"
    :data-variant="variant"
    :class="classes"
  >
    <slot />
  </Primitive>
</template>
