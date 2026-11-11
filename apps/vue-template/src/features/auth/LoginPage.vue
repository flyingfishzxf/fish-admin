<script setup lang="ts">
import { DEMO_ACCOUNTS } from '@fish-admin/contracts/demo'
import { Button, Input, Label } from '@fish-admin/vue'
import { ArrowUpRight, Database, Eye, EyeOff, Loader2, Palette, ShieldCheck } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BrandMark from '../../components/common/BrandMark.vue'
import LanguageToggle from '../../components/layout/LanguageToggle.vue'
import ThemeToggle from '../../components/layout/ThemeToggle.vue'
import { ApiError } from '../../lib/api-error'
import { sanitizeRedirect } from '../../lib/auth-redirect'
import { useT } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'

const t = useT()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FEATURES = [
  { icon: ShieldCheck, key: 'auth:brand.featureRbac' },
  { icon: Database, key: 'auth:brand.featureMock' },
  { icon: Palette, key: 'auth:brand.featureTheme' },
]

const values = reactive({ email: '', password: '' })
const errors = ref<{ email?: string; password?: string }>({})
const serverError = ref<string | null>(null)
const showPassword = ref(false)
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
    await auth.login(values.email.trim(), values.password)
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

// The mock answers MFA-capable accounts with HTTP 200 plus an MFA payload, so
// this branch keys off the code rather than the status.
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
    case 'MFA_NOT_SUPPORTED':
      return t('auth:mfaUnsupported')
    default:
      return t('auth:loginError')
  }
}
</script>

<template>
  <div class="flex min-h-svh bg-background">
    <aside
      class="bg-brand relative hidden overflow-hidden p-10 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between"
    >
      <div class="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div class="relative flex items-center gap-2.5">
        <BrandMark class="bg-white/15" />
        <span class="text-sm font-semibold tracking-tight">{{ t('common:app.name') }}</span>
      </div>

      <div class="relative max-w-md space-y-6">
        <h2 class="text-3xl leading-tight font-semibold tracking-tight text-balance">
          {{ t('auth:brand.headline') }}
        </h2>
        <p class="text-sm leading-relaxed text-white/80">{{ t('auth:brand.description') }}</p>
        <ul class="space-y-3">
          <li
            v-for="feature in FEATURES"
            :key="feature.key"
            class="flex items-center gap-3 text-sm text-white/90"
          >
            <span
              class="flex size-8 items-center justify-center rounded-lg bg-white/12 backdrop-blur"
            >
              <component :is="feature.icon" class="size-4" />
            </span>
            {{ t(feature.key) }}
          </li>
        </ul>
      </div>

      <div class="relative max-w-sm">
        <p class="text-xs leading-relaxed text-white/60">{{ t('auth:demo.disclaimer') }}</p>
      </div>
    </aside>

    <main class="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
      <div class="absolute end-4 top-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div class="w-full max-w-md">
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandMark />
          <span class="text-sm font-semibold tracking-tight">{{ t('common:app.name') }}</span>
        </div>

        <div class="shadow-soft rounded-3xl border bg-card p-6 sm:p-8">
          <div class="space-y-1.5">
            <h1 class="text-2xl font-semibold tracking-tight">{{ t('auth:title') }}</h1>
            <p class="text-sm text-muted-foreground">{{ t('auth:subtitle') }}</p>
          </div>

          <form class="mt-6 space-y-4" novalidate @submit.prevent="onSubmit">
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

            <div class="space-y-2">
              <Label for="login-password">{{ t('auth:password') }}</Label>
              <div class="relative">
                <Input
                  id="login-password"
                  v-model="values.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  class="pe-10"
                  :placeholder="t('auth:passwordPlaceholder')"
                  :aria-invalid="Boolean(errors.password)"
                  :aria-describedby="errors.password ? 'login-password-error' : undefined"
                />
                <button
                  type="button"
                  :aria-label="t(showPassword ? 'auth:hidePassword' : 'auth:showPassword')"
                  class="absolute end-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="size-4" />
                  <Eye v-else class="size-4" />
                </button>
              </div>
              <p v-if="errors.password" id="login-password-error" class="text-xs text-destructive">
                {{ errors.password }}
              </p>
            </div>

            <div
              v-if="serverError"
              role="alert"
              class="rounded-lg border border-destructive/50 px-4 py-3 text-sm text-destructive"
            >
              {{ serverError }}
            </div>

            <Button type="submit" class="w-full" size="lg" :disabled="submitting">
              <template v-if="submitting">
                <Loader2 class="size-4 animate-spin" />
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
        </div>
      </div>
    </main>
  </div>
</template>
