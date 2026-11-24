<script lang="ts">
export default { name: 'AvatarGroupDemo' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, Button } from '@fish-admin/vue'

const MEMBERS = [
  { id: 'ada', initials: 'AL', name: 'Ada Lovelace' },
  { id: 'grace', initials: 'GH', name: 'Grace Hopper' },
  { id: 'alan', initials: 'AT', name: 'Alan Turing' },
  { id: 'katherine', initials: 'KJ', name: 'Katherine Johnson' },
  { id: 'edsger', initials: 'ED', name: 'Edsger Dijkstra' },
  { id: 'margaret', initials: 'MH', name: 'Margaret Hamilton' },
  { id: 'barbara', initials: 'BL', name: 'Barbara Liskov' },
  { id: 'john', initials: 'JM', name: 'John McCarthy' },
  { id: 'radia', initials: 'RP', name: 'Radia Perlman' },
]

const expanded = ref(false)
const visible = computed(() => (expanded.value ? MEMBERS : MEMBERS.slice(0, 4)))
const hidden = computed(() => MEMBERS.length - visible.value.length)
</script>

<template>
  <div class="fish-demo-stack">
    <AvatarGroup>
      <Avatar v-for="member in visible" :key="member.id" role="img" :aria-label="member.name">
        <AvatarFallback>{{ member.initials }}</AvatarFallback>
      </Avatar>
      <AvatarGroupCount v-if="hidden > 0" role="img" :aria-label="`${hidden} more members`">
        +{{ hidden }}
      </AvatarGroupCount>
    </AvatarGroup>
    <div class="fish-demo-row">
      <Button size="sm" variant="outline" @click="expanded = !expanded">
        {{ expanded ? 'Show fewer members' : `Show all ${MEMBERS.length} members` }}
      </Button>
      <span class="fish-demo-muted">
        {{
          expanded
            ? `All ${MEMBERS.length} avatars are rendered and the count is gone.`
            : 'Four avatars plus the overflow count; the count matches the avatar size.'
        }}
      </span>
    </div>
  </div>
</template>
