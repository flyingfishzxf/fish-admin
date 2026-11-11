<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import { ShieldAlert } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useT } from '../lib/i18n'
import { useAuthStore } from '../stores/auth'

const t = useT()
const router = useRouter()
const auth = useAuthStore()
const pending = ref(false)

async function switchAccount() {
  pending.value = true
  try {
    await auth.logout()
    await router.replace('/login')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
    <div
      class="flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive"
    >
      <ShieldAlert class="size-7" />
    </div>
    <p class="mt-6 text-xs font-semibold tracking-[0.28em] text-muted-foreground">403</p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight">{{ t('errors:forbidden.title') }}</h1>
    <p class="mt-2 max-w-md text-sm text-muted-foreground">
      {{ t('errors:forbidden.description') }}
    </p>
    <p class="mt-1 max-w-md text-xs text-muted-foreground/80">{{ t('errors:forbidden.hint') }}</p>
    <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
      <Button as-child>
        <RouterLink to="/">{{ t('errors:forbidden.action') }}</RouterLink>
      </Button>
      <Button variant="outline" :disabled="pending" @click="switchAccount">
        {{ t('auth:otp.useAnotherAccount') }}
      </Button>
    </div>
  </div>
</template>
