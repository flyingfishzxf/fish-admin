<script setup lang="ts">
import type { SupportedLanguage } from '@fish-admin/i18n'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  Badge,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import {
  ExternalLink,
  Github,
  Info,
  Languages,
  LayoutTemplate,
  Palette,
  RotateCcw,
  ShieldCheck,
  Timer,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import PageHeader from '../../components/common/PageHeader.vue'
import AlertDialog from '../../components/ui/AlertDialog.vue'
import Card from '../../components/ui/Card.vue'
import Collapsible from '../../components/ui/Collapsible.vue'
import { env } from '../../config/env'
import {
  SHELL_CONTENT_WIDTH_OPTIONS,
  SHELL_DENSITY_OPTIONS,
  SHELL_LAYOUT_OPTIONS,
} from '../../config/shell'
import { ACCENTS, THEME_MODES, type Accent } from '../../config/theme'
import { useT, language, setLanguage } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useTransientMessage } from '../../lib/use-transient-message'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'
import { useUiStore } from '../../stores/ui'
import { resetDemoData } from './api'

const t = useT('settings')
const commonT = useT('common')
const theme = useThemeStore()
const ui = useUiStore()
const auth = useAuthStore()
const queryClient = useQueryClient()
const { message: statusMessage, show: showStatus } = useTransientMessage()

const appVersion = __APP_VERSION__
const resetOpen = ref(false)
const resetError = ref<string | null>(null)

// Mirrors `--primary` in each `[data-accent]` block of `packages/tokens/dist`,
// because the palettes only cascade from `:root` and a swatch cannot inherit
// the colour it is previewing.
const ACCENT_SWATCHES: Record<Accent, string> = {
  violet: 'oklch(0.57 0.235 292.5)',
  cyan: 'oklch(0.63 0.14 205)',
  emerald: 'oklch(0.53 0.14 160)',
  orange: 'oklch(0.68 0.18 55)',
  rose: 'oklch(0.57 0.22 10)',
}

const STATUS_PAGES = [
  { status: 'unauthorized', path: '/401' },
  { status: 'serverError', path: '/500' },
  { status: 'unavailable', path: '/503' },
  { status: 'maintenance', path: '/maintenance' },
] as const

const RETENTION_ROWS = [
  { label: 'retention.rows.audit', value: 'retention.rows.auditValue' },
  { label: 'retention.rows.notifications', value: 'retention.rows.notificationsValue' },
  { label: 'retention.rows.deliveries', value: 'retention.rows.deliveriesValue' },
] as const

// The demo reset only exists in the mock build, and only for roles that hold the
// permission — the same gate the server applies.
const canResetDemo = computed(
  () => env.enableMock && hasPermission(auth.user?.permissions ?? [], 'demo:reset'),
)

const languages = computed<Array<{ value: SupportedLanguage; label: string }>>(() => [
  { value: 'en', label: t('language.languages.en') },
  { value: 'zh-CN', label: t('language.languages.zh-CN') },
])

const resetMutation = useMutation({
  mutationFn: () => resetDemoData(),
  async onSuccess() {
    resetOpen.value = false
    queryClient.clear()
    await auth.refreshUser()
    showStatus(t('demo.success'))
  },
})

async function confirmReset() {
  resetError.value = null
  try {
    await resetMutation.mutateAsync()
  } catch {
    resetOpen.value = false
    resetError.value = t('demo.error')
  }
}

function changeLanguage(value: unknown) {
  if (value === 'en' || value === 'zh-CN') void setLanguage(value)
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

    <div class="grid gap-6 lg:grid-cols-2">
      <Card
        class="lg:col-span-2"
        :title="t('shell.title')"
        :description="t('shell.description')"
        :icon="LayoutTemplate"
      >
        <div class="space-y-5">
          <fieldset class="space-y-2">
            <legend class="text-sm font-medium">{{ t('shell.layout') }}</legend>
            <p class="text-xs text-muted-foreground">{{ t('shell.layoutDescription') }}</p>
            <div class="grid gap-2 sm:grid-cols-3">
              <button
                v-for="option in SHELL_LAYOUT_OPTIONS"
                :key="option.value"
                type="button"
                :aria-pressed="ui.layout === option.value"
                :data-shell-option="`layout-${option.value}`"
                class="rounded-lg border p-3 text-left transition-colors hover:bg-accent/40 aria-pressed:border-primary aria-pressed:bg-primary/5"
                @click="ui.setLayout(option.value)"
              >
                <span class="block text-sm font-medium">{{ t(option.labelKey) }}</span>
                <span class="mt-0.5 block text-xs text-muted-foreground">
                  {{ t(option.descriptionKey) }}
                </span>
              </button>
            </div>
          </fieldset>

          <fieldset class="space-y-2">
            <legend class="text-sm font-medium">{{ t('shell.density') }}</legend>
            <p class="text-xs text-muted-foreground">{{ t('shell.densityDescription') }}</p>
            <div class="grid gap-2 sm:grid-cols-2">
              <button
                v-for="option in SHELL_DENSITY_OPTIONS"
                :key="option.value"
                type="button"
                :aria-pressed="ui.density === option.value"
                :data-shell-option="`density-${option.value}`"
                class="rounded-lg border p-3 text-left transition-colors hover:bg-accent/40 aria-pressed:border-primary aria-pressed:bg-primary/5"
                @click="ui.setDensity(option.value)"
              >
                <span class="block text-sm font-medium">{{ t(option.labelKey) }}</span>
                <span class="mt-0.5 block text-xs text-muted-foreground">
                  {{ t(option.descriptionKey) }}
                </span>
              </button>
            </div>
          </fieldset>

          <fieldset class="space-y-2">
            <legend class="text-sm font-medium">{{ t('shell.contentWidth') }}</legend>
            <p class="text-xs text-muted-foreground">{{ t('shell.contentWidthDescription') }}</p>
            <div class="grid gap-2 sm:grid-cols-3">
              <button
                v-for="option in SHELL_CONTENT_WIDTH_OPTIONS"
                :key="option.value"
                type="button"
                :aria-pressed="ui.contentWidth === option.value"
                :data-shell-option="`width-${option.value}`"
                class="rounded-lg border p-3 text-left transition-colors hover:bg-accent/40 aria-pressed:border-primary aria-pressed:bg-primary/5"
                @click="ui.setContentWidth(option.value)"
              >
                <span class="block text-sm font-medium">{{ t(option.labelKey) }}</span>
                <span class="mt-0.5 block text-xs text-muted-foreground">
                  {{ t(option.descriptionKey) }}
                </span>
              </button>
            </div>
          </fieldset>
        </div>
      </Card>

      <Card
        :title="t('appearance.title')"
        :description="t('appearance.description')"
        :icon="Palette"
      >
        <fieldset class="space-y-3">
          <legend class="text-sm font-medium">{{ t('appearance.mode') }}</legend>
          <div class="grid gap-2 sm:grid-cols-3">
            <button
              v-for="mode in THEME_MODES"
              :key="mode"
              type="button"
              :aria-pressed="theme.mode === mode"
              :data-mode="mode"
              class="rounded-lg border p-3 text-left transition-colors hover:bg-accent/40 aria-pressed:border-primary aria-pressed:bg-primary/5"
              @click="theme.setMode(mode)"
            >
              <span class="block text-sm font-medium">{{ t(`appearance.modes.${mode}`) }}</span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                {{ t(`appearance.modes.${mode}Description`) }}
              </span>
            </button>
          </div>
        </fieldset>

        <div class="space-y-2">
          <p class="text-sm font-medium">{{ t('appearance.accent') }}</p>
          <p class="text-xs text-muted-foreground">{{ t('appearance.accentDescription') }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="accent in ACCENTS"
              :key="accent"
              type="button"
              :aria-pressed="theme.accent === accent"
              :aria-label="t(`appearance.accents.${accent}`)"
              :data-accent-option="accent"
              class="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-accent/40 aria-pressed:border-primary"
              @click="theme.setAccent(accent)"
            >
              <span
                class="size-4 rounded-full"
                :style="{ backgroundColor: ACCENT_SWATCHES[accent] }"
                aria-hidden="true"
              />
              {{ t(`appearance.accents.${accent}`) }}
            </button>
          </div>
        </div>
      </Card>

      <Card :title="t('language.title')" :description="t('language.description')" :icon="Languages">
        <div class="space-y-2">
          <Label for="settings-language">{{ t('language.label') }}</Label>
          <Select :model-value="language" @update:model-value="changeLanguage">
            <SelectTrigger id="settings-language" class="w-full sm:w-64">
              <SelectValue :label="t(`language.languages.${language}`)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in languages" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card
        :title="t('security.title')"
        :description="t('security.description')"
        :icon="ShieldCheck"
      >
        <div>
          <Button as-child variant="outline" data-action="open-security">
            <RouterLink to="/security">{{ t('security.action') }}</RouterLink>
          </Button>
        </div>
      </Card>

      <Card :title="t('about.title')" :description="t('about.description')" :icon="Info">
        <dl class="space-y-2 text-sm">
          <div class="flex items-center justify-between gap-3">
            <dt class="text-muted-foreground">{{ t('about.version') }}</dt>
            <dd>
              <Badge variant="secondary">v{{ appVersion }}</Badge>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-muted-foreground">{{ t('about.license') }}</dt>
            <dd>MIT</dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted-foreground">{{ t('about.stack') }}</dt>
            <dd class="text-end">{{ commonT('footer.builtWithVue') }}</dd>
          </div>
        </dl>

        <div class="flex flex-wrap gap-2">
          <Button as-child variant="outline" size="sm">
            <a
              href="https://github.com/flyingfishzxf/fish-admin"
              target="_blank"
              rel="noreferrer"
              data-link="repository"
            >
              <Github class="size-4" aria-hidden="true" />
              {{ t('about.repository') }}
            </a>
          </Button>
          <Button as-child variant="outline" size="sm">
            <a
              href="https://github.com/flyingfishzxf/fish-admin/blob/main/docs/en/vue-template.md"
              target="_blank"
              rel="noreferrer"
              data-link="docs"
            >
              <ExternalLink class="size-4" aria-hidden="true" />
              {{ t('about.docs') }}
            </a>
          </Button>
        </div>
      </Card>

      <Card
        :title="t('errorPages.title')"
        :description="t('errorPages.description')"
        :icon="ExternalLink"
      >
        <ul class="grid gap-2 sm:grid-cols-2">
          <li v-for="page in STATUS_PAGES" :key="page.path">
            <a
              :href="page.path"
              target="_blank"
              rel="noreferrer"
              :data-status-page="page.path"
              class="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent/40"
            >
              <span>{{ t(`errors:status.${page.status}.title`) }}</span>
              <span class="font-mono text-xs text-muted-foreground">{{ page.path }}</span>
            </a>
          </li>
        </ul>
        <p class="text-xs text-muted-foreground">{{ t('errorPages.open') }}</p>
      </Card>

      <Collapsible
        :title="t('retention.title')"
        :description="t('retention.description')"
        :icon="Timer"
        :class="canResetDemo ? '' : 'lg:col-span-2'"
      >
        <dl class="space-y-2 text-sm">
          <div
            v-for="row in RETENTION_ROWS"
            :key="row.label"
            class="flex items-center justify-between gap-3"
          >
            <dt class="text-muted-foreground">{{ t(row.label) }}</dt>
            <dd>{{ t(row.value) }}</dd>
          </div>
        </dl>
        <p class="mt-3 text-xs text-muted-foreground">{{ t('retention.note') }}</p>
      </Collapsible>

      <Card
        v-if="canResetDemo"
        :title="t('demo.title')"
        :description="t('demo.description')"
        :icon="RotateCcw"
      >
        <p v-if="resetError" role="alert" class="text-sm text-destructive">{{ resetError }}</p>
        <div>
          <Button variant="outline" data-action="reset-demo" @click="resetOpen = true">
            <RotateCcw class="size-4" aria-hidden="true" />
            {{ t('demo.reset') }}
          </Button>
        </div>
      </Card>
    </div>

    <AlertDialog
      v-model:open="resetOpen"
      :title="t('demo.dialog.title')"
      :description="t('demo.dialog.description')"
      :confirm-label="t('demo.dialog.confirm')"
      :cancel-label="commonT('actions.cancel')"
      :pending="resetMutation.isPending.value"
      @confirm="confirmReset"
    />
  </div>
</template>
