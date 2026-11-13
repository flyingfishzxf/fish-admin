<script setup lang="ts">
import { ServerCrash } from 'lucide-vue-next'

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
    code="500"
    :icon="ServerCrash"
    :title="t('errors:status.serverError.title')"
    :description="t('errors:status.serverError.description')"
    :hint="t('errors:status.serverError.hint')"
    :action="t('errors:status.serverError.action')"
    @action="reload"
  />
</template>
