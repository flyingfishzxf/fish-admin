<script setup lang="ts">
import type { WorkspaceNotification } from '@fish-admin/contracts'
import { Button } from '@fish-admin/vue'
import { computed } from 'vue'

import DetailDrawer from '../../components/common/DetailDrawer.vue'
import { formatDateTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import {
  notificationBody,
  notificationIcon,
  notificationSummary,
  notificationTitle,
} from './notification-meta'

const props = defineProps<{
  notification?: WorkspaceNotification
  open: boolean
  pending?: boolean
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'read-change': [notification: WorkspaceNotification, read: boolean]
}>()

const t = useT('notifications')

const heading = computed(() =>
  props.notification ? notificationTitle(t, props.notification) : t('detail.title'),
)
const summary = computed(() =>
  props.notification ? notificationSummary(t, props.notification) : undefined,
)
const icon = computed(() => (props.notification ? notificationIcon(props.notification.kind) : null))
const received = computed(() =>
  props.notification ? formatDateTime(props.notification.createdAt, language.value) : '',
)

function toggleRead() {
  if (!props.notification) return
  emit('read-change', props.notification, !props.notification.read)
}
</script>

<template>
  <!-- `DetailDrawer` always needs a title, so the fallback heading keeps the
       dialog registered while the deep link is being cleared. `open` is false by
       then, which is why the placeholder is never on screen. -->
  <DetailDrawer
    :open="props.open"
    :title="heading"
    :description="summary"
    @update:open="emit('update:open', $event)"
  >
    <template v-if="props.notification">
      <div class="flex items-start gap-3 border-b pb-4">
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
        >
          <component :is="icon" v-if="icon" class="size-5" aria-hidden="true" />
        </span>
        <p class="text-sm text-muted-foreground">{{ summary }}</p>
      </div>

      <div class="space-y-5 pt-4" data-drawer-body>
        <p class="text-sm leading-relaxed text-muted-foreground">
          {{ notificationBody(t, props.notification) }}
        </p>

        <dl class="grid gap-3 text-sm">
          <div class="flex items-center justify-between gap-3">
            <dt class="text-muted-foreground">{{ t('detail.kind') }}</dt>
            <dd>{{ t(`kinds.${props.notification.kind}.label`) }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-muted-foreground">{{ t('detail.actor') }}</dt>
            <dd>{{ props.notification.actorName ?? t('detail.system') }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-muted-foreground">{{ t('detail.entity') }}</dt>
            <!-- Only `/integrations` exists in this build, so the other entity
                 types render as plain text instead of a link that 404s. -->
            <dd class="text-end">
              <RouterLink
                v-if="
                  props.notification.entityType === 'integration' && props.notification.entityLabel
                "
                to="/integrations"
                class="font-medium text-primary hover:underline"
                data-detail-entity
              >
                {{ props.notification.entityLabel }}
              </RouterLink>
              <span v-else data-detail-entity>{{ props.notification.entityLabel ?? '—' }}</span>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-muted-foreground">{{ t('detail.received') }}</dt>
            <dd>{{ received }}</dd>
          </div>
        </dl>

        <div class="border-t pt-4">
          <Button
            :variant="props.notification.read ? 'outline' : 'default'"
            :disabled="props.pending"
            data-drawer-action="toggle-read"
            @click="toggleRead"
          >
            {{ props.notification.read ? t('actions.markUnread') : t('actions.markRead') }}
          </Button>
        </div>
      </div>
    </template>
  </DetailDrawer>
</template>
