<script setup lang="ts">
import { Input, Label } from '@fish-admin/vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { useT } from '../../lib/i18n'

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    autocomplete?: string
    placeholder?: string
    error?: string
    hint?: string
  }>(),
  { autocomplete: 'current-password' },
)

const model = defineModel<string>({ default: '' })
const t = useT()
const visible = ref(false)
const errorId = computed(() => `${props.id}-error`)
const hintId = computed(() => `${props.id}-hint`)
const describedBy = computed(() => {
  if (props.error) return errorId.value
  if (props.hint) return hintId.value
  return undefined
})
</script>

<template>
  <div class="space-y-2">
    <Label :for="props.id">{{ props.label }}</Label>
    <div class="relative">
      <Input
        :id="props.id"
        v-model="model"
        :type="visible ? 'text' : 'password'"
        :autocomplete="props.autocomplete"
        :placeholder="props.placeholder"
        class="pe-10"
        :aria-invalid="Boolean(props.error)"
        :aria-describedby="describedBy"
      />
      <button
        type="button"
        :aria-label="t(visible ? 'auth:hidePassword' : 'auth:showPassword')"
        class="absolute end-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" class="size-4" aria-hidden="true" />
        <Eye v-else class="size-4" aria-hidden="true" />
      </button>
    </div>
    <p v-if="props.error" :id="errorId" class="text-xs text-destructive">{{ props.error }}</p>
    <p v-else-if="props.hint" :id="hintId" class="text-xs text-muted-foreground">
      {{ props.hint }}
    </p>
  </div>
</template>
