import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Alert, AlertDescription, AlertTitle } from './alert'

describe('Alert', () => {
  it('announces its title and description as an alert', () => {
    render(
      <Alert>
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>The file exceeds the 10 MB limit.</AlertDescription>
      </Alert>,
    )

    const alert = screen.getByRole('alert')

    expect(alert).toHaveAttribute('data-slot', 'alert')
    expect(within(alert).getByText('Upload failed')).toHaveAttribute('data-slot', 'alert-title')
    expect(within(alert).getByText('The file exceeds the 10 MB limit.')).toHaveAttribute(
      'data-slot',
      'alert-description',
    )
  })

  it('marks the destructive variant with destructive text', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>Try again with a smaller file.</AlertDescription>
      </Alert>,
    )

    expect(screen.getByRole('alert')).toHaveClass('text-destructive')
  })
})
