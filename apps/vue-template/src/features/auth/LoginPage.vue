<script setup lang="ts">
import { DEMO_ACCOUNTS } from '@fish-admin/contracts/demo'
import { Button, Input, Label } from '@fish-admin/vue'
import { ArrowUpRight, Loader2 } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { sanitizeRedirect } from '../../lib/auth-redirect'
import { useT } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import AuthShell from './AuthShell.vue'
import PasswordInput from './PasswordInput.vue'

const t = useT()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const values = reactive({ email: '', password: '' })
const errors = ref<{ email?: string; password?: string }>({})
const serverError = ref<string | null>(null)
const submitting = ref(false)

function validate() {
  const next: { email?: string; password?: string } = {}
  if (!values.email.trim()) next.email = t('validation:required', { field: t('auth:email') })
  else if (!EMAIL.test(values.email.trim())) next.email = t('validation:email')
  if (!values.password) next.password = t('validation:required', { field: t('auth:password') })
  errors.value = next
  return Object.keys(next).length === 0
}

async function onSubmit() {
  serverError.value = null
  if (submitting.value || !validate()) return

  submitting.value = true
  try {
    const outcome = await auth.login(values.email.trim(), values.password)
    if (outcome.status === 'mfa') {
      await router.replace({
        name: 'otp',
        query: {
          challenge: outcome.challengeId,
          email: outcome.email,
          ...(route.query.redirect ? { redirect: String(route.query.redirect) } : {}),
        },
      })
      return
    }
    await router.replace(sanitizeRedirect(route.query.redirect) ?? '/')
  } catch (error) {
    serverError.value = resolveLoginError(error)
  } finally {
    submitting.value = false
  }
}

function fillDemoAccount(email: string, password: string) {
  serverError.value = null
  values.email = email
  values.password = password
}

function resolveLoginError(error: unknown) {
  if (!(error instanceof ApiError)) return t('auth:loginError')

  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return t('auth:invalidCredentials')
    case 'ACCOUNT_LOCKED':
      return t('auth:errors.locked')
    case 'EMAIL_NOT_VERIFIED':
      return t('auth:errors.emailNotVerified')
    case 'ACCOUNT_INACTIVE':
      return t('auth:errors.inactive')
    default:
      return t('auth:loginError')
  }
}
</script>

<template>
  <AuthShell :title="t('auth:title')" :subtitle="t('auth:subtitle')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div class="space-y-2">
        <Label for="login-email">{{ t('auth:email') }}</Label>
        <Input
          id="login-email"
          v-model="values.email"
          type="email"
          autocomplete="email"
          :placeholder="t('auth:emailPlaceholder')"
          :aria-invalid="Boolean(errors.email)"
          :aria-describedby="errors.email ? 'login-email-error' : undefined"
        />
        <p v-if="errors.email" id="login-email-error" class="text-xs text-destructive">
          {{ errors.email }}
        </p>
      </div>

      <PasswordInput
        id="login-password"
        v-model="values.password"
        :label="t('auth:password')"
        autocomplete="current-password"
        :placeholder="t('auth:passwordPlaceholder')"
        :error="errors.password"
      />

      <div
        v-if="serverError"
        role="alert"
        class="rounded-lg border border-destructive/50 px-4 py-3 text-sm text-destructive"
      >
        {{ serverError }}
      </div>

      <Button type="submit" class="w-full" size="lg" :disabled="submitting">
        <template v-if="submitting">
          <Loader2 class="size-4 animate-spin" aria-hidden="true" />
          {{ t('auth:signingIn') }}
        </template>
        <template v-else>{{ t('auth:signIn') }}</template>
      </Button>
    </form>

    <div class="mt-7 space-y-3">
      <div class="flex items-baseline justify-between gap-3">
        <p class="text-sm font-medium">{{ t('auth:demo.title') }}</p>
        <p class="text-[11px] text-muted-foreground">{{ t('auth:demo.description') }}</p>
      </div>
      <div class="grid gap-2 sm:grid-cols-3">
        <button
          v-for="account in DEMO_ACCOUNTS"
          :key="account.role"
          type="button"
          :data-demo="account.role"
          :title="t(`auth:demo.${account.role}Hint`)"
          class="group rounded-xl border bg-background/60 p-3 text-start transition hover:border-primary/40 hover:bg-primary/5"
          @click="fillDemoAccount(account.email, account.password)"
        >
          <span class="flex items-center justify-between gap-1">
            <span class="text-xs font-semibold">{{ t(`auth:demo.${account.role}`) }}</span>
            <ArrowUpRight
              class="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100"
              aria-hidden="true"
            />
          </span>
          <span class="mt-1 block truncate text-[11px] text-muted-foreground">
            {{ account.email }}
          </span>
        </button>
      </div>
      <p class="text-[11px] text-muted-foreground">
        {{ t('auth:footer.demoNote') }}
        <span class="lg:hidden"> {{ t('auth:demo.disclaimer') }}</span>
      </p>
    </div>
  </AuthShell>
</template>
