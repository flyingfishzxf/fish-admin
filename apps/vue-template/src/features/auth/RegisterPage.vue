<script setup lang="ts">
import { Alert, Button, Input, Label } from '@fish-admin/vue'
import { KeyRound, Loader2, MailCheck } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import AuthShell from './AuthShell.vue'
import PasswordInput from './PasswordInput.vue'
import PasswordStrength from './PasswordStrength.vue'
import { registerRequest } from './api'

const t = useT()
const router = useRouter()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LETTER = /[A-Za-z]/
const DIGIT = /\d/

const values = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const errors = ref<Record<string, string | undefined>>({})
const serverError = ref<string | null>(null)
const submitting = ref(false)
const sent = ref<{ email: string; verificationToken: string } | null>(null)

function validate() {
  const next: Record<string, string | undefined> = {}
  const name = values.name.trim()

  if (!name) next.name = t('validation:required', { field: t('auth:name') })
  else if (name.length < 2) next.name = t('validation:minLength', { field: t('auth:name'), min: 2 })

  if (!values.email.trim()) next.email = t('validation:required', { field: t('auth:email') })
  else if (!EMAIL.test(values.email.trim())) next.email = t('validation:email')

  if (!values.password) next.password = t('validation:required', { field: t('auth:password') })
  else if (values.password.length < 8)
    next.password = t('validation:minLength', { field: t('auth:password'), min: 8 })
  else if (!LETTER.test(values.password)) next.password = t('validation:passwordLetter')
  else if (!DIGIT.test(values.password)) next.password = t('validation:passwordNumber')

  if (!values.confirmPassword)
    next.confirmPassword = t('validation:required', { field: t('auth:confirmPassword') })
  else if (values.password !== values.confirmPassword)
    next.confirmPassword = t('validation:passwordMismatch')

  errors.value = next
  return Object.keys(next).length === 0
}

async function onSubmit() {
  serverError.value = null
  if (submitting.value || !validate()) return

  submitting.value = true
  try {
    sent.value = await registerRequest({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    })
  } catch (error) {
    serverError.value = resolveError(error)
  } finally {
    submitting.value = false
  }
}

function resolveError(error: unknown) {
  if (!(error instanceof ApiError)) return t('auth:errors.generic')
  switch (error.code) {
    case 'EMAIL_TAKEN':
      return t('auth:errors.emailTaken')
    case 'WEAK_PASSWORD':
      return t('auth:errors.weakPassword')
    default:
      return t('auth:errors.generic')
  }
}
</script>

<template>
  <AuthShell
    :title="sent ? t('auth:register.successTitle') : t('auth:register.title')"
    :subtitle="sent ? t('auth:register.successSubtitle') : t('auth:register.subtitle')"
  >
    <div v-if="sent" class="space-y-5">
      <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('auth:register.sentTo', { email: sent.email }) }}
      </p>
      <Alert :icon="KeyRound">{{ t('auth:register.demoToken') }}</Alert>
      <Button
        size="lg"
        class="w-full"
        @click="
          router.push({
            name: 'verify-email',
            query: { token: sent.verificationToken, email: sent.email },
          })
        "
      >
        {{ t('auth:register.verifyNow') }}
      </Button>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div class="space-y-2">
        <Label for="register-name">{{ t('auth:name') }}</Label>
        <Input
          id="register-name"
          v-model="values.name"
          autocomplete="name"
          :placeholder="t('auth:namePlaceholder')"
          :aria-invalid="Boolean(errors.name)"
          :aria-describedby="errors.name ? 'register-name-error' : undefined"
        />
        <p v-if="errors.name" id="register-name-error" class="text-xs text-destructive">
          {{ errors.name }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="register-email">{{ t('auth:email') }}</Label>
        <Input
          id="register-email"
          v-model="values.email"
          type="email"
          autocomplete="email"
          :placeholder="t('auth:emailPlaceholder')"
          :aria-invalid="Boolean(errors.email)"
          :aria-describedby="errors.email ? 'register-email-error' : undefined"
        />
        <p v-if="errors.email" id="register-email-error" class="text-xs text-destructive">
          {{ errors.email }}
        </p>
      </div>

      <div class="space-y-2">
        <PasswordInput
          id="register-password"
          v-model="values.password"
          :label="t('auth:password')"
          autocomplete="new-password"
          :placeholder="t('auth:passwordPlaceholder')"
          :error="errors.password"
        />
        <PasswordStrength :password="values.password" />
      </div>

      <PasswordInput
        id="register-confirm"
        v-model="values.confirmPassword"
        :label="t('auth:confirmPassword')"
        autocomplete="new-password"
        :error="errors.confirmPassword"
      />

      <Alert v-if="serverError" variant="destructive">{{ serverError }}</Alert>

      <Button type="submit" size="lg" class="w-full" :disabled="submitting">
        <Loader2 v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
        {{ t('auth:register.submit') }}
      </Button>

      <p class="text-center text-[11px] text-muted-foreground">{{ t('auth:register.demoNote') }}</p>
    </form>

    <template #footer>
      <span v-if="!sent">
        {{ t('auth:register.haveAccount') }}
        <RouterLink :to="{ name: 'login' }" class="font-medium text-primary hover:underline">
          {{ t('auth:signIn') }}
        </RouterLink>
      </span>
      <RouterLink v-else :to="{ name: 'login' }" class="font-medium text-primary hover:underline">
        {{ t('auth:backToSignIn') }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
