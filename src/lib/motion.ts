import { useSyncExternalStore } from 'react'

/** Entrance timing shared by every Recharts surface; matches the Vue charts. */
export const CHART_ANIMATION_DURATION = 600

/**
 * Recharts' prop types only name the built-in curves, but react-smooth accepts
 * `cubic-bezier(...)` templates at runtime, so the design token still applies.
 */
export const CHART_ANIMATION_EASING = 'cubic-bezier(0.2, 0, 0, 1)' as 'ease'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
