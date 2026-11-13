<script setup lang="ts">
import { Wrench } from 'lucide-vue-next'

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
    :icon="Wrench"
    tone="muted"
    :title="t('errors:status.maintenance.title')"
    :description="t('errors:status.maintenance.description')"
    :hint="t('errors:status.maintenance.hint')"
    :action="t('errors:status.maintenance.action')"
    @action="reload"
  />
</template>
