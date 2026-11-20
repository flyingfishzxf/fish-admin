<script lang="ts">
export default { name: 'ToggleBasic' }
</script>

<script setup lang="ts">
import { computed, reactive } from 'vue'

import { Toggle } from '@fish-admin/vue'
import { Bold, Italic, Underline } from 'lucide-vue-next'

type Mark = 'bold' | 'italic' | 'underline'

const MARKS: Mark[] = ['bold', 'italic', 'underline']

const ICONS = { bold: Bold, italic: Italic, underline: Underline }
const LABELS = { bold: 'Bold', italic: 'Italic', underline: 'Underline' }

const marks = reactive<Record<Mark, boolean>>({ bold: true, italic: false, underline: false })

function toggle(mark: Mark) {
  marks[mark] = !marks[mark]
}

const pressed = computed(() => MARKS.filter((mark) => marks[mark]).join(', ') || 'none')
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" role="toolbar" aria-label="Text formatting">
      <Toggle
        v-for="mark in MARKS"
        :key="mark"
        :model-value="marks[mark]"
        :aria-label="LABELS[mark]"
        @update:model-value="toggle(mark)"
      >
        <component :is="ICONS[mark]" />
      </Toggle>
    </div>
    <p
      style="
        margin: 0;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-weight: marks.bold ? 700 : 400;
        font-style: marks.italic ? 'italic' : 'normal';
        text-decoration: marks.underline ? 'underline' : 'none';
      "
    >
      Design is how it works.
    </p>
    <p class="fish-demo-muted" style="margin: 0" aria-live="polite">Pressed: {{ pressed }}</p>
    <p class="fish-demo-muted" style="margin: 0">
      Each toggle is its own tab stop. Pressing Space or Enter flips the icon button and updates
      the preview.
    </p>
  </div>
</template>
