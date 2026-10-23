import {
  Building2,
  CheckCircle2,
  FolderTree,
  GitBranch,
  Globe,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  DateRangePicker,
  type DateRangePreset,
  type DateRangeValue,
} from '@/components/enterprise/date-range-picker/date-range-picker'
import { Descriptions } from '@/components/enterprise/descriptions/descriptions'
import { Dropzone } from '@/components/enterprise/dropzone/dropzone'
import { Result } from '@/components/enterprise/result/result'
import { Stepper, type StepperStep } from '@/components/enterprise/stepper/stepper'
import { TagsInput } from '@/components/enterprise/tags-input/tags-input'
import { Timeline, type TimelineItem } from '@/components/enterprise/timeline/timeline'
import { Transfer, type TransferItem } from '@/components/enterprise/transfer/transfer'
import { Tree, type TreeItem } from '@/components/enterprise/tree/tree'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatDayDisplay, formatDayValue } from '@/lib/date'
import { cn } from '@/lib/utils'

function DemoSurface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border bg-muted/20 p-4', className)}>{children}</div>
}

function shiftDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function quarterStart() {
  const now = new Date()
  return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
}

export function DateRangePickerDemo() {
  const { t, i18n } = useTranslation()
  const [range, setRange] = useState<DateRangeValue>({
    from: formatDayValue(shiftDays(6)),
    to: formatDayValue(new Date()),
  })

  const presets = useMemo<DateRangePreset[]>(
    () => [
      {
        label: t('catalog:demos.dateRangePicker.last7'),
        from: formatDayValue(shiftDays(6)),
        to: formatDayValue(new Date()),
      },
      {
        label: t('catalog:demos.dateRangePicker.last30'),
        from: formatDayValue(shiftDays(29)),
        to: formatDayValue(new Date()),
      },
      {
        label: t('catalog:demos.dateRangePicker.quarter'),
        from: formatDayValue(quarterStart()),
        to: formatDayValue(new Date()),
      },
    ],
    [t],
  )

  const from = formatDayDisplay(range.from, i18n.language)
  const to = formatDayDisplay(range.to, i18n.language)

  return (
    <div className="space-y-2">
      <Label htmlFor="demo-audit-range">{t('catalog:demos.dateRangePicker.label')}</Label>
      <DateRangePicker
        value={range}
        onChange={setRange}
        placeholder={t('catalog:demos.dateRangePicker.placeholder')}
        ariaLabel={t('catalog:demos.dateRangePicker.ariaLabel')}
        presets={presets}
        className="w-full sm:w-72"
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {from || to
          ? t('catalog:demos.dateRangePicker.summary', {
              from: from ?? '—',
              to: to ?? '—',
              count: 74,
            })
          : t('catalog:demos.dateRangePicker.empty')}
      </p>
    </div>
  )
}

export function DescriptionsDemo() {
  const { t } = useTranslation()

  return (
    <Descriptions
      columns={2}
      items={[
        { term: t('catalog:demos.descriptions.email'), description: 'ada@example.com' },
        {
          term: t('catalog:demos.descriptions.role'),
          description: (
            <Badge variant="secondary">{t('catalog:demos.descriptions.roleValue')}</Badge>
          ),
        },
        { term: t('catalog:demos.descriptions.team'), description: 'Platform' },
        { term: t('catalog:demos.descriptions.joined'), description: '2025-01-08' },
        {
          term: t('catalog:demos.descriptions.sessions'),
          description: t('catalog:demos.descriptions.sessionsValue'),
          span: 2,
        },
      ]}
    />
  )
}

export function DropzoneDemo() {
  const { t } = useTranslation()
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState<string | undefined>()

  return (
    <div className="space-y-2">
      <Dropzone
        accept=".csv"
        label={t('catalog:demos.dropzone.label')}
        hint={t('catalog:demos.dropzone.hint')}
        browseLabel={t('catalog:demos.dropzone.browse')}
        error={error}
        onFiles={(files) => {
          const [first] = files
          if (!first) return
          if (!first.name.toLowerCase().endsWith('.csv')) {
            setFile(null)
            setError(t('catalog:demos.dropzone.invalid'))
            return
          }
          setError(undefined)
          setFile({ name: first.name, size: Math.max(1, Math.round(first.size / 1024)) })
        }}
      />
      {file ? (
        <p className="text-xs text-muted-foreground">
          {t('catalog:demos.dropzone.selected', { name: file.name, size: file.size })}
        </p>
      ) : null}
    </div>
  )
}

export function ResultDemo() {
  const { t } = useTranslation()

  return (
    <Result
      status="success"
      title={t('catalog:demos.result.title')}
      description={t('catalog:demos.result.description')}
      className="py-10"
      extra={
        <>
          <Button size="sm" onClick={() => toast.success(t('catalog:demos.result.invited'))}>
            <UserPlus className="size-4" />
            {t('catalog:demos.result.inviteMore')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast(t('catalog:demos.result.back'))}>
            {t('catalog:demos.result.back')}
          </Button>
        </>
      }
    />
  )
}

export function StepperDemo() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(1)

  const steps = useMemo<StepperStep[]>(
    () => [
      {
        id: 'profile',
        title: t('catalog:demos.stepper.profile'),
        description: t('catalog:demos.stepper.profileHint'),
      },
      {
        id: 'workspace',
        title: t('catalog:demos.stepper.workspace'),
        description: t('catalog:demos.stepper.workspaceHint'),
      },
      {
        id: 'invite',
        title: t('catalog:demos.stepper.invite'),
        description: t('catalog:demos.stepper.inviteHint'),
      },
      {
        id: 'review',
        title: t('catalog:demos.stepper.review'),
        description: t('catalog:demos.stepper.reviewHint'),
      },
    ],
    [t],
  )

  return (
    <div className="space-y-3">
      <Stepper
        steps={steps}
        current={current}
        ariaLabel={t('catalog:demos.stepper.ariaLabel')}
        onStepClick={setCurrent}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={current === 0}
          onClick={() => setCurrent((value) => Math.max(0, value - 1))}
        >
          {t('catalog:demos.stepper.back')}
        </Button>
        <Button
          size="sm"
          disabled={current === steps.length - 1}
          onClick={() => setCurrent((value) => Math.min(steps.length - 1, value + 1))}
        >
          {t('catalog:demos.stepper.next')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t('catalog:demos.stepper.progress', { current: current + 1, total: steps.length })}
        </span>
      </div>
    </div>
  )
}

export function TagsInputDemo() {
  const { t } = useTranslation()
  const [tags, setTags] = useState<string[]>(['billing', 'p1'])

  return (
    <div className="space-y-2">
      <Label htmlFor="demo-tags">{t('catalog:demos.tagsInput.label')}</Label>
      <TagsInput
        id="demo-tags"
        value={tags}
        onChange={setTags}
        ariaLabel={t('catalog:demos.tagsInput.ariaLabel')}
        placeholder={t('catalog:demos.tagsInput.placeholder')}
        maxTags={5}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {t('catalog:demos.tagsInput.hint', { count: tags.length })}
      </p>
    </div>
  )
}

export function TimelineDemo() {
  const { t } = useTranslation()

  const items = useMemo<TimelineItem[]>(
    () => [
      {
        id: 'role',
        title: t('catalog:demos.timeline.roleTitle'),
        description: t('catalog:demos.timeline.roleBody'),
        timestamp: t('catalog:demos.timeline.time1'),
        icon: ShieldCheck,
        tone: 'info',
      },
      {
        id: 'invite',
        title: t('catalog:demos.timeline.inviteTitle'),
        description: t('catalog:demos.timeline.inviteBody'),
        timestamp: t('catalog:demos.timeline.time2'),
        icon: UserPlus,
        tone: 'success',
      },
      {
        id: 'key',
        title: t('catalog:demos.timeline.keyTitle'),
        description: t('catalog:demos.timeline.keyBody'),
        timestamp: t('catalog:demos.timeline.time3'),
        icon: KeyRound,
        tone: 'warning',
      },
      {
        id: 'login',
        title: t('catalog:demos.timeline.loginTitle'),
        description: t('catalog:demos.timeline.loginBody'),
        timestamp: t('catalog:demos.timeline.time4'),
        icon: CheckCircle2,
      },
    ],
    [t],
  )

  return (
    <DemoSurface>
      <Timeline items={items} emptyLabel={t('catalog:demos.timeline.empty')} />
    </DemoSurface>
  )
}

export function TransferDemo() {
  const { t } = useTranslation()
  const [value, setValue] = useState<string[]>(['platform'])

  const items = useMemo<TransferItem[]>(
    () => [
      {
        key: 'platform',
        label: t('catalog:demos.transfer.platform'),
        description: t('catalog:demos.transfer.platformSize'),
        group: t('catalog:demos.transfer.groupProduct'),
      },
      {
        key: 'billing',
        label: t('catalog:demos.transfer.billing'),
        description: t('catalog:demos.transfer.billingSize'),
        group: t('catalog:demos.transfer.groupProduct'),
      },
      {
        key: 'design',
        label: t('catalog:demos.transfer.design'),
        description: t('catalog:demos.transfer.designSize'),
        group: t('catalog:demos.transfer.groupDesign'),
      },
      {
        key: 'support',
        label: t('catalog:demos.transfer.support'),
        description: t('catalog:demos.transfer.supportSize'),
        group: t('catalog:demos.transfer.groupOperations'),
      },
      {
        key: 'finance',
        label: t('catalog:demos.transfer.finance'),
        description: t('catalog:demos.transfer.financeSize'),
        group: t('catalog:demos.transfer.groupOperations'),
        disabled: true,
      },
    ],
    [t],
  )

  return (
    <div className="space-y-2">
      <Transfer
        items={items}
        value={value}
        onChange={setValue}
        sourceTitle={t('catalog:demos.transfer.available')}
        targetTitle={t('catalog:demos.transfer.assigned')}
        searchPlaceholder={t('catalog:demos.transfer.search')}
        emptySourceLabel={t('catalog:demos.transfer.emptySource')}
        emptyTargetLabel={t('catalog:demos.transfer.emptyTarget')}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {t('catalog:demos.transfer.hint', { count: value.length })}
      </p>
    </div>
  )
}

export function TreeDemo() {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>('platform')

  const items = useMemo<TreeItem[]>(
    () => [
      { id: 'acme', parentId: null, label: t('catalog:demos.tree.acme'), icon: Building2 },
      {
        id: 'engineering',
        parentId: 'acme',
        label: t('catalog:demos.tree.engineering'),
        badge: '18',
        icon: GitBranch,
      },
      {
        id: 'platform',
        parentId: 'engineering',
        label: t('catalog:demos.tree.platform'),
        badge: '7',
      },
      { id: 'web', parentId: 'engineering', label: t('catalog:demos.tree.web'), badge: '6' },
      { id: 'infra', parentId: 'engineering', label: t('catalog:demos.tree.infra'), badge: '5' },
      {
        id: 'design',
        parentId: 'acme',
        label: t('catalog:demos.tree.design'),
        badge: '4',
        icon: Globe,
      },
      {
        id: 'operations',
        parentId: 'acme',
        label: t('catalog:demos.tree.operations'),
        badge: '9',
        icon: Users,
      },
      { id: 'retired', parentId: 'acme', label: t('catalog:demos.tree.retired'), disabled: true },
    ],
    [t],
  )

  const selected = items.find((item) => item.id === selectedId)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FolderTree className="size-4" />
        {t('catalog:demos.tree.hint')}
      </div>
      <DemoSurface className="p-2">
        <Tree
          items={items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          ariaLabel={t('catalog:demos.tree.ariaLabel')}
          emptyLabel={t('catalog:demos.tree.empty')}
        />
      </DemoSurface>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {selected
          ? t('catalog:demos.tree.selected', { name: selected.label })
          : t('catalog:demos.tree.none')}
      </p>
    </div>
  )
}
