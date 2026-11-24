<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { SITES } from './config/site'

const route = useRoute()
const isZh = computed(() => route.path.startsWith('/zh'))
const home = computed(() => (isZh.value ? '/zh' : '/'))
const langTarget = computed(() => {
  if (isZh.value) return route.path.replace(/^\/zh/, '') || '/'
  return route.path === '/' ? '/zh' : `/zh${route.path}`
})

const labels = computed(() =>
  isZh.value
    ? {
        nav: '站点导航',
        reactDocs: 'React 文档',
        reactDemo: 'React 演示',
        vueDemo: 'Vue 演示',
        switchLabel: '切换到 English',
        switchText: 'EN',
      }
    : {
        nav: 'Site navigation',
        reactDocs: 'React docs',
        reactDemo: 'React demo',
        vueDemo: 'Vue demo',
        switchLabel: '切换到中文',
        switchText: '中文',
      },
)
</script>

<template>
  <header class="fish-site-header">
    <div class="fish-site-header__inner">
      <RouterLink class="fish-site-header__brand" :to="home">
        FishAdmin <span class="fish-site-header__chip">Vue</span>
      </RouterLink>
      <nav class="fish-site-header__nav" :aria-label="labels.nav">
        <a :href="SITES.reactDocs" target="_blank" rel="noreferrer">{{ labels.reactDocs }}</a>
        <a :href="SITES.reactDemo" target="_blank" rel="noreferrer">{{ labels.reactDemo }}</a>
        <a :href="SITES.vueDemo" target="_blank" rel="noreferrer">{{ labels.vueDemo }}</a>
        <a :href="SITES.github" target="_blank" rel="noreferrer">GitHub</a>
        <RouterLink
          class="fish-site-header__lang"
          :to="langTarget"
          :aria-label="labels.switchLabel"
        >
          {{ labels.switchText }}
        </RouterLink>
      </nav>
    </div>
  </header>
  <RouterView />
</template>
