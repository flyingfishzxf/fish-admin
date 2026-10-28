import { useState } from 'react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@fish-admin/react'

const TOTAL_RESULTS = 128
const PAGE_SIZE = 10
const TOTAL_PAGES = Math.ceil(TOTAL_RESULTS / PAGE_SIZE)

type PageItem = number | 'ellipsis'

function pageWindow(page: number): PageItem[] {
  if (TOTAL_PAGES <= 7) {
    return Array.from({ length: TOTAL_PAGES }, (_, index) => index + 1)
  }
  if (page <= 3) return [1, 2, 3, 4, 5, 'ellipsis', TOTAL_PAGES]
  if (page >= TOTAL_PAGES - 2) {
    return [
      1,
      'ellipsis',
      TOTAL_PAGES - 4,
      TOTAL_PAGES - 3,
      TOTAL_PAGES - 2,
      TOTAL_PAGES - 1,
      TOTAL_PAGES,
    ]
  }
  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', TOTAL_PAGES]
}

export default function PaginationBasic() {
  const [page, setPage] = useState(2)
  const first = (page - 1) * PAGE_SIZE + 1
  const last = Math.min(page * PAGE_SIZE, TOTAL_RESULTS)

  return (
    <div className="fish-demo-stack">
      <Pagination style={{ justifyContent: 'flex-start' }}>
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
          {pageWindow(page).map((item, index) =>
            item === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(event) => {
                    event.preventDefault()
                    setPage(item)
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setPage((current) => Math.min(TOTAL_PAGES, current + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        Page {page} of {TOTAL_PAGES} — reports {first}–{last} of {TOTAL_RESULTS}.
      </p>
    </div>
  )
}
