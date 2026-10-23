import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tree, type TreeItem } from '@/components/enterprise/tree/tree'
import type { Department } from '@/types'

export function DepartmentTreePanel({
  departments,
  selectedId,
  onSelect,
}: {
  departments: Department[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  const { t } = useTranslation()

  const items = useMemo<TreeItem[]>(
    () =>
      departments.map((department) => ({
        id: department.id,
        parentId: department.parentId,
        label: t(`common:departments.${department.name}`, { defaultValue: department.name }),
        description: t('departments:memberCount', { count: department.memberCount }),
        badge: String(department.memberCount),
      })),
    [departments, t],
  )

  return (
    <Card className="shadow-soft">
      <CardHeader className="gap-1">
        <CardTitle className="text-base">{t('departments:treeLabel')}</CardTitle>
        <CardDescription>{t('departments:subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tree
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          ariaLabel={t('departments:treeLabel')}
          emptyLabel={t('departments:treeEmpty')}
        />
      </CardContent>
    </Card>
  )
}
