import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Column, RowData, Table as TableInstance } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'

import { ContextMenu, ContextMenuTrigger } from '../ui/context-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Skeleton } from '../ui/skeleton'
import { cn } from '../../lib/utils'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    className?: string
    headerClassName?: string
    group?: string
    groupLabel?: string
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

/** Runs of adjacent columns sharing `meta.group`; order follows the visible leaf order. */
function groupRuns<TData>(columns: Column<TData, unknown>[]) {
  const runs: { group: string; label?: string; columns: Column<TData, unknown>[] }[] = []

  for (const column of columns) {
    const group = column.columnDef.meta?.group
    if (!group) return []

    const last = runs[runs.length - 1]
    if (last?.group === group) {
      last.columns.push(column)
    } else {
      runs.push({ group, label: column.columnDef.meta?.groupLabel, columns: [column] })
    }
  }

  return runs
}

function groupHeaderStyle<TData>(columns: Column<TData, unknown>[], header = true) {
  const pinned = columns[0].getIsPinned()
  const samePinning = columns.every((column) => column.getIsPinned() === pinned)
  const width = columns.reduce((sum, column) => sum + column.getSize(), 0)

  if (!pinned || !samePinning) return { width }

  return {
    ...pinningStyle(columns[0], header),
    width,
  }
}

const OVERSCAN = 6

export function DataTable<TData>({
  table,
  loading = false,
  skeletonRows = 6,
  empty,
  toolbar,
  footer,
  density = 'comfortable',
  rowContextMenu,
  onRowClick,
  virtualized = false,
  virtualRowHeight,
  virtualMaxHeight = 560,
  scrollLabel,
}: {
  table: TableInstance<TData>
  loading?: boolean
  skeletonRows?: number
  empty: ReactNode
  toolbar?: ReactNode
  footer?: ReactNode
  density?: DataTableDensity
  rowContextMenu?: (row: TData) => ReactNode
  onRowClick?: (row: TData) => void
  virtualized?: boolean
  virtualRowHeight?: number
  virtualMaxHeight?: number
  scrollLabel?: string
}) {
  const leaves = table.getVisibleLeafColumns()
  const columnCount = leaves.length
  const cellPadding = density === 'compact' ? 'py-1.5' : 'py-3'
  const headHeight = density === 'compact' ? 'h-9' : 'h-10'
  const rowHeight = virtualRowHeight ?? (density === 'compact' ? 48 : 60)
  const runs = useMemo(() => groupRuns(leaves), [leaves])
  const hasGroups = runs.length > 0
  const groupHeadHeight = hasGroups ? 32 : 0

  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(virtualMaxHeight)

  useEffect(() => {
    const element = scrollRef.current
    if (!virtualized || !element) return

    setViewportHeight(element.clientHeight)
    const observer = new ResizeObserver(() => setViewportHeight(element.clientHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [virtualized])

  const rows = table.getRowModel().rows
  const rowCount = rows.length
  const windowSize = Math.ceil(viewportHeight / rowHeight) + OVERSCAN * 2
  const maxStart = Math.max(0, rowCount - windowSize)
  const start = virtualized
    ? Math.min(Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN), maxStart)
    : 0
  const end = virtualized ? Math.min(rowCount, start + windowSize) : rowCount
  const visibleRows = virtualized ? rows.slice(start, end) : rows
  const paddingTop = virtualized ? start * rowHeight : 0
  const paddingBottom = virtualized ? (rowCount - end) * rowHeight : 0
  const rowSignature = rowCount > 0 ? `${rows[0].id}:${rows[rowCount - 1].id}` : ''

  useEffect(() => {
    if (!virtualized) return
    const element = scrollRef.current
    if (!element || element.scrollTop === 0) return
    element.scrollTop = 0
    setScrollTop(0)
  }, [virtualized, rowSignature])

  return (
    <div className="shadow-soft overflow-hidden rounded-2xl border bg-card">
      {toolbar ? <div className="border-b p-4">{toolbar}</div> : null}
      <div
        ref={scrollRef}
        role={virtualized ? 'region' : undefined}
        aria-label={virtualized ? scrollLabel : undefined}
        tabIndex={0}
        onScroll={virtualized ? (event) => setScrollTop(event.currentTarget.scrollTop) : undefined}
        style={virtualized ? { maxHeight: virtualMaxHeight } : undefined}
        className={cn(
          'overflow-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
        )}
      >
        <Table
          container={false}
          className={cn('w-full', virtualized && 'table-fixed')}
          aria-rowcount={virtualized ? rowCount + (hasGroups ? 2 : 1) : undefined}
        >
          {virtualized ? (
            <colgroup>
              {leaves.map((column) => (
                <col key={column.id} style={{ width: column.getSize() }} />
              ))}
            </colgroup>
          ) : null}
          <TableHeader>
            {hasGroups ? (
              <TableRow className="hover:bg-transparent">
                {runs.map((run) => {
                  const pinned = run.columns[0].getIsPinned()
                  return (
                    <TableHead
                      key={`${run.group}-${run.columns[0].id}`}
                      colSpan={run.columns.length}
                      style={{ ...groupHeaderStyle(run.columns), height: groupHeadHeight }}
                      className={cn(
                        'h-8 border-b text-[11px] font-semibold tracking-wide text-muted-foreground uppercase',
                        virtualized ? 'sticky top-0 bg-muted' : 'bg-muted/35',
                        pinned && 'bg-muted',
                      )}
                    >
                      {run.label}
                    </TableHead>
                  )
                })}
              </TableRow>
            ) : null}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const pinned = header.column.getIsPinned()
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        ...pinningStyle(header.column, true),
                        ...(virtualized ? { top: groupHeadHeight } : {}),
                        width: header.getSize(),
                      }}
                      className={cn(
                        'relative text-[11px] font-semibold tracking-wide text-muted-foreground uppercase',
                        headHeight,
                        virtualized ? 'sticky z-[2] bg-muted' : 'bg-muted/35',
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
            ) : rowCount > 0 ? (
              <>
                {paddingTop > 0 ? (
                  <TableRow aria-hidden className="border-0 hover:bg-transparent">
                    <TableCell
                      colSpan={columnCount}
                      style={{ height: paddingTop, padding: 0 }}
                      className="border-0"
                    />
                  </TableRow>
                ) : null}
                {visibleRows.map((row, index) => {
                  const rowNode = (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      aria-rowindex={
                        virtualized ? start + index + 1 + (hasGroups ? 2 : 1) : undefined
                      }
                      style={virtualized ? { height: rowHeight } : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      onKeyDown={
                        onRowClick
                          ? (event) => {
                              if (event.target !== event.currentTarget) return
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                onRowClick(row.original)
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        row.getIsSelected() && 'bg-muted/60',
                        onRowClick &&
                          'cursor-pointer focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
                      )}
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
                              'overflow-hidden',
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
                })}
                {paddingBottom > 0 ? (
                  <TableRow aria-hidden className="border-0 hover:bg-transparent">
                    <TableCell
                      colSpan={columnCount}
                      style={{ height: paddingBottom, padding: 0 }}
                      className="border-0"
                    />
                  </TableRow>
                ) : null}
              </>
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
