<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import { Compass } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

import { useT } from '../lib/i18n'

const t = useT()
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
    <div
      class="flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground"
    >
      <Compass class="size-7" />
    </div>
    <p class="mt-6 text-xs font-semibold tracking-[0.28em] text-muted-foreground">404</p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight">{{ t('errors:notFound.title') }}</h1>
    <p class="mt-2 max-w-md text-sm text-muted-foreground">
      {{ t('errors:notFound.description') }}
    </p>
    <Button as-child class="mt-6">
      <RouterLink to="/">{{ t('errors:notFound.action') }}</RouterLink>
    </Button>
  </div>
</template>
