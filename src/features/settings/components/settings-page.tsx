import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Check,
  ChevronDown,
  Database,
  Expand,
  ExternalLink,
  Info,
  Languages,
  LayoutTemplate,
  Loader2,
  LockKeyhole,
  Maximize,
  Monitor,
  Moon,
  PanelLeft,
  PanelTop,
  PanelsTopLeft,
  RectangleHorizontal,
  RotateCcw,
  Rows3,
  Rows4,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Can } from '@/components/common/can'
import { PageHeader } from '@fish-admin/react/internal/page-header'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@fish-admin/react'

import { APP_VERSION } from '@/config/app'
import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import {
  SHELL_CONTENT_WIDTH_OPTIONS,
  SHELL_DENSITY_OPTIONS,
  SHELL_LAYOUT_OPTIONS,
  type ShellContentWidth,
  type ShellDensity,
  type ShellLayout,
} from '@/config/shell'
import { ACCENTS, THEME_MODES, type ThemeMode } from '@/config/theme'
import { useDocumentTitle } from '@/lib/document-title'
import { changeLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n'

import { useAuthStore } from '@/stores/auth-store'
import { useThemeStore } from '@/stores/theme-store'
import { useUiStore } from '@/stores/ui-store'

import { resetDemoData } from '../api'

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} satisfies Record<ThemeMode, typeof Sun>

const LAYOUT_ICONS = {
  sidebar: PanelLeft,
  header: PanelTop,
  mixed: LayoutTemplate,
} satisfies Record<ShellLayout, LucideIcon>

const DENSITY_ICONS = {
  default: Rows3,
  compact: Rows4,
} satisfies Record<ShellDensity, LucideIcon>

const CONTENT_WIDTH_ICONS = {
  contained: RectangleHorizontal,
  wide: Expand,
  full: Maximize,
} satisfies Record<ShellContentWidth, LucideIcon>

const STATUS_PREVIEWS = [
  { to: '/401', code: '401', titleKey: 'errors:status.unauthorized.title' },
  { to: '/500', code: '500', titleKey: 'errors:status.serverError.title' },
  { to: '/503', code: '503', titleKey: 'errors:status.unavailable.title' },
  { to: '/maintenance', code: '503', titleKey: 'errors:status.maintenance.title' },
] as const

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('settings:title'))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const refreshUser = useAuthStore((state) => state.refreshUser)
  const mode = useThemeStore((state) => state.mode)
  const accent = useThemeStore((state) => state.accent)
  const setMode = useThemeStore((state) => state.setMode)
  const setAccent = useThemeStore((state) => state.setAccent)
  const layout = useUiStore((state) => state.layout)
  const density = useUiStore((state) => state.density)
  const contentWidth = useUiStore((state) => state.contentWidth)
  const setLayout = useUiStore((state) => state.setLayout)
  const setDensity = useUiStore((state) => state.setDensity)
  const setContentWidth = useUiStore((state) => state.setContentWidth)
  const [resetOpen, setResetOpen] = useState(false)

  const resetMutation = useMutation({
    mutationFn: resetDemoData,
    onSuccess: async () => {
      queryClient.clear()
      await refreshUser()
      setResetOpen(false)
      toast.success(t('settings:demo.success'))
    },
    onError: () => {
      toast.error(t('settings:demo.error'))
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings:title')} description={t('settings:subtitle')} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="size-4" />
              {t('settings:appearance.title')}
            </CardTitle>
            <CardDescription>{t('settings:appearance.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">{t('settings:appearance.mode')}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {THEME_MODES.map((option) => {
                  const Icon = MODE_ICONS[option]
                  const active = mode === option
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setMode(option)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'hover:bg-muted/50',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={cn('size-4', active && 'text-primary')} />
                        {active ? <Check className="size-4 text-primary" /> : null}
                      </div>
                      <p className="mt-3 text-sm font-medium">
                        {t(`settings:appearance.modes.${option}`)}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {t(`settings:appearance.modes.${option}Description`)}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('settings:appearance.accent')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('settings:appearance.accentDescription')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((option) => {
                  const active = accent === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setAccent(option.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      <span
                        className="size-4 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: option.swatch }}
                      />
                      {t(option.labelKey)}
                      {active ? <Check className="size-3.5 text-primary" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="size-4" />
                {t('settings:language.title')}
              </CardTitle>
              <CardDescription>{t('settings:language.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{t('settings:language.label')}</p>
              <Select
                value={i18n.resolvedLanguage === 'zh-CN' ? 'zh-CN' : 'en'}
                onValueChange={(value) => void changeLanguage(value as SupportedLanguage)}
              >
                <SelectTrigger className="w-full" aria-label={t('settings:language.label')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {t(`settings:language.languages.${language.code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="size-4" />
                {t('settings:security.title')}
              </CardTitle>
              <CardDescription>{t('settings:security.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => void navigate({ to: '/security' })}>
                {t('settings:security.action')}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-4" />
                {t('settings:about.title')}
              </CardTitle>
              <CardDescription>{t('settings:about.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t('settings:about.version')}</span>
                <Badge variant="secondary" className="font-mono font-normal">
                  v{APP_VERSION}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t('settings:about.stack')}</span>
                <span className="text-right text-xs">React 19 · TanStack Router · Tailwind 4</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t('settings:about.license')}</span>
                <span className="text-xs">MIT</span>
              </div>
              <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                {t('settings:about.builtWith')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="size-4" />
              {t('settings:shell.title')}
            </CardTitle>
            <CardDescription>{t('settings:shell.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ShellOptionRow
              labelKey="settings:shell.layout"
              hintKey="settings:shell.layoutDescription"
              options={SHELL_LAYOUT_OPTIONS}
              current={layout}
              onSelect={setLayout}
              icons={LAYOUT_ICONS}
            />
            <ShellOptionRow
              labelKey="settings:shell.density"
              hintKey="settings:shell.densityDescription"
              options={SHELL_DENSITY_OPTIONS}
              current={density}
              onSelect={setDensity}
              icons={DENSITY_ICONS}
            />
            <ShellOptionRow
              labelKey="settings:shell.contentWidth"
              hintKey="settings:shell.contentWidthDescription"
              options={SHELL_CONTENT_WIDTH_OPTIONS}
              current={contentWidth}
              onSelect={setContentWidth}
              icons={CONTENT_WIDTH_ICONS}
            />
          </CardContent>
        </Card>

        {env.enableMock ? (
          <Can permission={PERMISSION_CODES.demoReset}>
            <Card className="shadow-soft lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-4" />
                  {t('settings:demo.title')}
                </CardTitle>
                <CardDescription>{t('settings:demo.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => setResetOpen(true)}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RotateCcw className="size-4" />
                  )}
                  {t('settings:demo.reset')}
                </Button>
              </CardContent>
            </Card>
          </Can>
        ) : null}

        <Card className="shadow-soft lg:col-span-3">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="group w-full rounded-xl p-6 text-left transition-colors hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <span className="flex items-center gap-2 font-semibold">
                      <Database className="size-4" />
                      {t('settings:retention.title')}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {t('settings:retention.description')}
                    </span>
                  </div>
                  <ChevronDown
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                  />
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 border-t px-6 py-4">
                <dl className="grid gap-3 sm:grid-cols-3">
                  {(['audit', 'notifications', 'deliveries'] as const).map((row) => (
                    <div key={row} className="rounded-xl border p-3">
                      <dt className="text-xs text-muted-foreground">
                        {t(`settings:retention.rows.${row}`)}
                      </dt>
                      <dd className="mt-1 text-sm font-medium">
                        {t(`settings:retention.rows.${row}Value`)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t('settings:retention.note')}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <Card className="shadow-soft lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PanelsTopLeft className="size-4" />
              {t('settings:errorPages.title')}
            </CardTitle>
            <CardDescription>{t('settings:errorPages.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STATUS_PREVIEWS.map((page) => (
              <Link
                key={page.to}
                to={page.to}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border p-4 transition-colors hover:border-primary/30 hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{page.code}</span>
                  <ExternalLink className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <p className="mt-2 text-sm font-medium">{t(page.titleKey)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('settings:errorPages.open')}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings:demo.dialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings:demo.dialog.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetMutation.isPending}>
              {t('common:actions.cancel')}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
            >
              {resetMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('settings:demo.dialog.confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface ShellOptionRowProps<V extends string> {
  labelKey: string
  hintKey: string
  options: readonly { value: V; labelKey: string; descriptionKey: string }[]
  current: V
  onSelect: (value: V) => void
  icons: Record<V, LucideIcon>
}

function ShellOptionRow<V extends string>({
  labelKey,
  hintKey,
  options,
  current,
  onSelect,
  icons,
}: ShellOptionRowProps<V>) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{t(labelKey)}</p>
        <p className="text-xs text-muted-foreground">{t(hintKey)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const Icon: LucideIcon = icons[option.value]
          const active = current === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.value)}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors',
                active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-muted/50',
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className={cn('size-4', active && 'text-primary')} />
                {active ? <Check className="size-4 text-primary" /> : null}
              </div>
              <p className="mt-3 text-sm font-medium">{t(option.labelKey)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t(option.descriptionKey)}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
