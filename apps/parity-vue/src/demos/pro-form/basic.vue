<script lang="ts">
export default { name: 'ProFormBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { ProForm, type ProFormField, type ProFormRule, type ProFormValues } from '@fish-admin/vue'

const FIELDS: ProFormField[] = [
  {
    name: 'fullName',
    label: 'Member name',
    required: true,
    minLength: 2,
    placeholder: 'Ada Lovelace',
  },
  {
    name: 'email',
    label: 'Work email',
    type: 'email',
    required: true,
    placeholder: 'ada@acme.dev',
  },
  {
    name: 'team',
    label: 'Team',
    type: 'select',
    required: true,
    placeholder: 'Select a team',
    options: [
      { value: 'engineering', label: 'Engineering' },
      { value: 'design', label: 'Design' },
      { value: 'operations', label: 'Operations' },
    ],
  },
  {
    name: 'startDate',
    label: 'Start date',
    type: 'date',
    description: 'Used to schedule the onboarding digest.',
  },
  {
    name: 'notes',
    label: 'Access notes',
    type: 'textarea',
    colSpan: 2,
    maxLength: 240,
    placeholder: 'Why this person needs production access.',
  },
  {
    name: 'alerts',
    label: 'Send alert emails',
    type: 'switch',
    defaultValue: true,
    description: 'Switches to an on/off value, never a string.',
  },
]

const RULE_MESSAGES: Record<ProFormRule, (label: string, limit?: number) => string> = {
  required: (label) => `${label} is required.`,
  email: (label) => `${label} must be a valid email address.`,
  number: (label) => `${label} must be a number.`,
  min: (label, limit) => `${label} must be at least ${limit}.`,
  max: (label, limit) => `${label} must be ${limit} or lower.`,
  minLength: (label, limit) => `${label} needs at least ${limit} characters.`,
  maxLength: (label, limit) => `${label} can be at most ${limit} characters.`,
}

const validateMessage = (rule: ProFormRule, label: string, limit?: number) =>
  RULE_MESSAGES[rule](label, limit)

const values = ref<ProFormValues | null>(null)

async function onSubmit(next: ProFormValues) {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 600))
  values.value = next
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%">
    <ProForm
      :fields="FIELDS"
      :validate-message="validateMessage"
      submit-label="Invite member"
      reset-label="Discard changes"
      aria-label="Invite a workspace member"
      @submit="onSubmit"
    />
    <div v-if="values" style="display: flex; flex-direction: column; gap: 0.25rem">
      <p class="fish-demo-label" style="margin: 0">
        Payload passed to the submit handler
      </p>
      <pre
        style="
          margin: 0;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 11px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        "
      >{{ JSON.stringify(values, null, 2) }}</pre>
    </div>
    <p v-else class="fish-demo-muted" style="margin: 0" role="status">
      Submit to see the values. The async handler keeps the button in its loading state for a
      moment, exactly as a real request would.
    </p>
  </div>
</template>
