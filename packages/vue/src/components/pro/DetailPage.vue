<script setup lang="ts">
import { cn } from '../../lib/utils'
import Tabs from '../ui/tabs/Tabs.vue'
import TabsContent from '../ui/tabs/TabsContent.vue'
import TabsList from '../ui/tabs/TabsList.vue'
import TabsTrigger from '../ui/tabs/TabsTrigger.vue'

export interface DetailPageTab {
  value: string
  label: string
  content?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    tabs?: DetailPageTab[]
    defaultTab?: string
    tabsLabel?: string
    class?: string
  }>(),
  {},
)

defineSlots<{
  back?(): unknown
  avatar?(): unknown
  badges?(): unknown
  meta?(): unknown
  actions?(): unknown
  footer?(): unknown
  default?(): unknown
  tab?(props: { tab: DetailPageTab }): unknown
}>()
</script>

<template>
  <div data-slot="detail-page" :class="cn('space-y-6', props.class)">
    <slot name="back" />

    <header class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex min-w-0 items-center gap-4">
        <div v-if="$slots.avatar" class="shrink-0"><slot name="avatar" /></div>
        <div class="min-w-0 space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="truncate text-2xl font-semibold tracking-tight">{{ props.title }}</h1>
            <slot name="badges" />
          </div>
          <p v-if="props.subtitle" class="truncate text-sm text-muted-foreground">
            {{ props.subtitle }}
          </p>
          <div
            v-if="$slots.meta"
            class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"
          >
            <slot name="meta" />
          </div>
        </div>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>

    <Tabs
      v-if="props.tabs && props.tabs.length > 0"
      :default-value="props.defaultTab ?? props.tabs[0]?.value"
      class="gap-4"
    >
      <TabsList :aria-label="props.tabsLabel">
        <TabsTrigger v-for="tab in props.tabs" :key="tab.value" :value="tab.value">
          {{ tab.label }}
        </TabsTrigger>
      </TabsList>
      <TabsContent v-for="tab in props.tabs" :key="tab.value" :value="tab.value">
        <slot name="tab" :tab="tab">{{ tab.content }}</slot>
      </TabsContent>
    </Tabs>
    <slot v-else />

    <slot name="footer" />
  </div>
</template>
