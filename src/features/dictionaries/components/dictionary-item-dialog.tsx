import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@fish-admin/react'

import { ApiError } from '@/lib/api-error'
import type { DictionaryItem } from '@/types'

import { createDictionaryItem, updateDictionaryItem } from '../api'
import { dictionaryKeys } from '../queries'

function messageFor(error: unknown, t: (key: string) => string) {
  if (!(error instanceof ApiError)) return t('dictionaries:errors.unknown')
  if (error.code === 'ITEM_LABEL_TAKEN') return t('dictionaries:errors.labelTaken')
  if (error.code === 'ITEM_VALUE_TAKEN') return t('dictionaries:errors.valueTaken')
  if (error.code === 'ITEM_IN_USE') return t('dictionaries:errors.inUse')
  if (error.code === 'VALIDATION_ERROR') return t('dictionaries:errors.invalidValue')
  return t('dictionaries:errors.unknown')
}

export function DictionaryItemDialog({
  open,
  dictionaryId,
  item,
  onOpenChange,
}: {
  open: boolean
  dictionaryId: string
  item: DictionaryItem | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const editing = Boolean(item)
  const valueLocked = Boolean(item && item.referenceCount > 0)

  useEffect(() => {
    if (!open) return
    setLabel(item?.label ?? '')
    setValue(item?.value ?? '')
    setDescription(item?.description ?? '')
    setError(null)
  }, [open, item])

  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        label: label.trim(),
        value: value.trim(),
        description: description.trim(),
      }
      return item
        ? updateDictionaryItem(dictionaryId, item.id, input)
        : createDictionaryItem(dictionaryId, input)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dictionaryKeys.all })
      toast.success(t(editing ? 'dictionaries:item.updated' : 'dictionaries:item.created'))
      onOpenChange(false)
    },
    onError: (mutationError) => setError(messageFor(mutationError, t)),
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(editing ? 'dictionaries:item.editTitle' : 'dictionaries:item.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {valueLocked ? t('dictionaries:item.valueLocked') : t('dictionaries:type.codeHint')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="dictionary-item-label">{t('dictionaries:item.label')}</Label>
            <Input
              id="dictionary-item-label"
              value={label}
              maxLength={40}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dictionary-item-value">{t('dictionaries:item.value')}</Label>
            <Input
              id="dictionary-item-value"
              value={value}
              disabled={valueLocked}
              placeholder="priority"
              maxLength={32}
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={Boolean(error) || undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dictionary-item-description">
              {t('dictionaries:item.descriptionField')}
            </Label>
            <Textarea
              id="dictionary-item-description"
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
              !label.trim() ||
              !/^[a-z0-9][a-z0-9_-]{0,31}$/.test(value.trim())
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t(editing ? 'common:actions.save' : 'dictionaries:item.new')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
