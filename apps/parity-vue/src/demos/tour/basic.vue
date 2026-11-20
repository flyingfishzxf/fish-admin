<script lang="ts">
export default { name: 'TourBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Input, Tour, type TourStep } from '@fish-admin/vue'

const open = ref(false)
const finished = ref(false)

const steps: TourStep[] = [
  {
    target: '#tour-name',
    title: 'Name your workspace',
    description: 'This is what teammates see in the switcher.',
    placement: 'bottom',
  },
  {
    target: '#tour-plan',
    title: 'Pick a plan',
    description: 'You can change plans later from billing.',
    placement: 'bottom',
  },
  {
    target: '#tour-save',
    title: 'Save and invite',
    description: 'Saving unlocks the invite flow.',
    placement: 'top',
  },
]
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="justify-content: space-between">
      <p class="fish-demo-label" style="margin: 0">Workspace setup</p>
      <Button type="button" size="sm" variant="outline" @click="open = true">Start tour</Button>
    </div>
    <div class="fish-demo-row" style="align-items: flex-start">
      <div style="flex: 1; min-width: 10rem">
        <p class="fish-demo-label">Workspace name</p>
        <div id="tour-name">
          <Input aria-label="Workspace name" placeholder="Acme HQ" />
        </div>
      </div>
      <div style="flex: 1; min-width: 10rem">
        <p class="fish-demo-label">Plan</p>
        <div id="tour-plan">
          <select
            aria-label="Plan"
            style="
              width: 100%;
              height: 2.25rem;
              padding: 0 0.5rem;
              font-size: 0.875rem;
              color: var(--foreground);
              background: var(--background);
              border: 1px solid var(--input);
              border-radius: 0.375rem;
            "
          >
            <option value="team">Team</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>
    </div>
    <div id="tour-save" style="align-self: flex-start">
      <Button type="button" size="sm" @click="finished = true">Save workspace</Button>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{
        finished
          ? 'Tour finished, workspace saved.'
          : 'Three spotlight steps anchored to the fields above.'
      }}
    </p>
    <Tour
      :steps="steps"
      :open="open"
      :labels="{
        next: 'Next',
        previous: 'Back',
        skip: 'Skip tour',
        finish: 'Finish',
        step: 'Step {{current}} of {{total}}',
      }"
      @update:open="open = $event"
      @finish="finished = true"
    />
  </div>
</template>
