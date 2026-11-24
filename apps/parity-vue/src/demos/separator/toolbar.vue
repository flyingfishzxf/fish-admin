<script lang="ts">
export default { name: 'SeparatorToolbar' }
</script>

<script setup lang="ts">
import { reactive } from 'vue'

import { Button, Separator } from '@fish-admin/vue'
import { Bold, Italic, RotateCcw, Underline } from 'lucide-vue-next'

const MARKS = [
  { id: 'bold', label: 'Bold', icon: Bold },
  { id: 'italic', label: 'Italic', icon: Italic },
  { id: 'underline', label: 'Underline', icon: Underline },
] as const

const INITIAL_MARKS = { bold: true, italic: false, underline: false }

const marks = reactive<Record<string, boolean>>({ ...INITIAL_MARKS })
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" role="toolbar" aria-label="Text formatting">
      <Button
        v-for="mark in MARKS"
        :key="mark.id"
        size="icon-sm"
        :variant="marks[mark.id] ? 'default' : 'ghost'"
        :aria-label="mark.label"
        :aria-pressed="marks[mark.id]"
        @click="marks[mark.id] = !marks[mark.id]"
      >
        <component :is="mark.icon" aria-hidden="true" />
      </Button>
      <Separator orientation="vertical" style="height: 20px" />
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Clear formatting"
        @click="Object.assign(marks, INITIAL_MARKS)"
      >
        <RotateCcw aria-hidden="true" />
      </Button>
    </div>
    <p
      :style="{
        margin: 0,
        fontWeight: marks.bold ? 600 : 400,
        fontStyle: marks.italic ? 'italic' : 'normal',
        textDecoration: marks.underline ? 'underline' : 'none',
      }"
    >
      Release notes are reviewed by the platform team before every deploy.
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      The separator is vertical and 20 px tall, set explicitly because the toolbar row has no
      resolved height for <code>h-full</code> to use.
    </p>
  </div>
</template>
