import {
  BarChart3,
  Bell,
  Boxes,
  CircleDot,
  FolderKanban,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Palette,
  Plug,
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * The icon names a backend may send in `GET /menu`. A registry rather than
 * `import * as lucide`: a namespace import would put all ~1600 icons in the
 * first-paint graph.
 */
const MENU_ICONS: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  bell: Bell,
  boxes: Boxes,
  'circle-dot': CircleDot,
  'folder-kanban': FolderKanban,
  'folder-open': FolderOpen,
  'key-round': KeyRound,
  'layout-dashboard': LayoutDashboard,
  'lock-keyhole': LockKeyhole,
  network: Network,
  palette: Palette,
  plug: Plug,
  'scroll-text': ScrollText,
  'settings-2': Settings2,
  'shield-check': ShieldCheck,
  'user-round': UserRound,
  users: Users,
}

const ICON_NAMES = new Map<LucideIcon, string>(
  Object.entries(MENU_ICONS).map(([name, icon]) => [icon, name]),
)

export const MENU_ICON_NAMES = Object.keys(MENU_ICONS).sort()

/**
 * An unrecognised name is a cosmetic miss, so it falls back to a neutral marker
 * instead of throwing while the sidebar renders.
 */
export function resolveMenuIcon(name: unknown): LucideIcon {
  if (typeof name === 'string' && name in MENU_ICONS) return MENU_ICONS[name]
  return CircleDot
}

/** Used by the mock backend to serialize the static nav, so the two cannot drift. */
export function iconNameFor(icon: LucideIcon): string | undefined {
  return ICON_NAMES.get(icon)
}
