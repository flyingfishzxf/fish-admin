<script setup lang="ts">
import { Check, Copy } from 'lucide-vue-next'
import { onBeforeUnmount, ref } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import { Button } from '../ui/button'
import JsonNode from './JsonNode.vue'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

const props = withDefaults(
  defineProps<{
    /** Any JSON-compatible value; undefined renders the empty state. */
    // `unknown` on purpose: a prop whose type includes `boolean` gets Vue's
    // Boolean casting, which turns an absent value into `false`.
    value?: unknown
    /** Short label shown in the header and used as the root's accessible name. */
    ariaLabel: string
    /** Depth that starts expanded; 0 keeps everything folded. */
    defaultExpandedDepth?: number
    class?: string
  }>(),
  { defaultExpandedDepth: 2 },
)

const { t } = useUITranslation()
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

onBeforeUnmount(() => timer && clearTimeout(timer))

function copy() {
  if (props.value === undefined) return
  navigator.clipboard
    ?.writeText(JSON.stringify(props.value, null, 2))
    .then(() => {
      copied.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => (copied.value = false), 1500)
    })
    .catch(() => undefined)
}
</script>

<template>
  <div
    data-slot="json-viewer"
    :class="cn('overflow-hidden rounded-lg border bg-muted/20 font-mono text-xs', props.class)"
  >
    <div class="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
      <span class="truncate font-sans text-xs font-medium text-muted-foreground">
        {{ props.ariaLabel }}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        :disabled="props.value === undefined"
        :aria-label="copied ? t('actions.copied') : t('actions.copy')"
        @click="copy"
      >
        <Check v-if="copied" aria-hidden="true" />
        <Copy v-else aria-hidden="true" />
        <span aria-hidden="true">{{ copied ? t('actions.copied') : t('actions.copy') }}</span>
      </Button>
    </div>
    <div class="max-h-72 overflow-auto p-3">
      <p v-if="props.value === undefined" class="font-sans text-muted-foreground">
        {{ t('enterprise.noData') }}
      </p>
      <JsonNode
        v-else
        name=""
        :value="props.value as JsonValue"
        :depth="0"
        :expanded-depth="props.defaultExpandedDepth"
        :root-label="props.ariaLabel"
      />
    </div>
  </div>
</template>
