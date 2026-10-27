import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowUpRight,
  Banknote,
  FolderKanban,
  LayoutGrid,
  List,
  Plus,
  SearchX,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'

import { Can } from '@/components/common/can'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@fish-admin/react/internal/page-header'
import {
  type CascaderOption,
  Cascader,
  Carousel,
  type CarouselSlide,
  Combobox,
  Statistic,
  Trend,
  QueryFilter,
  type FilterField,
  type FilterValue,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Progress,
  Segmented,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fish-admin/react'

import { PERMISSION_CODES } from '@/config/permissions'
import { useDepartmentsQuery } from '@/features/departments/queries'
import { useCan } from '@/hooks/use-can'
import { useDocumentTitle } from '@/lib/document-title'
import { formatCurrency, formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import type { Department, Project, ProjectPriority, ProjectStatus } from '@/types'

import { archiveProject } from '../api'
import type { ProjectSortKey, ProjectsSearch } from '../search'
import {
  useProjectListQuery,
  useProjectOverviewQuery,
  useProjectUserOptionsQuery,
} from '../queries'
import { ProjectCard } from './project-card'
import { ProjectCreateDialog } from './project-create-dialog'
import { ProjectKeyMark, ProjectPriorityBadge, ProjectStatusBadge } from './project-badges'

const PROJECT_STATUSES: ProjectStatus[] = ['planning', 'active', 'review', 'done']
const PROJECT_PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high']

type PageToken = number | 'start-ellipsis' | 'end-ellipsis'

function pageTokens(current: number, count: number): PageToken[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)

  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  const tokens: PageToken[] = [1]
  if (start > 2) tokens.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) tokens.push(page)
  if (end < count - 1) tokens.push('end-ellipsis')
  tokens.push(count)
  return tokens
}

function toCascaderOptions(
  departments: Department[],
  translate: (name: string) => string,
): CascaderOption[] {
  const childrenByParent = new Map<string | null, Department[]>()
  for (const department of departments) {
    const list = childrenByParent.get(department.parentId) ?? []
    list.push(department)
    childrenByParent.set(department.parentId, list)
  }

  const build = (parentId: string | null): CascaderOption[] =>
    (childrenByParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((department) => {
        const children = build(department.id)
        return {
          value: department.id,
          label: translate(department.name),
          ...(children.length > 0 ? { children } : {}),
        }
      })

  return build(null)
}

export function ProjectsPage({
  search,
  onSearchChange,
}: {
  search: ProjectsSearch
  onSearchChange: (updater: (previous: ProjectsSearch) => ProjectsSearch) => void
}) {
  const { t, i18n } = useTranslation(['projects', 'common'])
  useDocumentTitle(t('projects:title'))
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const canManage = useCan(PERMISSION_CODES.projectManage)

  const [queryDraft, setQueryDraft] = useState(search.q ?? '')
  const [createOpen, setCreateOpen] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const list = useProjectListQuery({
    page: search.page,
    pageSize: search.pageSize,
    q: search.q,
    status: search.status,
    priority: search.priority,
    ownerId: search.ownerId,
    departmentId: search.departmentId,
    archived: search.archived,
    sort: search.sort,
    order: search.order,
  })
  const overview = useProjectOverviewQuery()
  const users = useProjectUserOptionsQuery()
  const departments = useDepartmentsQuery()

  useEffect(() => {
    setQueryDraft(search.q ?? '')
  }, [search.q])

  useEffect(() => {
    const trimmed = queryDraft.trim()
    if (trimmed === (search.q ?? '')) return
    const timer = window.setTimeout(() => {
      onSearchChange((previous) => ({ ...previous, q: trimmed || undefined, page: 1 }))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [queryDraft, search.q, onSearchChange])

  const archiveMutation = useMutation({
    mutationFn: (project: Project) => archiveProject(project.id),
    onMutate: (project) => setArchivingId(project.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
      toast.success(t('projects:card.archived'))
    },
    onError: () => toast.error(t('projects:card.archiveFailed')),
    onSettled: () => setArchivingId(null),
  })

  const departmentOptions = useMemo(
    () =>
      toCascaderOptions(departments.data ?? [], (name) =>
        t(`common:departments.${name}`, { defaultValue: name }),
      ),
    [departments.data, t],
  )

  const ownerOptions = useMemo(
    () =>
      (users.data ?? []).map((user) => ({
        value: user.id,
        label: user.name,
        description: user.email,
      })),
    [users.data],
  )

  const filterFields = useMemo<FilterField[]>(
    () => [
      {
        type: 'text',
        name: 'q',
        label: t('common:actions.search'),
        placeholder: t('projects:searchPlaceholder'),
      },
      {
        type: 'select',
        name: 'status',
        label: t('projects:filters.status'),
        allLabel: t('projects:filters.allStatuses'),
        options: PROJECT_STATUSES.map((status) => ({
          value: status,
          label: t(`projects:status.${status}`),
        })),
      },
      {
        type: 'select',
        name: 'priority',
        label: t('projects:filters.priority'),
        allLabel: t('projects:filters.allPriorities'),
        options: PROJECT_PRIORITIES.map((priority) => ({
          value: priority,
          label: t(`projects:priority.${priority}`),
        })),
      },
      {
        type: 'custom',
        name: 'ownerId',
        label: t('projects:filters.owner'),
        render: (value, onChange) => (
          <Combobox
            options={ownerOptions}
            value={typeof value === 'string' && value ? value : null}
            onChange={onChange}
            onClear={() => onChange('')}
            placeholder={t('projects:filters.allOwners')}
            searchPlaceholder={t('common:actions.search')}
            emptyLabel={t('common:states.empty.title')}
            ariaLabel={t('projects:filters.owner')}
            clearLabel={t('common:actions.clearSearch')}
            disabled={users.isPending}
          />
        ),
      },
      {
        type: 'custom',
        name: 'departmentId',
        label: t('projects:filters.department'),
        render: (value, onChange) => (
          <Cascader
            options={departmentOptions}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(next) => onChange(next)}
            onClear={() => onChange([])}
            placeholder={t('projects:filters.allDepartments')}
            ariaLabel={t('projects:filters.department')}
            clearLabel={t('common:actions.clearSearch')}
            emptyLabel={t('common:states.empty.title')}
            disabled={departments.isPending}
          />
        ),
      },
      {
        type: 'boolean',
        name: 'archived',
        label: t('projects:filters.archived'),
      },
    ],
    [t, ownerOptions, users.isPending, departmentOptions, departments.isPending],
  )

  const filterValue = useMemo<FilterValue>(
    () => ({
      q: queryDraft,
      status: search.status ?? '',
      priority: search.priority ?? '',
      ownerId: search.ownerId ?? '',
      departmentId: search.departmentId ? [search.departmentId] : [],
      archived: search.archived,
    }),
    [
      queryDraft,
      search.status,
      search.priority,
      search.ownerId,
      search.departmentId,
      search.archived,
    ],
  )

  function handleFilterChange(next: FilterValue) {
    setQueryDraft(typeof next.q === 'string' ? next.q : '')

    const nextStatus = PROJECT_STATUSES.includes(next.status as ProjectStatus)
      ? (next.status as ProjectStatus)
      : undefined
    const nextPriority = PROJECT_PRIORITIES.includes(next.priority as ProjectPriority)
      ? (next.priority as ProjectPriority)
      : undefined
    const nextOwner = typeof next.ownerId === 'string' && next.ownerId ? next.ownerId : undefined
    const nextDepartment = Array.isArray(next.departmentId)
      ? (next.departmentId.filter((entry): entry is string => typeof entry === 'string').at(-1) ??
        undefined)
      : undefined
    const nextArchived = next.archived === true

    if (
      nextStatus === search.status &&
      nextPriority === search.priority &&
      nextOwner === search.ownerId &&
      nextDepartment === search.departmentId &&
      nextArchived === search.archived
    ) {
      return
    }

    onSearchChange((previous) => ({
      ...previous,
      status: nextStatus,
      priority: nextPriority,
      ownerId: nextOwner,
      departmentId: nextDepartment,
      archived: nextArchived,
      page: 1,
    }))
  }

  function handleSort(key: ProjectSortKey) {
    onSearchChange((previous) => ({
      ...previous,
      sort: key,
      order: previous.sort === key && previous.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  const projects = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const pageCount = Math.max(list.data?.pageCount ?? 1, 1)
  const hasFilters = Boolean(
    search.q || search.status || search.priority || search.ownerId || search.departmentId,
  )

  const portfolio = useMemo(() => {
    const items = overview.data ?? []
    const budget = items.reduce((sum, project) => sum + project.budget, 0)
    const spent = items.reduce((sum, project) => sum + project.spent, 0)
    const completion = items.length
      ? Math.round(items.reduce((sum, project) => sum + project.progress, 0) / items.length)
      : 0
    return {
      active: items.filter((project) => project.status === 'active').length,
      budget,
      spent,
      completion,
      utilization: budget > 0 ? Math.round((spent / budget) * 100) : 0,
    }
  }, [overview.data])

  const featuredSlides = useMemo<CarouselSlide[]>(
    () =>
      (overview.data ?? [])
        .filter((project) => project.featured)
        .map((project) => ({
          id: project.id,
          content: (
            <div className="grid gap-5 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0 space-y-3 pl-6 sm:pl-8">
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectKeyMark projectKey={project.key} />
                  <ProjectStatusBadge
                    status={project.status}
                    label={t(`projects:status.${project.status}`)}
                  />
                  <ProjectPriorityBadge
                    priority={project.priority}
                    label={t(`projects:priority.${project.priority}`)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold tracking-tight">{project.name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span>
                    {t('projects:card.budget', {
                      spent: formatCurrency(project.spent, i18n.language),
                      budget: formatCurrency(project.budget, i18n.language),
                    })}
                  </span>
                  <span>
                    {t('projects:card.due', {
                      date: formatDate(project.dueDate, i18n.language, {
                        month: 'short',
                        day: 'numeric',
                      }),
                    })}
                  </span>
                  <span>{t('projects:card.members', { count: project.memberIds.length })}</span>
                </div>
                <Progress
                  value={project.progress}
                  aria-label={`${project.name} · ${t('projects:detail.overview.progress')}`}
                  className="max-w-md"
                />
              </div>
              <Button asChild className="gap-1.5 self-start sm:self-center">
                <Link to="/projects/$id" params={{ id: project.id }}>
                  {t('projects:card.open')}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          ),
        })),
    [overview.data, t, i18n.language],
  )

  const emptyState = hasFilters ? (
    <EmptyState
      icon={SearchX}
      title={t('projects:empty.filteredTitle')}
      description={t('projects:empty.filteredDescription')}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onSearchChange((previous) => ({
              ...previous,
              q: undefined,
              status: undefined,
              priority: undefined,
              ownerId: undefined,
              departmentId: undefined,
              archived: false,
              page: 1,
            }))
          }
        >
          {t('projects:filters.clear')}
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={FolderKanban}
      title={t('projects:empty.title')}
      description={t('projects:empty.description')}
      action={
        <Can permission={PERMISSION_CODES.projectManage}>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t('projects:newProject')}
          </Button>
        </Can>
      }
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('projects:title')}
        description={t('projects:subtitle')}
        actions={
          <Can permission={PERMISSION_CODES.projectManage}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t('projects:newProject')}
            </Button>
          </Can>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="gap-1">
          <CardTitle className="text-base">{t('projects:featured.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('projects:featured.description')}</p>
        </CardHeader>
        <CardContent>
          <Carousel
            slides={featuredSlides}
            ariaLabel={t('projects:featured.ariaLabel')}
            previousLabel={t('projects:pagination.previous')}
            nextLabel={t('projects:pagination.next')}
            goToLabel={(index) => t('projects:featured.goTo', { index })}
            emptyLabel={t('projects:featured.empty')}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Statistic
          label={t('projects:stats.active')}
          value={portfolio.active}
          icon={FolderKanban}
          loading={overview.isPending}
        />
        <Statistic
          label={t('projects:stats.budget')}
          value={formatCurrency(portfolio.budget, i18n.language)}
          icon={Wallet}
          loading={overview.isPending}
        />
        <Statistic
          label={t('projects:stats.spent')}
          value={formatCurrency(portfolio.spent, i18n.language)}
          icon={Banknote}
          suffix={
            <span className="text-xs font-medium text-muted-foreground">
              {portfolio.utilization}%
            </span>
          }
          loading={overview.isPending}
        />
        <Statistic
          label={t('projects:stats.completion')}
          value={portfolio.completion}
          suffix="%"
          icon={TrendingUp}
          loading={overview.isPending}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Trend
          value={portfolio.completion - 60}
          precision={0}
          label={t('projects:stats.vsTarget')}
          invert
        />
        <Segmented
          value={search.view}
          onValueChange={(value) =>
            onSearchChange((previous) => ({
              ...previous,
              view: value === 'list' ? 'list' : 'board',
            }))
          }
          aria-label={t('projects:view.label')}
          options={[
            { value: 'board', label: t('projects:view.board'), icon: LayoutGrid },
            { value: 'list', label: t('projects:view.list'), icon: List },
          ]}
        />
      </div>

      <QueryFilter
        fields={filterFields}
        value={filterValue}
        onChange={handleFilterChange}
        labels={{
          reset: t('projects:filters.clear'),
          more: t('projects:filters.more'),
          less: t('projects:filters.less'),
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t('projects:pagination.summary', { total })}
        </p>
        {list.isFetching && !list.isPending ? (
          <Spinner size="sm" label={t('common:states.loading')} />
        ) : null}
      </div>

      {list.isError && !list.data ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : list.isPending ? (
        search.view === 'board' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: search.pageSize }).map((_, index) => (
              <Skeleton key={index} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed">{emptyState}</div>
      ) : search.view === 'board' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              language={i18n.language}
              canManage={canManage}
              archiving={archivingId === project.id}
              onArchive={(item) => archiveMutation.mutate(item)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton
                    label={t('projects:list.name')}
                    active={search.sort === 'name'}
                    order={search.order}
                    onClick={() => handleSort('name')}
                  />
                </TableHead>
                <TableHead>{t('projects:list.status')}</TableHead>
                <TableHead>{t('projects:list.owner')}</TableHead>
                <TableHead>
                  <SortButton
                    label={t('projects:list.progress')}
                    active={search.sort === 'progress'}
                    order={search.order}
                    onClick={() => handleSort('progress')}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label={t('projects:list.due')}
                    active={search.sort === 'dueDate'}
                    order={search.order}
                    onClick={() => handleSort('dueDate')}
                  />
                </TableHead>
                <TableHead>
                  <SortButton
                    label={t('projects:list.budget')}
                    active={search.sort === 'budget'}
                    order={search.order}
                    onClick={() => handleSort('budget')}
                  />
                </TableHead>
                <TableHead className="text-right">{t('projects:list.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <ProjectKeyMark projectKey={project.key} className="size-8 rounded-lg" />
                      <div className="min-w-0">
                        <Link
                          to="/projects/$id"
                          params={{ id: project.id }}
                          className="block truncate font-medium hover:underline"
                        >
                          {project.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProjectStatusBadge
                      status={project.status}
                      label={t(`projects:status.${project.status}`)}
                    />
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{project.ownerName}</TableCell>
                  <TableCell className="min-w-32">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={project.progress}
                        aria-label={`${project.name} · ${t('projects:detail.overview.progress')}`}
                        className="w-24"
                      />
                      <span className="text-xs text-muted-foreground">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {formatDate(project.dueDate, i18n.language, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatCurrency(project.spent, i18n.language)}
                    <span className="text-muted-foreground">
                      {' / '}
                      {formatCurrency(project.budget, i18n.language)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link
                        to="/projects/$id"
                        params={{ id: project.id }}
                        aria-label={t('projects:card.open')}
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-label={t('projects:pagination.previous')}
                aria-disabled={search.page <= 1}
                className={search.page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  if (search.page > 1) {
                    onSearchChange((previous) => ({ ...previous, page: previous.page - 1 }))
                  }
                }}
              />
            </PaginationItem>
            {pageTokens(search.page, pageCount).map((token) =>
              typeof token === 'number' ? (
                <PaginationItem key={token}>
                  <PaginationLink
                    href="#"
                    isActive={token === search.page}
                    aria-label={`${token}`}
                    onClick={(event) => {
                      event.preventDefault()
                      onSearchChange((previous) => ({ ...previous, page: token }))
                    }}
                  >
                    {token}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={token}>
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-label={t('projects:pagination.next')}
                aria-disabled={search.page >= pageCount}
                className={search.page >= pageCount ? 'pointer-events-none opacity-50' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  if (search.page < pageCount) {
                    onSearchChange((previous) => ({ ...previous, page: previous.page + 1 }))
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <ProjectCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        currentUserId={currentUserId}
      />
    </div>
  )
}

function SortButton({
  label,
  active,
  order,
  onClick,
}: {
  label: string
  active: boolean
  order: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? `${label} · ${order === 'asc' ? '▲' : '▼'}` : label}
      className="inline-flex items-center gap-1 rounded-sm text-left font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {label}
      <span aria-hidden className="text-[10px]">
        {active ? (order === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </button>
  )
}
