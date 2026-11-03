import { act, fireEvent, render, screen } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Toaster } from './sonner'

function ToastHarness({ toasterId, duration = 2000 }: { toasterId: string; duration?: number }) {
  return (
    <>
      <button
        type="button"
        onClick={() =>
          toast.success('Changes saved', {
            toasterId,
            duration,
            description: 'Draft v4 is now the published version.',
          })
        }
      >
        Save changes
      </button>
      <Toaster id={toasterId} />
    </>
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Toaster', () => {
  it('renders the message pushed through toast()', () => {
    vi.useFakeTimers()
    try {
      render(<ToastHarness toasterId="toast-render" />)

      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
      act(() => vi.advanceTimersByTime(50))

      expect(screen.getByText('Changes saved')).toBeVisible()
      expect(screen.getByText('Draft v4 is now the published version.')).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('removes the toast once its duration elapses', () => {
    vi.useFakeTimers()
    try {
      render(<ToastHarness toasterId="toast-expiry" duration={2000} />)

      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
      act(() => vi.advanceTimersByTime(50))
      expect(screen.getByText('Changes saved')).toBeVisible()

      act(() => vi.advanceTimersByTime(1900))
      expect(screen.getByText('Changes saved')).toBeVisible()

      act(() => vi.advanceTimersByTime(600))
      expect(screen.queryByText('Changes saved')).not.toBeInTheDocument()
      expect(screen.queryByText('Draft v4 is now the published version.')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
