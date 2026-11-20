<script lang="ts">
export default { name: 'FormFields' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Form, type ProFormField, type ProFormRule } from '@fish-admin/vue'

const FIELDS: ProFormField[] = [
  {
    name: 'role',
    label: 'Access role',
    type: 'select',
    required: true,
    placeholder: 'Select a role',
    options: [
      { value: 'viewer', label: 'Viewer' },
      { value: 'member', label: 'Member' },
      { value: 'admin', label: 'Admin' },
    ],
    description: 'Admins can manage members and billing.',
  },
  {
    name: 'notify',
    label: 'Email the invitee a setup link',
    type: 'switch',
    defaultValue: true,
  },
]

const RULE_MESSAGES: Record<ProFormRule, (label: string, limit?: number) => string> = {
  required: () => `Pick an access role.`,
  email: (label) => `${label} must be a valid email address.`,
  number: (label) => `${label} must be a number.`,
  min: (label, limit) => `${label} must be at least ${limit}.`,
  max: (label, limit) => `${label} must be ${limit} or lower.`,
  minLength: (label, limit) => `${label} needs at least ${limit} characters.`,
  maxLength: (label, limit) => `${label} can be at most ${limit} characters.`,
}

const validateMessage = (rule: ProFormRule, label: string, limit?: number) =>
  RULE_MESSAGES[rule](label, limit)

const result = ref('')

function onSubmit(values: Record<string, unknown>) {
  result.value = `Invite ready: ${values.role} role, setup email ${values.notify ? 'included' : 'skipped'}.`
}
</script>

<template>
  <Form
    :fields="FIELDS"
    :validate-message="validateMessage"
    submit-label="Send invite"
    aria-label="Invite a member"
    @submit="onSubmit"
  />
  <div class="fish-demo-row">
    <p class="fish-demo-muted" role="status" style="margin: 0">
      {{ result || 'Submit without a role to see the select validation.' }}
    </p>
  </div>
</template>
