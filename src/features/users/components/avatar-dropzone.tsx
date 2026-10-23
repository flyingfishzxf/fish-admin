import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dropzone } from '@/components/enterprise/dropzone/dropzone'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createAvatarDataUrl, validateAvatarFile } from '@/lib/image'
import { getInitials } from '@/lib/utils'
import type { User } from '@/types'

import { updateUserProfile } from '../api'

type AvatarError = 'invalidType' | 'tooLarge' | 'upload'

export function AvatarDropzone({ user, canEdit }: { user: User; canEdit: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [error, setError] = useState<AvatarError | null>(null)

  const mutation = useMutation({
    mutationFn: (avatar: string) => updateUserProfile(user.id, { avatar }),
    onSuccess: (_, avatar) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      setError(null)
      toast.success(t(avatar ? 'users:detail.avatarUpdated' : 'users:detail.avatarRemoved'))
    },
    onError: () => setError('upload'),
  })

  async function handleFile(file: File) {
    const issue = validateAvatarFile(file)
    if (issue) {
      setError(issue)
      return
    }

    try {
      setError(null)
      mutation.mutate(await createAvatarDataUrl(file))
    } catch {
      setError('upload')
    }
  }

  const errorLabel = error
    ? t(
        error === 'invalidType'
          ? 'users:detail.avatarInvalidType'
          : error === 'tooLarge'
            ? 'users:detail.avatarTooLarge'
            : 'users:detail.avatarError',
      )
    : undefined

  return (
    <section className="space-y-2">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">{t('users:detail.avatar')}</h3>
        <p className="text-xs text-muted-foreground">{t('users:detail.avatarHint')}</p>
      </div>
      <Dropzone
        accept="image/png,image/jpeg,image/webp"
        label={t('users:detail.avatarLabel')}
        disabled={!canEdit || mutation.isPending}
        error={errorLabel}
        onFile={(file) => void handleFile(file)}
        preview={
          <Avatar className="size-16">
            {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
            <AvatarFallback className="bg-brand-soft text-lg font-semibold text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        }
      />
      {canEdit && user.avatar ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('')}
        >
          <Trash2 className="size-4" />
          {t('users:detail.removeAvatar')}
        </Button>
      ) : null}
    </section>
  )
}
