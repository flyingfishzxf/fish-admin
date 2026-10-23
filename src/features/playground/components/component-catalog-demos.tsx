import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table'
import { Activity, Download, Plus, TrendingUp, Users } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/empty-state'
import { DatePicker } from '@/components/enterprise/date-picker/date-picker'
import { PageContainer } from '@/components/enterprise/page-container/page-container'
import { Popconfirm } from '@/components/enterprise/popconfirm/popconfirm'
import { Statistic } from '@/components/enterprise/statistic/statistic'
import { TimePicker } from '@/components/enterprise/time-picker/time-picker'
import { ProTable } from '@/components/pro/pro-table/pro-table'
import { QueryFilter } from '@/components/pro/query-filter/query-filter'
import type { FilterField, FilterValue } from '@/components/pro/query-filter/query-filter-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDayDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'

function DemoSurface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border bg-muted/20 p-4', className)}>{children}</div>
}

export function DatePickerDemo() {
  const { t, i18n } = useTranslation()
  const [value, setValue] = useState<string>()

  return (
    <DemoSurface className="flex flex-wrap items-center gap-3">
      <DatePicker
        value={value}
        onChange={setValue}
        placeholder={t('catalog:demos.datePicker.placeholder')}
        ariaLabel={t('catalog:demos.datePicker.ariaLabel')}
        className="w-56"
      />
      <p className="text-xs text-muted-foreground">
        {value ? formatDayDisplay(value, i18n.language) : t('catalog:demos.datePicker.placeholder')}
      </p>
    </DemoSurface>
  )
}

export function TimePickerDemo() {
  const { t } = useTranslation()
  const [value, setValue] = useState<string>()

  return (
    <DemoSurface className="flex flex-wrap items-center gap-3">
      <TimePicker
        value={value}
        onChange={setValue}
        placeholder={t('catalog:demos.timePicker.placeholder')}
        ariaLabel={t('catalog:demos.timePicker.ariaLabel')}
        className="w-44"
      />
      <p className="font-mono text-xs text-muted-foreground">{value ?? '--:--'}</p>
    </DemoSurface>
  )
}

export function PopconfirmDemo() {
  const { t } = useTranslation()

  return (
    <DemoSurface>
      <Popconfirm
        title={t('catalog:demos.popconfirm.confirmTitle')}
        description={t('catalog:demos.popconfirm.confirmDescription')}
        confirmLabel={t('catalog:demos.popconfirm.confirm')}
        cancelLabel={t('catalog:demos.popconfirm.cancel')}
        onConfirm={() => toast.success(t('catalog:demos.popconfirm.deleted'))}
        destructive
      >
        <Button variant="outline" size="sm">
          {t('catalog:demos.popconfirm.trigger')}
        </Button>
      </Popconfirm>
    </DemoSurface>
  )
}

export function StatisticDemo() {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Statistic
        label={t('catalog:demos.statistic.revenue')}
        value={128400}
        prefix="$"
        suffix={t('catalog:demos.statistic.revenueSuffix')}
        trend={{ value: 12.4, label: t('catalog:demos.statistic.trendLabel') }}
        icon={TrendingUp}
      />
      <Statistic label={t('catalog:demos.statistic.members')} value={2480} icon={Users} />
      <Statistic
        label={t('catalog:demos.statistic.churn')}
        value={1.8}
        precision={1}
        suffix="%"
        trend={{ value: -0.6, label: t('catalog:demos.statistic.trendLabel') }}
        icon={Activity}
      />
    </div>
  )
}

export function PageContainerDemo() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('overview')

  return (
    <div className="overflow-hidden rounded-lg border bg-background p-4">
      <PageContainer
        title={t('catalog:demos.pageContainer.pageTitle')}
        description={t('catalog:demos.pageContainer.pageDescription')}
        actions={
          <Button size="sm" variant="outline">
            <Download className="size-4" />
            {t('catalog:demos.pageContainer.action')}
          </Button>
        }
        tabs={
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="overview">
                {t('catalog:demos.pageContainer.tabOverview')}
              </TabsTrigger>
              <TabsTrigger value="invoices">
                {t('catalog:demos.pageContainer.tabInvoices')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        footer={
          <p className="text-xs text-muted-foreground">{t('catalog:demos.pageContainer.footer')}</p>
        }
      >
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {t('catalog:demos.pageContainer.body')}
        </p>
      </PageContainer>
    </div>
  )
}

export function QueryFilterDemo() {
  const { t } = useTranslation()
  const [value, setValue] = useState<FilterValue>({})

  const fields = useMemo<FilterField[]>(
    () => [
      {
        type: 'text',
        name: 'name',
        label: t('catalog:demos.queryFilter.name'),
        placeholder: t('catalog:demos.queryFilter.namePlaceholder'),
      },
      {
        type: 'select',
        name: 'status',
        label: t('catalog:demos.queryFilter.status'),
        allLabel: t('catalog:demos.queryFilter.allStatuses'),
        options: [
          { value: 'active', label: t('catalog:demos.queryFilter.statusActive') },
          { value: 'invited', label: t('catalog:demos.queryFilter.statusInvited') },
          { value: 'inactive', label: t('catalog:demos.queryFilter.statusInactive') },
        ],
      },
      { type: 'boolean', name: 'verified', label: t('catalog:demos.queryFilter.verified') },
      {
        type: 'dateRange',
        fromName: 'from',
        toName: 'to',
        label: t('catalog:demos.queryFilter.joined'),
      },
    ],
    [t],
  )

  const activeCount = fields.filter((field) => {
    if (field.type === 'dateRange') {
      return Boolean(value[field.fromName] || value[field.toName])
    }
    if (field.type === 'boolean') return value[field.name] === true
    return typeof value[field.name] === 'string' && value[field.name] !== ''
  }).length

  return (
    <DemoSurface className="space-y-3">
      <QueryFilter
        fields={fields}
        value={value}
        onChange={setValue}
        labels={{
          reset: t('catalog:demos.queryFilter.reset'),
          more: t('catalog:demos.queryFilter.more'),
          less: t('catalog:demos.queryFilter.less'),
        }}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {t('catalog:demos.queryFilter.active', { count: activeCount })}
      </p>
    </DemoSurface>
  )
}

type DemoMember = {
  id: string
  name: string
  team: 'engineering' | 'design' | 'product'
  status: 'active' | 'invited'
  joined: string
}

const MEMBERS: DemoMember[] = [
  { id: 'm-1', name: 'Ada Lovelace', team: 'engineering', status: 'active', joined: '2024-11-04' },
  { id: 'm-2', name: 'Grace Hopper', team: 'engineering', status: 'active', joined: '2025-01-18' },
  { id: 'm-3', name: 'Alan Turing', team: 'product', status: 'invited', joined: '2025-03-02' },
  {
    id: 'm-4',
    name: 'Katherine Johnson',
    team: 'design',
    status: 'active',
    joined: '2024-08-23',
  },
  {
    id: 'm-5',
    name: 'Linus Torvalds',
    team: 'engineering',
    status: 'invited',
    joined: '2025-05-14',
  },
  {
    id: 'm-6',
    name: 'Margaret Hamilton',
    team: 'product',
    status: 'active',
    joined: '2024-12-09',
  },
  { id: 'm-7', name: 'Hedy Lamarr', team: 'design', status: 'active', joined: '2025-02-27' },
  {
    id: 'm-8',
    name: 'Tim Berners-Lee',
    team: 'engineering',
    status: 'invited',
    joined: '2025-04-06',
  },
]

export function ProTableDemo() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [team, setTeam] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return MEMBERS.filter(
      (member) =>
        (team === 'all' || member.team === team) &&
        (query === '' || member.name.toLowerCase().includes(query)),
    )
  }, [search, team])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const columns = useMemo<ColumnDef<DemoMember>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
            aria-label={t('common:enterprise.selectAll')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
            aria-label={row.original.name}
          />
        ),
        enableSorting: false,
        size: 36,
      },
      {
        accessorKey: 'name',
        header: t('catalog:demos.proTable.member'),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'team',
        header: t('catalog:demos.proTable.team'),
        cell: ({ row }) => t(`catalog:demos.proTable.teams.${row.original.team}`),
      },
      {
        accessorKey: 'status',
        header: t('catalog:demos.proTable.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'active' ? 'secondary' : 'outline'}>
            {t(`catalog:demos.proTable.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: 'joined',
        header: t('catalog:demos.proTable.joined'),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatDayDisplay(row.original.joined, i18n.language)}
          </span>
        ),
      },
    ],
    [t, i18n.language],
  )

  const table = useReactTable({
    data: pageRows,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    // Pagination is controlled here; pageRows is new each render, so auto-reset would loop.
    autoResetPageIndex: false,
  })

  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  return (
    <ProTable
      table={table}
      empty={
        <EmptyState
          icon={Users}
          title={t('catalog:demos.proTable.empty')}
          description={t('catalog:demos.proTable.hint')}
        />
      }
      search={{
        value: search,
        onChange: (next) => {
          setSearch(next)
          setPage(1)
        },
        placeholder: t('catalog:demos.proTable.searchPlaceholder'),
        ariaLabel: t('catalog:demos.proTable.searchLabel'),
        clearLabel: t('catalog:demos.proTable.clearSearch'),
      }}
      filters={
        <Select
          value={team}
          onValueChange={(next) => {
            setTeam(next)
            setPage(1)
          }}
        >
          <SelectTrigger className="h-9 w-[9.5rem]" aria-label={t('catalog:demos.proTable.team')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('catalog:demos.proTable.filterAll')}</SelectItem>
            {(['engineering', 'design', 'product'] as const).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`catalog:demos.proTable.teams.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.success(t('catalog:demos.proTable.added'))}
        >
          <Plus className="size-4" />
          {t('catalog:demos.proTable.addMember')}
        </Button>
      }
      pagination={{
        page,
        pageCount,
        total: filtered.length,
        pageSize,
        onPageChange: setPage,
        onPageSizeChange: (next) => {
          setPageSize(next)
          setPage(1)
        },
        pageSizeOptions: [5, 10, 20],
      }}
      selection={
        selectedCount > 0
          ? {
              count: selectedCount,
              label: t('catalog:demos.proTable.selected', { count: selectedCount }),
              clearLabel: t('catalog:demos.proTable.clearSelection'),
              onClear: () => setRowSelection({}),
              children: (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRowSelection({})
                    toast.success(t('catalog:demos.proTable.activated', { count: selectedCount }))
                  }}
                >
                  {t('catalog:demos.proTable.makeActive')}
                </Button>
              ),
            }
          : undefined
      }
    />
  )
}
