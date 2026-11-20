<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { COMPONENTS } from '../data/registry'
import { DEMOS } from '../data/demos'
import { uiText } from '../data/ui'
import type { ComponentEntry, DocsLang } from '../data/types'

const route = useRoute()
const lang = computed<DocsLang>(() => (route.path.startsWith('/zh') ? 'zh' : 'en'))
const text = computed(() => uiText(lang.value))
const prefix = computed(() => (lang.value === 'zh' ? '/zh' : ''))

const CATEGORY_ORDER = ['primitive', 'enterprise', 'pro'] as const

const groups = computed(() =>
  CATEGORY_ORDER.map((category) => ({
    category,
    label:
      category === 'primitive'
        ? text.value.categoryPrimitive
        : category === 'enterprise'
          ? text.value.categoryEnterprise
          : text.value.categoryPro,
    items: COMPONENTS.filter((entry) => entry.category === category),
  })),
)

function demoCount(entry: ComponentEntry): number {
  return DEMOS.filter((demo) => demo.componentId === entry.id).length
}
</script>

<template>
  <main class="fish-page">
    <div class="rp-doc rspress-doc">
      <h1>FishAdmin Vue</h1>
      <p class="fish-demo-muted">
        {{ COMPONENTS.length }} {{ text.componentCount }} · @fish-admin/vue
      </p>
      <div class="fish-index">
        <section v-for="group in groups" :key="group.category" class="fish-index__group">
          <h2>
            {{ group.label }}
            <span class="fish-index__note">{{ group.items.length }} {{ text.componentCount }}</span>
          </h2>
          <div class="fish-index__grid">
            <RouterLink
              v-for="entry in group.items"
              :key="entry.id"
              class="fish-index__item"
              :to="`${prefix}/components/${entry.id}`"
            >
              <span class="fish-index__name">{{ entry.name }}</span>
              <span v-if="entry.isNew" class="fish-index__note">new</span>
              <span v-else-if="demoCount(entry) === 0" class="fish-index__note">
                {{ text.docsPending }}
              </span>
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
