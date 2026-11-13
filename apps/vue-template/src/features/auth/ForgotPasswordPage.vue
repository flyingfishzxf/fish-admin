<script setup lang="ts">
import { Button, Input, Label } from '@fish-admin/vue'
import { KeyRound, Loader2, MailCheck } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import Alert from '../../components/ui/Alert.vue'
import { useT } from '../../lib/i18n'
import AuthShell from './AuthShell.vue'
import { forgotPasswordRequest } from './api'

const t = useT()
const router = useRouter()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const values = reactive({ email: '' })
const error = ref<string | undefined>()
const serverError = ref<string | null>(null)
const submitting = ref(false)
const sent = ref<{ email: string; token?: string } | null>(null)

async function onSubmit() {
  serverError.value = null
  error.value = undefined

  const email = values.email.trim()
  if (!email) {
    error.value = t('validation:required', { field: t('auth:email') })
    return
  }
  if (!EMAIL.test(email)) {
    error.value = t('validation:email')
    return
  }
  if (submitting.value) return

  submitting.value = true
  try {
    const result = await forgotPasswordRequest(email)
    sent.value = { email, token: result.demoResetToken }
  } catch {
    serverError.value = t('auth:errors.generic')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthShell
    :title="sent ? t('auth:forgot.sentTitle') : t('auth:forgot.title')"
    :subtitle="sent ? t('auth:forgot.sentSubtitle') : t('auth:forgot.subtitle')"
  >
    <div v-if="sent" class="space-y-5">
      <div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('auth:forgot.sentTo', { email: sent.email }) }}
      </p>

      <Alert v-if="sent.token" :icon="KeyRound" :title="t('auth:forgot.demoTitle')">
        {{ t('auth:forgot.demoDescription') }}
      </Alert>
      <p v-else class="text-xs text-muted-foreground">{{ t('auth:forgot.noAccountHint') }}</p>

      <Button
        v-if="sent.token"
        size="lg"
        class="w-full"
        data-action="open-demo-link"
        @click="
          router.push({
            name: 'reset-password',
            query: { token: sent.token, email: sent.email },
          })
        "
      >
        {{ t('auth:forgot.openDemoLink') }}
      </Button>
      <Button variant="outline" class="w-full" @click="router.push({ name: 'register' })">
        {{ t('auth:register.title') }}
      </Button>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div class="space-y-2">
        <Label for="forgot-email">{{ t('auth:email') }}</Label>
        <Input
          id="forgot-email"
          v-model="values.email"
          type="email"
          autocomplete="email"
          :placeholder="t('auth:emailPlaceholder')"
          :aria-invalid="Boolean(error)"
          :aria-describedby="error ? 'forgot-email-error' : undefined"
        />
        <p v-if="error" id="forgot-email-error" class="text-xs text-destructive">{{ error }}</p>
      </div>

      <Button type="submit" size="lg" class="w-full" :disabled="submitting">
        <Loader2 v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
        {{ t('auth:forgot.submit') }}
      </Button>

      <Alert v-if="serverError" variant="destructive">{{ serverError }}</Alert>
      <p class="text-center text-[11px] text-muted-foreground">{{ t('auth:forgot.note') }}</p>
    </form>

    <template #footer>
      <RouterLink :to="{ name: 'login' }" class="font-medium text-primary hover:underline">
        {{ t('auth:backToSignIn') }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
