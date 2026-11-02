import { useEffect, useRef } from 'react'

export function usePreviewTheme(values: Record<string, string>) {
  const applied = useRef<string[]>([])
  const original = useRef<Map<string, string> | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const previous = original.current ?? new Map<string, string>()
    original.current = previous

    for (const cssVar of applied.current) {
      const originalValue = previous.get(cssVar)
      if (originalValue) root.style.setProperty(cssVar, originalValue)
      else root.style.removeProperty(cssVar)
    }

    const next = Object.entries(values)
    for (const [cssVar, value] of next) {
      if (!previous.has(cssVar)) previous.set(cssVar, root.style.getPropertyValue(cssVar))
      root.style.setProperty(cssVar, value)
    }
    applied.current = next.map(([cssVar]) => cssVar)
  }, [values])

  useEffect(() => {
    return () => {
      const root = document.documentElement
      for (const [cssVar, value] of original.current ?? []) {
        if (value) root.style.setProperty(cssVar, value)
        else root.style.removeProperty(cssVar)
      }
      original.current = null
      applied.current = []
    }
  }, [])
}
