<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { SITES } from '../config/site'
import { COMPONENTS } from '../data/registry'
import { DEMOS } from '../data/demos'
import { ABOUT } from '../data/about'
import { uiText } from '../data/ui'
import type { ComponentEntry, DocsLang } from '../data/types'

const route = useRoute()
const lang = computed<DocsLang>(() => (route.path.startsWith('/zh') ? 'zh' : 'en'))
const text = computed(() => uiText(lang.value))
const about = computed(() => ABOUT[lang.value])
const prefix = computed(() => (lang.value === 'zh' ? '/zh' : ''))

const CATEGORY_ORDER = ['primitive', 'enterprise', 'pro'] as const

const vueOnlyCount = computed(() => COMPONENTS.filter((entry) => entry.vueOnly).length)
const sharedCount = computed(() => COMPONENTS.length - vueOnlyCount.value)

const stats = computed(() => [
  { value: COMPONENTS.length, label: about.value.labels.components },
  { value: DEMOS.length, label: about.value.labels.demos },
  { value: sharedCount.value, label: about.value.labels.shared },
  { value: vueOnlyCount.value, label: about.value.labels.vueOnly },
])

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
  <main class="fish-page fish-home">
    <div class="rp-doc rspress-doc">
      <p class="fish-home__eyebrow">{{ about.eyebrow }}</p>
      <h1>{{ about.title }}</h1>
      <p class="fish-home__intro">{{ about.intro }}</p>
      <div class="fish-home__actions">
        <a class="fish-home__button fish-home__button--primary" href="#catalog">
          {{ about.browse }}
        </a>
        <a class="fish-home__button" :href="SITES.npm" target="_blank" rel="noreferrer">npm</a>
        <a class="fish-home__button" :href="SITES.github" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>

      <div class="fish-home__stats">
        <div v-for="stat in stats" :key="stat.label" class="fish-home__stat">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </div>
      </div>

      <section class="fish-home__section">
        <h2>{{ about.installTitle }}</h2>
        <p>{{ about.installNote }}</p>
        <pre class="fish-home__code"><code>pnpm add @fish-admin/vue</code></pre>
        <pre class="fish-home__code"><code>import '@fish-admin/vue/styles.css'</code></pre>
      </section>

      <section class="fish-home__section">
        <h2>{{ about.sharedTitle }}</h2>
        <p>{{ about.sharedNote }}</p>
        <h3>{{ about.differencesTitle }}</h3>
        <ul class="fish-home__list">
          <li v-for="difference in about.differences" :key="difference">{{ difference }}</li>
        </ul>
      </section>

      <section class="fish-home__section">
        <h2>{{ about.baselineTitle }}</h2>
        <p>{{ about.baselineNote }}</p>
        <p class="fish-home__security">{{ about.securityNote }}</p>
      </section>

      <section class="fish-home__section">
        <h2>{{ about.verifyTitle }}</h2>
        <p>{{ about.verifyNote }}</p>
        <div class="fish-home__commands">
          <div v-for="item in about.commands" :key="item.command" class="fish-home__command">
            <code>{{ item.command }}</code>
            <span>{{ item.note }}</span>
          </div>
        </div>
      </section>

      <section id="catalog" class="fish-home__catalog">
        <h2>
          {{ about.statusTitle }}
          <span class="fish-index__note">
            {{ COMPONENTS.length }} {{ text.componentCount }} · {{ DEMOS.length }}
            {{ about.labels.demos }}
          </span>
        </h2>
        <p>{{ about.statusNote }}</p>
        <div class="fish-index">
          <section v-for="group in groups" :key="group.category" class="fish-index__group">
            <h2>
              {{ group.label }}
              <span class="fish-index__note">
                {{ group.items.length }} {{ text.componentCount }}
              </span>
            </h2>
            <div class="fish-index__grid">
              <RouterLink
                v-for="entry in group.items"
                :key="entry.id"
                class="fish-index__item"
                :to="`${prefix}/components/${entry.id}`"
              >
                <span class="fish-index__name">{{ entry.name }}</span>
                <span v-if="entry.vueOnly" class="fish-index__note">Vue-only</span>
                <span v-else-if="demoCount(entry) === 0" class="fish-index__note">
                  {{ text.docsPending }}
                </span>
              </RouterLink>
            </div>
          </section>
        </div>
      </section>
    </div>
  </main>
</template>
