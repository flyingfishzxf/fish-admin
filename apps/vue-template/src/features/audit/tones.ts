import {
  AUDIT_ACTION_TONES,
  type AuditAction,
  type AuditEntityType,
  type AuditTone,
} from '@fish-admin/contracts/audit'
import {
  BookMarked,
  Building2,
  FileText,
  FolderKanban,
  LogIn,
  Plug,
  ShieldCheck,
  UserRound,
  Workflow,
} from 'lucide-vue-next'

// The audit screen and the user activity timeline both colour events by tone,
// so the mapping lives here rather than in either page: two copies of a colour
// table drift the moment one of them is touched.
export const TONE_CLASSES: Record<AuditTone, string> = {
  success: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  info: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
  warning: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
}

export function toneClass(action: AuditAction) {
  return TONE_CLASSES[AUDIT_ACTION_TONES[action]] ?? TONE_CLASSES.neutral
}

// One icon per entity type, not per action: a timeline is read as "what kind of
// thing changed", and 25 action icons in a 20-item list is noise.
export const ENTITY_ICONS: Record<AuditEntityType, typeof UserRound> = {
  user: UserRound,
  role: ShieldCheck,
  department: Building2,
  auth: LogIn,
  project: FolderKanban,
  file: FileText,
  integration: Plug,
  workflow: Workflow,
  dictionary: BookMarked,
}
