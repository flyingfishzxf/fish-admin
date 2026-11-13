<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import Alert from '../../components/ui/Alert.vue'
import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import AuthShell from './AuthShell.vue'
import { verifyEmailRequest } from './api'

const t = useT()
const route = useRoute()
const router = useRouter()

const token = computed(() =>
  typeof route.query.token === 'string' ? route.query.token : undefined,
)
const email = computed(() =>
  typeof route.query.email === 'string' ? route.query.email : undefined,
)

const loading = ref(false)
const error = ref<string | null>(null)
const verifiedEmail = ref<string | null>(null)

const title = computed(() => {
  if (!token.value) return t('auth:verify.missingTitle')
  if (verifiedEmail.value) return t('auth:verify.successTitle')
  return t('auth:verify.title')
})
const subtitle = computed(() => {
  if (!token.value) return t('auth:verify.missingSubtitle')
  if (verifiedEmail.value) return t('auth:verify.successSubtitle')
  return t('auth:verify.subtitle')
})

async function onVerify() {
  if (!token.value || loading.value) return
  loading.value = true
  error.value = null
  try {
    const result = await verifyEmailRequest(token.value)
    verifiedEmail.value = result.email
  } catch (resolveError) {
    error.value =
      resolveError instanceof ApiError && resolveError.code === 'INVALID_TOKEN'
        ? t('auth:verify.invalid')
        : t('auth:errors.generic')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell :title="title" :subtitle="subtitle">
    <div v-if="!token" class="space-y-5">
      <div
        class="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
      >
        <AlertTriangle class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">{{ t('auth:verify.missingDescription') }}</p>
      <Button variant="outline" class="w-full" @click="router.push({ name: 'register' })">
        {{ t('auth:register.title') }}
      </Button>
    </div>

    <div v-else-if="verifiedEmail" class="space-y-5">
      <div
        class="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600"
      >
        <CheckCircle2 class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('auth:verify.verifiedFor', { email: verifiedEmail }) }}
      </p>
      <Button
        size="lg"
        class="w-full"
        @click="router.push({ name: 'login', query: { email: verifiedEmail } })"
      >
        {{ t('auth:signIn') }}
      </Button>
    </div>

    <div v-else class="space-y-5">
      <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">
        {{ email ? t('auth:verify.sentTo', { email }) : t('auth:verify.sentGeneric') }}
      </p>
      <Alert v-if="error" variant="destructive">{{ error }}</Alert>
      <Button
        size="lg"
        class="w-full"
        data-action="verify-email"
        :disabled="loading"
        @click="onVerify"
      >
        <Loader2 v-if="loading" class="size-4 animate-spin" aria-hidden="true" />
        {{ t('auth:verify.confirm') }}
      </Button>
    </div>

    <template #footer>
      <RouterLink :to="{ name: 'login' }" class="font-medium text-primary hover:underline">
        {{ t('auth:backToSignIn') }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
