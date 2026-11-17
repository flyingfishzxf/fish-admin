<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

const props = withDefaults(
  defineProps<{
    name: string
    value: JsonValue
    depth: number
    expandedDepth?: number
    rootLabel?: string
  }>(),
  { expandedDepth: 2 },
)

const { t } = useUITranslation()
const isContainer = computed(() => props.value !== null && typeof props.value === 'object')
const entries = computed(() =>
  isContainer.value ? Object.entries(props.value as Record<string, JsonValue>) : [],
)
const expanded = ref(props.depth < props.expandedDepth)

const PRIMITIVE_STYLES: Record<string, string> = {
  string: 'text-success',
  number: 'text-primary',
  boolean: 'text-warning',
  null: 'text-muted-foreground',
}

function formatPrimitive(value: JsonValue) {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  return String(value)
}

const primitiveStyle = computed(() =>
  cn('break-all', PRIMITIVE_STYLES[props.value === null ? 'null' : typeof props.value]),
)
const summary = computed(() =>
  Array.isArray(props.value) ? `[${entries.value.length}]` : `{${entries.value.length}}`,
)
const label = computed(() => props.name || props.rootLabel || t('enterprise.noData'))
</script>

<template>
  <div v-if="!isContainer" class="flex gap-2 py-0.5">
    <span v-if="props.name" class="shrink-0 text-muted-foreground">{{ props.name }}:</span>
    <span :class="primitiveStyle">{{ formatPrimitive(props.value) }}</span>
  </div>
  <div v-else-if="entries.length === 0" class="flex gap-2 py-0.5">
    <span v-if="props.name" class="shrink-0 text-muted-foreground">{{ props.name }}:</span>
    <span class="text-muted-foreground">{{ summary }}</span>
  </div>
  <div v-else>
    <button
      type="button"
      :aria-expanded="expanded"
      class="flex items-center gap-1 rounded-sm py-0.5 text-start outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      @click="expanded = !expanded"
    >
      <ChevronRight
        aria-hidden="true"
        :class="
          cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )
        "
      />
      <span v-if="props.name" class="text-foreground">{{ props.name }}:</span>
      <span v-else class="sr-only">{{ label }}</span>
      <span class="text-muted-foreground">{{ summary }}</span>
    </button>
    <div v-if="expanded" class="ms-1.5 border-s ps-3">
      <JsonNode
        v-for="[key, entry] in entries"
        :key="key"
        :name="key"
        :value="entry"
        :depth="props.depth + 1"
        :expanded-depth="props.expandedDepth"
      />
    </div>
  </div>
</template>
