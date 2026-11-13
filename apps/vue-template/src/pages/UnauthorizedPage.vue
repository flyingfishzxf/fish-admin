<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'

import StatusScreen from '../components/common/StatusScreen.vue'
import { useT } from '../lib/i18n'

const t = useT()
</script>

<template>
  <StatusScreen
    code="401"
    :icon="ShieldAlert"
    :title="t('errors:status.unauthorized.title')"
    :description="t('errors:status.unauthorized.description')"
    :hint="t('errors:status.unauthorized.hint')"
    :action="t('errors:status.unauthorized.action')"
    action-to="/login"
  />
</template>
