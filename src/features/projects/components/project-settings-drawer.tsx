import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Popconfirm } from '@/components/enterprise/popconfirm/popconfirm'
import { TagsInput } from '@/components/enterprise/tags-input/tags-input'
import { TimePicker } from '@/components/enterprise/time-picker/time-picker'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import type { Project } from '@/types'

import { archiveProject, updateProject } from '../api'

export function ProjectSettingsDrawer({
  project,
  open,
  onOpenChange,
  canManage,
  onArchived,
}: {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  canManage: boolean
  onArchived: () => void
}) {
  const { t } = useTranslation(['projects', 'common'])
  const queryClient = useQueryClient()
  const [tags, setTags] = useState<string[]>(project.tags)
  const [reminderTime, setReminderTime] = useState<string | undefined>(project.reminderTime)

  useEffect(() => {
    if (!open) return
    setTags(project.tags)
    setReminderTime(project.reminderTime)
  }, [open, project.tags, project.reminderTime])

  const saveMutation = useMutation({
    mutationFn: () => updateProject(project.id, { tags, reminderTime: reminderTime ?? '' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('projects:detail.settings.saved'))
      onOpenChange(false)
    },
    onError: () => toast.error(t('projects:detail.settings.saveFailed')),
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveProject(project.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('projects:detail.settings.archived'))
      onOpenChange(false)
      onArchived()
    },
    onError: () => toast.error(t('projects:card.archiveFailed')),
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{t('projects:detail.settings.title')}</DrawerTitle>
          <DrawerDescription>{t('projects:detail.settings.description')}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-tags">{t('projects:detail.settings.tags')}</Label>
            <TagsInput
              id="project-tags"
              value={tags}
              onChange={setTags}
              placeholder={t('projects:fields.tagsPlaceholder')}
              ariaLabel={t('projects:detail.settings.tags')}
              disabled={!canManage}
            />
            <p className="text-xs text-muted-foreground">
              {t('projects:detail.settings.tagsHint')}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t('projects:detail.settings.reminder')}</Label>
            <TimePicker
              value={reminderTime}
              onChange={setReminderTime}
              placeholder={t('projects:detail.settings.reminder')}
              ariaLabel={t('projects:detail.settings.reminder')}
              disabled={!canManage}
            />
            <p className="text-xs text-muted-foreground">
              {t('projects:detail.settings.reminderHint')}
            </p>
          </div>

          {canManage ? (
            <Collapsible className="rounded-lg border border-destructive/30 p-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-destructive"
                >
                  <span className="flex items-center gap-2">
                    <TriangleAlert className="size-4" aria-hidden />
                    {t('projects:detail.settings.danger')}
                  </span>
                  <ChevronDown className="size-4" aria-hidden />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  {t('projects:detail.settings.dangerHint')}
                </p>
                <Popconfirm
                  title={t('projects:detail.settings.archiveTitle', { project: project.name })}
                  description={t('projects:detail.settings.archiveDescription')}
                  confirmLabel={t('projects:detail.settings.archive')}
                  onConfirm={() => archiveMutation.mutate()}
                  pending={archiveMutation.isPending}
                  destructive
                >
                  <Button variant="destructive" size="sm" disabled={archiveMutation.isPending}>
                    {t('projects:detail.settings.archive')}
                  </Button>
                </Popconfirm>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
        <DrawerFooter className="border-t">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!canManage || saveMutation.isPending}
          >
            {t('projects:detail.settings.save')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">{t('common:actions.cancel')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
