<script setup lang="ts">
import { Alert, Badge, Button, Input, Label, Skeleton } from '@fish-admin/vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { AlertTriangle, Loader2, MailCheck } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { formatDate } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import AuthShell from './AuthShell.vue'
import PasswordInput from './PasswordInput.vue'
import PasswordStrength from './PasswordStrength.vue'
import { acceptInviteRequest } from './api'
import { inviteQueryOptions } from './queries'

const t = useT()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const queryClient = useQueryClient()

const token = computed(() =>
  typeof route.query.token === 'string' ? route.query.token : undefined,
)
const invite = useQuery(computed(() => inviteQueryOptions(token.value)))

const LETTER = /[A-Za-z]/
const DIGIT = /\d/

const values = reactive({ name: '', password: '', confirmPassword: '' })
const errors = ref<Record<string, string | undefined>>({})
const serverError = ref<string | null>(null)
const submitting = ref(false)
const joined = ref(false)

// Seed the name when the preview arrives; later edits are left alone because
// this only fires on a data change.
watch(
  () => invite.data.value,
  (preview) => {
    if (preview) values.name = preview.name ?? ''
  },
  { immediate: true },
)

const title = computed(() => {
  if (!token.value) return t('auth:invite.missingTitle')
  if (invite.isPending.value) return t('auth:invite.loadingTitle')
  if (invite.isError.value || !invite.data.value) return t('auth:invite.invalidTitle')
  return t('auth:invite.title')
})
const subtitle = computed(() => {
  if (!token.value) return t('auth:invite.missingSubtitle')
  if (invite.isPending.value) return t('auth:invite.loadingSubtitle')
  if (invite.isError.value || !invite.data.value) return t('auth:invite.invalidSubtitle')
  return t('auth:invite.subtitle')
})

const invalidMessage = computed(() => {
  const error = invite.error.value
  return error instanceof ApiError && error.code === 'INVITE_EXPIRED'
    ? t('auth:invite.expired')
    : t('auth:invite.invalidDescription')
})

function validate() {
  const next: Record<string, string | undefined> = {}
  if (!values.name.trim()) next.name = t('validation:required', { field: t('auth:name') })
  else if (values.name.trim().length < 2)
    next.name = t('validation:minLength', { field: t('auth:name'), min: 2 })

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
  const preview = invite.data.value
  if (!token.value || !preview || submitting.value || !validate()) return

  submitting.value = true
  try {
    const tokens = await acceptInviteRequest({
      token: token.value,
      name: values.name.trim(),
      email: preview.email,
      password: values.password,
    })
    await auth.completeLogin(tokens)
    queryClient.clear()
    joined.value = true
    await router.replace('/')
  } catch (error) {
    serverError.value = resolveError(error)
  } finally {
    submitting.value = false
  }
}

function resolveError(error: unknown) {
  if (!(error instanceof ApiError)) return t('auth:errors.generic')
  switch (error.code) {
    case 'INVITE_EXPIRED':
    case 'INVITE_USED':
      return t('auth:invite.invalidDescription')
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
  <AuthShell :title="title" :subtitle="subtitle">
    <div v-if="!token" class="space-y-5">
      <div
        class="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
      >
        <AlertTriangle class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">{{ t('auth:invite.missingDescription') }}</p>
      <Button variant="outline" class="w-full" @click="router.push({ name: 'login' })">
        {{ t('auth:backToSignIn') }}
      </Button>
    </div>

    <div v-else-if="invite.isPending.value" class="space-y-3" data-slot="invite-loading">
      <Skeleton class="h-12 w-12 rounded-2xl" />
      <Skeleton class="h-4 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-24 w-full rounded-xl" />
    </div>

    <div v-else-if="invite.isError.value || !invite.data.value" class="space-y-5">
      <div
        class="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
      >
        <AlertTriangle class="size-6" aria-hidden="true" />
      </div>
      <p class="text-sm text-muted-foreground">{{ invalidMessage }}</p>
      <Button variant="outline" class="w-full" @click="router.push({ name: 'login' })">
        {{ t('auth:backToSignIn') }}
      </Button>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div class="flex items-start gap-3 rounded-2xl border bg-muted/35 p-4">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <MailCheck class="size-5" aria-hidden="true" />
        </div>
        <div class="min-w-0 space-y-1">
          <p class="truncate text-sm font-medium">{{ invite.data.value.email }}</p>
          <p class="text-xs text-muted-foreground">
            {{ t('auth:invite.invitedBy', { name: invite.data.value.invitedByName }) }}
          </p>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">{{ invite.data.value.roleName }}</Badge>
            <span class="text-[11px] text-muted-foreground">
              {{
                t('auth:invite.expires', {
                  date: formatDate(invite.data.value.expiresAt, language, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                })
              }}
            </span>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="invite-name">{{ t('auth:name') }}</Label>
        <Input
          id="invite-name"
          v-model="values.name"
          autocomplete="name"
          :aria-invalid="Boolean(errors.name)"
          :aria-describedby="errors.name ? 'invite-name-error' : undefined"
        />
        <p v-if="errors.name" id="invite-name-error" class="text-xs text-destructive">
          {{ errors.name }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="invite-email">{{ t('auth:email') }}</Label>
        <Input
          id="invite-email"
          :model-value="invite.data.value.email"
          disabled
          aria-readonly="true"
        />
      </div>

      <div class="space-y-2">
        <PasswordInput
          id="invite-password"
          v-model="values.password"
          :label="t('auth:password')"
          autocomplete="new-password"
          :error="errors.password"
        />
        <PasswordStrength :password="values.password" />
      </div>

      <PasswordInput
        id="invite-confirm"
        v-model="values.confirmPassword"
        :label="t('auth:confirmPassword')"
        autocomplete="new-password"
        :error="errors.confirmPassword"
      />

      <Alert v-if="serverError" variant="destructive">{{ serverError }}</Alert>
      <p v-if="joined" role="status" class="text-sm text-emerald-600">
        {{ t('auth:invite.successToast') }}
      </p>

      <Button
        type="submit"
        size="lg"
        class="w-full"
        data-action="accept-invite"
        :disabled="submitting"
      >
        <Loader2 v-if="submitting" class="size-4 animate-spin" aria-hidden="true" />
        {{ t('auth:invite.submit') }}
      </Button>
    </form>

    <template #footer>
      <RouterLink :to="{ name: 'login' }" class="font-medium text-primary hover:underline">
        {{ t('auth:backToSignIn') }}
      </RouterLink>
    </template>
  </AuthShell>
</template>
