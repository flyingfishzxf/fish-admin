import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

export type TourStep = {
  target: () => HTMLElement | null
  title: string
  description?: string
  placement?: TourPlacement
}

export type TourLabels = {
  next: string
  previous: string
  skip: string
  finish: string
  step: (current: number, total: number) => string
}

type TargetRect = { top: number; left: number; width: number; height: number }

const POPOVER_WIDTH = 320
const POPOVER_HEIGHT = 190
const GAP = 12
const EDGE = 8

export function Tour({
  steps,
  open,
  onOpenChange,
  onFinish,
  labels,
}: {
  steps: TourStep[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onFinish?: () => void
  labels: TourLabels
}) {
  const [index, setIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    }
  }, [open, onOpenChange])

  const step = steps[index]

  useLayoutEffect(() => {
    if (!open) return

    function update() {
      const target = step?.target() ?? null
      if (!target) {
        setTargetRect(null)
        setPosition({
          top: Math.max(EDGE, window.innerHeight / 2 - POPOVER_HEIGHT / 2),
          left: Math.max(EDGE, window.innerWidth / 2 - POPOVER_WIDTH / 2),
        })
        return
      }

      const rect = target.getBoundingClientRect()
      const placement = step?.placement ?? 'bottom'
      let top = rect.bottom + GAP
      let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2

      if (placement === 'top') top = rect.top - GAP - POPOVER_HEIGHT
      if (placement === 'left') {
        top = rect.top
        left = rect.left - GAP - POPOVER_WIDTH
      }
      if (placement === 'right') {
        top = rect.top
        left = rect.right + GAP
      }

      const nextTarget = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      const nextPosition = {
        top: Math.min(Math.max(EDGE, top), window.innerHeight - POPOVER_HEIGHT - EDGE),
        left: Math.min(Math.max(EDGE, left), window.innerWidth - POPOVER_WIDTH - EDGE),
      }
      setTargetRect((current) =>
        current &&
        current.top === nextTarget.top &&
        current.left === nextTarget.left &&
        current.width === nextTarget.width &&
        current.height === nextTarget.height
          ? current
          : nextTarget,
      )
      setPosition((current) =>
        current.top === nextPosition.top && current.left === nextPosition.left
          ? current
          : nextPosition,
      )
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, step])

  useEffect(() => {
    if (open) dialogRef.current?.focus()
  }, [open, index])

  if (!open || !step) return null

  const isLast = index === steps.length - 1

  return createPortal(
    <div data-slot="tour">
      <div
        aria-hidden
        className="fixed inset-0 z-[80] bg-black/45"
        onClick={() => onOpenChange(false)}
      />
      {targetRect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[81] rounded-md ring-2 ring-primary ring-offset-2 ring-offset-background"
          style={{
            top: targetRect.top - 2,
            left: targetRect.left - 2,
            width: targetRect.width + 4,
            height: targetRect.height + 4,
          }}
        />
      ) : null}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed z-[82] w-80 max-w-[calc(100vw-1rem)] rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl outline-none"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {labels.step(index + 1, steps.length)}
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {labels.skip}
          </button>
        </div>
        <h2 id={titleId} className="mt-2 text-sm font-semibold">
          {step.title}
        </h2>
        {step.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
          >
            {labels.previous}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (isLast) {
                onFinish?.()
                onOpenChange(false)
                return
              }
              setIndex((current) => current + 1)
            }}
          >
            {isLast ? labels.finish : labels.next}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
