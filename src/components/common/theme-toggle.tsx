import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/react'

import { THEME_MODES, type ThemeMode } from '@/config/theme'
import { useThemeStore } from '@/stores/theme-store'

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} satisfies Record<ThemeMode, typeof Sun>

export function ThemeToggle() {
  const { t } = useTranslation('common')
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-9" aria-label={t('theme.toggle')}>
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t('theme.label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_MODES.map((option) => {
          const Icon = MODE_ICONS[option]
          return (
            <DropdownMenuItem key={option} onClick={() => setMode(option)}>
              <Icon className="size-4" />
              {t(`theme.${option}`)}
              {mode === option ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
