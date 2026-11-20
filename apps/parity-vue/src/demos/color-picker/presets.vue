<script lang="ts">
export default { name: 'ColorPickerPresets' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { ColorPicker, Label } from '@fish-admin/vue'

const SURFACE_PRESETS = ['#0f172a', '#1d4ed8', '#0d9488', '#b45309', '#be123c']

const tint = ref('#0d9488')
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 420px">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-color-picker-tint">Surface tint</Label>
      <div style="width: 11rem">
        <ColorPicker
          id="demo-color-picker-tint"
          v-model="tint"
          :presets="SURFACE_PRESETS"
          ariaLabel="Surface tint"
          hexLabel="Surface tint hex"
          pickerLabel="Surface tint swatch"
          presetsLabel="Surface tint presets"
        />
      </div>
      <div
        :style="{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          backgroundColor: `${tint}1f`,
        }"
      >
        <p style="margin: 0; font-size: 0.875rem; font-weight: 600">Weekly digest</p>
        <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
          Tinted with {{ tint.toUpperCase() }} at 12% opacity.
        </p>
      </div>
      <p class="fish-demo-muted">
        Custom presets replace the eight defaults; <code>#abc</code> expands to
        <code>#aabbcc</code>.
      </p>
    </div>

    <div class="fish-demo-stack" style="gap: 0.4rem">
      <span class="fish-demo-label">Workspace color</span>
      <div style="width: 11rem">
        <ColorPicker model-value="#64748b" ariaLabel="Workspace color" disabled />
      </div>
      <p class="fish-demo-muted">
        Disabled: the trigger stays visible but the popover never opens.
      </p>
    </div>
  </div>
</template>
