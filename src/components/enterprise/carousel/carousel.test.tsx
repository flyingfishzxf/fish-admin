import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Carousel, type CarouselSlide } from '@/components/enterprise/carousel/carousel'

const slides: CarouselSlide[] = [
  { id: 'one', title: 'First', description: 'First slide' },
  { id: 'two', title: 'Second', description: 'Second slide' },
  { id: 'three', title: 'Third', description: 'Third slide' },
]

function renderCarousel() {
  return render(
    <Carousel
      slides={slides}
      ariaLabel="Release highlights"
      previousLabel="Previous slide"
      nextLabel="Next slide"
      goToLabel={(index) => `Go to slide ${index}`}
    />,
  )
}

describe('Carousel', () => {
  it('moves between slides with the controls', async () => {
    const user = userEvent.setup()
    renderCarousel()

    expect(screen.getByRole('group', { name: '1 / 3' })).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(screen.getByRole('group', { name: '2 / 3' })).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Go to slide 3' }))
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('wraps around and supports arrow keys', async () => {
    const user = userEvent.setup()
    renderCarousel()
    const carousel = screen.getByRole('region', { name: 'Release highlights' })

    await user.click(screen.getByRole('button', { name: 'Previous slide' }))
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    carousel.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('renders an empty state when there are no slides', () => {
    render(
      <Carousel
        slides={[]}
        ariaLabel="Release highlights"
        previousLabel="Previous slide"
        nextLabel="Next slide"
        goToLabel={(index) => `Go to slide ${index}`}
        emptyLabel="No slides"
      />,
    )

    expect(screen.getByText('No slides')).toBeInTheDocument()
  })
})
