<script lang="ts">
export default { name: 'SkeletonList' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Avatar, AvatarFallback, Badge, Button, Skeleton } from '@fish-admin/vue'

const MEMBERS = [
  { id: 'ada', initials: 'AL', name: 'Ada Lovelace', email: 'ada@acme.dev', status: 'Active' },
  { id: 'grace', initials: 'GH', name: 'Grace Hopper', email: 'grace@acme.dev', status: 'Active' },
  { id: 'alan', initials: 'AT', name: 'Alan Turing', email: 'alan@acme.dev', status: 'Invited' },
  { id: 'katherine', initials: 'KJ', name: 'Katherine Johnson', email: 'katherine@acme.dev', status: 'Active' },
  { id: 'edsger', initials: 'ED', name: 'Edsger Dijkstra', email: 'edsger@acme.dev', status: 'Invited' },
]

const loading = ref(true)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button size="sm" variant="outline" @click="loading = !loading">
        {{ loading ? 'Load members' : 'Show skeleton' }}
      </Button>
      <span class="fish-demo-muted">
        {{ loading ? 'Loading 5 members…' : '5 members loaded.' }}
      </span>
    </div>
    <div class="fish-demo-stack" style="gap: 12px" :aria-busy="loading">
      <div v-for="member in MEMBERS" :key="member.id" class="fish-demo-row">
        <Skeleton
          v-if="loading"
          style="width: 32px; height: 32px; border-radius: 9999px"
        />
        <Avatar v-else role="img" :aria-label="member.name">
          <AvatarFallback>{{ member.initials }}</AvatarFallback>
        </Avatar>
        <div class="fish-demo-stack" style="gap: 6px; width: 160px">
          <template v-if="loading">
            <Skeleton style="height: 12px; width: 120px" />
            <Skeleton style="height: 10px; width: 88px" />
          </template>
          <template v-else>
            <span>{{ member.name }}</span>
            <span class="fish-demo-muted">{{ member.email }}</span>
          </template>
        </div>
        <Skeleton
          v-if="loading"
          style="width: 56px; height: 20px; border-radius: 9999px"
        />
        <Badge v-else :variant="member.status === 'Active' ? 'secondary' : 'outline'">
          {{ member.status }}
        </Badge>
      </div>
    </div>
  </div>
</template>
