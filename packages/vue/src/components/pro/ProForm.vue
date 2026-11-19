<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { reactive, ref } from 'vue'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import Input from '../ui/input/Input.vue'
import Label from '../ui/label/Label.vue'
import Select from '../ui/select/Select.vue'
import SelectContent from '../ui/select/SelectContent.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import SelectTrigger from '../ui/select/SelectTrigger.vue'
import SelectValue from '../ui/select/SelectValue.vue'
import Switch from '../ui/switch/Switch.vue'

export type ProFormFieldType =
  'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'switch' | 'date'

export interface ProFormOption {
  value: string
  label: string
}

export interface ProFormField {
  name: string
  label: string
  type?: ProFormFieldType
  placeholder?: string
  description?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  options?: ProFormOption[]
  defaultValue?: string | number | boolean
  colSpan?: 1 | 2
}

export type ProFormRule =
  'required' | 'email' | 'number' | 'min' | 'max' | 'minLength' | 'maxLength'

export type ProFormValues = Record<string, unknown>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildInitialValues(fields: ProFormField[], defaultValues?: Partial<ProFormValues>) {
  const values: ProFormValues = {}
  for (const field of fields) {
    if (field.type === 'switch') values[field.name] = field.defaultValue === true
    else if (field.type === 'number')
      values[field.name] = typeof field.defaultValue === 'number' ? field.defaultValue : ''
    else values[field.name] = field.defaultValue ?? ''
  }
  return { ...values, ...defaultValues }
}

const props = withDefaults(
  defineProps<{
    fields: ProFormField[]
    defaultValues?: Partial<ProFormValues>
    validateMessage: (rule: ProFormRule, label: string, limit?: number) => string
    submitLabel: string
    resetLabel?: string
    loading?: boolean
    ariaLabel?: string
    class?: string
  }>(),
  { loading: false },
)

const emit = defineEmits<{ submit: [values: ProFormValues] }>()

const initial = buildInitialValues(props.fields, props.defaultValues)
const values = reactive<ProFormValues>({ ...initial })
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const busy = () => props.loading || submitting.value

function typeOf(field: ProFormField): ProFormFieldType {
  return field.type ?? 'text'
}

function validateField(field: ProFormField) {
  const type = typeOf(field)
  const value = values[field.name]
  const text = value == null ? '' : String(value)

  if (field.required && text.trim() === '') return props.validateMessage('required', field.label)
  if (type === 'email' && text !== '' && !EMAIL_PATTERN.test(text))
    return props.validateMessage('email', field.label)

  if (type === 'number' && text !== '') {
    const parsed = Number(text)
    if (!Number.isFinite(parsed)) return props.validateMessage('number', field.label)
    if (field.min !== undefined && parsed < field.min)
      return props.validateMessage('min', field.label, field.min)
    if (field.max !== undefined && parsed > field.max)
      return props.validateMessage('max', field.label, field.max)
  }

  if (['text', 'email', 'password', 'textarea'].includes(type) && text !== '') {
    if (field.minLength !== undefined && text.length < field.minLength)
      return props.validateMessage('minLength', field.label, field.minLength)
    if (field.maxLength !== undefined && text.length > field.maxLength)
      return props.validateMessage('maxLength', field.label, field.maxLength)
  }

  return undefined
}

async function onSubmit() {
  let valid = true
  for (const field of props.fields) {
    const message = validateField(field)
    if (message) {
      errors[field.name] = message
      valid = false
    } else delete errors[field.name]
  }
  if (!valid) return

  submitting.value = true
  try {
    await emit('submit', { ...values })
  } finally {
    submitting.value = false
  }
}

function reset() {
  Object.assign(values, buildInitialValues(props.fields, props.defaultValues))
  for (const key of Object.keys(errors)) delete errors[key]
}
</script>

<template>
  <form
    novalidate
    :aria-label="props.ariaLabel"
    :aria-busy="busy() || undefined"
    data-slot="pro-form"
    :class="cn('space-y-5', props.class)"
    @submit.prevent="onSubmit"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="field in props.fields"
        :key="field.name"
        class="min-w-0 space-y-2"
        :class="field.colSpan === 2 && 'sm:col-span-2'"
      >
        <Label :for="`pro-form-${field.name}`">{{ field.label }}</Label>

        <textarea
          v-if="typeOf(field) === 'textarea'"
          :id="`pro-form-${field.name}`"
          :value="String(values[field.name] ?? '')"
          :placeholder="field.placeholder"
          :aria-invalid="errors[field.name] ? true : undefined"
          class="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          @input="values[field.name] = ($event.target as HTMLTextAreaElement).value"
        ></textarea>

        <Select
          v-else-if="typeOf(field) === 'select'"
          :model-value="String(values[field.name] ?? '')"
          @update:model-value="values[field.name] = $event"
        >
          <SelectTrigger :id="`pro-form-${field.name}`" :aria-label="field.label" class="w-full">
            <SelectValue :placeholder="field.placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in field.options ?? []"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Switch
          v-else-if="typeOf(field) === 'switch'"
          :id="`pro-form-${field.name}`"
          :model-value="values[field.name] === true"
          @update:model-value="values[field.name] = $event"
        />

        <Input
          v-else
          :id="`pro-form-${field.name}`"
          :type="
            typeOf(field) === 'password'
              ? 'password'
              : typeOf(field) === 'number' || typeOf(field) === 'date'
                ? typeOf(field)
                : 'text'
          "
          :value="String(values[field.name] ?? '')"
          :placeholder="field.placeholder"
          :aria-invalid="errors[field.name] ? true : undefined"
          @input="values[field.name] = ($event.target as HTMLInputElement).value"
        />
        <p v-if="errors[field.name]" class="text-xs text-destructive">{{ errors[field.name] }}</p>
        <p v-else-if="field.description" class="text-xs text-muted-foreground">
          {{ field.description }}
        </p>
      </div>
    </div>

    <div class="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
      <Button
        v-if="props.resetLabel"
        type="button"
        variant="outline"
        :disabled="busy()"
        @click="reset"
      >
        {{ props.resetLabel }}
      </Button>
      <Button type="submit" :disabled="busy()">
        <Loader2 v-if="busy()" aria-hidden="true" class="animate-spin" />
        {{ props.submitLabel }}
      </Button>
    </div>
  </form>
</template>
