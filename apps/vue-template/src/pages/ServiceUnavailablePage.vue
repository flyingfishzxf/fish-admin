<script setup lang="ts">
import { CloudOff } from 'lucide-vue-next'

import StatusScreen from '../components/common/StatusScreen.vue'
import { useT } from '../lib/i18n'

const t = useT()

// A status page is often reached with a stale bundle, so the primary action
// re-requests the document instead of routing within the app.
function reload() {
  window.location.reload()
}
</script>

<template>
  <StatusScreen
    code="503"
    :icon="CloudOff"
    tone="muted"
    :title="t('errors:status.unavailable.title')"
    :description="t('errors:status.unavailable.description')"
    :hint="t('errors:status.unavailable.hint')"
    :action="t('errors:status.unavailable.action')"
    @action="reload"
  />
</template>
