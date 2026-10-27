import { Ellipsis } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AutoComplete,
  type AutoCompleteOption,
  Carousel,
  type CarouselSlide,
  List,
  type ListItem,
  Tour,
  type TourStep,
  DetailPage,
  type DetailPageTab,
  EditableTable,
  type EditableTableColumn,
  type EditableTableLabels,
  type EditableTableRow,
  ImportWizard,
  type ImportWizardLabels,
  type ImportField,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  ColorPicker,
  Input,
  cn,
} from '@fish-admin/react'

function DemoSurface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border bg-muted/20 p-4', className)}>{children}</div>
}

function gradientImage(from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="350" fill="url(#g)"/><circle cx="140" cy="90" r="80" fill="rgba(255,255,255,0.16)"/><circle cx="660" cy="290" r="120" fill="rgba(255,255,255,0.12)"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SLIDE_IMAGES = [
  gradientImage('#0f766e', '#22d3ee'),
  gradientImage('#4338ca', '#a855f7'),
  gradientImage('#b45309', '#fbbf24'),
]

const SAMPLE_CSV = `Name,Email,Team
Ada Lovelace,ada@example.com,Engineering
Grace Hopper,grace@example.com,Design
Katherine Johnson,not-an-email,Product`

export function AutoCompleteDemo() {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const options = useMemo<AutoCompleteOption[]>(
    () => [
      { value: 'ada', label: 'Ada Lovelace', description: t('catalog:demos.autoComplete.ada') },
      { value: 'grace', label: 'Grace Hopper', description: t('catalog:demos.autoComplete.grace') },
      {
        value: 'katherine',
        label: 'Katherine Johnson',
        description: t('catalog:demos.autoComplete.katherine'),
      },
      {
        value: 'linus',
        label: 'Linus Torvalds',
        description: t('catalog:demos.autoComplete.linus'),
        disabled: true,
      },
    ],
    [t],
  )

  return (
    <DemoSurface className="space-y-2">
      <p className="text-xs font-medium">{t('catalog:demos.autoComplete.label')}</p>
      <AutoComplete
        options={options}
        value={value}
        onValueChange={(next) => {
          setValue(next)
          setSelected(null)
        }}
        onSelect={(option) => setSelected(option.label)}
        placeholder={t('catalog:demos.autoComplete.placeholder')}
        ariaLabel={t('catalog:demos.autoComplete.ariaLabel')}
        emptyLabel={t('catalog:demos.autoComplete.empty')}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {selected
          ? t('catalog:demos.autoComplete.selected', { name: selected })
          : t('catalog:demos.autoComplete.hint')}
      </p>
    </DemoSurface>
  )
}

export function ListDemo() {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState('ada')

  const items = useMemo<ListItem[]>(
    () => [
      {
        id: 'ada',
        title: 'Ada Lovelace',
        description: t('catalog:demos.list.roleAda'),
        meta: t('catalog:demos.list.metaAda'),
        avatar: (
          <Avatar className="size-9">
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        ),
        actions: (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t('catalog:demos.list.action', { name: 'Ada Lovelace' })}
            onClick={() => toast(t('catalog:demos.list.actionToast', { name: 'Ada Lovelace' }))}
          >
            <Ellipsis aria-hidden className="size-4" />
          </Button>
        ),
      },
      {
        id: 'grace',
        title: 'Grace Hopper',
        description: t('catalog:demos.list.roleGrace'),
        meta: t('catalog:demos.list.metaGrace'),
        avatar: (
          <Avatar className="size-9">
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
        ),
        actions: (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t('catalog:demos.list.action', { name: 'Grace Hopper' })}
            onClick={() => toast(t('catalog:demos.list.actionToast', { name: 'Grace Hopper' }))}
          >
            <Ellipsis aria-hidden className="size-4" />
          </Button>
        ),
      },
      {
        id: 'katherine',
        title: 'Katherine Johnson',
        description: t('catalog:demos.list.roleKatherine'),
        meta: t('catalog:demos.list.metaKatherine'),
        disabled: true,
        avatar: (
          <Avatar className="size-9">
            <AvatarFallback>KJ</AvatarFallback>
          </Avatar>
        ),
      },
    ],
    [t],
  )

  const selected = items.find((item) => item.id === selectedId)

  return (
    <div className="space-y-2">
      <List
        items={items}
        selectedId={selectedId}
        onItemClick={(item) => setSelectedId(item.id)}
        ariaLabel={t('catalog:demos.list.ariaLabel')}
        emptyLabel={t('catalog:demos.list.empty')}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {selected
          ? t('catalog:demos.list.selected', { name: selected.title })
          : t('catalog:demos.list.hint')}
      </p>
    </div>
  )
}

export function TourDemo() {
  const { t } = useTranslation()
  const workspaceRef = useRef<HTMLDivElement>(null)
  const planRef = useRef<HTMLDivElement>(null)
  const saveRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [finished, setFinished] = useState(false)

  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: () => workspaceRef.current,
        title: t('catalog:demos.tour.stepTitle1'),
        description: t('catalog:demos.tour.stepBody1'),
        placement: 'bottom',
      },
      {
        target: () => planRef.current,
        title: t('catalog:demos.tour.stepTitle2'),
        description: t('catalog:demos.tour.stepBody2'),
        placement: 'bottom',
      },
      {
        target: () => saveRef.current,
        title: t('catalog:demos.tour.stepTitle3'),
        description: t('catalog:demos.tour.stepBody3'),
        placement: 'top',
      },
    ],
    [t],
  )

  const labels = useMemo(
    () => ({
      next: t('catalog:demos.tour.next'),
      previous: t('catalog:demos.tour.previous'),
      skip: t('catalog:demos.tour.skip'),
      finish: t('catalog:demos.tour.finish'),
      step: (current: number, total: number) => t('catalog:demos.tour.step', { current, total }),
    }),
    [t],
  )

  return (
    <DemoSurface className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{t('catalog:demos.tour.title')}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          {t('catalog:demos.tour.start')}
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t('catalog:demos.tour.workspaceLabel')}</p>
          <div ref={workspaceRef}>
            <Input
              aria-label={t('catalog:demos.tour.workspaceLabel')}
              placeholder={t('catalog:demos.tour.workspacePlaceholder')}
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t('catalog:demos.tour.planLabel')}</p>
          <div ref={planRef}>
            <select
              aria-label={t('catalog:demos.tour.planLabel')}
              defaultValue="team"
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="team">{t('catalog:demos.tour.planTeam')}</option>
              <option value="business">{t('catalog:demos.tour.planBusiness')}</option>
            </select>
          </div>
        </div>
      </div>
      <div ref={saveRef} className="inline-flex">
        <Button type="button" size="sm" onClick={() => setFinished(true)}>
          {t('catalog:demos.tour.save')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {finished ? t('catalog:demos.tour.finished') : t('catalog:demos.tour.hint')}
      </p>
      <Tour
        steps={steps}
        open={open}
        onOpenChange={setOpen}
        onFinish={() => setFinished(true)}
        labels={labels}
      />
    </DemoSurface>
  )
}

export function CarouselDemo() {
  const { t } = useTranslation()

  const slides = useMemo<CarouselSlide[]>(
    () => [
      {
        id: 'onboarding',
        title: t('catalog:demos.carousel.slide1Title'),
        description: t('catalog:demos.carousel.slide1Body'),
        image: SLIDE_IMAGES[0],
        alt: t('catalog:demos.carousel.slide1Alt'),
      },
      {
        id: 'roles',
        title: t('catalog:demos.carousel.slide2Title'),
        description: t('catalog:demos.carousel.slide2Body'),
        image: SLIDE_IMAGES[1],
        alt: t('catalog:demos.carousel.slide2Alt'),
      },
      {
        id: 'audit',
        title: t('catalog:demos.carousel.slide3Title'),
        description: t('catalog:demos.carousel.slide3Body'),
        image: SLIDE_IMAGES[2],
        alt: t('catalog:demos.carousel.slide3Alt'),
      },
    ],
    [t],
  )

  return (
    <Carousel
      slides={slides}
      ariaLabel={t('catalog:demos.carousel.ariaLabel')}
      previousLabel={t('catalog:demos.carousel.previous')}
      nextLabel={t('catalog:demos.carousel.next')}
      goToLabel={(index) => t('catalog:demos.carousel.goTo', { index })}
    />
  )
}

export function ColorPickerDemo() {
  const { t } = useTranslation()
  const [color, setColor] = useState('#6366f1')

  return (
    <DemoSurface className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <ColorPicker
          value={color}
          onValueChange={setColor}
          ariaLabel={t('catalog:demos.colorPicker.ariaLabel')}
          hexLabel={t('catalog:demos.colorPicker.hexLabel')}
          pickerLabel={t('catalog:demos.colorPicker.pickerLabel')}
          presetsLabel={t('catalog:demos.colorPicker.presetsLabel')}
          className="w-44"
        />
        <div
          aria-hidden
          className="h-9 min-w-24 flex-1 rounded-md border"
          style={{ backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t('catalog:demos.colorPicker.selected', { color: color.toUpperCase() })}
      </p>
    </DemoSurface>
  )
}

export function DetailPageDemo() {
  const { t } = useTranslation()

  const tabs = useMemo<DetailPageTab[]>(
    () => [
      {
        value: 'overview',
        label: t('catalog:demos.detailPage.tabOverview'),
        content: (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">{t('catalog:demos.detailPage.about')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('catalog:demos.detailPage.aboutBody')}
              </p>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['email', 'ada@fishadmin.dev'],
                ['team', t('catalog:demos.detailPage.teamValue')],
                ['location', t('catalog:demos.detailPage.locationValue')],
                ['manager', 'Charles Babbage'],
              ].map(([key, value]) => (
                <div key={key} className="space-y-0.5">
                  <dt className="text-xs text-muted-foreground">
                    {t(`catalog:demos.detailPage.${key}`)}
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ),
      },
      {
        value: 'activity',
        label: t('catalog:demos.detailPage.tabActivity'),
        content: (
          <ul className="space-y-2 text-sm">
            {['activity1', 'activity2', 'activity3'].map((key) => (
              <li key={key} className="flex items-start gap-2">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{t(`catalog:demos.detailPage.${key}`)}</span>
              </li>
            ))}
          </ul>
        ),
      },
    ],
    [t],
  )

  return (
    <DetailPage
      avatar={
        <Avatar className="size-14">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      }
      title="Ada Lovelace"
      subtitle="ada@fishadmin.dev"
      badges={<Badge>{t('catalog:demos.detailPage.active')}</Badge>}
      meta={
        <>
          <span>{t('catalog:demos.detailPage.metaRole')}</span>
          <span aria-hidden>·</span>
          <span>{t('catalog:demos.detailPage.teamValue')}</span>
        </>
      }
      actions={
        <>
          <Button type="button" variant="outline" size="sm">
            {t('catalog:demos.detailPage.message')}
          </Button>
          <Button type="button" size="sm">
            {t('catalog:demos.detailPage.edit')}
          </Button>
        </>
      }
      tabs={tabs}
      tabsLabel={t('catalog:demos.detailPage.tabsLabel')}
    />
  )
}

export function EditableTableDemo() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<EditableTableRow[]>([
    { id: 'row-1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
    { id: 'row-2', name: 'Grace Hopper', email: 'grace@example.com', role: 'editor' },
  ])

  const columns = useMemo<EditableTableColumn[]>(
    () => [
      {
        key: 'name',
        header: t('catalog:demos.editableTable.name'),
        editor: 'text',
        validate: (value) =>
          String(value ?? '').trim() ? null : t('catalog:demos.editableTable.nameRequired'),
      },
      {
        key: 'email',
        header: t('catalog:demos.editableTable.email'),
        editor: 'text',
        validate: (value) =>
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value ?? ''))
            ? null
            : t('catalog:demos.editableTable.emailInvalid'),
      },
      {
        key: 'role',
        header: t('catalog:demos.editableTable.role'),
        editor: 'select',
        options: [
          { value: 'admin', label: t('catalog:demos.editableTable.roleAdmin') },
          { value: 'editor', label: t('catalog:demos.editableTable.roleEditor') },
          { value: 'viewer', label: t('catalog:demos.editableTable.roleViewer') },
        ],
        render: (row) =>
          ({
            admin: t('catalog:demos.editableTable.roleAdmin'),
            editor: t('catalog:demos.editableTable.roleEditor'),
            viewer: t('catalog:demos.editableTable.roleViewer'),
          })[String(row.role)] ?? String(row.role ?? ''),
      },
    ],
    [t],
  )

  const labels = useMemo<EditableTableLabels>(
    () => ({
      add: t('catalog:demos.editableTable.add'),
      save: t('catalog:demos.editableTable.save'),
      cancel: t('catalog:demos.editableTable.cancel'),
      edit: t('catalog:demos.editableTable.edit'),
      delete: t('catalog:demos.editableTable.delete'),
      actions: t('catalog:demos.editableTable.actions'),
      empty: t('catalog:demos.editableTable.empty'),
    }),
    [t],
  )

  return (
    <div className="space-y-2">
      <EditableTable
        columns={columns}
        rows={rows}
        onRowsChange={setRows}
        addRow={() => ({ id: crypto.randomUUID(), name: '', email: '', role: 'viewer' })}
        rowLabel={(row) => String(row.name ?? row.id)}
        labels={labels}
        ariaLabel={t('catalog:demos.editableTable.ariaLabel')}
      />
      <p className="text-xs text-muted-foreground">
        {t('catalog:demos.editableTable.rowCount', { count: rows.length })}
      </p>
    </div>
  )
}

export function ImportWizardDemo() {
  const { t } = useTranslation()

  const fields = useMemo<ImportField[]>(
    () => [
      {
        key: 'name',
        label: t('catalog:demos.importWizard.fieldName'),
        required: true,
        aliases: ['name', 'full name'],
      },
      {
        key: 'email',
        label: t('catalog:demos.importWizard.fieldEmail'),
        required: true,
        type: 'email',
        aliases: ['email', 'e-mail'],
      },
      {
        key: 'team',
        label: t('catalog:demos.importWizard.fieldTeam'),
        aliases: ['team', 'department'],
      },
    ],
    [t],
  )

  const labels = useMemo<ImportWizardLabels>(
    () => ({
      steps: [
        t('catalog:demos.importWizard.stepUpload'),
        t('catalog:demos.importWizard.stepMap'),
        t('catalog:demos.importWizard.stepReview'),
        t('catalog:demos.importWizard.stepDone'),
      ],
      dropTitle: t('catalog:demos.importWizard.dropTitle'),
      dropHint: t('catalog:demos.importWizard.dropHint'),
      browse: t('catalog:demos.importWizard.browse'),
      sample: t('catalog:demos.importWizard.sample'),
      emptyFile: t('catalog:demos.importWizard.emptyFile'),
      parseError: t('catalog:demos.importWizard.parseError'),
      mapTitle: t('catalog:demos.importWizard.mapTitle'),
      mapHint: t('catalog:demos.importWizard.mapHint'),
      sourceColumn: t('catalog:demos.importWizard.sourceColumn'),
      skipColumn: t('catalog:demos.importWizard.skipColumn'),
      previewTitle: t('catalog:demos.importWizard.previewTitle'),
      mapRequired: (names) => t('catalog:demos.importWizard.mapRequired', { fields: names }),
      reviewTitle: t('catalog:demos.importWizard.reviewTitle'),
      reviewHint: t('catalog:demos.importWizard.reviewHint'),
      validCount: (count) => t('catalog:demos.importWizard.validCount', { count }),
      invalidCount: (count) => t('catalog:demos.importWizard.invalidCount', { count }),
      rowNumber: t('catalog:demos.importWizard.rowNumber'),
      status: t('catalog:demos.importWizard.status'),
      statusValid: t('catalog:demos.importWizard.statusValid'),
      statusInvalid: t('catalog:demos.importWizard.statusInvalid'),
      back: t('catalog:demos.importWizard.back'),
      next: t('catalog:demos.importWizard.next'),
      import: (count) => t('catalog:demos.importWizard.import', { count }),
      importing: t('catalog:demos.importWizard.importing'),
      importFailed: t('catalog:demos.importWizard.importFailed'),
      doneTitle: t('catalog:demos.importWizard.doneTitle'),
      doneHint: (count) => t('catalog:demos.importWizard.doneHint', { count }),
      reset: t('catalog:demos.importWizard.reset'),
      messages: {
        required: (label) => t('catalog:demos.importWizard.requiredMessage', { label }),
        email: (label) => t('catalog:demos.importWizard.emailMessage', { label }),
        number: (label) => t('catalog:demos.importWizard.numberMessage', { label }),
      },
    }),
    [t],
  )

  return (
    <ImportWizard
      fields={fields}
      labels={labels}
      sample={SAMPLE_CSV}
      sampleName="members.csv"
      ariaLabel={t('catalog:demos.importWizard.ariaLabel')}
      onImport={async (payload) => {
        await new Promise((resolve) => setTimeout(resolve, 400))
        toast.success(t('catalog:demos.importWizard.imported', { count: payload.length }))
      }}
    />
  )
}
