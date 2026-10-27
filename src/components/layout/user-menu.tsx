import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, LockKeyhole, LogOut, Settings2, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  getInitials,
} from '@fish-admin/react'

import { useAuthStore } from '@/stores/auth-store'

export function UserMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (!user) return null

  async function handleSignOut() {
    await logout()
    toast.success(t('auth:signedOut'))
    navigate({ to: '/login', replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-1.5 md:pr-2"
          aria-label={`${getInitials(user.name)} ${user.name} — ${t('common:header.account')}`}
          data-tour="account"
        >
          <Avatar className="size-7" aria-hidden>
            {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
            <AvatarFallback className="bg-primary/12 text-[11px] font-semibold text-accent-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>{' '}
          <span className="hidden max-w-28 truncate text-sm font-medium lg:block">{user.name}</span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
            {user.roleName}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
            <UserRound className="size-4" />
            {t('common:userMenu.profile')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: '/security' })}>
            <LockKeyhole className="size-4" />
            {t('common:userMenu.security')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: '/settings' })}>
            <Settings2 className="size-4" />
            {t('common:userMenu.settings')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
          <LogOut className="size-4" />
          {t('common:userMenu.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
