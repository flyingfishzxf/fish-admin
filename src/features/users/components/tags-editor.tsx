import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { TagsInput } from '@/components/enterprise/tags-input/tags-input'
import { useDictionaryOptionsQuery } from '@/features/dictionaries/queries'
import type { User } from '@/types'

import { updateUserProfile } from '../api'

export function TagsEditor({ user, canEdit }: { user: User; canEdit: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [tags, setTags] = useState<string[]>(user.tags)
  const tagOptions = useDictionaryOptionsQuery('user_tag', canEdit)

  useEffect(() => {
    setTags(user.tags)
  }, [user.id, user.tags])

  const mutation = useMutation({
    mutationFn: (next: string[]) => updateUserProfile(user.id, { tags: next }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('users:detail.tagsSaved'))
    },
    onError: () => toast.error(t('errors:api.unknown')),
  })

  const dirty = tags.join('\u0000') !== user.tags.join('\u0000')

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold">{t('users:detail.tags')}</h3>
          <p className="text-xs text-muted-foreground">{t('users:detail.tagsHint')}</p>
        </div>
        {canEdit ? (
          <Button
            size="sm"
            variant="outline"
            disabled={!dirty || mutation.isPending}
            onClick={() => mutation.mutate(tags)}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t('users:detail.saveTags')}
          </Button>
        ) : null}
      </div>
      <TagsInput
        value={tags}
        onChange={setTags}
        ariaLabel={t('users:detail.tags')}
        placeholder={t('users:detail.tags')}
        disabled={!canEdit || mutation.isPending}
        suggestions={(tagOptions.data ?? []).filter(
          (option) => !tags.some((tag) => tag.toLowerCase() === option.value.toLowerCase()),
        )}
      />
    </section>
  )
}
