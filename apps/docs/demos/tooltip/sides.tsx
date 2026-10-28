import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@fish-admin/react'

const sides = [
  { side: 'top', label: 'Top', hint: 'Opens above the trigger' },
  { side: 'right', label: 'Right', hint: 'Opens to the right of the trigger' },
  { side: 'bottom', label: 'Bottom', hint: 'Opens below the trigger' },
  { side: 'left', label: 'Left', hint: 'Opens to the left of the trigger' },
] as const

export default function TooltipSides() {
  return (
    <TooltipProvider>
      <div className="fish-demo-stack">
        <div className="fish-demo-row">
          {sides.map((entry) => (
            <Tooltip key={entry.side}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  {entry.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={entry.side}>{entry.hint}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <p className="fish-demo-muted">
          Each trigger sets its own <code>side</code>; the arrow follows automatically.
        </p>
      </div>
    </TooltipProvider>
  )
}
