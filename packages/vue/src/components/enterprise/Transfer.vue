<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import {
  filterTransferItems,
  groupTransferItems,
  splitTransferItems,
  toggleTransferKeys,
  toggleTransferValue,
  transferKeysState,
  type TransferLike,
} from '../../lib/transfer-utils'
import { useUITranslation } from '../../i18n'
import { cn } from '../../lib/utils'
import Checkbox from '../ui/checkbox/Checkbox.vue'

export type TransferItem = TransferLike

const props = withDefaults(
  defineProps<{
    /** Full item pool; `value` decides which panel each item renders in. */
    items: TransferItem[]
    /** Keys currently sitting in the target panel. */
    value: string[]
    /** Heading of the available-items panel. */
    sourceTitle: string
    /** Heading of the assigned-items panel. */
    targetTitle: string
    /** Search input placeholder in both panels; defaults to the locale "Search". */
    searchPlaceholder?: string
    /** Text shown when the filtered source panel has no rows. */
    emptySourceLabel?: string
    /** Text shown when the filtered target panel has no rows. */
    emptyTargetLabel?: string
    disabled?: boolean
    class?: string
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ 'update:value': [value: string[]] }>()

const { t } = useUITranslation()
const sourceSearch = ref('')
const targetSearch = ref('')

const visibleSource = computed(() =>
  filterTransferItems(splitTransferItems(props.items, props.value).source, sourceSearch.value),
)
const visibleTarget = computed(() =>
  filterTransferItems(splitTransferItems(props.items, props.value).target, targetSearch.value),
)
const sourceCount = computed(() => splitTransferItems(props.items, props.value).source.length)
const targetCount = computed(() => splitTransferItems(props.items, props.value).target.length)

function onChange(next: string[]) {
  emit('update:value', next)
}

function onSearchInput(panelKey: string, event: Event) {
  const next = (event.target as HTMLInputElement).value
  if (panelKey === 'source') sourceSearch.value = next
  else targetSearch.value = next
}
</script>

<template>
  <div :class="cn('grid gap-3 md:grid-cols-2', props.class)">
    <section
      v-for="panel in [
        {
          key: 'source',
          title: props.sourceTitle,
          emptyLabel: props.emptySourceLabel,
          search: sourceSearch,
          visible: visibleSource,
          count: sourceCount,
          target: false,
        },
        {
          key: 'target',
          title: props.targetTitle,
          emptyLabel: props.emptyTargetLabel,
          search: targetSearch,
          visible: visibleTarget,
          count: targetCount,
          target: true,
        },
      ]"
      :key="panel.key"
      :aria-labelledby="`transfer-${panel.key}`"
      class="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-3"
    >
      <div class="flex items-center justify-between gap-2">
        <h3 :id="`transfer-${panel.key}`" class="text-sm font-medium">{{ panel.title }}</h3>
        <span class="text-xs text-muted-foreground">{{ panel.count }}</span>
      </div>

      <input
        :value="panel.key === 'source' ? sourceSearch : targetSearch"
        type="text"
        :aria-label="`${panel.title} — ${t('enterprise.search')}`"
        @input="onSearchInput(panel.key as string, $event)"
        :placeholder="props.searchPlaceholder ?? t('enterprise.search')"
        :disabled="props.disabled"
        class="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div class="flex items-center gap-2">
        <Checkbox
          :id="`transfer-all-${panel.key}`"
          :model-value="
            transferKeysState(
              props.value,
              panel.visible.filter((item) => !item.disabled).map((item) => item.key),
            ) === 'all'
              ? true
              : transferKeysState(
                    props.value,
                    panel.visible.filter((item) => !item.disabled).map((item) => item.key),
                  ) === 'some'
                ? 'indeterminate'
                : false
          "
          :disabled="props.disabled || panel.visible.every((item) => item.disabled)"
          @update:model-value="
            () =>
              onChange(
                toggleTransferKeys(
                  props.value,
                  panel.visible.filter((item) => !item.disabled).map((item) => item.key),
                ),
              )
          "
        />
        <label :for="`transfer-all-${panel.key}`" class="text-xs text-muted-foreground">
          {{ t('enterprise.selectAll') }}
        </label>
      </div>

      <ul
        role="listbox"
        :aria-label="panel.title"
        aria-multiselectable="true"
        class="max-h-64 space-y-1 overflow-y-auto pe-1"
      >
        <li v-for="group in groupTransferItems(panel.visible)" :key="group.key || '__ungrouped'">
          <p
            v-if="group.key"
            class="px-2 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground"
          >
            {{ group.key }}
          </p>
          <ul role="presentation" class="space-y-1">
            <li v-for="item in group.items" :key="item.key">
              <button
                type="button"
                role="option"
                :aria-selected="panel.target"
                :disabled="props.disabled || item.disabled"
                :class="
                  cn(
                    'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-start transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
                    panel.target && 'bg-primary/5',
                  )
                "
                @click="onChange(toggleTransferValue(props.value, item.key))"
              >
                <span
                  aria-hidden="true"
                  :class="
                    cn(
                      'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input',
                      panel.target && 'border-primary bg-primary text-primary-foreground',
                    )
                  "
                >
                  <Check v-if="panel.target" class="size-3" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm">{{ item.label }}</span>
                  <span v-if="item.description" class="block text-xs text-muted-foreground">
                    {{ item.description }}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </li>
        <li
          v-if="panel.visible.length === 0"
          class="px-2 py-6 text-center text-xs text-muted-foreground"
        >
          {{ panel.emptyLabel ?? t('enterprise.noMatches') }}
        </li>
      </ul>
    </section>
  </div>
</template>
