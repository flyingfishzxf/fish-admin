<script lang="ts">
export default { name: 'FormBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Form, type ProFormField, type ProFormRule, type ProFormValues } from '@fish-admin/vue'

// The Vue `Form` export is the config-driven ProForm; the React demo's
// per-field pattern rule becomes a minLength rule plus a hint description.
const FIELDS: ProFormField[] = [
  {
    name: 'name',
    label: 'Workspace name',
    required: true,
    minLength: 2,
    placeholder: 'Acme Operations',
    description: 'Shown in the workspace switcher.',
  },
  {
    name: 'slug',
    label: 'URL slug',
    required: true,
    minLength: 2,
    placeholder: 'acme-ops',
    description: 'Lowercase letters, numbers and hyphens only; used in acme.dev/<slug>.',
  },
]

const RULE_MESSAGES: Record<ProFormRule, (label: string, limit?: number) => string> = {
  required: (label) => `Enter a ${label.toLowerCase()}.`,
  email: (label) => `${label} must be a valid email address.`,
  number: (label) => `${label} must be a number.`,
  min: (label, limit) => `${label} must be at least ${limit}.`,
  max: (label, limit) => `${label} must be ${limit} or lower.`,
  minLength: (label, limit) => `${label} needs at least ${limit} characters.`,
  maxLength: (label, limit) => `${label} can be at most ${limit} characters.`,
}

const validateMessage = (rule: ProFormRule, label: string, limit?: number) =>
  RULE_MESSAGES[rule](label, limit)

const saved = ref('')

function onSubmit(values: ProFormValues) {
  saved.value = `Saved ${values.name} with the slug "${values.slug}".`
}
</script>

<template>
  <Form
    :fields="FIELDS"
    :validate-message="validateMessage"
    submit-label="Create workspace"
    aria-label="Create a workspace"
    @submit="onSubmit"
  />
  <div class="fish-demo-row">
    <p class="fish-demo-muted" role="status" style="margin: 0">
      {{ saved || 'Submit with empty fields to see the validation messages.' }}
    </p>
  </div>
</template>
