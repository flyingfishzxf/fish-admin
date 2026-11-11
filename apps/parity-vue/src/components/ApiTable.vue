<script setup lang="ts">
import { computed } from 'vue'

import { API } from '../data/api'
import type { DocsLang } from '../data/types'
import { uiText } from '../data/ui'

const props = defineProps<{ component: string; lang: DocsLang }>()

const text = computed(() => uiText(props.lang))
const entry = computed(() => API.components[props.component])
const rows = computed(() => (entry.value ? [...entry.value.props, ...entry.value.events] : []))
</script>

<template>
  <div>
    <template v-if="entry">
      <h3>
        {{ entry.name
        }}<template v-if="entry.exportName !== entry.name">
          {{ ' ' }}<code>{{ entry.exportName }}</code></template
        >
      </h3>
      <p v-if="rows.length === 0" class="fish-demo__placeholder">{{ text.apiNone }}</p>
      <table v-else class="fish-api">
        <thead>
          <tr>
            <th>{{ text.apiName }}</th>
            <th>{{ text.apiType }}</th>
            <th>{{ text.apiDefault }}</th>
            <th>{{ text.apiRequired }}</th>
            <th>{{ text.apiDescription }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prop in rows" :key="prop.name">
            <td>
              <code>{{ prop.name }}</code>
            </td>
            <td>
              <code>{{ prop.type }}</code>
            </td>
            <td>
              <code v-if="prop.defaultValue">{{ prop.defaultValue }}</code>
              <template v-else>—</template>
            </td>
            <td>{{ prop.required ? 'yes' : '—' }}</td>
            <td>{{ prop.description || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="entry.slots.length > 0" class="fish-api-note">Slots: {{ entry.slots.join(', ') }}</p>
      <div v-if="entry.unresolved.length > 0" class="fish-api-note">
        <strong>{{ text.apiUnresolved }}</strong>
        <ul>
          <li v-for="note in entry.unresolved" :key="note">{{ note }}</li>
        </ul>
      </div>
    </template>
    <p v-else class="fish-demo__placeholder">Unknown component: {{ component }}</p>
  </div>
</template>
