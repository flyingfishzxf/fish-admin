<script setup lang="ts">
import { DEMO_MFA_CODE } from '@fish-admin/contracts/demo'
import { Alert, Button, OtpInput } from '@fish-admin/vue'
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { sanitizeRedirect } from '../../lib/auth-redirect'
import { useT } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import AuthShell from './AuthShell.vue'

const t = useT()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const challenge = computed(() =>
  typeof route.query.challenge === 'string' ? route.query.challenge : undefined,
)
const email = computed(() =>
  typeof route.query.email === 'string' ? route.query.email : undefined,
)
const redirect = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : undefined,
)

const code = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

const title = computed(() => (challenge.value ? t('auth:otp.title') : t('auth:otp.missingTitle')))
const subtitle = computed(() => {
  if (!challenge.value) return t('auth:otp.missingSubtitle')
  return email.value ? t('auth:otp.subtitleFor', { email: email.value }) : t('auth:otp.subtitle')
})

async function submit(value: string) {
  if (!challenge.value || submitting.value || value.length !== 6) return
  submitting.value = true
  error.value = null
  try {
    await auth.completeMfa(challenge.value, value)
    await router.replace(sanitizeRedirect(redirect.value) ?? '/')
  } catch (failure) {
    error.value = resolveError(failure)
    code.value = ''
  } finally {
    submitting.value = false
  }
}

function resolveError(failure: unknown) {
  if (!(failure instanceof ApiError)) return t('auth:errors.generic')
  switch (failure.code) {
    case 'INVALID_CODE':
      return t('auth:otp.invalidCode')
    case 'MFA_EXPIRED':
      return t('auth:otp.expired')
    default:
      return t('auth:errors.generic')
  }
}
</script>

<template>
  <AuthShell :title="title" :subtitle="subtitle">
    <div v-if="!challenge" class="space-y-5">
      <div
        class="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
      >
        <AlertTriangle class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">{{ t('auth:otp.missingDescription') }}</p>
      <Button variant="outline" class="w-full" @click="router.push({ name: 'login' })">
        {{ t('auth:backToSignIn') }}
      </Button>
    </div>

    <div v-else class="space-y-5">
      <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ShieldCheck class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">{{ t('auth:otp.description') }}</p>

      <OtpInput
        v-model="code"
        :label="t('auth:otp.codeLabel')"
        :invalid="Boolean(error)"
        @complete="submit"
      />

      <Alert :icon="ShieldCheck">
        {{ t('auth:otp.demoHint', { code: DEMO_MFA_CODE }) }}
      </Alert>

      <Alert v-if="error" variant="destructive">{{ error }}</Alert>

      <Button
        size="lg"
        class="w-full"
        data-action="verify-otp"
        :disabled="submitting || code.length !== 6"
        @click="submit(code)"
      >
        <Loader2 v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
        {{ t('auth:otp.verify') }}
      </Button>
    </div>

    <template #footer>
      <RouterLink :to="{ name: 'login' }" class="font-medium text-primary hover:underline">
        {{ t('auth:otp.useAnotherAccount') }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
