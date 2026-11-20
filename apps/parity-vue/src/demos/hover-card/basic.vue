<script lang="ts">
export default { name: 'HoverCardBasic' }
</script>

<script setup lang="ts">
import { Avatar, AvatarFallback, Button, HoverCard } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 420px">
    <div
      style="
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.875rem 1rem;
        background: var(--card);
      "
    >
      <p class="fish-demo-muted" style="margin: 0">Grace Hopper · 2 hours ago</p>
      <p style="margin: 0.375rem 0 0; font-size: 0.9rem; line-height: 1.6">
        Reviewed the migration plan with
        <HoverCard align="start">
          <template #trigger>
            <Button variant="link" size="sm" style="height: auto; padding: 0">@ada</Button>
          </template>
          <div style="display: flex; gap: 0.75rem">
            <Avatar>
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
            <div style="display: grid; gap: 2px; min-width: 0">
              <span style="font-size: 0.875rem; font-weight: 600">Ada Lovelace</span>
              <span class="fish-demo-muted">@ada · Engineering</span>
              <span class="fish-demo-muted">GMT · replies within an hour</span>
            </div>
          </div>
        </HoverCard>
        — the rollout window still needs a second approver.
      </p>
    </div>
    <p class="fish-demo-muted">
      Hover @ada, or focus it with Tab, to open the preview; it closes when the pointer or focus
      leaves.
    </p>
  </div>
</template>
