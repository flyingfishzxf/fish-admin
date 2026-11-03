import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from './avatar'

describe('Avatar', () => {
  it('shows the initials fallback with an accessible name while the image loads', () => {
    render(
      <Avatar role="img" aria-label="Ada Lovelace profile">
        <AvatarImage src="/avatars/ada.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    )

    const avatar = screen.getByRole('img', { name: 'Ada Lovelace profile' })

    expect(avatar).toHaveAttribute('data-slot', 'avatar')
    expect(avatar).toHaveTextContent('AL')
    expect(screen.queryByRole('img', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
  })

  it('replaces the image with the initials fallback when it fails to load', () => {
    // jsdom never loads images, and Radix Avatar renders the <img> only after its
    // preloader reports success. Replace window.Image with a preloader that reports a
    // completed image so the rendered <img> exists before we dispatch the error.
    const originalImage = window.Image
    const preloaders: HTMLImageElement[] = []

    function FakeImage() {
      const image = document.createElement('img')
      Object.defineProperties(image, {
        complete: { configurable: true, get: () => true },
        naturalWidth: { configurable: true, get: () => 128 },
      })
      preloaders.push(image)
      return image
    }

    Object.defineProperty(window, 'Image', { configurable: true, writable: true, value: FakeImage })

    try {
      const onLoadingStatusChange = vi.fn()
      render(
        <Avatar role="img" aria-label="Ada Lovelace profile">
          <AvatarImage
            src="/avatars/ada.png"
            alt="Ada Lovelace"
            onLoadingStatusChange={onLoadingStatusChange}
          />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>,
      )

      expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument()
      expect(screen.queryByText('AL')).not.toBeInTheDocument()
      expect(preloaders).toHaveLength(1)

      fireEvent.error(preloaders[0])

      expect(onLoadingStatusChange).toHaveBeenLastCalledWith('error')
      expect(screen.getByText('AL')).toBeVisible()
      expect(screen.queryByRole('img', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
    } finally {
      Object.defineProperty(window, 'Image', {
        configurable: true,
        writable: true,
        value: originalImage,
      })
    }
  })

  it('labels a presence badge only when aria-label is provided', () => {
    render(
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
        <AvatarBadge aria-label="Online" />
      </Avatar>,
    )

    expect(screen.getByRole('img', { name: 'Online' })).toHaveAttribute('data-slot', 'avatar-badge')
  })
})
