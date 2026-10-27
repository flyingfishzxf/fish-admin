import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Button } from '../ui/button'

export function SortableHeader({
  label,
  direction,
  onToggle,
}: {
  label: string
  direction: false | 'asc' | 'desc'
  onToggle: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 gap-1 px-2 text-[11px] font-semibold tracking-wide uppercase"
      onClick={onToggle}
    >
      {label}
      {direction === 'asc' ? (
        <ArrowUp className="size-3.5" />
      ) : direction === 'desc' ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" />
      )}
    </Button>
  )
}
