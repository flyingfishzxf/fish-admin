import type { ReactNode } from 'react'
import type { Column, RowData, Table as TableInstance } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'

import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    className?: string
    headerClassName?: string
  }
}

export type DataTableDensity = 'comfortable' | 'compact'

function pinningStyle<TData>(column: Column<TData, unknown>, header = false) {
  const pinned = column.getIsPinned()
  if (!pinned) return undefined

  return {
    position: 'sticky' as const,
    left: pinned === 'left' ? column.getStart('left') : undefined,
    right: pinned === 'right' ? column.getAfter('right') : undefined,
    zIndex: header ? 2 : 1,
  }
}

export function DataTable<TData>({
  table,
  loading = false,
  skeletonRows = 6,
  empty,
  toolbar,
  footer,
  density = 'comfortable',
  rowContextMenu,
}: {
  table: TableInstance<TData>
  loading?: boolean
  skeletonRows?: number
  empty: ReactNode
  toolbar?: ReactNode
  footer?: ReactNode
  density?: DataTableDensity
  rowContextMenu?: (row: TData) => ReactNode
}) {
  const columnCount = table.getVisibleLeafColumns().length
  const cellPadding = density === 'compact' ? 'py-1.5' : 'py-3'
  const headHeight = density === 'compact' ? 'h-9' : 'h-10'

  return (
    <div className="shadow-soft overflow-hidden rounded-2xl border bg-card">
      {toolbar ? <div className="border-b p-4">{toolbar}</div> : null}
      <div className="overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const pinned = header.column.getIsPinned()
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        ...pinningStyle(header.column, true),
                        width: header.getSize(),
                      }}
                      className={cn(
                        'relative bg-muted/35 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase',
                        headHeight,
                        header.column.columnDef.meta?.headerClassName,
                        pinned && 'bg-muted',
                        header.column.getCanResize() && 'border-r last:border-r-0',
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanResize() ? (
                        <button
                          type="button"
                          aria-label={`Resize ${header.column.id}`}
                          tabIndex={-1}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            'absolute inset-y-0 right-0 z-10 w-1.5 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-primary/40',
                            header.column.getIsResizing() && 'bg-primary/60',
                          )}
                        />
                      ) : null}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                  {Array.from({ length: columnCount }).map((__, cellIndex) => (
                    <TableCell key={cellIndex} className="py-3.5">
                      <Skeleton className={cn('h-4', cellIndex === 0 ? 'w-32' : 'w-20')} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const rowNode = (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className={cn(row.getIsSelected() && 'bg-muted/60')}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const pinned = cell.column.getIsPinned()
                      return (
                        <TableCell
                          key={cell.id}
                          style={{
                            ...pinningStyle(cell.column),
                            width: cell.column.getSize(),
                          }}
                          className={cn(
                            cellPadding,
                            cell.column.columnDef.meta?.className,
                            pinned && 'sticky',
                            pinned && (row.getIsSelected() ? 'bg-muted' : 'bg-card'),
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )

                if (!rowContextMenu) return rowNode

                return (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>{rowNode}</ContextMenuTrigger>
                    {rowContextMenu(row.original)}
                  </ContextMenu>
                )
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="p-0">
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {footer}
    </div>
  )
}
