import { useEffect, useRef, useState } from 'react'

import { ProForm, type ProFormField, type ProFormRule, type ProFormValues } from '@fish-admin/react'

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

export default function ProFormBasic() {
  const [values, setValues] = useState<ProFormValues | null>(null)
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer)
      timers.current = []
    },
    [],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <ProForm
        fields={FIELDS}
        onSubmit={async (next) => {
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, 600)
            timers.current.push(timer)
          })
          setValues(next)
        }}
        validateMessage={validateMessage}
        submitLabel="Invite member"
        resetLabel="Discard changes"
        ariaLabel="Invite a workspace member"
      />
      {values ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <p className="fish-demo-label" style={{ margin: 0 }}>
            Payload passed to <code>onSubmit</code>
          </p>
          <pre
            style={{
              margin: 0,
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '11px',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {JSON.stringify(values, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="fish-demo-muted" style={{ margin: 0 }} role="status">
          Submit to see the values. The promise above keeps the button in its loading state for a
          moment, exactly as a real request would.
        </p>
      )}
    </div>
  )
}
