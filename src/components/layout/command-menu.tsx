import { useNavigate } from '@tanstack/react-router'
import { Languages, LogOut, MonitorCog, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { NAV_GROUPS } from '@/config/nav'
import { changeLanguage, type SupportedLanguage } from '@/lib/i18n'
import { filterNavGroups } from '@/lib/permissions'
import { useResolvedTheme } from '@/lib/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'
import { useUiStore } from '@/stores/ui-store'

const NO_PERMISSIONS: string[] = []

export function CommandMenu() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const open = useUiStore((state) => state.commandOpen)
  const setOpen = useUiStore((state) => state.setCommandOpen)
  const permissions = useAuthStore((state) => state.user?.permissions ?? NO_PERMISSIONS)
  const logout = useAuthStore((state) => state.logout)
  const setMode = useThemeStore((state) => state.setMode)
  const resolvedTheme = useResolvedTheme()
  const groups = filterNavGroups(NAV_GROUPS, permissions)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(!useUiStore.getState().commandOpen)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setOpen])

  function runAction(action: () => void) {
    setOpen(false)
    action()
  }

  function toggleLanguage() {
    const next: SupportedLanguage = i18n.resolvedLanguage === 'zh-CN' ? 'en' : 'zh-CN'
    void changeLanguage(next)
  }

  async function signOut() {
    setOpen(false)
    await logout()
    toast.success(t('auth:signedOut'))
    navigate({ to: '/login', replace: true })
  }

  const otherLanguage = i18n.resolvedLanguage === 'zh-CN' ? t('language.en') : t('language.zh-CN')

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('command.title')}
      description={t('command.description')}
      className="sm:max-w-xl"
    >
      <CommandInput placeholder={t('command.placeholder')} />
      <CommandList>
        <CommandEmpty>{t('command.empty')}</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.titleKey} heading={t(group.titleKey)}>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.to}
                  value={`${t(item.titleKey)} ${item.to}`}
                  onSelect={() => runAction(() => navigate({ to: item.to }))}
                >
                  <Icon />
                  {t(item.titleKey)}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading={t('command.groups.actions')}>
          <CommandItem
            value="theme"
            onSelect={() => runAction(() => setMode(resolvedTheme === 'dark' ? 'light' : 'dark'))}
          >
            <MonitorCog />
            {t('command.actions.toggleTheme')}
          </CommandItem>
          <CommandItem value="language" onSelect={() => runAction(toggleLanguage)}>
            <Languages />
            {t('command.actions.toggleLanguage', { language: otherLanguage })}
          </CommandItem>
          <CommandItem
            value="profile"
            onSelect={() => runAction(() => navigate({ to: '/profile' }))}
          >
            <UserRound />
            {t('command.actions.profile')}
          </CommandItem>
          <CommandItem value="logout" onSelect={() => void signOut()}>
            <LogOut />
            {t('command.actions.signOut')}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
