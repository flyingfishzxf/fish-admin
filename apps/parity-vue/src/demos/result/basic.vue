<script lang="ts">
export default { name: 'ResultBasic' }
</script>

<script setup lang="ts">
import { Button, Result, toast } from '@fish-admin/vue'
import { UserPlus } from 'lucide-vue-next'
</script>

<template>
  <Result
    status="success"
    title="Invitations sent"
    description="Three teammates were invited to the Platform workspace. They appear in the member list once they accept."
  >
    <template #extra>
      <Button size="sm" @click="toast.success('Invitations re-sent')">
        <UserPlus class="size-4" />
        Invite more
      </Button>
      <Button variant="outline" size="sm" @click="toast('Members are listed in the template.')">
        View members
      </Button>
    </template>
  </Result>
</template>
