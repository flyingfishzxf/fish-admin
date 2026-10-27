import { FileText, Rocket, UserPlus } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AnchorNav,
  type AnchorItem,
  BackTop,
  Cascader,
  type CascaderOption,
  Combobox,
  type ComboboxOption,
  ImagePreview,
  type PreviewImage,
  JsonViewer,
  NotificationCenter,
  type NotificationItem,
  Rate,
  Trend,
  TreeSelect,
  type TreeItem,
  Upload,
  type UploadItem,
  Watermark,
  ProForm,
  type ProFormField,
  type ProFormRule,
  type ProFormValues,
  cn,
} from '@fish-admin/react'

function DemoSurface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border bg-muted/20 p-4', className)}>{children}</div>
}

function gradientImage(from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="180" cy="180" r="120" fill="rgba(255,255,255,0.16)"/><circle cx="620" cy="440" r="170" fill="rgba(255,255,255,0.12)"/><path d="M0 460 Q 200 360 400 450 T 800 420 V600 H0 Z" fill="rgba(255,255,255,0.14)"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const PREVIEW_SOURCES = [
  gradientImage('#0f766e', '#22d3ee'),
  gradientImage('#4338ca', '#a855f7'),
  gradientImage('#b45309', '#fbbf24'),
]

const JSON_PAYLOAD = {
  user: {
    id: 'usr_1042',
    name: 'Ada Lovelace',
    roles: ['admin', 'auditor'],
    active: true,
  },
  session: { mfa: true, expiresIn: 3600 },
  meta: null,
}

export function TrendDemo() {
  const { t } = useTranslation()

  const rows = [
    { key: 'revenue', value: 12.4, label: t('catalog:demos.trend.vsLastMonth') },
    { key: 'churn', value: -0.6, label: t('catalog:demos.trend.vsLastMonth') },
    { key: 'users', value: 0, label: t('catalog:demos.trend.vsLastWeek') },
  ]

  return (
    <DemoSurface className="space-y-2">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t(`catalog:demos.trend.${row.key}`)}</span>
          <Trend value={row.value} label={row.label} />
        </div>
      ))}
    </DemoSurface>
  )
}

export function RateDemo() {
  const { t } = useTranslation()
  const [rating, setRating] = useState(3)

  return (
    <DemoSurface className="flex flex-wrap items-center gap-4">
      <Rate value={rating} onChange={setRating} ariaLabel={t('catalog:demos.rate.ariaLabel')} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {rating > 0
          ? t('common:enterprise.rateValue', { count: rating, max: 5 })
          : t('catalog:demos.rate.none')}
      </p>
    </DemoSurface>
  )
}

export function WatermarkDemo() {
  const { t } = useTranslation()

  return (
    <Watermark text={t('catalog:demos.watermark.text')} className="overflow-hidden rounded-lg">
      <div className="space-y-1 border bg-background p-4">
        <p className="text-sm font-medium">{t('catalog:demos.watermark.title')}</p>
        <p className="text-xs text-muted-foreground">{t('catalog:demos.watermark.body')}</p>
      </div>
    </Watermark>
  )
}

export function BackTopDemo() {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <DemoSurface className="space-y-2">
      <div className="relative">
        <div
          ref={scrollRef}
          role="region"
          aria-label={t('catalog:demos.backTop.title')}
          tabIndex={0}
          className="h-40 overflow-y-auto rounded-md border bg-background p-3"
        >
          <p className="text-sm font-medium">{t('catalog:demos.backTop.title')}</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {Array.from({ length: 14 }, (_, index) => (
              <li key={index}>{t('catalog:demos.backTop.row', { count: index + 1 })}</li>
            ))}
          </ul>
        </div>
        <BackTop
          targetRef={scrollRef}
          threshold={24}
          label={t('catalog:demos.backTop.label')}
          className="absolute right-3 bottom-3"
        />
      </div>
      <p className="text-xs text-muted-foreground">{t('catalog:demos.backTop.hint')}</p>
    </DemoSurface>
  )
}

export function JsonViewerDemo() {
  const { t } = useTranslation()

  return (
    <JsonViewer
      value={JSON_PAYLOAD}
      ariaLabel={t('catalog:demos.jsonViewer.ariaLabel')}
      className="max-w-full"
    />
  )
}

export function ImagePreviewDemo() {
  const { t } = useTranslation()

  const images = useMemo<PreviewImage[]>(
    () =>
      PREVIEW_SOURCES.map((src, index) => ({
        src,
        alt: t(`catalog:demos.imagePreview.alt${index + 1}`),
        caption: t(`catalog:demos.imagePreview.caption${index + 1}`),
      })),
    [t],
  )

  return <ImagePreview images={images} ariaLabel={t('catalog:demos.imagePreview.ariaLabel')} />
}

export function NotificationCenterDemo() {
  const { t } = useTranslation()
  const [readIds, setReadIds] = useState<string[]>([])

  const items = useMemo<NotificationItem[]>(
    () => [
      {
        id: 'invite',
        title: t('catalog:demos.notifications.inviteTitle'),
        description: t('catalog:demos.notifications.inviteDescription'),
        time: t('catalog:demos.notifications.inviteTime'),
        icon: UserPlus,
        read: readIds.includes('invite'),
      },
      {
        id: 'deploy',
        title: t('catalog:demos.notifications.deployTitle'),
        description: t('catalog:demos.notifications.deployDescription'),
        time: t('catalog:demos.notifications.deployTime'),
        icon: Rocket,
        read: readIds.includes('deploy'),
      },
      {
        id: 'report',
        title: t('catalog:demos.notifications.reportTitle'),
        description: t('catalog:demos.notifications.reportDescription'),
        time: t('catalog:demos.notifications.reportTime'),
        icon: FileText,
        read: readIds.includes('report'),
      },
    ],
    [t, readIds],
  )

  return (
    <DemoSurface className="flex items-center gap-3">
      <NotificationCenter
        items={items}
        ariaLabel={t('catalog:demos.notifications.ariaLabel')}
        title={t('catalog:demos.notifications.title')}
        markAllLabel={t('catalog:demos.notifications.markAll')}
        emptyLabel={t('catalog:demos.notifications.empty')}
        onItemClick={(item) => {
          setReadIds((current) => (current.includes(item.id) ? current : [...current, item.id]))
        }}
        onMarkAllRead={() => setReadIds(items.map((item) => item.id))}
      />
      <p className="text-xs text-muted-foreground">{t('catalog:demos.notifications.hint')}</p>
    </DemoSurface>
  )
}

export function ComboboxDemo() {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const options = useMemo<ComboboxOption[]>(
    () => [
      {
        value: 'engineering',
        label: t('catalog:demos.combobox.engineering'),
        description: t('catalog:demos.combobox.engineeringDescription'),
      },
      {
        value: 'design',
        label: t('catalog:demos.combobox.design'),
        description: t('catalog:demos.combobox.designDescription'),
      },
      {
        value: 'product',
        label: t('catalog:demos.combobox.product'),
        description: t('catalog:demos.combobox.productDescription'),
      },
    ],
    [t],
  )

  return (
    <DemoSurface className="max-w-sm">
      <Combobox
        options={options}
        value={value}
        onChange={setValue}
        onClear={() => setValue('')}
        placeholder={t('catalog:demos.combobox.placeholder')}
        searchPlaceholder={t('catalog:demos.combobox.searchPlaceholder')}
        ariaLabel={t('catalog:demos.combobox.ariaLabel')}
        clearLabel={t('catalog:demos.combobox.clear')}
        emptyLabel={t('catalog:demos.combobox.empty')}
      />
    </DemoSurface>
  )
}

export function CascaderDemo() {
  const { t } = useTranslation()
  const [value, setValue] = useState<string[]>([])

  const options = useMemo<CascaderOption[]>(
    () => [
      {
        value: 'americas',
        label: t('catalog:demos.cascader.americas'),
        children: [
          {
            value: 'us',
            label: t('catalog:demos.cascader.us'),
            children: [
              { value: 'california', label: t('catalog:demos.cascader.california') },
              { value: 'new-york', label: t('catalog:demos.cascader.newYork') },
            ],
          },
          {
            value: 'canada',
            label: t('catalog:demos.cascader.canada'),
            children: [{ value: 'ontario', label: t('catalog:demos.cascader.ontario') }],
          },
        ],
      },
      {
        value: 'europe',
        label: t('catalog:demos.cascader.europe'),
        children: [
          {
            value: 'germany',
            label: t('catalog:demos.cascader.germany'),
            children: [
              { value: 'berlin', label: t('catalog:demos.cascader.berlin') },
              { value: 'bavaria', label: t('catalog:demos.cascader.bavaria') },
            ],
          },
        ],
      },
    ],
    [t],
  )

  return (
    <DemoSurface className="max-w-sm">
      <Cascader
        options={options}
        value={value}
        onChange={setValue}
        onClear={() => setValue([])}
        placeholder={t('catalog:demos.cascader.placeholder')}
        ariaLabel={t('catalog:demos.cascader.ariaLabel')}
        clearLabel={t('catalog:demos.cascader.clear')}
        emptyLabel={t('catalog:demos.cascader.empty')}
      />
    </DemoSurface>
  )
}

export function UploadDemo() {
  const { t } = useTranslation()
  const [items, setItems] = useState<UploadItem[]>(() => [
    { id: 'existing-report', name: 'quarterly-report.pdf', size: 1_480_000, status: 'done' },
    {
      id: 'existing-assets',
      name: 'brand-assets.zip',
      size: 8_200_000,
      status: 'error',
      error: t('catalog:demos.upload.error'),
    },
  ])

  return (
    <Upload
      items={items}
      label={t('catalog:demos.upload.label')}
      hint={t('catalog:demos.upload.hint')}
      browseLabel={t('catalog:demos.upload.browse')}
      retryLabel={t('catalog:demos.upload.retry')}
      removeLabel={(item) => t('catalog:demos.upload.remove', { name: item.name })}
      onFiles={(files) =>
        setItems((current) => [
          ...current,
          ...files.map((file, index) => ({
            id: `${Date.now()}-${index}-${file.name}`,
            name: file.name,
            size: file.size,
            status: 'done' as const,
          })),
        ])
      }
      onRemove={(item) => setItems((current) => current.filter((entry) => entry.id !== item.id))}
      onRetry={(item) =>
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, status: 'done', progress: 100, error: undefined }
              : entry,
          ),
        )
      }
    />
  )
}

export function AnchorNavDemo() {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)

  const items = useMemo<AnchorItem[]>(
    () => [
      { id: 'demo-anchor-overview', label: t('catalog:demos.anchorNav.overview') },
      { id: 'demo-anchor-details', label: t('catalog:demos.anchorNav.details') },
      { id: 'demo-anchor-security', label: t('catalog:demos.anchorNav.security') },
      { id: 'demo-anchor-activity', label: t('catalog:demos.anchorNav.activity') },
    ],
    [t],
  )

  return (
    <DemoSurface>
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <AnchorNav
          items={items}
          ariaLabel={t('catalog:demos.anchorNav.ariaLabel')}
          rootRef={scrollRef}
          offset={12}
        />
        <div
          ref={scrollRef}
          role="region"
          aria-label={t('catalog:demos.anchorNav.ariaLabel')}
          tabIndex={0}
          className="h-56 space-y-4 overflow-y-auto rounded-md border bg-background p-4"
        >
          {items.map((item) => (
            <section
              key={item.id}
              id={item.id}
              className="min-h-32 scroll-mt-3 border-b pb-4 last:border-b-0 last:pb-0"
            >
              <h4 className="text-sm font-medium">{item.label}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('catalog:demos.anchorNav.body')}
              </p>
            </section>
          ))}
        </div>
      </div>
    </DemoSurface>
  )
}

export function TreeSelectDemo() {
  const { t } = useTranslation()
  const [value, setValue] = useState<string | null>('frontend')

  const items = useMemo<TreeItem[]>(
    () => [
      { id: 'engineering', parentId: null, label: t('catalog:demos.treeSelect.engineering') },
      { id: 'platform', parentId: 'engineering', label: t('catalog:demos.treeSelect.platform') },
      { id: 'frontend', parentId: 'engineering', label: t('catalog:demos.treeSelect.frontend') },
      { id: 'design', parentId: null, label: t('catalog:demos.treeSelect.design') },
      { id: 'product', parentId: null, label: t('catalog:demos.treeSelect.product') },
    ],
    [t],
  )

  return (
    <DemoSurface className="max-w-sm">
      <TreeSelect
        items={items}
        value={value}
        onChange={setValue}
        onClear={() => setValue(null)}
        placeholder={t('catalog:demos.treeSelect.placeholder')}
        ariaLabel={t('catalog:demos.treeSelect.ariaLabel')}
        clearLabel={t('catalog:demos.treeSelect.clear')}
      />
    </DemoSurface>
  )
}

export function ProFormDemo() {
  const { t } = useTranslation()
  const [snapshot, setSnapshot] = useState<ProFormValues>()

  const fields = useMemo<ProFormField[]>(
    () => [
      {
        name: 'fullName',
        label: t('catalog:demos.proForm.fullName'),
        required: true,
        minLength: 2,
        placeholder: t('catalog:demos.proForm.fullNamePlaceholder'),
      },
      {
        name: 'email',
        label: t('catalog:demos.proForm.email'),
        type: 'email',
        required: true,
        placeholder: t('catalog:demos.proForm.emailPlaceholder'),
      },
      {
        name: 'team',
        label: t('catalog:demos.proForm.team'),
        type: 'select',
        required: true,
        placeholder: t('catalog:demos.proForm.teamPlaceholder'),
        options: [
          { value: 'engineering', label: t('catalog:demos.proForm.teamEngineering') },
          { value: 'design', label: t('catalog:demos.proForm.teamDesign') },
          { value: 'product', label: t('catalog:demos.proForm.teamProduct') },
        ],
      },
      {
        name: 'startDate',
        label: t('catalog:demos.proForm.startDate'),
        type: 'date',
      },
      {
        name: 'bio',
        label: t('catalog:demos.proForm.bio'),
        type: 'textarea',
        colSpan: 2,
        maxLength: 200,
        placeholder: t('catalog:demos.proForm.bioPlaceholder'),
      },
      {
        name: 'alerts',
        label: t('catalog:demos.proForm.alerts'),
        type: 'switch',
        defaultValue: true,
        description: t('catalog:demos.proForm.alertsDescription'),
      },
    ],
    [t],
  )

  const validateMessage = (rule: ProFormRule, label: string, limit?: number) =>
    t(`catalog:demos.proForm.rules.${rule}`, { label, limit })

  return (
    <DemoSurface className="space-y-4">
      <ProForm
        fields={fields}
        onSubmit={(values) => {
          setSnapshot(values)
          toast.success(t('catalog:demos.proForm.submitted'))
        }}
        validateMessage={validateMessage}
        submitLabel={t('catalog:demos.proForm.submit')}
        resetLabel={t('catalog:demos.proForm.reset')}
        ariaLabel={t('catalog:demos.proForm.ariaLabel')}
      />
      {snapshot ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {t('catalog:demos.proForm.payload')}
          </p>
          <pre className="overflow-x-auto rounded-md border bg-background p-3 font-mono text-[11px]">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </div>
      ) : null}
    </DemoSurface>
  )
}
