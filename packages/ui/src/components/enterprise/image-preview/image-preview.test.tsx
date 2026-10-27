import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { ImagePreview } from './image-preview'

const images = [
  { src: 'a.png', alt: 'Alpha', caption: 'First' },
  { src: 'b.png', alt: 'Beta', caption: 'Second' },
]

describe('ImagePreview', () => {
  beforeEach(async () => {})

  it('opens a lightbox, steps through images and closes on Escape', async () => {
    const user = userEvent.setup()
    render(<ImagePreview images={images} ariaLabel="Screenshots" />)

    await user.click(screen.getByRole('button', { name: 'Screenshots: Alpha — First' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('First')).toBeInTheDocument()
    expect(within(dialog).getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next|下一/i }))
    expect(within(dialog).getByText('Second')).toBeInTheDocument()
    expect(within(dialog).getByText('2 / 2')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an empty state without images', () => {
    render(<ImagePreview images={[]} ariaLabel="Screenshots" />)

    expect(screen.getByText(/no data|暂无数据/i)).toBeInTheDocument()
  })
})
