<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import { WifiOff } from 'lucide-vue-next'
import { ref, watch } from 'vue'

import { useT } from '../../lib/i18n'
import { useOnlineStatus } from '../../lib/online'
import { useTransientMessage } from '../../lib/use-transient-message'

const t = useT('errors')
const online = useOnlineStatus()
const { message, show } = useTransientMessage()

// Report the recovery once, and only to someone who actually lost the link.
const wasOffline = ref(false)
watch(online, (isOnline) => {
  if (!isOnline) {
    wasOffline.value = true
    return
  }
  if (!wasOffline.value) return
  wasOffline.value = false
  // The timer lives here, so the recovery line retires itself.
  show(t('offline.restored'))
})

function retry() {
  window.location.reload()
}
</script>

<template>
  <div
    v-if="!online"
    data-slot="offline-banner"
    role="status"
    aria-live="polite"
    class="flex items-center gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-900 sm:px-6 dark:text-amber-200"
  >
    <WifiOff class="size-4 shrink-0" aria-hidden="true" />
    <div class="min-w-0">
      <p class="text-sm font-medium">{{ t('offline.title') }}</p>
      <p class="truncate text-xs opacity-80">{{ t('offline.description') }}</p>
    </div>
    <Button variant="outline" size="sm" class="ms-auto shrink-0" @click="retry">
      {{ t('offline.retry') }}
    </Button>
  </div>

  <p
    v-else-if="message"
    data-slot="offline-restored"
    role="status"
    class="border-b border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-900 sm:px-6 dark:text-emerald-200"
  >
    {{ message }}
  </p>
</template>
