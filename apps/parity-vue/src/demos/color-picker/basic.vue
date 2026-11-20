<script lang="ts">
export default { name: 'ColorPickerBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { ColorPicker, Label } from '@fish-admin/vue'

const color = ref('#6366f1')
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 420px">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-color-picker-brand">Brand color</Label>
      <div style="display: flex; align-items: center; gap: 0.75rem">
        <div style="width: 11rem; flex-shrink: 0">
          <ColorPicker
            id="demo-color-picker-brand"
            v-model="color"
            ariaLabel="Brand color"
            hexLabel="Brand color hex"
            pickerLabel="Brand color swatch"
            presetsLabel="Brand color presets"
          />
        </div>
        <div
          aria-hidden="true"
          :style="{
            flex: 1,
            minWidth: '96px',
            height: '36px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: color,
          }"
        />
      </div>
      <p class="fish-demo-muted">
        Brand color: {{ color.toUpperCase() }} — open the trigger to pick a preset or type a hex
        value.
      </p>
    </div>
  </div>
</template>
