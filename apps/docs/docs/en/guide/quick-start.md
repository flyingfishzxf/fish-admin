---
title: Quick start
description: Build a first screen with Button, Card and UIProvider.
---

# Quick start

This page builds a small screen with the package's components and no business dependencies.

## A first screen

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle, UIProvider } from '@fish-admin/react'
import '@fish-admin/react/styles.css'

export function ProjectCard() {
  return (
    <UIProvider locale="en" theme="light">
      <Card>
        <CardHeader>
          <CardTitle>Quarterly report</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Last updated 12 minutes ago.</p>
          <Button>Open report</Button>
          <Button variant="ghost">Dismiss</Button>
        </CardContent>
      </Card>
    </UIProvider>
  )
}
```

Three rules keep the first screen predictable:

1. Import the stylesheet once, at the application entry.
2. Keep one `UIProvider` around the component tree; it supplies locale, theme and UI copy.
3. Compose layout with your own CSS or Tailwind. The package ships component styles, not a page
   layout system.

## Add a data table

`ProTable` takes a TanStack Table instance, so the data and column definitions stay in your code:

```tsx
import { ProTable } from '@fish-admin/react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

<ProTable table={table} empty={<p>No rows</p>} />
```

The template's `/users` screen is the full version: server-shaped pagination, row selection,
column visibility and a mock API. Use the "Used in the template" link on the ProTable page to open
it.

## Where to go next

- [Theming](/guide/theming) explains the token contract.
- [Components](/components) lists all 83 exports.
- [Template](/template) documents the application that consumes the library.

**Client-side permission checks are a UX layer, not a security boundary.** The template hides
controls based on the signed-in role; your API must still authorize every request.
