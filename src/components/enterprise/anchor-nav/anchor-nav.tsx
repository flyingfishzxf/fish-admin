import { useEffect, useState, type RefObject } from 'react'

import { cn } from '@/lib/utils'

export type AnchorItem = {
  id: string
  label: string
}

export function AnchorNav({
  items,
  ariaLabel,
  rootRef,
  offset = 88,
  className,
}: {
  items: AnchorItem[]
  ariaLabel: string
  rootRef?: RefObject<HTMLElement | null>
  offset?: number
  className?: string
}) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id)

  useEffect(() => {
    const root = rootRef?.current

    const update = () => {
      const boundary = (root?.getBoundingClientRect().top ?? 0) + offset
      let current = items[0]?.id

      for (const item of items) {
        const element = document.getElementById(item.id)
        if (!element) continue
        if (element.getBoundingClientRect().top <= boundary) current = item.id
        else break
      }

      setActiveId(current)
    }

    update()
    const target: HTMLElement | Window = root ?? window
    target.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      target.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [items, offset, rootRef])

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (!element) return

    const root = rootRef?.current
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth'

    if (root) {
      const top =
        root.scrollTop +
        element.getBoundingClientRect().top -
        root.getBoundingClientRect().top -
        offset
      root.scrollTo({ top, behavior })
    } else {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - offset,
        behavior,
      })
    }
  }

  return (
    <nav
      data-slot="anchor-nav"
      aria-label={ariaLabel}
      className={cn('flex flex-col border-l', className)}
    >
      {items.map((item) => {
        const active = item.id === activeId

        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'location' : undefined}
            onClick={() => scrollTo(item.id)}
            className={cn(
              '-ml-px border-l-2 border-transparent px-3 py-1.5 text-left text-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50',
              active ? 'border-primary font-medium text-primary' : 'text-muted-foreground',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
