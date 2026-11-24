<script lang="ts">
export default { name: 'DetailPageSingleSection' }
</script>

<script setup lang="ts">
import { Avatar, AvatarFallback, Badge, Button, DetailPage } from '@fish-admin/vue'
import { ArrowLeft } from 'lucide-vue-next'

const details: [string, string][] = [
  ['Status', 'Running — 42 of 60 checks green'],
  ['Owner', 'Grace Hopper'],
  ['Target region', 'eu-west-1'],
  ['Freeze window', 'Nov 27, 2026 to Dec 1, 2026'],
]
</script>

<template>
  <div style="width: 100%">
    <DetailPage title="Northwind migration" subtitle="Rolling out the v2 data pipeline">
      <template #back>
        <Button type="button" variant="ghost" size="sm">
          <ArrowLeft />
          Back to projects
        </Button>
      </template>
      <template #avatar>
        <Avatar size="lg">
          <AvatarFallback>NP</AvatarFallback>
        </Avatar>
      </template>
      <template #badges>
        <Badge variant="secondary">In progress</Badge>
      </template>
      <template #meta>
        <span>Owner: Grace Hopper</span>
        <span aria-hidden="true">·</span>
        <span>Due Nov 30, 2026</span>
      </template>
      <template #actions>
        <Button type="button" size="sm">Edit plan</Button>
      </template>
      <div class="fish-demo-stack">
        <p style="margin: 0">
          This record passes a single body through the default slot instead of tabbed sections, adds
          a back node above the header, and closes with a footer action row — the layout the
          component falls back to whenever <code>tabs</code> is empty.
        </p>
        <dl
          style="
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem;
            margin: 0;
            font-size: 0.875rem;
          "
        >
          <div v-for="[label, value] in details" :key="label">
            <dt class="fish-demo-label" style="margin: 0">{{ label }}</dt>
            <dd style="margin: 0">{{ value }}</dd>
          </div>
        </dl>
      </div>
      <template #footer>
        <div
          class="fish-demo-row"
          style="justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 1rem"
        >
          <Button type="button" variant="outline" size="sm">Export summary</Button>
          <Button type="button" size="sm">Share</Button>
        </div>
      </template>
    </DetailPage>
  </div>
</template>
