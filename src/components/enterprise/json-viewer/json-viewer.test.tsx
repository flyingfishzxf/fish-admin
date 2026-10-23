import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JsonViewer } from '@/components/enterprise/json-viewer/json-viewer'
import { i18nReady } from '@/lib/i18n'

describe('JsonViewer', () => {
  beforeEach(async () => {
    await i18nReady
  })

  it('renders nested keys and collapses a branch', async () => {
    const user = userEvent.setup()
    render(<JsonViewer value={{ user: { name: 'Ada' } }} ariaLabel="Payload" />)

    expect(screen.getByText('user:')).toBeInTheDocument()
    expect(screen.getByText('name:')).toBeInTheDocument()
    expect(screen.getByText('"Ada"')).toBeInTheDocument()

    const rootToggle = screen.getAllByRole('button', { expanded: true })[0]!
    await user.click(rootToggle)

    expect(screen.queryByText('"Ada"')).not.toBeInTheDocument()
  })

  it('copies the formatted JSON', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<JsonViewer value={{ active: true }} ariaLabel="Payload" />)

    await user.click(screen.getByRole('button', { name: /copy|复制/i }))

    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ active: true }, null, 2))
  })

  it('shows an empty state for undefined values', () => {
    render(<JsonViewer value={undefined} ariaLabel="Payload" />)

    expect(screen.getByText(/no data|暂无数据/i)).toBeInTheDocument()
  })
})
