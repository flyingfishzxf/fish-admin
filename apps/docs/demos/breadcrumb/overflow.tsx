import { useState } from 'react'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@fish-admin/react'

export default function BreadcrumbOverflow() {
  const [opened, setOpened] = useState('No hidden folder opened yet')

  return (
    <div className="fish-demo-stack">
      <Breadcrumb aria-label="File path">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#files" onClick={(event) => event.preventDefault()}>
              Files
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Show hidden folders">
                  <BreadcrumbEllipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setOpened('Documents')}>
                  Documents
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpened('Images')}>Images</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setOpened('Archive')}>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#design" onClick={(event) => event.preventDefault()}>
              Design
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Q4 report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p className="fish-demo-muted" aria-live="polite">
        {opened}
      </p>
    </div>
  )
}
