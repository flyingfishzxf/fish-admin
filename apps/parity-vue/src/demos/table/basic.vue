<script lang="ts">
export default { name: 'TableBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  Badge,
  Input,
  Label,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fish-admin/vue'
import { MEMBERS } from '../data/members'

const TEAM_LABELS = {
  engineering: 'Engineering',
  design: 'Design',
  product: 'Product',
}

const query = ref('')
const normalized = computed(() => query.value.trim().toLowerCase())
const rows = computed(() =>
  MEMBERS.filter(
    (member) =>
      member.name.toLowerCase().includes(normalized.value) ||
      member.team.includes(normalized.value),
  ),
)
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 36rem">
    <div style="display: grid; gap: 0.375rem">
      <Label for="demo-table-search">Filter members</Label>
      <Input
        id="demo-table-search"
        v-model="query"
        placeholder="Search by name or team"
      />
    </div>
    <Table>
      <TableCaption>Workspace members and the teams they belong to.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="member in rows" :key="member.id">
          <TableCell>{{ member.name }}</TableCell>
          <TableCell class="fish-demo-muted">{{ TEAM_LABELS[member.team] }}</TableCell>
          <TableCell>
            <Badge :variant="member.status === 'active' ? 'secondary' : 'outline'">
              {{ member.status === 'active' ? 'Active' : 'Invited' }}
            </Badge>
          </TableCell>
          <TableCell class="fish-demo-muted">{{ member.joined }}</TableCell>
        </TableRow>
        <TableRow v-if="rows.length === 0">
          <TableCell :col-span="4" style="color: var(--muted-foreground); white-space: normal">
            {{ `No members match "${query.trim()}".` }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
