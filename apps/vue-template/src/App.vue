<script setup lang="ts">
import { provideUILocale, type UILocale } from '@fish-admin/vue'
import { ref, watch } from 'vue'

import { language } from './lib/i18n'

const uiLocale = ref<UILocale>(language.value === 'zh-CN' ? 'zh-CN' : 'en')
watch(language, (value) => {
  uiLocale.value = value === 'zh-CN' ? 'zh-CN' : 'en'
})
provideUILocale(uiLocale)
</script>

<template>
  <RouterView />
</template>
