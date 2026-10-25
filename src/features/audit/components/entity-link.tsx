import { Link } from '@tanstack/react-router'
import type { MouseEvent, ReactNode } from 'react'

import { DEFAULT_FILES_SEARCH } from '@/features/files/search'
import { DEFAULT_INTEGRATIONS_SEARCH } from '@/features/integrations/search'
import type { AuditEntityType } from '@/types'

export function AuditEntityLink({
  entityType,
  entityId,
  className,
  onClick,
  children,
}: {
  entityType: AuditEntityType
  entityId?: string
  className?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  children: ReactNode
}) {
  if (!entityId) return <span className={className}>{children}</span>

  if (entityType === 'user') {
    return (
      <Link to="/users/$id" params={{ id: entityId }} className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (entityType === 'role') {
    return (
      <Link to="/roles/matrix" className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (entityType === 'department') {
    return (
      <Link to="/departments" search={{ dept: entityId }} className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (entityType === 'project') {
    return (
      <Link to="/projects/$id" params={{ id: entityId }} className={className} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (entityType === 'file') {
    return (
      <Link
        to="/files"
        search={{
          ...DEFAULT_FILES_SEARCH,
          q: typeof children === 'string' ? children : undefined,
        }}
        className={className}
        onClick={onClick}
      >
        {children}
      </Link>
    )
  }

  if (entityType === 'integration') {
    return (
      <Link
        to="/integrations"
        search={DEFAULT_INTEGRATIONS_SEARCH}
        className={className}
        onClick={onClick}
      >
        {children}
      </Link>
    )
  }

  return <span className={className}>{children}</span>
}
