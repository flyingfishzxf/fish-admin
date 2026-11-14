<script setup lang="ts">
import type { NotificationPreferences } from '@fish-admin/contracts'
import { Button, Switch } from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Info } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import Card from '../../components/ui/Card.vue'
import Popover from '../../components/ui/Popover.vue'
import { useT } from '../../lib/i18n'
import { useTransientMessage } from '../../lib/use-transient-message'
import { updateNotificationPreferences } from './api'
import { notificationKeys, notificationPreferencesQueryOptions } from './queries'

const DIGESTS = ['off', 'daily', 'weekly'] as const
const CHANNELS = ['inApp', 'email', 'push'] as const

const t = useT('notifications')
const queryClient = useQueryClient()
const query = useQuery(notificationPreferencesQueryOptions())
const feedback = useTransientMessage()

// The card edits a draft so a half-typed quiet hour never becomes the saved
// value; `dirty` is the only thing the two buttons look at.
const draft = ref<NotificationPreferences>()

watch(
  () => query.data.value,
  (data) => {
    if (data) draft.value = data
  },
  { immediate: true },
)

const dirty = computed(
  () =>
    draft.value !== undefined && JSON.stringify(draft.value) !== JSON.stringify(query.data.value),
)

const save = useMutation({
  mutationFn: (input: NotificationPreferences) => updateNotificationPreferences(input),
  onSuccess: (data) => {
    draft.value = data
    queryClient.setQueryData(notificationKeys.preferences, data)
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    feedback.show(t('preferences.saved'))
  },
  // The draft stays dirty on failure, so the user can retry without re-entering
  // anything and the reset button is still available.
  onError: () => feedback.show(t('preferences.saveFailed')),
})

function patch(next: Partial<NotificationPreferences>) {
  if (!draft.value) return
  draft.value = { ...draft.value, ...next }
}

function patchChannel(key: (typeof CHANNELS)[number], checked: boolean) {
  if (!draft.value) return
  draft.value = { ...draft.value, channels: { ...draft.value.channels, [key]: checked } }
}

function reset() {
  draft.value = query.data.value
}
</script>

<template>
  <Card
    data-preferences-card
    :title="t('preferences.title')"
    :description="t('preferences.description')"
  >
    <template #header>
      <Popover class="w-64 p-3 text-sm">
        <template #trigger>
          <Button variant="ghost" size="icon-sm" :aria-label="t('preferences.quietHelp')">
            <Info class="size-4" aria-hidden="true" />
          </Button>
        </template>
        {{ t('preferences.quietHelp') }}
      </Popover>
    </template>

    <template v-if="draft">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <p class="text-sm font-medium">{{ t('preferences.quietHours') }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <!-- Native time inputs: the value is the same `HH:mm` string the API
                 stores, so there is nothing to parse on the way in or out. -->
            <input
              type="time"
              data-quiet="start"
              :aria-label="t('preferences.quietStart')"
              :value="draft.quietStart"
              class="h-9 rounded-md border bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @input="patch({ quietStart: ($event.target as HTMLInputElement).value })"
            />
            <span aria-hidden="true" class="text-muted-foreground">–</span>
            <input
              type="time"
              data-quiet="end"
              :aria-label="t('preferences.quietEnd')"
              :value="draft.quietEnd"
              class="h-9 rounded-md border bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              @input="patch({ quietEnd: ($event.target as HTMLInputElement).value })"
            />
          </div>
        </div>

        <fieldset class="space-y-2">
          <legend class="text-sm font-medium">{{ t('preferences.digest') }}</legend>
          <div class="flex flex-wrap gap-4">
            <label
              v-for="digest in DIGESTS"
              :key="digest"
              class="flex items-center gap-2 text-sm font-normal"
            >
              <input
                type="radio"
                name="notification-digest"
                :data-digest="digest"
                :checked="draft.digest === digest"
                class="size-4 accent-primary"
                @change="patch({ digest })"
              />
              {{ t(`preferences.digests.${digest}`) }}
            </label>
          </div>
        </fieldset>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-medium">{{ t('preferences.channels') }}</p>
        <div
          v-for="channel in CHANNELS"
          :key="channel"
          data-channel-row
          class="flex items-start justify-between gap-3"
        >
          <div class="space-y-0.5">
            <p class="text-sm">{{ t(`preferences.channelLabels.${channel}`) }}</p>
            <p class="text-xs text-muted-foreground">
              {{ t(`preferences.channelDescriptions.${channel}`) }}
            </p>
          </div>
          <Switch
            :data-channel="channel"
            :model-value="draft.channels[channel]"
            :aria-label="t(`preferences.channelLabels.${channel}`)"
            @update:model-value="patchChannel(channel, $event === true)"
          />
        </div>
      </div>

      <p
        v-if="feedback.message.value"
        role="status"
        data-preferences-status
        class="text-sm text-muted-foreground"
      >
        {{ feedback.message.value }}
      </p>
    </template>

    <template v-if="draft" #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="ghost"
          data-preferences-action="reset"
          :disabled="!dirty || save.isPending.value"
          @click="reset"
        >
          {{ t('actions.resetPreferences') }}
        </Button>
        <Button
          data-preferences-action="save"
          :disabled="!dirty || save.isPending.value"
          @click="draft && save.mutate(draft)"
        >
          {{ t('actions.savePreferences') }}
        </Button>
      </div>
    </template>
  </Card>
</template>
