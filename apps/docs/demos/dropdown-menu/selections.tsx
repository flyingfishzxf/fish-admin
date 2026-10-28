import { useState } from 'react'

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@fish-admin/react'
import { Link2, Mail, Settings2 } from 'lucide-react'

export default function DropdownMenuSelections() {
  const [gridLines, setGridLines] = useState(true)
  const [inlineHints, setInlineHints] = useState(false)
  const [density, setDensity] = useState('comfortable')
  const [shareStatus, setShareStatus] = useState('Nothing shared yet')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 />
              View options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" style={{ minWidth: '13rem' }}>
            <DropdownMenuLabel>Show</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={gridLines}
              onCheckedChange={(checked) => setGridLines(checked === true)}
            >
              Grid lines
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={inlineHints}
              onCheckedChange={(checked) => setInlineHints(checked === true)}
            >
              Inline hints
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Density</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
              <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => setShareStatus('Link copied')}>
                  <Link2 />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setShareStatus('Email draft created')}>
                  <Mail />
                  Send by email
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="fish-demo-muted">
        Density: {density} · Grid lines: {gridLines ? 'on' : 'off'} · Inline hints:{' '}
        {inlineHints ? 'on' : 'off'}
      </p>
      <p className="fish-demo-muted">Share: {shareStatus}</p>
    </div>
  )
}
