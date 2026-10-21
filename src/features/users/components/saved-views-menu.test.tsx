import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { ensureNamespaces } from '@/lib/i18n'
import { SavedViewsMenu } from '@/features/users/components/saved-views-menu'
import type { UsersSearch } from '@/features/users/search'

const search: UsersSearch = {
  page: 2,
  pageSize: 20,
  q: 'ada',
  roleId: 'role_manager',
  status: 'active',
  sort: 'name',
  order: 'asc',
}

function key(userId: string) {
  return `fish-admin:users-views:${userId}`
}

describe('SavedViewsMenu', () => {
  beforeAll(async () => {
    await ensureNamespaces('users')
  })

  beforeEach(() => {
    localStorage.clear()
  })

  it('saves the current search snapshot without the page number', async () => {
    render(<SavedViewsMenu userId="user_admin" search={search} onApply={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Views/ }))
    fireEvent.change(screen.getByLabelText('View name'), { target: { value: 'Active managers' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(localStorage.getItem(key('user_admin'))).toBeTruthy())

    const stored = JSON.parse(String(localStorage.getItem(key('user_admin')))) as Array<{
      name: string
      search: Record<string, unknown>
    }>
    expect(stored[0].name).toBe('Active managers')
    expect(stored[0].search).toEqual({
      q: 'ada',
      roleId: 'role_manager',
      status: 'active',
      sort: 'name',
      order: 'asc',
      pageSize: 20,
    })
  })

  it('applies a saved view through the callback', async () => {
    localStorage.setItem(
      key('user_admin'),
      JSON.stringify([
        {
          id: 'view-1',
          name: 'Invite queue',
          search: { status: 'invited', sort: 'createdAt', order: 'desc', pageSize: 10 },
          createdAt: new Date().toISOString(),
        },
      ]),
    )
    const onApply = vi.fn()
    render(<SavedViewsMenu userId="user_admin" search={search} onApply={onApply} />)

    expect(screen.getByRole('button', { name: /Views\s*1/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Views\s*1/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Invite queue' }))

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'view-1', name: 'Invite queue' }),
    )
  })

  it('ignores malformed storage entries instead of throwing', async () => {
    localStorage.setItem(key('user_admin'), '{"not":"an array"}')
    render(<SavedViewsMenu userId="user_admin" search={search} onApply={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Views' }))

    expect(await screen.findByText('No saved views yet.')).toBeInTheDocument()
  })

  it('deletes a view and keeps the remaining ones', async () => {
    localStorage.setItem(
      key('user_admin'),
      JSON.stringify([
        { id: 'view-1', name: 'First', search: {}, createdAt: new Date().toISOString() },
        { id: 'view-2', name: 'Second', search: {}, createdAt: new Date().toISOString() },
      ]),
    )
    render(<SavedViewsMenu userId="user_admin" search={search} onApply={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Views\s*2/ }))
    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete view' })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      const stored = JSON.parse(String(localStorage.getItem(key('user_admin')))) as Array<{
        id: string
      }>
      expect(stored.map((view) => view.id)).toEqual(['view-2'])
    })
  })
})
