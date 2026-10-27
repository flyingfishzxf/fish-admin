import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { UIProvider } from '@fish-admin/react'

import { useResolvedTheme } from '@/lib/theme'

export function AppUIProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const theme = useResolvedTheme()
  const locale = i18n.resolvedLanguage === 'zh-CN' ? 'zh-CN' : 'en'

  return (
    <UIProvider locale={locale} theme={theme}>
      {children}
    </UIProvider>
  )
}
