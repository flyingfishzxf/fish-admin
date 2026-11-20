<script lang="ts">
export default { name: 'ListSelectable' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { List, type ListItem } from '@fish-admin/vue'
import { ShieldAlert, ShieldCheck, UserCog } from 'lucide-vue-next'

const MEMBERS = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Platform admin', meta: 'Active', icon: UserCog },
  { id: 'grace', name: 'Grace Hopper', role: 'Auditor', meta: 'Invited', icon: ShieldCheck },
  {
    id: 'katherine',
    name: 'Katherine Johnson',
    role: 'Billing owner',
    meta: 'Suspended',
    icon: ShieldAlert,
    disabled: true,
  },
]

const selectedId = ref('ada')
const status = ref('Ada Lovelace is selected.')

const items: ListItem[] = MEMBERS.map((member) => ({
  id: member.id,
  title: member.name,
  description: member.role,
  meta: member.meta,
  icon: member.icon,
  disabled: member.disabled,
}))

function onItemClick(item: ListItem) {
  selectedId.value = item.id
  status.value = `${item.title} is selected.`
}
</script>

<template>
  <div class="fish-demo-stack">
    <List
      :items="items"
      ariaLabel="Workspace members"
      empty-label="No members match this filter."
      :selected-id="selectedId"
      @item-click="onItemClick"
    />
    <p class="fish-demo-muted" aria-live="polite">{{ status }}</p>
    <p class="fish-demo-muted">The suspended member is disabled and never becomes the selection.</p>
  </div>
</template>
