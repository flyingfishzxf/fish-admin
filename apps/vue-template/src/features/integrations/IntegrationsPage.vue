<script setup lang="ts">
import type { Integration, IntegrationDelivery, IntegrationMode } from '@fish-admin/contracts'
import { INTEGRATION_EVENTS, INTEGRATION_PROVIDERS } from '@fish-admin/contracts/integrations'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
} from '@fish-admin/vue'
import {
  Boxes,
  Clock,
  Code2,
  CreditCard,
  Database,
  Info,
  Pencil,
  Plug,
  Plus,
  Trash2,
  Webhook,
  Zap,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, reactive, ref, watchEffect } from 'vue'

import DetailDrawer from '../../components/common/DetailDrawer.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import ListPageHeader from '../../components/common/ListPageHeader.vue'
import { ApiError } from '../../lib/api-error'
import { formatRelativeTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import IntegrationDeliveryDrawer from './IntegrationDeliveryDrawer.vue'
import {
  createIntegration,
  deleteIntegration,
  updateIntegration,
  type IntegrationInput,
} from './api'
import {
  integrationKeys,
  integrationListQueryOptions,
  recentDeliveriesQueryOptions,
} from './queries'
import {
  DEFAULT_INTEGRATIONS_SEARCH,
  INTEGRATION_STATUS_FILTERS,
  type IntegrationsSearch,
} from './search'

const t = useT('integrations')
const commonT = useT('common')

// Mirrors the mock validators so an invalid form never round-trips.
const NAME_MIN = 2
const NAME_MAX = 60
const ENDPOINT_MAX = 300
const HEADER_KEY_PATTERN = /^[A-Za-z0-9-]{1,40}$/
const MAX_HEADER_VALUE = 200

const PROVIDER_ICONS = {
  Slack: Webhook,
  GitHub: Code2,
  Stripe: CreditCard,
  Linear: Boxes,
  Datadog: Database,
  Custom: Plug,
} as const

const RECENT_LIMIT = 6

const queryClient = useQueryClient()
const auth = useAuthStore()
const canManage = computed(() => hasPermission(auth.user?.permissions ?? [], 'integration:manage'))

const search = reactive<IntegrationsSearch>({ ...DEFAULT_INTEGRATIONS_SEARCH })
const list = useQuery(
  computed(() =>
    integrationListQueryOptions({
      page: search.page,
      pageSize: search.pageSize,
      provider: search.provider,
      enabled: search.status === 'all' ? undefined : search.status === 'enabled',
    }),
  ),
)
const recent = useQuery(recentDeliveriesQueryOptions(RECENT_LIMIT))

const integrations = computed<Integration[]>(() => list.data.value?.items ?? [])
const total = computed(() => list.data.value?.total ?? 0)
const pageCount = computed(() => Math.max(list.data.value?.pageCount ?? 1, 1))

// The endpoint clamps `page` to the last page it can serve; adopt its answer so
// the pager never points at a page the server refused to produce.
watchEffect(() => {
  const serverPage = list.data.value?.page
  if (!serverPage || list.isPlaceholderData.value) return
  if (serverPage !== search.page) search.page = serverPage
})

const feedback = ref<string | null>(null)
const failure = ref<string | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

function showFeedback(message: string) {
  feedback.value = message
  failure.value = null
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = null
  }, 3000)
}

function showFailure(message: string) {
  failure.value = message
  feedback.value = null
}

onBeforeUnmount(() => {
  if (feedbackTimer) clearTimeout(feedbackTimer)
})

function setProvider(value: string) {
  search.provider = value === 'all' ? undefined : value
  search.page = 1
}

function setStatus(value: string) {
  search.status = value as IntegrationsSearch['status']
  search.page = 1
}

function resetFilters() {
  search.provider = undefined
  search.status = DEFAULT_INTEGRATIONS_SEARCH.status
  search.page = 1
}

function goToPage(next: number) {
  search.page = Math.min(Math.max(next, 1), pageCount.value)
}

function eventLabel(event: string) {
  return t(`events.${event}`, { defaultValue: event })
}

function providerIcon(provider: string) {
  return PROVIDER_ICONS[provider as keyof typeof PROVIDER_ICONS] ?? Plug
}

async function invalidate() {
  await queryClient.invalidateQueries({ queryKey: integrationKeys.all })
}

/* ------------------------------------------------------------- toggle/delete */

const pendingToggleId = ref<string | null>(null)

async function toggleEnabled(integration: Integration, enabled: boolean) {
  if (pendingToggleId.value) return
  pendingToggleId.value = integration.id
  try {
    await updateIntegration(integration.id, { enabled })
    showFeedback(t(enabled ? 'toasts.enabled' : 'toasts.disabled'))
    await invalidate()
  } catch {
    showFailure(t('errors.update'))
  } finally {
    pendingToggleId.value = null
  }
}

const deleteTarget = ref<Integration | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target || deleting.value) return
  deleting.value = true
  try {
    await deleteIntegration(target.id)
    showFeedback(t('toasts.deleted'))
    deleteTarget.value = null
    await invalidate()
  } catch {
    showFailure(t('errors.delete'))
  } finally {
    deleting.value = false
  }
}

/* --------------------------------------------------------------- form drawer */

interface HeaderDraft {
  id?: string
  key: string
  value: string
}

const formOpen = ref(false)
const editTarget = ref<Integration | null>(null)
const formName = ref('')
const formProvider = ref<string>(INTEGRATION_PROVIDERS[0])
const formEndpoint = ref('')
const formEvent = ref<string>(INTEGRATION_EVENTS[0])
const formMode = ref<IntegrationMode>('immediate')
const formEnabled = ref(false)
const formHeaders = ref<HeaderDraft[]>([])
const formError = ref<string | null>(null)
const saving = ref(false)

const isNameValid = computed(() => {
  const length = formName.value.trim().length
  return length >= NAME_MIN && length <= NAME_MAX
})

const isEndpointValid = computed(() => {
  const value = formEndpoint.value.trim()
  if (value.length < 8 || value.length > ENDPOINT_MAX) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
})

const isSubmitDisabled = computed(
  () => saving.value || !isNameValid.value || !isEndpointValid.value,
)

function openForm(integration: Integration | null) {
  editTarget.value = integration
  formName.value = integration?.name ?? ''
  formProvider.value = integration?.provider ?? INTEGRATION_PROVIDERS[0]
  formEndpoint.value = integration?.endpoint ?? ''
  formEvent.value = integration?.event ?? INTEGRATION_EVENTS[0]
  formMode.value = integration?.mode ?? 'immediate'
  formEnabled.value = integration?.enabled ?? false
  formHeaders.value = (integration?.headers ?? []).map((header) => ({ ...header }))
  formError.value = null
  feedback.value = null
  failure.value = null
  formOpen.value = true
}

function setFormMode(value: string) {
  formMode.value = value as IntegrationMode
}

function addHeader() {
  formHeaders.value.push({ key: '', value: '' })
}

function removeHeader(index: number) {
  formHeaders.value.splice(index, 1)
}

function validateHeaders(): string | null {
  const seen = new Set<string>()
  for (const header of formHeaders.value) {
    const key = header.key.trim()
    if (!HEADER_KEY_PATTERN.test(key)) return t('headers.errors.key')
    const normalized = key.toLowerCase()
    if (seen.has(normalized)) return t('headers.errors.key')
    seen.add(normalized)
    if (header.value.trim().length > MAX_HEADER_VALUE)
      return t('validation.maxLength', {
        label: t('headers.columns.value'),
        limit: MAX_HEADER_VALUE,
      })
  }
  return null
}

async function submitForm() {
  if (isSubmitDisabled.value) return
  if (!isNameValid.value) {
    formError.value = t('validation.minLength', { label: t('fields.name'), limit: NAME_MIN })
    return
  }
  if (!isEndpointValid.value) {
    formError.value = t('fields.endpointHint')
    return
  }
  const headerError = validateHeaders()
  if (headerError) {
    formError.value = headerError
    return
  }

  const input: IntegrationInput = {
    name: formName.value.trim(),
    provider: formProvider.value,
    endpoint: formEndpoint.value.trim(),
    event: formEvent.value,
    mode: formMode.value,
    enabled: formEnabled.value,
    headers: formHeaders.value.map((header) => ({
      ...(header.id ? { id: header.id } : {}),
      key: header.key.trim(),
      value: header.value.trim(),
    })),
  }

  saving.value = true
  formError.value = null
  try {
    if (editTarget.value) {
      await updateIntegration(editTarget.value.id, input)
      showFeedback(t('toasts.updated'))
    } else {
      await createIntegration(input)
      showFeedback(t('toasts.created'))
    }
    formOpen.value = false
    await invalidate()
  } catch (cause) {
    // ENDPOINT_TAKEN and the validators share one message: the locale has no
    // per-code copy, so surface the generic save failure with the field hints.
    formError.value =
      cause instanceof ApiError && cause.code === 'ENDPOINT_TAKEN'
        ? t('form.editDescription')
        : t('errors.save')
  } finally {
    saving.value = false
  }
}

/* ----------------------------------------------------------- delivery drawer */

const deliveryTarget = ref<Integration | null>(null)

function openDeliveries(integration: Integration) {
  deliveryTarget.value = integration
}

function onRetried(_delivery: IntegrationDelivery) {
  // A replay touches the connection's last-delivery stamp and the activity list.
  void invalidate()
}

const recentDeliveries = computed(() => recent.data.value?.items ?? [])
</script>

<template>
  <div class="space-y-6">
    <ListPageHeader :title="t('title')" :description="t('subtitle')">
      <template v-if="canManage" #actions>
        <Button data-action="new-integration" @click="openForm(null)">
          <Plus class="size-4" aria-hidden="true" />
          {{ t('actions.create') }}
        </Button>
      </template>
    </ListPageHeader>

    <div class="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
      <Info class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div class="space-y-1">
        <p class="text-sm font-medium">{{ t('demo.title') }}</p>
        <p class="text-sm text-muted-foreground">{{ t('demo.description') }}</p>
      </div>
    </div>

    <p v-if="feedback" role="status" class="text-sm text-success">{{ feedback }}</p>
    <p v-if="failure" role="alert" class="text-sm text-destructive">{{ failure }}</p>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <Select :model-value="search.provider ?? 'all'" @update:model-value="setProvider">
          <SelectTrigger class="h-9 w-[10.5rem]" :aria-label="t('filters.provider')">
            <SelectValue :label="search.provider ?? t('filters.provider')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('filters.provider') }}</SelectItem>
            <SelectItem v-for="provider in INTEGRATION_PROVIDERS" :key="provider" :value="provider">
              {{ provider }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="search.status" @update:model-value="setStatus">
          <SelectTrigger class="h-9 w-[9.5rem]" :aria-label="t('filters.statusLabel')">
            <SelectValue
              :label="
                search.status === 'all' ? t('filters.statusAll') : t(`status.${search.status}`)
              "
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="status in INTEGRATION_STATUS_FILTERS" :key="status" :value="status">
              {{ status === 'all' ? t('filters.statusAll') : t(`status.${status}`) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          v-if="search.provider || search.status !== 'all'"
          variant="ghost"
          size="sm"
          class="h-9"
          @click="resetFilters"
        >
          {{ t('filters.clear') }}
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">{{ t('summary', { count: total }) }}</p>
    </div>

    <ErrorState
      v-if="list.isError.value && !integrations.length"
      :on-retry="() => list.refetch()"
    />
    <template v-else>
      <p v-if="list.isError.value" role="alert" class="text-sm text-destructive">
        {{ commonT('states.error.description') }}
      </p>

      <div v-if="list.isPending.value" class="grid gap-4 lg:grid-cols-2">
        <Skeleton v-for="index in 4" :key="index" class="h-60 w-full rounded-xl" />
      </div>

      <div
        v-else-if="!integrations.length"
        class="space-y-3 rounded-2xl border border-dashed px-6 py-14 text-center"
      >
        <p class="text-sm font-semibold">{{ t('empty.title') }}</p>
        <p class="text-sm text-muted-foreground">{{ t('empty.description') }}</p>
        <Button variant="outline" size="sm" @click="resetFilters">{{ t('empty.reset') }}</Button>
      </div>

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="integration in integrations"
          :key="integration.id"
          :data-integration-id="integration.id"
          class="space-y-3 rounded-2xl border p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
              >
                <component
                  :is="providerIcon(integration.provider)"
                  class="size-5"
                  aria-hidden="true"
                />
              </span>
              <div class="min-w-0 space-y-1">
                <h3 class="truncate text-base font-semibold">{{ integration.name }}</h3>
                <div class="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{{ integration.provider }}</Badge>
                  <Badge :variant="integration.enabled ? 'secondary' : 'outline'">
                    {{ t(integration.enabled ? 'status.enabled' : 'status.disabled') }}
                  </Badge>
                </div>
              </div>
            </div>
            <Switch
              v-if="canManage"
              size="sm"
              :model-value="integration.enabled"
              :disabled="pendingToggleId === integration.id"
              :aria-label="t('card.toggle', { name: integration.name })"
              @update:model-value="toggleEnabled(integration, $event)"
            />
          </div>

          <p class="truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
            {{ integration.endpoint }}
          </p>

          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div class="min-w-0">
              <dt class="text-xs text-muted-foreground">{{ t('card.event') }}</dt>
              <dd class="truncate">{{ eventLabel(integration.event) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">{{ t('card.mode') }}</dt>
              <dd class="flex items-center gap-1.5">
                <component
                  :is="integration.mode === 'immediate' ? Zap : Clock"
                  class="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                {{ t(`mode.${integration.mode}`) }}
              </dd>
            </div>
            <div class="col-span-2">
              <dt class="text-xs text-muted-foreground">{{ t('card.lastDelivery') }}</dt>
              <dd>
                {{
                  integration.lastDeliveryAt
                    ? formatRelativeTime(integration.lastDeliveryAt, language)
                    : t('card.never')
                }}
              </dd>
            </div>
          </dl>

          <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <span class="font-mono text-xs text-muted-foreground">
              {{ integration.secretPreview }}
            </span>
            <div class="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                :data-integration-id="integration.id"
                data-action="open-deliveries"
                @click="openDeliveries(integration)"
              >
                {{ t('card.deliveries') }}
              </Button>
              <template v-if="canManage">
                <Button
                  variant="ghost"
                  size="sm"
                  :data-integration-id="integration.id"
                  data-action="edit-integration"
                  @click="openForm(integration)"
                >
                  <Pencil class="size-3.5" aria-hidden="true" />
                  {{ t('actions.edit') }}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="text-destructive"
                  :aria-label="t('card.delete', { name: integration.name })"
                  :data-integration-id="integration.id"
                  data-action="delete-integration"
                  @click="deleteTarget = integration"
                >
                  <Trash2 class="size-4" aria-hidden="true" />
                </Button>
              </template>
            </div>
          </div>
        </article>
      </div>

      <div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{{ commonT('table.pageOf', { page: search.page, pageCount }) }}</span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="search.page <= 1"
            :aria-label="commonT('table.previous')"
            @click="goToPage(search.page - 1)"
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="search.page >= pageCount"
            :aria-label="commonT('table.next')"
            @click="goToPage(search.page + 1)"
          >
            →
          </Button>
        </div>
      </div>
    </template>

    <section aria-labelledby="integration-activity" class="space-y-3 rounded-2xl border p-4">
      <div>
        <h2 id="integration-activity" class="text-base font-semibold">{{ t('activity.title') }}</h2>
        <p class="text-sm text-muted-foreground">{{ t('activity.description') }}</p>
      </div>
      <ul v-if="recentDeliveries.length" aria-label="Recent deliveries" class="space-y-2">
        <li
          v-for="delivery in recentDeliveries"
          :key="delivery.id"
          class="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
        >
          <span class="min-w-0 text-sm">
            <span class="font-medium">{{ delivery.integrationName }}</span>
            <span class="text-muted-foreground"> · {{ eventLabel(delivery.event) }}</span>
          </span>
          <span class="text-xs text-muted-foreground">
            {{
              t('activity.summary', {
                code: delivery.statusCode,
                duration: delivery.durationMs,
              })
            }}
            · {{ formatRelativeTime(delivery.createdAt, language) }}
          </span>
        </li>
      </ul>
      <p v-else class="text-sm text-muted-foreground">{{ t('activity.empty') }}</p>
    </section>

    <DetailDrawer
      :open="formOpen"
      :title="editTarget ? t('form.editTitle') : t('form.createTitle')"
      :description="editTarget ? t('form.editDescription') : t('form.createDescription')"
      @update:open="!$event && (formOpen = false)"
    >
      <form class="space-y-4" @submit.prevent="submitForm">
        <div class="space-y-2">
          <Label for="integration-name">{{ t('fields.name') }}</Label>
          <Input
            id="integration-name"
            :model-value="formName"
            :placeholder="t('fields.namePlaceholder')"
            @update:model-value="formName = $event"
          />
        </div>

        <div class="space-y-2">
          <Label for="integration-provider">{{ t('fields.provider') }}</Label>
          <Select :model-value="formProvider" @update:model-value="formProvider = $event">
            <SelectTrigger
              id="integration-provider"
              class="w-full"
              :aria-label="t('fields.provider')"
            >
              <SelectValue :label="formProvider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="provider in INTEGRATION_PROVIDERS"
                :key="provider"
                :value="provider"
              >
                {{ provider }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="integration-endpoint">{{ t('fields.endpoint') }}</Label>
          <Input
            id="integration-endpoint"
            :model-value="formEndpoint"
            placeholder="https://example.com/hooks"
            @update:model-value="formEndpoint = $event"
          />
          <p class="text-xs text-muted-foreground">{{ t('fields.endpointHint') }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="integration-event">{{ t('fields.event') }}</Label>
            <Select :model-value="formEvent" @update:model-value="formEvent = $event">
              <SelectTrigger id="integration-event" class="w-full" :aria-label="t('fields.event')">
                <SelectValue :label="eventLabel(formEvent)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="event in INTEGRATION_EVENTS" :key="event" :value="event">
                  {{ eventLabel(event) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="integration-mode">{{ t('fields.mode') }}</Label>
            <Select :model-value="formMode" @update:model-value="setFormMode">
              <SelectTrigger id="integration-mode" class="w-full" :aria-label="t('fields.mode')">
                <SelectValue :label="t(`mode.${formMode}`)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">{{ t('mode.immediate') }}</SelectItem>
                <SelectItem value="digest">{{ t('mode.digest') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="space-y-1">
            <Label for="integration-enabled">{{ t('fields.enabled') }}</Label>
            <p class="text-xs text-muted-foreground">{{ t('fields.enabledHint') }}</p>
          </div>
          <Switch
            id="integration-enabled"
            :model-value="formEnabled"
            :aria-label="t('fields.enabled')"
            @update:model-value="formEnabled = $event"
          />
        </div>

        <section class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">{{ t('headers.title') }}</h3>
            <Button type="button" variant="outline" size="sm" @click="addHeader">
              {{ t('headers.add') }}
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">{{ t('headers.description') }}</p>
          <p v-if="!formHeaders.length" class="text-sm text-muted-foreground">
            {{ t('headers.empty') }}
          </p>
          <div v-for="(header, index) in formHeaders" :key="index" class="flex items-center gap-2">
            <Input
              v-model="header.key"
              :aria-label="t('headers.columns.key')"
              placeholder="X-Signature"
            />
            <Input v-model="header.value" :aria-label="t('headers.columns.value')" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              :aria-label="t('headers.delete')"
              @click="removeHeader(index)"
            >
              <Trash2 class="size-4" aria-hidden="true" />
            </Button>
          </div>
        </section>

        <p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" :disabled="saving" @click="formOpen = false">
            {{ t('form.cancel') }}
          </Button>
          <Button type="submit" :disabled="isSubmitDisabled">
            {{ editTarget ? t('form.save') : t('form.create') }}
          </Button>
        </div>
      </form>
    </DetailDrawer>

    <Dialog :open="deleteTarget !== null" @update:open="!$event && (deleteTarget = null)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ t('card.deleteTitle', { name: deleteTarget?.name ?? '' }) }}
          </DialogTitle>
          <DialogDescription>{{ t('card.deleteDescription') }}</DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-2">
          <Button variant="outline" :disabled="deleting" @click="deleteTarget = null">
            {{ commonT('actions.cancel') }}
          </Button>
          <Button variant="destructive" :disabled="deleting" @click="confirmDelete">
            {{ t('actions.delete') }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <IntegrationDeliveryDrawer
      :integration="deliveryTarget"
      @close="deliveryTarget = null"
      @retried="onRetried"
    />
  </div>
</template>
