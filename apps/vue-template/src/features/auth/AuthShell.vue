<script setup lang="ts">
import { Database, Palette, ShieldCheck } from 'lucide-vue-next'

import BrandMark from '../../components/common/BrandMark.vue'
import LanguageToggle from '../../components/layout/LanguageToggle.vue'
import ThemeToggle from '../../components/layout/ThemeToggle.vue'
import { useT } from '../../lib/i18n'

const props = defineProps<{ title: string; subtitle?: string }>()
const t = useT()

const FEATURES = [
  { icon: ShieldCheck, key: 'auth:brand.featureRbac' },
  { icon: Database, key: 'auth:brand.featureMock' },
  { icon: Palette, key: 'auth:brand.featureTheme' },
]
</script>

<template>
  <div class="flex min-h-svh bg-background">
    <aside
      class="bg-brand relative hidden overflow-hidden p-10 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between"
    >
      <div class="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div class="relative flex items-center gap-2.5">
        <BrandMark class="bg-white/15" />
        <span class="text-sm font-semibold tracking-tight">{{ t('common:app.name') }}</span>
      </div>

      <div class="relative max-w-md space-y-6">
        <h2 class="text-3xl leading-tight font-semibold tracking-tight text-balance">
          {{ t('auth:brand.headline') }}
        </h2>
        <p class="text-sm leading-relaxed text-white/80">{{ t('auth:brand.description') }}</p>
        <ul class="space-y-3">
          <li
            v-for="feature in FEATURES"
            :key="feature.key"
            class="flex items-center gap-3 text-sm text-white/90"
          >
            <span
              class="flex size-8 items-center justify-center rounded-lg bg-white/12 backdrop-blur"
            >
              <component :is="feature.icon" class="size-4" aria-hidden="true" />
            </span>
            {{ t(feature.key) }}
          </li>
        </ul>
      </div>

      <div class="relative max-w-sm">
        <p class="text-xs leading-relaxed text-white/60">{{ t('auth:demo.disclaimer') }}</p>
      </div>
    </aside>

    <main class="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
      <div class="absolute end-4 top-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div class="w-full max-w-md">
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandMark />
          <span class="text-sm font-semibold tracking-tight">{{ t('common:app.name') }}</span>
        </div>

        <div class="shadow-soft rounded-3xl border bg-card p-6 sm:p-8">
          <div class="space-y-1.5">
            <h1 class="text-2xl font-semibold tracking-tight">{{ props.title }}</h1>
            <p v-if="props.subtitle" class="text-sm text-muted-foreground">{{ props.subtitle }}</p>
          </div>

          <div class="mt-6">
            <slot />
          </div>
        </div>

        <div v-if="$slots.footer" class="mt-6 text-center text-sm text-muted-foreground">
          <slot name="footer" />
        </div>
      </div>
    </main>
  </div>
</template>
