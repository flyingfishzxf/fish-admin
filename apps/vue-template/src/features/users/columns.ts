import type { User } from '@fish-admin/contracts'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import { h } from 'vue'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/vue'

import { formatDate } from '../../lib/format'
import { getInitials } from '../../lib/initials'
import type { Translate } from './form'

export interface UserColumnsOptions {
  t: Translate
  language: string
  currentUserId?: string
  canEdit: boolean
  canDelete: boolean
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

const STATUS_VARIANTS = {
  active: 'default',
  invited: 'secondary',
  inactive: 'outline',
} as const

const STATUS_DOTS = {
  active: 'bg-success',
  invited: 'bg-warning',
  inactive: 'bg-muted-foreground/60',
} as const

function sortableHeader(label: string): ColumnDef<User>['header'] {
  return ({ column }) => {
    const sorted = column.getIsSorted()
    return h(
      'button',
      {
        type: 'button',
        class: 'inline-flex items-center gap-1 uppercase',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      [
        label,
        h(sorted === 'desc' ? ArrowDown : ArrowUp, {
          class: 'size-3',
          'aria-hidden': 'true',
        }),
      ],
    )
  }
}

export function createUserColumns({
  t,
  language,
  currentUserId,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: UserColumnsOptions): ColumnDef<User>[] {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: sortableHeader(t('users:columns.name')),
      cell: ({ row }) => {
        const user = row.original
        return h('div', { class: 'flex items-center gap-3' }, [
          h(Avatar, { class: 'size-9' }, () => [
            user.avatar ? h(AvatarImage, { src: user.avatar, alt: '' }) : null,
            h(AvatarFallback, { class: 'bg-brand-soft text-xs font-semibold text-primary' }, () =>
              getInitials(user.name),
            ),
          ]),
          h('span', { class: 'text-sm font-medium' }, user.name),
        ])
      },
    },
    {
      accessorKey: 'email',
      enableSorting: false,
      header: () => t('users:columns.email'),
      cell: ({ row }) => h('span', { class: 'text-sm text-muted-foreground' }, row.original.email),
    },
    {
      accessorKey: 'roleName',
      enableSorting: false,
      header: () => t('users:columns.role'),
      cell: ({ row }) =>
        h(Badge, { variant: 'secondary', class: 'font-normal' }, () => row.original.roleName),
    },
    {
      accessorKey: 'status',
      enableSorting: false,
      header: () => t('users:columns.status'),
      cell: ({ row }) => {
        const status = row.original.status
        return h(Badge, { variant: STATUS_VARIANTS[status], class: 'gap-1.5 font-normal' }, () => [
          h('span', {
            class: ['size-1.5 rounded-full', STATUS_DOTS[status]],
            'aria-hidden': 'true',
          }),
          t(`common:status.${status}`),
        ])
      },
    },
    {
      accessorKey: 'createdAt',
      header: sortableHeader(t('users:columns.createdAt')),
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-sm text-muted-foreground' },
          formatDate(row.original.createdAt, language, { dateStyle: 'medium' }),
        ),
    },
  ]

  if (canEdit || canDelete) {
    columns.push({
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      header: () => h('span', { class: 'sr-only' }, t('users:columns.actions')),
      cell: ({ row }) => {
        const user = row.original
        return h(DropdownMenu, null, {
          default: () => [
            h(
              DropdownMenuTrigger,
              { asChild: true },
              {
                default: () =>
                  h(
                    Button,
                    {
                      variant: 'ghost',
                      size: 'icon-sm',
                      class: 'ms-auto',
                      'aria-label': t('users:columns.actions'),
                    },
                    () => h(MoreHorizontal, { class: 'size-4', 'aria-hidden': 'true' }),
                  ),
              },
            ),
            h(
              DropdownMenuContent,
              { align: 'end' },
              {
                default: () => [
                  canEdit
                    ? h(DropdownMenuItem, { onSelect: () => onEdit(user) }, () => [
                        h(Pencil, { 'aria-hidden': 'true' }),
                        t('users:actions.edit'),
                      ])
                    : null,
                  canEdit && canDelete ? h(DropdownMenuSeparator) : null,
                  canDelete
                    ? h(
                        DropdownMenuItem,
                        {
                          variant: 'destructive',
                          disabled: user.id === currentUserId,
                          onSelect: () => onDelete(user),
                        },
                        () => [h(Trash2, { 'aria-hidden': 'true' }), t('users:actions.delete')],
                      )
                    : null,
                ],
              },
            ),
          ],
        })
      },
    })
  }

  return columns
}
