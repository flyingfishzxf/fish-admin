import { useState } from 'react'

import { ProForm, type ProFormField, type ProFormRule, type ProFormValues } from '@fish-admin/react'

const FIELDS: ProFormField[] = [
  { name: 'workspace', label: 'Workspace key', required: true, minLength: 4, maxLength: 24 },
  { name: 'seats', label: 'Seat limit', type: 'number', required: true, min: 1, max: 12 },
  {
    name: 'region',
    label: 'Hosting region',
    type: 'select',
    required: true,
    placeholder: 'Select a region',
    options: [
      { value: 'eu', label: 'Europe (Frankfurt)' },
      { value: 'us', label: 'United States (Oregon)' },
      { value: 'apac', label: 'Asia Pacific (Tokyo)' },
    ],
  },
  { name: 'billingEmail', label: 'Billing contact', type: 'email' },
  {
    name: 'signingSecret',
    label: 'Signing secret',
    type: 'password',
    required: true,
    minLength: 8,
    description: 'At least 8 characters; browsers never autofill this field.',
  },
]

const RULE_MESSAGES: Record<ProFormRule, (label: string, limit?: number) => string> = {
  required: (label) => `${label} is required`,
  email: (label) => `${label} is not a valid address`,
  number: (label) => `${label} must be numeric`,
  min: (label, limit) => `${label} must be ${limit} or higher`,
  max: (label, limit) => `${label} cannot exceed ${limit}`,
  minLength: (label, limit) => `${label} needs ${limit}+ characters`,
  maxLength: (label, limit) => `${label} is limited to ${limit} characters`,
}

const validateMessage = (rule: ProFormRule, label: string, limit?: number) =>
  RULE_MESSAGES[rule](label, limit)

export default function ProFormValidation() {
  const [values, setValues] = useState<ProFormValues | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <ProForm
        fields={FIELDS}
        onSubmit={setValues}
        validateMessage={validateMessage}
        submitLabel="Save integration"
        ariaLabel="Integration credentials"
      />
      <p className="fish-demo-muted" style={{ margin: 0 }} role="status">
        {values
          ? `Saved: seats ${values.seats}, region ${values.region}.`
          : 'Submit the empty form to see every rule report through the same message builder.'}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        <code>validateMessage</code> receives the rule name, the field label and, for numeric and
        length rules, the limit — so copy stays in one object instead of one string per field.
      </p>
    </div>
  )
}
