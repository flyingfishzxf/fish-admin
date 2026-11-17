<script setup lang="ts">
import { cn } from '../../lib/utils'
import PageHeader from './PageHeader.vue'

const props = withDefaults(
  defineProps<{
    /** Page title, rendered as the page's h1. */
    title: string
    /** One or two sentences under the title. */
    description?: string
    /** Small uppercase label above the title, such as "Workspace". */
    eyebrow?: string
    /** Filter bar or tabs rendered below the header in a bordered row. */
    tabs?: boolean
    /** Page-level footer, separated by a top border. */
    footer?: boolean
    /** Makes the tabs row sticky instead of the whole header. */
    stickyHeader?: boolean
    class?: string
  }>(),
  { stickyHeader: false },
)
</script>

<template>
  <div data-slot="page-container" :class="cn('flex flex-col gap-6', props.class)">
    <PageHeader :title="props.title" :description="props.description" :eyebrow="props.eyebrow">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </PageHeader>
    <div
      v-if="props.tabs || $slots.tabs"
      data-slot="page-container-tabs"
      :class="
        cn('border-b', props.stickyHeader && 'sticky top-0 z-10 bg-background/95 backdrop-blur')
      "
    >
      <slot name="tabs" />
    </div>
    <div class="space-y-6">
      <slot />
    </div>
    <footer
      v-if="props.footer || $slots.footer"
      data-slot="page-container-footer"
      class="border-t pt-6"
    >
      <slot name="footer" />
    </footer>
  </div>
</template>
