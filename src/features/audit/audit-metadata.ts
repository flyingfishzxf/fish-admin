import type { AuditEvent } from '@/types'

export function auditMetadataSummary(event: AuditEvent, limit = 2) {
  return Object.entries(event.metadata)
    .filter(([key]) => key !== 'actorId')
    .slice(0, limit)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
}
