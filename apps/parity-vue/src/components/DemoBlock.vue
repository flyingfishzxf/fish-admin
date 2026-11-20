<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import type { ComponentEntry, DemoEntry, DocsLang } from '../data/types'
import { SITE, demoSourceUrl, templatePath, uiText } from '../data/ui'

const props = defineProps<{
  demo: DemoEntry
  componentEntry: ComponentEntry
  lang: DocsLang
}>()

const text = computed(() => uiText(props.lang))
const view = ref<'preview' | 'code'>('preview')
const copied = ref(false)
const uid = useId()

const isMirrored = computed(() => props.demo.filename.endsWith('.tsx'))
const sourceLabel = computed(() => (isMirrored.value ? 'TSX' : 'Vue'))
const sourceUrl = computed(() =>
  isMirrored.value
    ? demoSourceUrl(props.demo.filename)
    : `${SITE.githubUrl}/blob/${SITE.repoBranch}/${props.demo.filename}`,
)

function select(next: 'preview' | 'code') {
  view.value = next
  document.getElementById(`${uid}-${next}-tab`)?.focus()
}

function onTabKeyDown(event: KeyboardEvent) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  event.preventDefault()
  select(view.value === 'preview' ? 'code' : 'preview')
}

async function onCopy() {
  try {
    await navigator.clipboard.writeText(props.demo.source)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <section class="fish-demo" :data-demo="demo.id">
    <header class="fish-demo__header">
      <h3 class="fish-demo__title">{{ demo.title[lang] }}</h3>
      <div class="fish-demo__links">
        <a
          :href="`${SITE.demoUrl}${templatePath(componentEntry.usedIn)}`"
          target="_blank"
          rel="noreferrer"
        >
          {{ text.demoUsedIn }}
        </a>
        <a :href="sourceUrl" target="_blank" rel="noreferrer">{{ text.demoViewSource }}</a>
      </div>
    </header>
    <div class="fish-demo__card">
      <div class="fish-demo__toolbar">
        <div class="fish-demo__tabs" role="tablist" :aria-label="demo.title[lang]">
          <button
            type="button"
            role="tab"
            :id="`${uid}-preview-tab`"
            :aria-selected="view === 'preview'"
            :aria-controls="`${uid}-preview`"
            :tabindex="view === 'preview' ? 0 : -1"
            class="fish-demo__tab"
            @click="select('preview')"
            @keydown="onTabKeyDown"
          >
            {{ text.demoPreview }}
          </button>
          <button
            type="button"
            role="tab"
            :id="`${uid}-code-tab`"
            :aria-selected="view === 'code'"
            :aria-controls="`${uid}-code`"
            :tabindex="view === 'code' ? 0 : -1"
            class="fish-demo__tab"
            @click="select('code')"
            @keydown="onTabKeyDown"
          >
            {{ text.demoSource }}
          </button>
        </div>
        <div class="fish-demo__tools">
          <span class="fish-demo__meta">{{ sourceLabel }} · {{ demo.lines }} {{ text.demoLines }}</span>
          <button
            type="button"
            class="fish-demo__copy"
            :aria-label="text.demoCopy"
            :title="copied ? text.demoCopied : text.demoCopy"
            :data-copied="copied || undefined"
            @click="onCopy"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
              <path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1" />
            </svg>
          </button>
          <span class="fish-visually-hidden" role="status">{{
            copied ? text.demoCopied : ''
          }}</span>
        </div>
      </div>
      <div
        :id="`${uid}-preview`"
        role="tabpanel"
        :aria-labelledby="`${uid}-preview-tab`"
        :hidden="view !== 'preview'"
        class="fish-demo__panel fish-demo__preview rp-not-doc"
      >
        <component :is="demo.view" />
      </div>
      <div
        :id="`${uid}-code`"
        role="tabpanel"
        :aria-labelledby="`${uid}-code-tab`"
        :hidden="view !== 'code'"
        class="fish-demo__panel fish-demo__source"
      >
        <pre class="fish-demo__code"><code>{{ demo.source }}</code></pre>
      </div>
    </div>
  </section>
</template>
