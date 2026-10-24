import {
  Building,
  Building2,
  LogIn,
  ShieldCheck,
  ShieldMinus,
  ShieldPlus,
  UserCheck,
  UserCog,
  UserPlus,
  UserRound,
  UserX,
  type LucideIcon,
} from 'lucide-react'

import type { AuditAction, AuditEntityType } from '@/types'

export const AUDIT_ACTIONS: AuditAction[] = [
  'user.created',
  'user.updated',
  'user.deleted',
  'user.restored',
  'role.created',
  'role.updated',
  'role.deleted',
  'department.created',
  'department.updated',
  'auth.login',
  'profile.updated',
]

export const AUDIT_ENTITY_TYPES: AuditEntityType[] = ['user', 'role', 'department', 'auth']

export type AuditTone = 'success' | 'info' | 'warning' | 'destructive' | 'neutral'

export const AUDIT_ACTION_TONES: Record<AuditAction, AuditTone> = {
  'user.created': 'success',
  'user.updated': 'info',
  'user.deleted': 'destructive',
  'user.restored': 'success',
  'role.created': 'success',
  'role.updated': 'info',
  'role.deleted': 'destructive',
  'department.created': 'success',
  'department.updated': 'info',
  'auth.login': 'neutral',
  'profile.updated': 'info',
}

export const AUDIT_ACTION_ICONS: Record<AuditAction, LucideIcon> = {
  'user.created': UserPlus,
  'user.updated': UserCog,
  'user.deleted': UserX,
  'user.restored': UserCheck,
  'role.created': ShieldPlus,
  'role.updated': ShieldCheck,
  'role.deleted': ShieldMinus,
  'department.created': Building2,
  'department.updated': Building,
  'auth.login': LogIn,
  'profile.updated': UserRound,
}

export const AUDIT_TONE_BADGE_CLASSES: Record<AuditTone, string> = {
  success: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  info: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
  warning: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
}
