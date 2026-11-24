<script lang="ts">
export default { name: 'HoverCardProfile' }
</script>

<script setup lang="ts">
import { Avatar, AvatarFallback, Badge, Button, HoverCard } from '@fish-admin/vue'
import { Building2, Clock, MapPin } from 'lucide-vue-next'
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 420px">
    <div class="fish-demo-row">
      <span class="fish-demo-muted">Assigned reviewer</span>
      <HoverCard align="start" :open-delay="200" class="w-72">
        <template #trigger>
          <Button
            variant="outline"
            size="sm"
            style="height: auto; padding: 0.25rem 0.5rem; gap: 0.5rem"
          >
            <Avatar size="sm">
              <AvatarFallback>GH</AvatarFallback>
            </Avatar>
            Grace Hopper
          </Button>
        </template>
        <div style="display: flex; align-items: flex-start; gap: 0.75rem">
          <Avatar>
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <div style="display: grid; gap: 2px; min-width: 0">
            <span style="font-size: 0.875rem; font-weight: 600">Grace Hopper</span>
            <span class="fish-demo-muted">@grace · Platform engineering</span>
          </div>
          <Badge variant="secondary" style="margin-left: auto">Active</Badge>
        </div>
        <p style="margin: 0.75rem 0 0; font-size: 0.85rem; line-height: 1.6">
          Maintains the release pipeline and reviews every migration plan before it reaches
          production.
        </p>
        <div style="display: grid; gap: 0.35rem; margin-top: 0.75rem">
          <div style="display: flex; align-items: center; gap: 0.5rem">
            <Building2 aria-hidden="true" :size="14" style="color: var(--muted-foreground)" />
            <span class="fish-demo-muted">Platform engineering</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem">
            <MapPin aria-hidden="true" :size="14" style="color: var(--muted-foreground)" />
            <span class="fish-demo-muted">Berlin · CET</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem">
            <Clock aria-hidden="true" :size="14" style="color: var(--muted-foreground)" />
            <span class="fish-demo-muted">Joined November 2024</span>
          </div>
        </div>
      </HoverCard>
    </div>
    <p class="fish-demo-muted">
      The card opens after a 200 ms delay. It is a read-only preview, so real actions belong on the
      destination page.
    </p>
  </div>
</template>
