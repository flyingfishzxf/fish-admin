import { useState } from 'react'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@fish-admin/react'

const TOTAL_RESULTS = 128
const PAGE_SIZES = [10, 25, 50]

export default function PaginationCompact() {
  const [page, setPage] = useState(3)
  const [pageSize, setPageSize] = useState(25)
  const totalPages = Math.ceil(TOTAL_RESULTS / pageSize)
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, TOTAL_RESULTS)

  const changePageSize = (size: number) => {
    setPageSize(size)
    setPage((current) => Math.min(current, Math.ceil(TOTAL_RESULTS / size)))
  }

  return (
    <div className="fish-demo-stack">
      <Pagination style={{ justifyContent: 'flex-start' }} aria-label="Compact pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setPage((current) => Math.max(1, current - 1))
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="fish-demo-muted" style={{ padding: '0 0.5rem' }}>
              Page {page} of {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setPage((current) => Math.min(totalPages, current + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <span className="fish-demo-label" id="demo-pagination-page-size">
          Rows per page
        </span>
        <PaginationContent aria-labelledby="demo-pagination-page-size">
          {PAGE_SIZES.map((size) => (
            <PaginationItem key={size}>
              <PaginationLink
                href="#"
                size="sm"
                isActive={pageSize === size}
                aria-label={`${size} rows per page`}
                onClick={(event) => {
                  event.preventDefault()
                  changePageSize(size)
                }}
              >
                {size}
              </PaginationLink>
            </PaginationItem>
          ))}
        </PaginationContent>
      </div>

      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        Showing {first}–{last} of {TOTAL_RESULTS} reports.
      </p>
    </div>
  )
}
