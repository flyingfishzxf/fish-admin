<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { provideUILocale, type UILocale } from '@fish-admin/vue'

import ApiTable from '../components/ApiTable.vue'
import DemoBlock from '../components/DemoBlock.vue'
import { COMPONENTS } from '../data/registry'
import { DEMOS } from '../data/demos'
import type { DocsLang } from '../data/types'

const route = useRoute()
const lang = computed<DocsLang>(() => (route.path.startsWith('/zh/') ? 'zh' : 'en'))
const locale = computed<UILocale>(() => (lang.value === 'zh' ? 'zh-CN' : 'en'))
provideUILocale(locale)

const componentEntry = computed(() => COMPONENTS.find((entry) => entry.id === route.params.id))
const demos = computed(() => DEMOS.filter((demo) => demo.componentId === route.params.id))
</script>

<template>
  <main class="fish-page">
    <div class="rp-doc rspress-doc">
      <template v-if="componentEntry">
        <h1 class="fish-page__title">{{ componentEntry.name }}</h1>
        <DemoBlock
          v-for="demo in demos"
          :key="demo.id"
          :demo="demo"
          :component-entry="componentEntry"
          :lang="lang"
        />
        <ApiTable :component="String(componentEntry.id)" :lang="lang" />
      </template>
      <p v-else class="fish-demo__placeholder">Unknown component: {{ route.params.id }}</p>
    </div>
  </main>
</template>
