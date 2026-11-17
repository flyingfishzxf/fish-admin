<script setup lang="ts">
import { Alert, Button } from '@fish-admin/vue'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import AuthShell from './AuthShell.vue'
import PasswordInput from './PasswordInput.vue'
import PasswordStrength from './PasswordStrength.vue'
import { resetPasswordRequest } from './api'

const t = useT()
const route = useRoute()
const router = useRouter()

const token = computed(() =>
  typeof route.query.token === 'string' ? route.query.token : undefined,
)
const email = computed(() =>
  typeof route.query.email === 'string' ? route.query.email : undefined,
)

const LETTER = /[A-Za-z]/
const DIGIT = /\d/

const values = ref({ password: '', confirmPassword: '' })
const errors = ref<{ password?: string; confirmPassword?: string }>({})
const serverError = ref<string | null>(null)
const submitting = ref(false)
const done = ref(false)

const title = computed(() => {
  if (!token.value) return t('auth:reset.missingTitle')
  if (done.value) return t('auth:reset.successTitle')
  return t('auth:reset.title')
})
const subtitle = computed(() => {
  if (!token.value) return t('auth:reset.missingSubtitle')
  if (done.value) return t('auth:reset.successSubtitle')
  return email.value
    ? t('auth:reset.subtitleFor', { email: email.value })
    : t('auth:reset.subtitle')
})

function validate() {
  const next: typeof errors.value = {}
  if (!values.value.password)
    next.password = t('validation:required', { field: t('auth:newPassword') })
  else if (values.value.password.length < 8)
    next.password = t('validation:minLength', { field: t('auth:newPassword'), min: 8 })
  else if (!LETTER.test(values.value.password)) next.password = t('validation:passwordLetter')
  else if (!DIGIT.test(values.value.password)) next.password = t('validation:passwordNumber')

  if (!values.value.confirmPassword)
    next.confirmPassword = t('validation:required', { field: t('auth:confirmPassword') })
  else if (values.value.password !== values.value.confirmPassword)
    next.confirmPassword = t('validation:passwordMismatch')

  errors.value = next
  return Object.keys(next).length === 0
}

async function onSubmit() {
  serverError.value = null
  if (!token.value || submitting.value || !validate()) return

  submitting.value = true
  try {
    await resetPasswordRequest({ token: token.value, password: values.value.password })
    done.value = true
  } catch (error) {
    serverError.value = resolveError(error)
  } finally {
    submitting.value = false
  }
}

function resolveError(error: unknown) {
  if (!(error instanceof ApiError)) return t('auth:errors.generic')
  switch (error.code) {
    case 'INVALID_TOKEN':
      return t('auth:reset.invalidToken')
    case 'WEAK_PASSWORD':
      return t('auth:errors.weakPassword')
    default:
      return t('auth:errors.generic')
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
      <p class="text-sm text-muted-foreground">{{ t('auth:reset.missingDescription') }}</p>
      <Button variant="outline" class="w-full" @click="router.push({ name: 'forgot-password' })">
        {{ t('auth:forgot.submit') }}
      </Button>
    </div>

    <div v-else-if="done" class="space-y-5">
      <div
        class="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600"
      >
        <CheckCircle2 class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">{{ t('auth:reset.successDescription') }}</p>
      <Button
        size="lg"
        class="w-full"
        data-action="go-to-login"
        @click="router.push({ name: 'login', query: email ? { email } : {} })"
      >
        {{ t('auth:signIn') }}
      </Button>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div class="space-y-2">
        <PasswordInput
          id="reset-password"
          v-model="values.password"
          :label="t('auth:newPassword')"
          autocomplete="new-password"
          :error="errors.password"
        />
        <PasswordStrength :password="values.password" />
      </div>

      <PasswordInput
        id="reset-confirm"
        v-model="values.confirmPassword"
        :label="t('auth:confirmPassword')"
        autocomplete="new-password"
        :error="errors.confirmPassword"
      />

      <Alert v-if="serverError" variant="destructive">{{ serverError }}</Alert>

      <Button type="submit" size="lg" class="w-full" :disabled="submitting">
        <Loader2 v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
        {{ t('auth:reset.submit') }}
      </Button>
    </form>

    <template #footer>
      <RouterLink :to="{ name: 'login' }" class="font-medium text-primary hover:underline">
        {{ t('auth:backToSignIn') }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
