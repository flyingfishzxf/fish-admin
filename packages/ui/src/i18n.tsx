import * as React from 'react'

import en from './locales/en'
import zhCN from './locales/zh-CN'

export type UILocale = 'en' | 'zh-CN'
export type UITheme = 'light' | 'dark' | 'system'
export type UIMessages = Record<string, string>

const BUILT_IN: Record<UILocale, UIMessages> = { en, 'zh-CN': zhCN }

interface UIProviderProps {
  locale?: UILocale
  messages?: UIMessages
  theme?: UITheme
  children: React.ReactNode
}

interface UIContextValue {
  locale: UILocale
  messages: UIMessages
  resolvedTheme: 'light' | 'dark'
}

const DEFAULT_CONTEXT: UIContextValue = {
  locale: 'en',
  messages: en,
  resolvedTheme: 'light',
}

const UIContext = React.createContext<UIContextValue | null>(null)

export function UIProvider({
  locale = 'en',
  messages,
  theme = 'light',
  children,
}: UIProviderProps) {
  const [systemDark, setSystemDark] = React.useState(false)

  React.useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [theme])

  const value = React.useMemo<UIContextValue>(
    () => ({
      locale,
      messages: { ...BUILT_IN[locale], ...messages },
      resolvedTheme: theme === 'system' ? (systemDark ? 'dark' : 'light') : theme,
    }),
    [locale, messages, theme, systemDark],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

function useUIContext(): UIContextValue {
  return React.useContext(UIContext) ?? DEFAULT_CONTEXT
}

export function useUILocale(): UILocale {
  return useUIContext().locale
}

export function useUITheme(): 'light' | 'dark' {
  return useUIContext().resolvedTheme
}

export function useUITranslation(): {
  t: (key: string, vars?: Record<string, string | number>) => string
  locale: UILocale
} {
  const { locale, messages } = useUIContext()

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const template = messages[key] ?? BUILT_IN.en[key]
      if (template === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[@fish-admin/react] Missing UI message "${key}" for locale "${locale}".`)
        }
        return key
      }
      if (!vars) return template
      return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
        vars[name] === undefined ? match : String(vars[name]),
      )
    },
    [locale, messages],
  )

  return { t, locale }
}
