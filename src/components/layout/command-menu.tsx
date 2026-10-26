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
import { flattenNavItems } from '@/config/nav'
import { useMenuNavGroups } from '@/features/navigation/queries'
import { changeLanguage, nextLanguage } from '@/lib/i18n'
import { useResolvedTheme } from '@/lib/theme'
import { useAuthStore } from '@/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'
import { useUiStore } from '@/stores/ui-store'

export function CommandMenu() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const open = useUiStore((state) => state.commandOpen)
  const setOpen = useUiStore((state) => state.setCommandOpen)
  const logout = useAuthStore((state) => state.logout)
  const setMode = useThemeStore((state) => state.setMode)
  const resolvedTheme = useResolvedTheme()
  const groups = useMenuNavGroups()

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

  const otherLanguage = nextLanguage(i18n.resolvedLanguage)

  function toggleLanguage() {
    if (otherLanguage) void changeLanguage(otherLanguage)
  }

  async function signOut() {
    setOpen(false)
    await logout()
    toast.success(t('auth:signedOut'))
    navigate({ to: '/login', replace: true })
  }

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
            {flattenNavItems([group]).map((item) => {
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
          {otherLanguage ? (
            <CommandItem value="language" onSelect={() => runAction(toggleLanguage)}>
              <Languages />
              {t('command.actions.toggleLanguage', { language: t(`language.${otherLanguage}`) })}
            </CommandItem>
          ) : null}
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
