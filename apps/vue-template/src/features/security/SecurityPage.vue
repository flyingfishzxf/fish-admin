<script setup lang="ts">
import type { AuthSession } from '@fish-admin/contracts'
import { DEMO_MFA_CODE } from '@fish-admin/contracts/demo'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Input,
  Label,
  OtpInput,
  PageHeader,
  Separator,
  Skeleton,
} from '@fish-admin/vue'
import { Check, Copy, KeyRound, Laptop, ShieldCheck, ShieldOff, Smartphone } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'

import { ApiError } from '../../lib/api-error'
import { formatRelativeTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { useTransientMessage } from '../../lib/use-transient-message'
import { useAuthStore } from '../../stores/auth'
import PasswordInput from '../auth/PasswordInput.vue'
import PasswordStrength from '../auth/PasswordStrength.vue'
import { analyzePassword } from '../auth/password'
import { authKeys } from '../auth/queries'
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  revokeOtherSessions,
  revokeSession,
  setupTwoFactor,
  type ChangePasswordInput,
} from './api'
import { sessionsQueryOptions } from './queries'

const t = useT('security')
const commonT = useT('common')
const validationT = useT('validation')

const auth = useAuthStore()
const queryClient = useQueryClient()
const { message: statusMessage, show: showStatus } = useTransientMessage()

// Same boundaries as the server validator, so a weak password is caught before
// it reaches the API and the strength meter agrees with the rejection.
const PASSWORD_MIN = 8
const LETTER = /[A-Za-z]/
const DIGIT = /\d/

const passwordForm = reactive({ current: '', next: '', confirm: '' })
const passwordErrors = reactive<{ current?: string; next?: string; confirm?: string }>({})
const passwordError = ref<string | null>(null)

const sessions = useQuery(sessionsQueryOptions())
const otherSessions = computed(() => (sessions.data.value ?? []).filter((item) => !item.current))

const revokeTarget = ref<AuthSession | null>(null)
const revokeOpen = ref(false)
const revokeOthersOpen = ref(false)

const twoFactorEnabled = computed(() => auth.user?.twoFactorEnabled === true)
const setupOpen = ref(false)
const setupSecret = ref('')
const setupCode = ref('')
const setupError = ref<string | null>(null)
const disableOpen = ref(false)
const disablePassword = ref('')
const disableError = ref<string | null>(null)

async function invalidateSessions() {
  await queryClient.invalidateQueries({ queryKey: authKeys.sessions() })
}

function resolvePasswordError(failure: unknown) {
  passwordError.value = null
  if (failure instanceof ApiError) {
    if (failure.code === 'INVALID_PASSWORD') {
      passwordErrors.current = t('password.errors.current')
      return
    }
    if (failure.code === 'PASSWORD_UNCHANGED') {
      passwordErrors.next = t('password.errors.unchanged')
      return
    }
    if (failure.code === 'WEAK_PASSWORD') {
      passwordErrors.next = t('password.errors.weak')
      return
    }
  }
  passwordError.value = t('password.error')
}

const passwordMutation = useMutation({
  mutationFn: (input: ChangePasswordInput) => changePassword(input),
  async onSuccess() {
    passwordForm.current = ''
    passwordForm.next = ''
    passwordForm.confirm = ''
    await invalidateSessions()
    showStatus(t('password.success'))
  },
})

function validatePassword(): boolean {
  passwordErrors.current = undefined
  passwordErrors.next = undefined
  passwordErrors.confirm = undefined
  passwordError.value = null

  if (!passwordForm.current) {
    passwordErrors.current = validationT('required', { field: t('password.current') })
  }
  const analysis = analyzePassword(passwordForm.next)
  if (!analysis.checks.length) {
    passwordErrors.next = validationT('minLength', {
      field: t('password.new'),
      min: PASSWORD_MIN,
    })
  } else if (!LETTER.test(passwordForm.next)) {
    passwordErrors.next = validationT('passwordLetter')
  } else if (!DIGIT.test(passwordForm.next)) {
    passwordErrors.next = validationT('passwordNumber')
  } else if (passwordForm.confirm !== passwordForm.next) {
    passwordErrors.confirm = validationT('passwordMismatch')
  }
  return !passwordErrors.current && !passwordErrors.next && !passwordErrors.confirm
}

async function submitPassword() {
  if (!validatePassword()) return
  try {
    await passwordMutation.mutateAsync({
      currentPassword: passwordForm.current,
      newPassword: passwordForm.next,
    })
  } catch (failure) {
    resolvePasswordError(failure)
  }
}

const revokeMutation = useMutation({
  mutationFn: (id: string) => revokeSession(id),
  async onSuccess() {
    revokeOpen.value = false
    revokeTarget.value = null
    await invalidateSessions()
    showStatus(t('sessions.revokeSuccess'))
  },
})

const revokeOthersMutation = useMutation({
  mutationFn: () => revokeOtherSessions(),
  async onSuccess() {
    revokeOthersOpen.value = false
    await invalidateSessions()
    showStatus(t('sessions.revokeAllSuccess'))
  },
})

function askRevoke(session: AuthSession) {
  revokeTarget.value = session
  revokeOpen.value = true
}

async function confirmRevoke() {
  if (!revokeTarget.value) return
  try {
    await revokeMutation.mutateAsync(revokeTarget.value.id)
  } catch {
    revokeOpen.value = false
    showStatus(t('sessions.revokeError'))
  }
}

async function confirmRevokeOthers() {
  try {
    await revokeOthersMutation.mutateAsync()
  } catch {
    revokeOthersOpen.value = false
    showStatus(t('sessions.revokeError'))
  }
}

const setupMutation = useMutation({
  mutationFn: () => setupTwoFactor(),
  onSuccess(data) {
    setupSecret.value = data.secret
  },
})

const enableMutation = useMutation({
  mutationFn: (code: string) => enableTwoFactor(code),
  async onSuccess() {
    await auth.refreshUser()
    await invalidateSessions()
    setupOpen.value = false
    setupCode.value = ''
    showStatus(t('twoFactor.setup.success'))
  },
})

const disableMutation = useMutation({
  mutationFn: (password: string) => disableTwoFactor(password),
  async onSuccess() {
    await auth.refreshUser()
    await invalidateSessions()
    disableOpen.value = false
    disablePassword.value = ''
    showStatus(t('twoFactor.disableDialog.success'))
  },
})

async function openSetup() {
  setupError.value = null
  setupCode.value = ''
  setupSecret.value = ''
  setupOpen.value = true
  try {
    await setupMutation.mutateAsync()
  } catch {
    setupError.value = t('twoFactor.setup.error')
  }
}

async function confirmSetup() {
  if (setupCode.value.length !== 6) return
  setupError.value = null
  try {
    await enableMutation.mutateAsync(setupCode.value)
  } catch (failure) {
    setupError.value =
      failure instanceof ApiError && failure.code === 'INVALID_CODE'
        ? t('auth:otp.invalidCode')
        : t('twoFactor.setup.error')
    setupCode.value = ''
  }
}

function openDisable() {
  disableError.value = null
  disablePassword.value = ''
  disableOpen.value = true
}

async function confirmDisable() {
  disableError.value = null
  if (!disablePassword.value) return
  try {
    await disableMutation.mutateAsync(disablePassword.value)
  } catch (failure) {
    disableError.value =
      failure instanceof ApiError && failure.code === 'INVALID_PASSWORD'
        ? t('password.errors.current')
        : t('twoFactor.disableDialog.error')
  }
}

async function copySecret() {
  try {
    await navigator.clipboard.writeText(setupSecret.value)
    showStatus(t('twoFactor.setup.copied'))
  } catch {
    // Clipboard access can be denied; the secret stays selectable on screen.
  }
}

function relativeTime(value: string) {
  return formatRelativeTime(value, language.value)
}

function sessionIcon(session: AuthSession) {
  return /mobile|ios|android/i.test(`${session.os} ${session.browser}`) ? Smartphone : Laptop
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="t('title')" :description="t('subtitle')">
      <template #actions>
        <p v-if="statusMessage" role="status" data-slot="status" class="text-sm text-success">
          {{ statusMessage }}
        </p>
      </template>
    </PageHeader>

    <Alert :icon="ShieldCheck" :title="t('demo.title')">{{ t('demo.description') }}</Alert>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card :title="t('password.title')" :description="t('password.description')" :icon="KeyRound">
        <form class="flex flex-col gap-4" novalidate @submit.prevent="submitPassword">
          <PasswordInput
            id="current-password"
            v-model="passwordForm.current"
            :label="t('password.current')"
            :error="passwordErrors.current"
          />
          <div class="space-y-2">
            <PasswordInput
              id="new-password"
              v-model="passwordForm.next"
              :label="t('password.new')"
              autocomplete="new-password"
              :error="passwordErrors.next"
            />
            <PasswordStrength :password="passwordForm.next" />
          </div>
          <PasswordInput
            id="confirm-password"
            v-model="passwordForm.confirm"
            :label="t('password.confirm')"
            autocomplete="new-password"
            :error="passwordErrors.confirm"
          />

          <p class="text-xs text-muted-foreground">{{ t('password.hint') }}</p>
          <p v-if="passwordError" role="alert" class="text-sm text-destructive">
            {{ passwordError }}
          </p>

          <div>
            <Button
              type="submit"
              :disabled="passwordMutation.isPending.value"
              data-action="change-password"
            >
              {{ t('password.submit') }}
            </Button>
          </div>
        </form>
      </Card>

      <Card
        :title="t('twoFactor.title')"
        :description="t('twoFactor.description')"
        :icon="twoFactorEnabled ? ShieldCheck : ShieldOff"
      >
        <template #header>
          <Badge :variant="twoFactorEnabled ? 'default' : 'secondary'" data-slot="totp-state">
            {{ twoFactorEnabled ? t('twoFactor.enabled') : t('twoFactor.disabled') }}
          </Badge>
        </template>

        <p class="text-sm text-muted-foreground">
          {{
            twoFactorEnabled
              ? t('twoFactor.enabledDescription')
              : t('twoFactor.disabledDescription')
          }}
        </p>

        <div>
          <Button
            v-if="twoFactorEnabled"
            variant="outline"
            data-action="disable-2fa"
            @click="openDisable"
          >
            {{ t('twoFactor.disable') }}
          </Button>
          <Button v-else data-action="enable-2fa" @click="openSetup">
            {{ t('twoFactor.enable') }}
          </Button>
        </div>
      </Card>
    </div>

    <Card :title="t('sessions.title')" :description="t('sessions.description')" :icon="Laptop">
      <template #header>
        <Button
          variant="outline"
          size="sm"
          data-action="revoke-others"
          :disabled="otherSessions.length === 0"
          @click="revokeOthersOpen = true"
        >
          {{ t('sessions.revokeOthers') }}
        </Button>
      </template>

      <div v-if="sessions.isPending.value" class="space-y-3" data-slot="sessions-loading">
        <Skeleton v-for="index in 2" :key="index" class="h-20 w-full rounded-lg" />
      </div>

      <ErrorState
        v-else-if="sessions.isError.value"
        :title="t('sessions.loadError')"
        :on-retry="() => sessions.refetch()"
      />

      <p v-else-if="(sessions.data.value ?? []).length === 0" class="text-sm text-muted-foreground">
        {{ t('sessions.empty') }}
      </p>

      <ul v-else class="flex flex-col gap-3">
        <li
          v-for="session in sessions.data.value"
          :key="session.id"
          data-slot="session"
          :data-current="session.current || undefined"
          class="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <component :is="sessionIcon(session)" class="size-4" />
            </div>
            <div class="space-y-1">
              <p class="flex flex-wrap items-center gap-2 text-sm font-medium">
                {{ session.browser }} · {{ session.os }}
                <Badge v-if="session.current" variant="secondary">
                  {{ t('sessions.current') }}
                </Badge>
              </p>
              <p class="text-xs text-muted-foreground">
                {{ t('sessions.lastActive', { time: relativeTime(session.lastActiveAt) }) }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ t('sessions.ip', { ip: session.ip }) }} ·
                {{ t('sessions.created', { time: relativeTime(session.createdAt) }) }}
              </p>
            </div>
          </div>

          <Button
            v-if="!session.current"
            variant="outline"
            size="sm"
            data-action="revoke-session"
            @click="askRevoke(session)"
          >
            {{ t('sessions.revoke') }}
          </Button>
        </li>
      </ul>
    </Card>

    <AlertDialog
      v-model:open="revokeOpen"
      :title="t('sessions.confirmRevoke.title')"
      :description="t('sessions.confirmRevoke.description')"
      :confirm-label="t('sessions.confirmRevoke.confirm')"
      :cancel-label="commonT('actions.cancel')"
      :pending="revokeMutation.isPending.value"
      @confirm="confirmRevoke"
    />

    <AlertDialog
      v-model:open="revokeOthersOpen"
      :title="t('sessions.confirm.title')"
      :description="t('sessions.confirm.description')"
      :confirm-label="t('sessions.confirm.confirm')"
      :cancel-label="commonT('actions.cancel')"
      :pending="revokeOthersMutation.isPending.value"
      @confirm="confirmRevokeOthers"
    />

    <Dialog v-model:open="setupOpen">
      <DialogContent data-slot="totp-setup">
        <DialogHeader>
          <DialogTitle>{{ t('twoFactor.setup.title') }}</DialogTitle>
          <DialogDescription>{{ t('twoFactor.setup.description') }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-2">
          <Label for="totp-secret">{{ t('twoFactor.setup.secret') }}</Label>
          <div class="flex items-center gap-2">
            <Input id="totp-secret" :model-value="setupSecret" readonly class="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              :aria-label="t('twoFactor.setup.copy')"
              data-action="copy-secret"
              :disabled="!setupSecret"
              @click="copySecret"
            >
              <Copy class="size-4" aria-hidden="true" />
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('twoFactor.setup.demoNote', { code: DEMO_MFA_CODE }) }}
          </p>
        </div>

        <Separator />

        <div class="space-y-2">
          <p class="text-sm font-medium">{{ t('twoFactor.setup.code') }}</p>
          <OtpInput
            v-model="setupCode"
            :label="t('twoFactor.setup.code')"
            :invalid="Boolean(setupError)"
          />
        </div>

        <p v-if="setupError" role="alert" class="text-sm text-destructive">{{ setupError }}</p>

        <div class="flex justify-end gap-2">
          <Button variant="outline" data-action="cancel-setup" @click="setupOpen = false">
            {{ commonT('actions.cancel') }}
          </Button>
          <Button
            data-action="confirm-2fa"
            :disabled="setupCode.length !== 6 || enableMutation.isPending.value"
            @click="confirmSetup"
          >
            <Check class="size-4" aria-hidden="true" />
            {{ t('twoFactor.setup.confirm') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="disableOpen">
      <DialogContent data-slot="totp-disable">
        <DialogHeader>
          <DialogTitle>{{ t('twoFactor.disableDialog.title') }}</DialogTitle>
          <DialogDescription>{{ t('twoFactor.disableDialog.description') }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-2">
          <Label for="disable-password">{{ t('twoFactor.disableDialog.password') }}</Label>
          <Input
            id="disable-password"
            v-model="disablePassword"
            type="password"
            autocomplete="current-password"
            :aria-invalid="Boolean(disableError)"
          />
          <p v-if="disableError" role="alert" class="text-sm text-destructive">
            {{ disableError }}
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="outline" data-action="cancel-disable" @click="disableOpen = false">
            {{ commonT('actions.cancel') }}
          </Button>
          <Button
            variant="destructive"
            data-action="confirm-disable"
            :disabled="!disablePassword || disableMutation.isPending.value"
            @click="confirmDisable"
          >
            {{ t('twoFactor.disableDialog.confirm') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
