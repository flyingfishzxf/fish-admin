import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api-error'
import type { DictionaryType } from '@/types'

import { createDictionary, updateDictionary } from '../api'
import { dictionaryKeys } from '../queries'

function messageFor(error: unknown, t: (key: string) => string) {
  if (!(error instanceof ApiError)) return t('dictionaries:errors.unknown')
  if (error.code === 'DICTIONARY_CODE_TAKEN') return t('dictionaries:errors.codeTaken')
  if (error.code === 'VALIDATION_ERROR') return t('dictionaries:errors.invalidCode')
  return t('dictionaries:errors.unknown')
}

export function DictionaryTypeDialog({
  open,
  type,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  type: DictionaryType | null
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const editing = Boolean(type)

  useEffect(() => {
    if (!open) return
    setCode(type?.code ?? '')
    setName(type?.name ?? '')
    setDescription(type?.description ?? '')
    setError(null)
  }, [open, type])

  const mutation = useMutation({
    mutationFn: () =>
      type
        ? updateDictionary(type.id, { name: name.trim(), description: description.trim() })
        : createDictionary({
            code: code.trim(),
            name: name.trim(),
            description: description.trim(),
          }),
    onSuccess: (detail) => {
      void queryClient.invalidateQueries({ queryKey: dictionaryKeys.all })
      toast.success(t(editing ? 'dictionaries:type.updated' : 'dictionaries:type.created'))
      onOpenChange(false)
      if (!editing) onCreated?.(detail.dictionary.id)
    },
    onError: (mutationError) => setError(messageFor(mutationError, t)),
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(editing ? 'dictionaries:type.editTitle' : 'dictionaries:type.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('dictionaries:type.codeHint')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="dictionary-code">{t('dictionaries:type.code')}</Label>
            <Input
              id="dictionary-code"
              value={code}
              disabled={editing}
              placeholder="expense_category"
              maxLength={32}
              onChange={(event) => setCode(event.target.value)}
              aria-invalid={Boolean(error) || undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dictionary-name">{t('dictionaries:type.name')}</Label>
            <Input
              id="dictionary-name"
              value={name}
              maxLength={48}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dictionary-description">
              {t('dictionaries:type.descriptionField')}
            </Label>
            <Textarea
              id="dictionary-description"
              value={description}
              maxLength={200}
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            disabled={
              mutation.isPending ||
              name.trim().length < 2 ||
              (!editing && !/^[a-z][a-z0-9_]{1,31}$/.test(code.trim()))
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t(editing ? 'common:actions.save' : 'dictionaries:newType')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
