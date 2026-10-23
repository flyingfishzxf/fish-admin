import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface StepperStep {
  id: string
  title: string
  description?: string
}

export function Stepper({
  steps,
  current,
  onStepClick,
  ariaLabel,
  className,
}: {
  steps: StepperStep[]
  current: number
  onStepClick?: (index: number) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <ol
      aria-label={ariaLabel}
      className={cn('flex flex-col gap-4 sm:flex-row sm:gap-0', className)}
    >
      {steps.map((step, index) => {
        const state = index < current ? 'complete' : index === current ? 'current' : 'upcoming'
        const content = (
          <>
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                state === 'complete' && 'border-primary bg-primary text-primary-foreground',
                state === 'current' && 'border-primary text-primary',
                state === 'upcoming' && 'border-border text-muted-foreground',
              )}
            >
              {state === 'complete' ? <Check className="size-4" /> : index + 1}
            </span>
            <span className="min-w-0 space-y-0.5">
              <span
                className={cn(
                  'block text-sm font-medium',
                  state === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {step.title}
              </span>
              {step.description ? (
                <span className="block text-xs text-muted-foreground">{step.description}</span>
              ) : null}
            </span>
          </>
        )

        return (
          <li
            key={step.id}
            aria-current={state === 'current' ? 'step' : undefined}
            className="relative flex flex-1 items-start gap-3"
          >
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-4 right-2 left-8 hidden h-px bg-border sm:block"
              />
            ) : null}
            {onStepClick && index <= current ? (
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className="relative z-10 flex flex-1 items-start gap-3 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {content}
              </button>
            ) : (
              <div className="relative z-10 flex flex-1 items-start gap-3">{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
