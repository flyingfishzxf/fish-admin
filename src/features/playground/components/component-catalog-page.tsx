import { Link } from '@tanstack/react-router'
import { Boxes, Layers, LayoutGrid, Search, SearchX, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageContainer } from '@/components/enterprise/page-container/page-container'
import { Statistic } from '@/components/enterprise/statistic/statistic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import {
  COMPONENTS,
  COMPONENT_CATEGORIES,
  COMPONENT_COUNTS,
  DEMOED_COMPONENTS,
  type ComponentCategory,
  type ComponentEntry,
} from '@/config/components'
import { useDocumentTitle } from '@/lib/document-title'
import { cn } from '@/lib/utils'

import { CATALOG_DEMOS } from './component-catalog-demo-map'

type CategoryFilter = 'all' | ComponentCategory

const DEMO_SPANS: Record<string, string> = {
  statistic: 'md:col-span-2',
  'page-container': 'md:col-span-2',
  'query-filter': 'md:col-span-2',
  'anchor-nav': 'md:col-span-2',
  'pro-form': 'md:col-span-2',
  'pro-table': 'md:col-span-2 xl:col-span-3',
  'detail-page': 'md:col-span-2',
  'import-wizard': 'md:col-span-2',
  'editable-table': 'md:col-span-2 xl:col-span-3',
}

export function ComponentCatalogPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('catalog:title', { count: COMPONENTS.length }))

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')

  const patternCount = COMPONENT_COUNTS.enterprise + COMPONENT_COUNTS.pro

  const filterOptions = useMemo(
    () => [
      {
        value: 'all',
        label: <FilterLabel label={t('catalog:filters.all')} count={COMPONENTS.length} />,
      },
      {
        value: 'primitive',
        label: (
          <FilterLabel label={t('catalog:filters.primitive')} count={COMPONENT_COUNTS.primitive} />
        ),
      },
      {
        value: 'enterprise',
        label: (
          <FilterLabel
            label={t('catalog:filters.enterprise')}
            count={COMPONENT_COUNTS.enterprise}
          />
        ),
      },
      {
        value: 'pro',
        label: <FilterLabel label={t('catalog:filters.pro')} count={COMPONENT_COUNTS.pro} />,
      },
    ],
    [t],
  )

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return COMPONENTS.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false
      if (!needle) return true
      const description = t(`catalog:components.${entry.id}.description`)
      const haystack = `${entry.name} ${entry.id} ${description} ${t(
        `catalog:categories.${entry.category}`,
      )}`
      return haystack.toLowerCase().includes(needle)
    })
  }, [category, query, t])

  const clearFilters = () => {
    setQuery('')
    setCategory('all')
  }

  return (
    <PageContainer
      eyebrow={t('catalog:eyebrow')}
      title={t('catalog:title', { count: COMPONENTS.length })}
      description={t('catalog:subtitle')}
      actions={
        <>
          <Badge variant="outline">{t('catalog:hero.runtime')}</Badge>
          <Badge variant="secondary">{t('catalog:hero.license')}</Badge>
        </>
      }
    >
      <section
        aria-label={t('catalog:stats.total')}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Statistic label={t('catalog:stats.total')} value={COMPONENTS.length} icon={Boxes} />
        <Statistic
          label={t('catalog:stats.demoed')}
          value={DEMOED_COMPONENTS.length}
          icon={Sparkles}
        />
        <Statistic
          label={t('catalog:stats.primitives')}
          value={COMPONENT_COUNTS.primitive}
          icon={LayoutGrid}
        />
        <Statistic label={t('catalog:stats.patterns')} value={patternCount} icon={Layers} />
      </section>

      <section
        aria-label={t('catalog:filters.searchLabel')}
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="relative w-full min-w-0 sm:max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('catalog:filters.searchPlaceholder')}
            aria-label={t('catalog:filters.searchLabel')}
            className="h-9 pl-9"
          />
          {query ? (
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              aria-label={t('common:actions.clearSearch')}
              onClick={() => setQuery('')}
            >
              <X className="size-3.5" />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={filterOptions}
            value={category}
            onValueChange={(next) => setCategory(next as CategoryFilter)}
            aria-label={t('catalog:filters.searchLabel')}
            size="sm"
          />
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {t('catalog:filters.summary', {
              visible: visible.length,
              total: COMPONENTS.length,
            })}
          </span>
        </div>
      </section>

      {visible.length === 0 ? (
        <Empty variant="outline">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>{t('catalog:filters.emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('catalog:filters.emptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {t('catalog:filters.clear')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        COMPONENT_CATEGORIES.map((categoryName) => {
          const items = visible.filter((entry) => entry.category === categoryName)
          if (items.length === 0) return null

          return (
            <section key={categoryName} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {t(`catalog:filters.${categoryName}`)}
                </h2>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((entry) => (
                  <ComponentCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </PageContainer>
  )
}

function FilterLabel({ label, count }: { label: string; count: number }) {
  return (
    <>
      {label}
      <span className="hidden sm:inline"> · {count}</span>
    </>
  )
}

function ComponentCard({ entry }: { entry: ComponentEntry }) {
  const { t } = useTranslation()
  const Demo = CATALOG_DEMOS[entry.id]
  const description = t(`catalog:components.${entry.id}.description`)

  return (
    <Card
      id={`demo-${entry.id}`}
      className={cn('shadow-soft flex h-full min-w-0 scroll-mt-24 flex-col', DEMO_SPANS[entry.id])}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {entry.name}
              {entry.isNew ? (
                <Badge className="h-5 px-1.5 text-[10px]">{t('catalog:card.new')}</Badge>
              ) : null}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {t(`catalog:categories.${entry.category}`)}
          </Badge>
        </div>
      </CardHeader>

      {Demo ? (
        <CardContent className="flex-1">
          <Demo />
        </CardContent>
      ) : (
        <div className="flex-1" />
      )}

      <CardFooter className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-0">
        <code className="font-mono text-[11px] text-muted-foreground">{entry.id}</code>
        <CardDemoAction entry={entry} />
      </CardFooter>
    </Card>
  )
}

function CardDemoAction({ entry }: { entry: ComponentEntry }) {
  const { t } = useTranslation()

  if (CATALOG_DEMOS[entry.id]) {
    return null
  }

  if (entry.demo) {
    const [path, hash] = entry.demo.split('#')

    return (
      <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
        <Link to={path as '/ui'} hash={hash}>
          {t('catalog:card.inUiKit')}
        </Link>
      </Button>
    )
  }

  if (entry.usedIn) {
    return (
      <span className="text-xs text-muted-foreground">
        {t('catalog:card.usedIn', { route: entry.usedIn })}
      </span>
    )
  }

  return <span className="text-xs text-muted-foreground">{t('catalog:card.libraryOnly')}</span>
}
