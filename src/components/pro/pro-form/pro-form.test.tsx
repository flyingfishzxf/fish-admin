import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  ProForm,
  type ProFormField,
  type ProFormRule,
  type ProFormValues,
} from '@/components/pro/pro-form/pro-form'

const fields: ProFormField[] = [
  { name: 'name', label: 'Full name', required: true, minLength: 3 },
  { name: 'email', label: 'Work email', type: 'email', required: true },
  {
    name: 'team',
    label: 'Team',
    type: 'select',
    required: true,
    options: [
      { value: 'engineering', label: 'Engineering' },
      { value: 'design', label: 'Design' },
    ],
  },
  { name: 'score', label: 'Score', type: 'number', min: 1, max: 10 },
  { name: 'bio', label: 'Bio', type: 'textarea', colSpan: 2 },
  { name: 'alerts', label: 'Email alerts', type: 'switch', defaultValue: true },
]

const validateMessage = (rule: ProFormRule, label: string, limit?: number) =>
  `${label} ${rule}${limit === undefined ? '' : ` ${limit}`}`

function renderForm(onSubmit = vi.fn<(values: ProFormValues) => void>()) {
  render(
    <ProForm
      fields={fields}
      onSubmit={onSubmit}
      validateMessage={validateMessage}
      submitLabel="Create member"
      resetLabel="Reset"
      ariaLabel="Create member"
    />,
  )

  return onSubmit
}

describe('ProForm', () => {
  it('blocks submission and reports every required field', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole('button', { name: 'Create member' }))

    expect(await screen.findByText('Full name required')).toBeInTheDocument()
    expect(await screen.findByText('Work email required')).toBeInTheDocument()
    expect(await screen.findByText('Team required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('validates length, email shape and numeric range', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.type(screen.getByLabelText('Full name'), 'Al')
    await user.type(screen.getByLabelText('Work email'), 'not-an-email')
    await user.type(screen.getByLabelText('Score'), '11')
    await user.click(screen.getByRole('button', { name: 'Create member' }))

    expect(await screen.findByText('Full name minLength 3')).toBeInTheDocument()
    expect(await screen.findByText('Work email email')).toBeInTheDocument()
    expect(await screen.findByText('Score max 10')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits typed values, select option and switch state', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace')
    await user.type(screen.getByLabelText('Work email'), 'ada@example.com')
    await user.click(screen.getByRole('combobox', { name: 'Team' }))
    await user.click(await screen.findByRole('option', { name: 'Design' }))
    await user.type(screen.getByLabelText('Score'), '8')
    await user.type(screen.getByLabelText('Bio'), 'First programmer')
    await user.click(screen.getByRole('switch', { name: 'Email alerts' }))
    await user.click(screen.getByRole('button', { name: 'Create member' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        team: 'design',
        score: 8,
        bio: 'First programmer',
        alerts: false,
      }),
    )
  })

  it('resets fields to their initial values', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Full name'), 'Grace Hopper')
    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByLabelText('Full name')).toHaveValue('')
    expect(screen.getByRole('switch', { name: 'Email alerts' })).toBeChecked()
  })
})
