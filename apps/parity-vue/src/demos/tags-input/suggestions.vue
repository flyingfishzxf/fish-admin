<script lang="ts">
export default { name: 'TagsInputSuggestions' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { TagsInput } from '@fish-admin/vue'

const SUGGESTIONS = ['frontend', 'backend', 'security']

const tags = ref<string[]>(['api'])
const remaining = computed(() => 4 - tags.value.length)
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Team skills</p>
    <TagsInput
      v-model="tags"
      aria-label="Team skills"
      placeholder="Add a skill"
      :max="4"
      :maxlength="16"
      :suggestions="SUGGESTIONS"
    />
    <p class="fish-demo-muted" aria-live="polite">
      {{
        tags.length >= 4
          ? 'Skill limit reached. Remove one to add another.'
          : `Tap a suggestion or type your own. ${remaining} slot(s) left.`
      }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      <code>suggestions</code> render as dashed quick-add chips below the input. They share the
      <code>max</code> budget, so every chip disables once the fourth tag lands.
    </p>
  </div>
</template>
