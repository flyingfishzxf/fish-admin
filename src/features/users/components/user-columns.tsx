import type { TFunction } from 'i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { StatusBadge } from '@/components/common/status-badge'
import { SortableHeader } from '@/components/data-table/sortable-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { getInitials } from '@/lib/utils'
import type { User } from '@/types'

import type { SortOrder, UserSortKey, UsersSearch } from '../search'

interface UserColumnsOptions {
  t: TFunction
  language: string
  currentUserId?: string
  canEdit: boolean
  canDelete: boolean
  selectable: boolean
  sort: UsersSearch['sort']
  order: SortOrder
  onSort: (key: UserSortKey) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function createUserColumns({
  t,
  language,
  currentUserId,
  canEdit,
  canDelete,
  selectable,
  sort,
  order,
  onSort,
  onEdit,
  onDelete,
}: UserColumnsOptions): ColumnDef<User>[] {
  const sortableHeader = (key: UserSortKey, label: string) => () => (
    <SortableHeader
      label={label}
      direction={sort === key ? order : false}
      onToggle={() => onSort(key)}
    />
  )

  const columns: ColumnDef<User>[] = selectable
    ? [
        {
          id: 'select',
          size: 44,
          minSize: 44,
          maxSize: 44,
          enableSorting: false,
          enableHiding: false,
          enableResizing: false,
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
              aria-label={t('users:bulk.selectAll')}
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
              disabled={!row.getCanSelect()}
              aria-label={t('users:bulk.selectRow', { name: row.original.name })}
            />
          ),
          meta: {
            className: 'w-11',
          },
        },
      ]
    : []

  columns.push(
    {
      accessorKey: 'name',
      size: 250,
      minSize: 160,
      header: sortableHeader('name', t('users:columns.name')),
      enableHiding: false,
      meta: {
        label: t('users:columns.name'),
        className: 'min-w-[160px]',
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
              <AvatarFallback className="bg-brand-soft text-xs font-semibold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                to="/users/$id"
                params={{ id: user.id }}
                className="block truncate text-sm font-medium hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {user.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground md:hidden">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'email',
      size: 230,
      minSize: 160,
      header: sortableHeader('email', t('users:columns.email')),
      meta: {
        label: t('users:columns.email'),
        className: 'hidden md:table-cell',
        headerClassName: 'hidden md:table-cell',
      },
      cell: ({ row }) => (
        <span className="block truncate text-sm text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'roleName',
      id: 'role',
      size: 140,
      minSize: 100,
      header: sortableHeader('role', t('users:columns.role')),
      meta: {
        label: t('users:columns.role'),
      },
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-normal">
          {row.original.roleName}
        </Badge>
      ),
    },
    {
      accessorKey: 'department',
      size: 150,
      minSize: 110,
      header: () => (
        <span className="text-[11px] font-semibold tracking-wide uppercase">
          {t('users:columns.department')}
        </span>
      ),
      enableSorting: false,
      meta: {
        label: t('users:columns.department'),
        className: 'hidden lg:table-cell',
        headerClassName: 'hidden lg:table-cell',
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {t(`common:departments.${row.original.department}`, {
            defaultValue: row.original.department,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      size: 130,
      minSize: 110,
      header: () => (
        <span className="text-[11px] font-semibold tracking-wide uppercase">
          {t('users:columns.status')}
        </span>
      ),
      enableSorting: false,
      meta: {
        label: t('users:columns.status'),
      },
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'createdAt',
      size: 150,
      minSize: 120,
      header: sortableHeader('createdAt', t('users:columns.createdAt')),
      meta: {
        label: t('users:columns.createdAt'),
        className: 'hidden xl:table-cell whitespace-nowrap',
        headerClassName: 'hidden xl:table-cell',
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt, language, { dateStyle: 'medium' })}
        </span>
      ),
    },
    {
      accessorKey: 'lastActiveAt',
      size: 150,
      minSize: 120,
      header: sortableHeader('lastActiveAt', t('users:columns.lastActive')),
      meta: {
        label: t('users:columns.lastActive'),
        className: 'hidden xl:table-cell whitespace-nowrap',
        headerClassName: 'hidden xl:table-cell',
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatRelativeTime(row.original.lastActiveAt, language)}
        </span>
      ),
    },
  )

  if (canEdit || canDelete) {
    columns.push({
      id: 'actions',
      size: 64,
      minSize: 64,
      maxSize: 64,
      enableHiding: false,
      enableSorting: false,
      enableResizing: false,
      header: () => <span className="sr-only">{t('users:columns.actions')}</span>,
      meta: {
        label: t('users:columns.actions'),
        className: 'text-right',
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label={t('users:columns.actions')}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit ? (
                <DropdownMenuItem onSelect={() => onEdit(user)}>
                  <Pencil />
                  {t('users:actions.edit')}
                </DropdownMenuItem>
              ) : null}
              {canEdit && canDelete ? <DropdownMenuSeparator /> : null}
              {canDelete ? (
                <DropdownMenuItem
                  variant="destructive"
                  disabled={user.id === currentUserId}
                  onSelect={() => onDelete(user)}
                >
                  <Trash2 />
                  {t('users:actions.delete')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })
  }

  return columns
}
