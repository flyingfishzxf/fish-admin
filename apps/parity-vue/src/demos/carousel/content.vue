<script lang="ts">
export default { name: 'CarouselContent' }
</script>

<script setup lang="ts">
import { Carousel, Button, type CarouselSlide } from '@fish-admin/vue'

const SLIDES: CarouselSlide[] = [{ id: 'migration' }, { id: 'maintenance' }]
</script>

<template>
  <div style="width: 100%; max-width: 28rem">
    <Carousel
      :slides="SLIDES"
      ariaLabel="Operations notices"
      previous-label="Previous notice"
      next-label="Next notice"
      :go-to-label="(index: number) => `Go to notice ${index}`"
    >
      <template #slide="{ slide }">
        <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem">
          <template v-if="slide.id === 'migration'">
            <p
              style="
                margin: 0;
                font-size: 0.75rem;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: var(--muted-foreground);
              "
            >
              Action required
            </p>
            <p style="margin: 0; font-size: 1rem; font-weight: 600">
              Move your webhooks to the v2 endpoint
            </p>
            <p style="margin: 0; font-size: 0.85rem; color: var(--muted-foreground)">
              The v1 endpoint stops accepting deliveries on November 30. Four workspaces still point
              at it.
            </p>
            <div>
              <Button type="button" size="sm">Review endpoints</Button>
            </div>
          </template>
          <template v-else>
            <p
              style="
                margin: 0;
                font-size: 0.75rem;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: var(--muted-foreground);
              "
            >
              Scheduled
            </p>
            <p style="margin: 0; font-size: 1rem; font-weight: 600">
              Read-replica maintenance on Sunday
            </p>
            <p style="margin: 0; font-size: 0.85rem; color: var(--muted-foreground)">
              Reporting queries may take up to 30 seconds longer between 02:00 and 03:00 UTC.
            </p>
            <div>
              <Button type="button" size="sm" variant="outline">View status page</Button>
            </div>
          </template>
        </div>
      </template>
    </Carousel>
  </div>
</template>
