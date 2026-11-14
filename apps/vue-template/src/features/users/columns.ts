import type { User } from '@fish-admin/contracts'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowDown, ArrowUp, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import { h } from 'vue'
import { RouterLink } from 'vue-router'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/vue'

import { formatDate, formatRelativeTime } from '../../lib/format'
import { getInitials } from '../../lib/initials'
import type { Translate } from './form'
import UserStatusBadge from './UserStatusBadge.vue'

export interface UserColumnsOptions {
  t: Translate
  language: string
  currentUserId?: string
  canEdit: boolean
  canDelete: boolean
  /** Row checkboxes only exist when the user may act on the selection. */
  selectable: boolean
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

/**
 * Column widths mirror the React table so the two render the same hierarchy.
 * There are no resize handles here, so `size` is only the width hint the row
 * template writes onto each cell.
 */
const WIDTH = {
  select: 44,
  name: 240,
  email: 200,
  role: 140,
  department: 150,
  status: 130,
  createdAt: 150,
  lastActive: 150,
  actions: 64,
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
  selectable,
  onView,
  onEdit,
  onDelete,
}: UserColumnsOptions): ColumnDef<User>[] {
  const columns: ColumnDef<User>[] = selectable
    ? [
        {
          id: 'select',
          size: WIDTH.select,
          enableSorting: false,
          // Both markers keep the column out of the visibility menu: a table
          // whose checkboxes can be hidden has no way back to them.
          enableHiding: false,
          header: ({ table }) =>
            h(Checkbox, {
              modelValue:
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() ? 'indeterminate' : false),
              'aria-label': t('users:bulk.selectAll'),
              'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
                table.toggleAllPageRowsSelected(value === true),
            }),
          cell: ({ row }) =>
            h(Checkbox, {
              modelValue: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              'aria-label': t('users:bulk.selectRow', { name: row.original.name }),
              'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
                row.toggleSelected(value === true),
            }),
          meta: {
            label: t('users:bulk.selectAll'),
            group: 'identity',
            groupLabel: t('users:columnGroups.identity'),
          },
        },
      ]
    : []

  columns.push(
    {
      accessorKey: 'name',
      size: WIDTH.name,
      header: sortableHeader(t('users:columns.name')),
      enableHiding: false,
      meta: {
        label: t('users:columns.name'),
        group: 'identity',
        groupLabel: t('users:columnGroups.identity'),
      },
      cell: ({ row }) => {
        const user = row.original
        return h('div', { class: 'flex items-center gap-3' }, [
          h(Avatar, { class: 'size-9' }, () => [
            user.avatar ? h(AvatarImage, { src: user.avatar, alt: '' }) : null,
            h(AvatarFallback, { class: 'bg-brand-soft text-xs font-semibold text-primary' }, () =>
              getInitials(user.name),
            ),
          ]),
          // A real link, not a click handler: opening a user in a new tab and
          // copying the URL both have to work. The row menu offers the same
          // destination for people who never notice the name is clickable.
          h(
            'div',
            { class: 'min-w-0' },
            h(
              RouterLink,
              {
                to: { name: 'user-detail', params: { id: user.id } },
                class:
                  'block truncate text-sm font-medium hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none',
              },
              () => user.name,
            ),
          ),
        ])
      },
    },
    {
      accessorKey: 'email',
      size: WIDTH.email,
      enableSorting: false,
      header: () => t('users:columns.email'),
      meta: {
        label: t('users:columns.email'),
        group: 'contact',
        groupLabel: t('users:columnGroups.contact'),
      },
      cell: ({ row }) => h('span', { class: 'text-sm text-muted-foreground' }, row.original.email),
    },
    {
      accessorKey: 'roleName',
      id: 'role',
      size: WIDTH.role,
      enableSorting: false,
      header: () => t('users:columns.role'),
      meta: {
        label: t('users:columns.role'),
        group: 'access',
        groupLabel: t('users:columnGroups.access'),
      },
      cell: ({ row }) =>
        h(Badge, { variant: 'secondary', class: 'font-normal' }, () => row.original.roleName),
    },
    {
      accessorKey: 'department',
      size: WIDTH.department,
      enableSorting: false,
      header: () => t('users:columns.department'),
      meta: {
        label: t('users:columns.department'),
        group: 'access',
        groupLabel: t('users:columnGroups.access'),
      },
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-sm text-muted-foreground' },
          // The dictionary is keyed by the English name; an unmapped department
          // still has to render, so fall back to the raw value.
          t(`common:departments.${row.original.department}`, {
            defaultValue: row.original.department,
          }),
        ),
    },
    {
      accessorKey: 'status',
      size: WIDTH.status,
      enableSorting: false,
      header: () => t('users:columns.status'),
      meta: {
        label: t('users:columns.status'),
        group: 'access',
        groupLabel: t('users:columnGroups.access'),
      },
      cell: ({ row }) => h(UserStatusBadge, { status: row.original.status }),
    },
    {
      accessorKey: 'createdAt',
      size: WIDTH.createdAt,
      header: sortableHeader(t('users:columns.createdAt')),
      meta: {
        label: t('users:columns.createdAt'),
        group: 'activity',
        groupLabel: t('users:columnGroups.activity'),
      },
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-sm text-muted-foreground' },
          formatDate(row.original.createdAt, language, { dateStyle: 'medium' }),
        ),
    },
    {
      accessorKey: 'lastActiveAt',
      size: WIDTH.lastActive,
      header: sortableHeader(t('users:columns.lastActive')),
      meta: {
        label: t('users:columns.lastActive'),
        group: 'activity',
        groupLabel: t('users:columnGroups.activity'),
      },
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-sm text-muted-foreground' },
          formatRelativeTime(row.original.lastActiveAt, language),
        ),
    },
  )

  if (canEdit || canDelete) {
    columns.push({
      id: 'actions',
      size: WIDTH.actions,
      enableSorting: false,
      enableHiding: false,
      header: () => h('span', { class: 'sr-only' }, t('users:columns.actions')),
      meta: { label: t('users:columns.actions'), group: 'actions', groupLabel: '' },
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
                  h(DropdownMenuItem, { onSelect: () => onView(user) }, () => [
                    h(Eye, { 'aria-hidden': 'true' }),
                    t('users:actions.view'),
                  ]),
                  h(DropdownMenuSeparator),
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
