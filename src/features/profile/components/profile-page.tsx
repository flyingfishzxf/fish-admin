import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2, LogOut, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { PageHeader } from '@fish-admin/react/internal/page-header'
import {
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
  Textarea,
  getInitials,
} from '@fish-admin/react'

import { PERMISSIONS, type PermissionDefinition } from '@/config/permissions'
import { useDocumentTitle } from '@/lib/document-title'
import { createAvatarDataUrl, validateAvatarFile } from '@/lib/image'

import { useAuthStore } from '@/stores/auth-store'

import { updateProfile } from '../api'
import { createProfileSchema, type ProfileFormValues } from '../schemas'

export function ProfilePage() {
  const { t } = useTranslation()
  useDocumentTitle(t('profile:title'))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const logout = useAuthStore((state) => state.logout)

  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const schema = useMemo(() => createProfileSchema(t), [t])
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', bio: user?.bio ?? '' },
  })

  useEffect(() => {
    form.reset({ name: user?.name ?? '', bio: user?.bio ?? '' })
    setAvatar(user?.avatar)
  }, [user?.name, user?.bio, user?.avatar, form])

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateProfile({
        name: values.name,
        bio: values.bio || undefined,
        avatar: avatar ?? null,
      }),
    onSuccess: (updated) => {
      updateUser({ ...updated, avatar: updated.avatar ?? undefined })
      setAvatar(updated.avatar)
      setServerError(null)
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('profile:saveSuccess'))
    },
    onError: () => {
      setServerError(t('errors:api.unknown'))
    },
  })

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const error = validateAvatarFile(file)
    if (error) {
      setAvatarError(t(`profile:avatarErrors.${error}`))
      return
    }

    try {
      const dataUrl = await createAvatarDataUrl(file)
      setAvatar(dataUrl)
      setAvatarError(null)
    } catch {
      setAvatarError(t('profile:avatarErrors.invalidType'))
    }
  }

  async function handleSignOut() {
    await logout()
    toast.success(t('auth:signedOut'))
    navigate({ to: '/login', replace: true })
  }

  const permissionCodes = user?.permissions ?? []
  const hasAllPermissions = permissionCodes.includes('*')
  const grantedPermissions = hasAllPermissions
    ? []
    : permissionCodes
        .map((code) => PERMISSIONS.find((permission) => permission.code === code))
        .filter((permission): permission is PermissionDefinition => Boolean(permission))

  return (
    <div className="space-y-6">
      <PageHeader title={t('profile:title')} description={t('profile:subtitle')} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('profile:form.title')}</CardTitle>
            <CardDescription>{t('profile:form.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) => {
                  setServerError(null)
                  mutation.mutate(values)
                })}
              >
                {serverError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">{t('profile:form.avatar')}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar className="size-20">
                      {avatar ? <AvatarImage src={avatar} alt={user?.name ?? ''} /> : null}
                      <AvatarFallback className="bg-brand-soft text-xl font-semibold text-primary">
                        {getInitials(user?.name ?? '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="size-4" />
                          {t('profile:form.changeAvatar')}
                        </Button>
                        {avatar ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAvatar(undefined)}
                          >
                            {t('profile:form.removeAvatar')}
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('profile:form.avatarHint')}
                      </p>
                      {avatarError ? (
                        <p className="text-xs text-destructive">{avatarError}</p>
                      ) : null}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      aria-label={t('profile:form.changeAvatar')}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => void handleAvatarChange(event)}
                    />
                  </div>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile:form.name')}</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="name"
                          placeholder={t('profile:form.namePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('profile:form.email')}</p>
                  <Input value={user?.email ?? ''} readOnly disabled />
                  <p className="text-xs text-muted-foreground">{t('profile:form.emailHint')}</p>
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile:form.bio')}</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder={t('profile:form.bioPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    {t('common:actions.saveChanges')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{t('profile:title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t('profile:account.role')}</span>
                <Badge variant="secondary" className="font-normal">
                  {user?.roleName}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t('profile:account.email')}</span>
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t('profile:account.id')}</span>
                <code className="rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                  {user?.id}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{t('profile:permissions.title')}</CardTitle>
                <Badge variant="outline" className="font-normal">
                  {hasAllPermissions
                    ? t('profile:permissions.all')
                    : t('profile:permissions.count', {
                        count: grantedPermissions.length,
                      })}
                </Badge>
              </div>
              <CardDescription>{t('profile:permissions.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {hasAllPermissions ? (
                <p className="text-sm font-medium text-primary">{t('profile:permissions.all')}</p>
              ) : grantedPermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('profile:permissions.empty')}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {grantedPermissions.map((permission) => (
                    <Badge key={permission.code} variant="outline" className="font-normal">
                      {t(permission.labelKey)}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>{t('profile:session.title')}</CardTitle>
              <CardDescription>{t('profile:session.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => void handleSignOut()}>
                <LogOut className="size-4" />
                {t('profile:session.signOut')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
