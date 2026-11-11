<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { TabsList as TabsListPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type TabsListVariants = VariantProps<typeof tabsListVariants>

const props = withDefaults(
  defineProps<{ variant?: TabsListVariants['variant']; class?: string }>(),
  { variant: 'default' },
)
</script>

<template>
  <TabsListPrimitive
    data-slot="tabs-list"
    :data-variant="variant"
    :class="cn(tabsListVariants({ variant }), props.class)"
  >
    <slot />
  </TabsListPrimitive>
</template>
