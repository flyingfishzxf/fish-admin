<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import { ChevronDown } from 'lucide-vue-next'
import type { Component } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'

const props = defineProps<{
  title: string
  description?: string
  icon?: Component
  class?: string
}>()
</script>

<template>
  <CollapsibleRoot
    data-slot="collapsible"
    :class="cn('rounded-xl border bg-card shadow-sm', props.class)"
  >
    <CollapsibleTrigger
      class="group flex w-full items-start justify-between gap-3 px-6 py-5 text-left"
    >
      <div class="flex items-start gap-3">
        <div
          v-if="props.icon"
          class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <component :is="props.icon" class="size-4" />
        </div>
        <div class="space-y-1">
          <span class="block font-semibold tracking-tight">{{ props.title }}</span>
          <span v-if="props.description" class="block text-sm text-muted-foreground">
            {{ props.description }}
          </span>
        </div>
      </div>
      <ChevronDown
        class="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </CollapsibleTrigger>

    <CollapsibleContent data-slot="collapsible-content">
      <div class="border-t px-6 py-5">
        <slot />
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
