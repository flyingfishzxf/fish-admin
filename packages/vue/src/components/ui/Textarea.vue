<script setup lang="ts">
import { cn } from '@fish-admin/vue'

const props = withDefaults(
  defineProps<{
    id?: string
    rows?: number
    invalid?: boolean
    placeholder?: string
    describedBy?: string
    class?: string
  }>(),
  { rows: 4, invalid: false },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <textarea
    :id="props.id"
    v-model="model"
    :rows="props.rows"
    :placeholder="props.placeholder"
    :aria-invalid="props.invalid || undefined"
    :aria-describedby="props.describedBy"
    data-slot="textarea"
    :class="
      cn(
        'flex min-h-16 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        props.class,
      )
    "
  />
</template>
