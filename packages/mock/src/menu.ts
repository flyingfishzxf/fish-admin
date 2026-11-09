import { NAV_CONTRACT, type MenuPayload } from '@fish-admin/contracts/navigation'

/**
 * Serialized from the shared navigation contract so the demo, the offline
 * fallback and the future framework ports cannot drift. Every entry carries its
 * permission code, so the client can re-check it against the session.
 */
export function buildMenuPayload(): MenuPayload {
  return {
    groups: NAV_CONTRACT.map((group) => ({
      titleKey: group.titleKey,
      items: group.items.map((item) => ({
        titleKey: item.titleKey,
        path: item.to,
        icon: item.icon,
        ...(item.permission ? { permission: item.permission } : {}),
      })),
    })),
  }
}
