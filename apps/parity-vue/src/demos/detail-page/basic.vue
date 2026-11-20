<script lang="ts">
export default { name: 'DetailPageBasic' }
</script>

<script setup lang="ts">
import { Avatar, AvatarFallback, Badge, Button, DetailPage, type DetailPageTab } from '@fish-admin/vue'

const overviewRows: [string, string][] = [
  ['Email', 'ada@fishadmin.dev'],
  ['Team', 'Platform reliability'],
  ['Location', 'London, UK'],
  ['Manager', 'Charles Babbage'],
]

const activityItems = [
  'Approved the Q4 access review.',
  'Merged the deploy-pipeline hardening PR.',
  'Assigned two on-call rotations.',
]

// The Vue tab model carries a plain string; rich panels render through
// the scoped #tab slot keyed by tab.value.
const tabs: DetailPageTab[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
]
</script>

<template>
  <div style="width: 100%">
    <DetailPage
      title="Ada Lovelace"
      subtitle="ada@fishadmin.dev"
      :tabs="tabs"
      tabs-label="Profile sections"
    >
      <template #avatar>
        <Avatar size="lg">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </template>
      <template #badges>
        <Badge>Active</Badge>
      </template>
      <template #meta>
        <span>Principal engineer</span>
        <span aria-hidden="true">·</span>
        <span>Platform reliability</span>
      </template>
      <template #actions>
        <Button type="button" variant="outline" size="sm">Message</Button>
        <Button type="button" size="sm">Edit</Button>
      </template>
      <template #tab="{ tab }">
        <div v-if="tab.value === 'overview'" class="fish-demo-stack">
          <div>
            <p class="fish-demo-label" style="margin: 0">About</p>
            <p style="margin: 0.25rem 0 0">
              Principal engineer on the platform reliability team, focused on deploy pipelines and
              on-call tooling.
            </p>
          </div>
          <dl
            style="
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.75rem;
              margin: 0;
              font-size: 0.875rem;
            "
          >
            <div v-for="[label, value] in overviewRows" :key="label">
              <dt class="fish-demo-label" style="margin: 0">{{ label }}</dt>
              <dd style="margin: 0">{{ value }}</dd>
            </div>
          </dl>
        </div>
        <ul
          v-else
          class="fish-demo-stack"
          style="list-style: none; margin: 0; padding: 0; font-size: 0.875rem"
        >
          <li v-for="text in activityItems" :key="text" class="fish-demo-row">
            <span
              aria-hidden="true"
              style="
                width: 6px;
                height: 6px;
                border-radius: 999px;
                background: var(--primary);
                flex-shrink: 0;
              "
            />
            <span>{{ text }}</span>
          </li>
        </ul>
      </template>
    </DetailPage>
  </div>
</template>
