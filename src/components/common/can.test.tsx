import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { Can } from '@/components/common/can'
import { useCan } from '@/hooks/use-can'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthUser } from '@/types'

const manager: AuthUser = {
  id: 'user_manager',
  name: 'Maya Chen',
  email: 'manager@fish.dev',
  roleId: 'role_manager',
  roleName: 'Manager',
  permissions: ['dashboard:read', 'user:read', 'user:create', 'user:update', 'role:read'],
  emailVerified: true,
  twoFactorEnabled: false,
}

function PermissionProbe({ permission }: { permission?: string }) {
  return <span>{useCan(permission) ? 'allowed' : 'denied'}</span>
}

describe('Can', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: manager, status: 'authenticated' })
  })

  it('renders children when the permission is granted', () => {
    render(
      <Can permission="user:create">
        <button type="button">Invite</button>
      </Can>,
    )

    expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument()
  })

  it('renders the fallback when the permission is missing', () => {
    render(
      <Can permission="user:delete" fallback={<span>read only</span>}>
        <button type="button">Delete</button>
      </Can>,
    )

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.getByText('read only')).toBeInTheDocument()
  })

  it('renders children without a required permission', () => {
    render(
      <Can>
        <span>always</span>
      </Can>,
    )

    expect(screen.getByText('always')).toBeInTheDocument()
  })

  it('exposes the same decision through useCan', () => {
    useAuthStore.setState({ user: { ...manager, permissions: ['user:*'] } })
    render(<PermissionProbe permission="user:delete" />)

    expect(screen.getByText('allowed')).toBeInTheDocument()
  })

  it('denies everything when signed out', () => {
    useAuthStore.setState({ user: null, status: 'anonymous' })
    render(<PermissionProbe permission="dashboard:read" />)

    expect(screen.getByText('denied')).toBeInTheDocument()
  })
})
