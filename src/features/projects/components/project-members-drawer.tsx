import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Transfer, type TransferItem } from '@/components/enterprise/transfer/transfer'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { Project } from '@/types'

import { updateProject } from '../api'
import { useProjectUserOptionsQuery } from '../queries'

export function ProjectMembersDrawer({
  project,
  open,
  onOpenChange,
}: {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation(['projects', 'common'])
  const queryClient = useQueryClient()
  const users = useProjectUserOptionsQuery()
  const [selected, setSelected] = useState<string[]>(project.memberIds)

  useEffect(() => {
    if (open) setSelected(project.memberIds)
  }, [open, project.memberIds])

  const items = useMemo<TransferItem[]>(
    () =>
      (users.data ?? []).map((user) => ({
        key: user.id,
        label: user.name,
        description: [user.jobTitle, user.email].filter(Boolean).join(' · '),
        group: t(`common:departments.${user.department}`, { defaultValue: user.department }),
        searchText: user.email,
        disabled: user.id === project.ownerId,
      })),
    [users.data, project.ownerId, t],
  )

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProject(project.id, {
        memberIds: Array.from(new Set([project.ownerId, ...selected])),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('projects:detail.members.saved'))
      onOpenChange(false)
    },
    onError: () => toast.error(t('projects:detail.members.saveFailed')),
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-2xl">
        <DrawerHeader>
          <DrawerTitle>{t('projects:detail.members.title')}</DrawerTitle>
          <DrawerDescription>{t('projects:detail.members.description')}</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <Transfer
            items={items}
            value={selected}
            onChange={setSelected}
            sourceTitle={t('projects:detail.members.available')}
            targetTitle={t('projects:detail.members.selected')}
            searchPlaceholder={t('projects:detail.members.search')}
            emptySourceLabel={t('common:states.empty.title')}
            emptyTargetLabel={t('projects:detail.members.empty')}
            disabled={users.isPending}
          />
        </div>
        <DrawerFooter className="border-t">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {t('projects:detail.members.save')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">{t('common:actions.cancel')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
