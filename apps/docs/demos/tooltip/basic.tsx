import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@fish-admin/react'
import { Settings2 } from 'lucide-react'

export default function TooltipBasic() {
  return (
    <TooltipProvider>
      <div className="fish-demo-stack">
        <div className="fish-demo-row">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                Copy invite link
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy the invite link to your clipboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Invite settings">
                <Settings2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Invite settings</TooltipContent>
          </Tooltip>
        </div>
        <p className="fish-demo-muted">
          Hover a trigger, or focus it with the keyboard, to open the tooltip.
        </p>
      </div>
    </TooltipProvider>
  )
}
