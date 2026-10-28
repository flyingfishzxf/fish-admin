import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'

import { Button } from '../../ui/button'
import { cn } from '../../../lib/utils'

export type CarouselSlide = {
  id: string
  title?: string
  description?: string
  image?: string
  alt?: string
  content?: ReactNode
}

export function Carousel({
  slides,
  ariaLabel,
  previousLabel,
  nextLabel,
  goToLabel,
  emptyLabel,
  className,
}: {
  /** Slides in order; an empty array renders the empty state instead. */
  slides: CarouselSlide[]
  /** Accessible name for the carousel region. */
  ariaLabel: string
  /** Accessible name for the previous-slide button. */
  previousLabel: string
  /** Accessible name for the next-slide button. */
  nextLabel: string
  /** Builds the accessible name of a dot, given its 1-based position. */
  goToLabel: (index: number) => string
  /** Copy for the box shown when slides is empty. */
  emptyLabel?: string
  className?: string
}) {
  const [index, setIndex] = useState(0)

  if (slides.length === 0) {
    return (
      <div
        data-slot="carousel-empty"
        className={cn(
          'rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground',
          className,
        )}
      >
        {emptyLabel}
      </div>
    )
  }

  const activeIndex = Math.min(index, slides.length - 1)

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo(activeIndex - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo(activeIndex + 1)
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the focusable region adds arrow-key paging on top of the slide controls
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      data-slot="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      <div className="overflow-hidden rounded-lg border bg-muted/20">
        <div
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} / ${slides.length}`}
              aria-hidden={slideIndex !== activeIndex}
              inert={slideIndex !== activeIndex}
              className="relative min-w-full shrink-0"
            >
              {slide.content ?? (
                <>
                  {slide.image ? (
                    <img
                      src={slide.image}
                      alt={slide.alt ?? ''}
                      className="aspect-[16/7] w-full object-cover"
                    />
                  ) : null}
                  {slide.title || slide.description ? (
                    <div
                      className={cn(
                        'space-y-1 p-4',
                        slide.image &&
                          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-12 py-4 text-white',
                      )}
                    >
                      {slide.title ? <p className="text-sm font-semibold">{slide.title}</p> : null}
                      {slide.description ? (
                        <p className="text-xs opacity-90">{slide.description}</p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            aria-label={previousLabel}
            onClick={() => goTo(activeIndex - 1)}
            className="absolute top-1/2 left-2 -translate-y-1/2 shadow-sm"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            aria-label={nextLabel}
            onClick={() => goTo(activeIndex + 1)}
            className="absolute top-1/2 right-2 -translate-y-1/2 shadow-sm"
          >
            <ChevronRight aria-hidden className="size-4" />
          </Button>
          <div className="mt-2 flex justify-center gap-1.5" role="group">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={goToLabel(slideIndex + 1)}
                aria-current={slideIndex === activeIndex ? 'true' : undefined}
                onClick={() => goTo(slideIndex)}
                className={cn(
                  'h-1.5 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  slideIndex === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30',
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
