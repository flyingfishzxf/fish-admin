import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination'

function PaginationHarness({
  onPageChange,
  totalPages = 3,
}: {
  onPageChange?: (page: number) => void
  totalPages?: number
}) {
  const [page, setPage] = useState(1)

  function goTo(next: number) {
    setPage(next)
    onPageChange?.(next)
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#page-1"
            aria-disabled={page === 1}
            onClick={(event) => {
              event.preventDefault()
              if (page > 1) goTo(page - 1)
            }}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
          <PaginationItem key={number}>
            <PaginationLink
              href={`#page-${number}`}
              isActive={page === number}
              onClick={(event) => {
                event.preventDefault()
                goTo(number)
              }}
            >
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={`#page-${totalPages}`}
            aria-disabled={page === totalPages}
            onClick={(event) => {
              event.preventDefault()
              if (page < totalPages) goTo(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

describe('Pagination', () => {
  it('labels the navigation and marks the first page as current', () => {
    render(<PaginationHarness />)

    const nav = screen.getByRole('navigation', { name: 'Pagination' })

    expect(nav).toHaveAttribute('data-slot', 'pagination')
    expect(within(nav).getByRole('link', { name: '1' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: '2' })).not.toHaveAttribute('aria-current')
    expect(within(nav).getByRole('link', { name: 'Go to previous page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(within(nav).getByRole('link', { name: 'Go to next page' })).toHaveAttribute(
      'aria-disabled',
      'false',
    )
  })

  it('reports page clicks and keeps disabled boundary links inert', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<PaginationHarness onPageChange={onPageChange} />)

    await user.click(screen.getByRole('link', { name: 'Go to previous page' }))
    expect(onPageChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole('link', { name: '2' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('link', { name: 'Go to next page' }))
    expect(onPageChange).toHaveBeenLastCalledWith(3)
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute('aria-current', 'page')

    const next = screen.getByRole('link', { name: 'Go to next page' })
    expect(next).toHaveAttribute('aria-disabled', 'true')

    await user.click(next)
    expect(onPageChange).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute('aria-current', 'page')
  })

  it('moves backwards from the last page', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<PaginationHarness onPageChange={onPageChange} />)

    await user.click(screen.getByRole('link', { name: '3' }))
    await user.click(screen.getByRole('link', { name: 'Go to previous page' }))

    expect(onPageChange).toHaveBeenLastCalledWith(2)
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page')
  })
})
