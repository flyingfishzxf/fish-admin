import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useUITranslation } from '../../../i18n'

import { Button } from '../../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../ui/dialog'
import { cn } from '../../../lib/utils'

export type PreviewImage = {
  src: string
  alt: string
  caption?: string
}

export function ImagePreview({
  images,
  ariaLabel,
  className,
}: {
  /** Thumbnails in display order; an empty array renders the "No data" line. */
  images: PreviewImage[]
  /** Accessible name of the dialog and prefix of every thumbnail name. */
  ariaLabel: string
  /** Extra classes for the thumbnail grid. */
  className?: string
}) {
  const { t } = useUITranslation()
  const [index, setIndex] = useState<number | null>(null)
  const current = index === null ? undefined : images[index]

  const step = (delta: number) => {
    setIndex((value) => {
      if (value === null || images.length === 0) return value
      return (value + delta + images.length) % images.length
    })
  }

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('enterprise.noData')}</p>
  }

  return (
    <div
      data-slot="image-preview"
      className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)}
    >
      {images.map((image, imageIndex) => (
        <button
          key={`${image.src}-${imageIndex}`}
          type="button"
          aria-label={`${ariaLabel}: ${image.alt}${image.caption ? ` — ${image.caption}` : ''}`}
          onClick={() => setIndex(imageIndex)}
          className="group relative aspect-4/3 overflow-hidden rounded-lg border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {image.caption ? (
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-left text-xs text-white">
              {image.caption}
            </span>
          ) : null}
        </button>
      ))}

      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent
          className="max-w-3xl p-3 sm:p-4"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              step(-1)
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              step(1)
            }
          }}
        >
          <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
          {current ? (
            <figure className="space-y-2">
              <img
                src={current.src}
                alt={current.alt}
                className="max-h-[70vh] w-full rounded-md object-contain"
              />
              <figcaption className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>{current.caption ?? current.alt}</span>
                {images.length > 1 ? (
                  <span className="text-xs tabular-nums">
                    {(index ?? 0) + 1} / {images.length}
                  </span>
                ) : null}
              </figcaption>
              <DialogDescription className="sr-only">{current.alt}</DialogDescription>
            </figure>
          ) : null}
          {images.length > 1 ? (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t('actions.previous')}
                onClick={() => step(-1)}
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t('actions.next')}
                onClick={() => step(1)}
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
