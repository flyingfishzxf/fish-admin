import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '../../ui/button'
import { Result } from './result'

describe('Result', () => {
  it('renders the title, description and extra actions for a success', () => {
    render(
      <Result
        status="success"
        title="Invitations sent"
        description="Three teammates were invited to the Platform workspace."
        extra={
          <Button size="sm" variant="outline">
            Invite more
          </Button>
        }
      />,
    )

    const result = screen.getByRole('status')

    expect(
      within(result).getByRole('heading', { level: 2, name: 'Invitations sent' }),
    ).toBeVisible()
    expect(result).toHaveTextContent('Three teammates were invited to the Platform workspace.')
    expect(within(result).getByRole('button', { name: 'Invite more' })).toBeVisible()
    expect(result.querySelector('svg')).not.toBeNull()
  })

  it('announces an error result and omits optional content when it is not provided', () => {
    render(<Result status="error" title="Payment failed" />)

    const result = screen.getByRole('alert')

    expect(within(result).getByRole('heading', { level: 2, name: 'Payment failed' })).toBeVisible()
    expect(within(result).queryByRole('button')).not.toBeInTheDocument()
    expect(result.querySelectorAll('h2')).toHaveLength(1)
  })
})
