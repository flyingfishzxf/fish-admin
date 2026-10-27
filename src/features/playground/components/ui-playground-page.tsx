import { Link } from '@tanstack/react-router'
import { enUS, zhCN } from 'date-fns/locale'
import {
  ArrowUpRight,
  BellRing,
  Bold,
  Boxes,
  Check,
  CircleCheck,
  Columns3,
  Compass,
  Copy,
  Download,
  EllipsisVertical,
  Filter,
  Inbox,
  Info,
  Italic,
  Layers,
  LayoutGrid,
  LifeBuoy,
  List,
  Loader2,
  LogOut,
  Mail,
  Monitor,
  Moon,
  MousePointerClick,
  OctagonX,
  Palette,
  PanelBottom,
  PanelsTopLeft,
  Pencil,
  Plus,
  SearchX,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TextCursorInput,
  Trash2,
  TriangleAlert,
  Underline,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { PageHeader } from '@fish-admin/react/internal/page-header'
import {
  AnchorNav,
  type AnchorItem,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputNumber,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Segmented,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Slider,
  LoadingOverlay,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@fish-admin/react'

import { COMPONENT_COUNTS } from '@/config/components'
import { ACCENTS, THEME_MODES, type ThemeMode } from '@/config/theme'
import { useDocumentTitle } from '@/lib/document-title'
import { changeLanguage, currentLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n'

import { useThemeStore } from '@/stores/theme-store'

const UI_SECTIONS = [
  'foundations',
  'actions',
  'feedback',
  'forms',
  'overlays',
  'navigation',
  'layout',
  'states',
] as const

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} satisfies Record<ThemeMode, typeof Sun>

const PALETTE = [
  { token: 'primary', className: 'bg-primary' },
  { token: 'secondary', className: 'bg-secondary' },
  { token: 'accent', className: 'bg-accent' },
  { token: 'muted', className: 'bg-muted' },
  { token: 'success', className: 'bg-success' },
  { token: 'warning', className: 'bg-warning' },
  { token: 'destructive', className: 'bg-destructive' },
  { token: 'foreground', className: 'bg-foreground' },
] as const

const RADII = [
  { label: 'md', className: 'rounded-md' },
  { label: 'lg', className: 'rounded-lg' },
  { label: 'xl', className: 'rounded-xl' },
] as const

const AUTH_LINKS = [
  { to: '/login', key: 'signIn' },
  { to: '/register', key: 'register' },
  { to: '/forgot-password', key: 'forgot' },
  { to: '/reset-password', key: 'reset' },
  { to: '/verify-email', key: 'verify' },
  { to: '/otp', key: 'otp' },
  { to: '/accept-invite', key: 'invite' },
] as const

const STATUS_LINKS = [
  { to: '/401', code: '401', key: 'unauthorized' },
  { to: '/403', code: '403', key: 'forbidden' },
  { to: '/500', code: '500', key: 'serverError' },
  { to: '/503', code: '503', key: 'unavailable' },
  { to: '/maintenance', code: '503', key: 'maintenance' },
] as const

const SCROLL_ROWS = Array.from({ length: 10 }, (_, index) => index + 1)

function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  id: string
  icon: LucideIcon
  title: string
  description: string
  className?: string
  children: ReactNode
}) {
  return (
    <Card id={id} className={cn('shadow-soft scroll-mt-32', className)}>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="flex items-center gap-2.5 text-base">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function DemoBlock({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function UiPlaygroundPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('ui:title'))

  const mode = useThemeStore((state) => state.mode)
  const accent = useThemeStore((state) => state.accent)
  const setMode = useThemeStore((state) => state.setMode)
  const setAccent = useThemeStore((state) => state.setAccent)
  const language = currentLanguage()

  const sectionItems = useMemo<AnchorItem[]>(
    () =>
      UI_SECTIONS.map((key) => ({
        id: `ui-${key}`,
        label: t(`ui:sections.${key}.title`),
      })),
    [t],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('ui:eyebrow')}
        title={t('ui:title')}
        description={t('ui:subtitle')}
        actions={
          <>
            <Badge variant="outline">shadcn/ui · Radix</Badge>
            <Badge variant="secondary">Tailwind CSS 4</Badge>
            <Button asChild variant="outline" size="sm">
              <Link to="/components">
                <Boxes className="size-4" />
                {t('ui:hero.catalog')}
              </Link>
            </Button>
          </>
        }
      />

      <section className="shadow-soft relative overflow-hidden rounded-2xl border bg-card">
        <div
          className="bg-brand pointer-events-none absolute -top-24 -right-16 size-80 rounded-full opacity-10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:p-8">
          <div className="flex flex-col justify-center space-y-4">
            <Badge className="w-fit gap-1.5">
              <Sparkles className="size-3" />
              {t('ui:hero.badge')}
            </Badge>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t('ui:hero.title')}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t('ui:hero.description')}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {['primitives', 'accents', 'locales', 'responsive'].map((key) => (
                <span key={key} className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-primary" />
                  {t(`ui:hero.${key}`, { count: COMPONENT_COUNTS.primitive })}
                </span>
              ))}
            </div>
          </div>

          <div className="shadow-soft grid content-start gap-4 rounded-xl border bg-background/75 p-4 backdrop-blur sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {t('ui:quick.theme')}
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('ui:quick.theme')}>
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
                        'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                          : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="size-3.5" />
                      {t(`ui:quick.modes.${option}`)}
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {t('ui:quick.accent')}
              </p>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={t('ui:quick.accent')}
              >
                {ACCENTS.map((option) => {
                  const active = accent === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setAccent(option.value)}
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span
                        className="size-3.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: option.swatch }}
                      />
                      {t(`ui:quick.accents.${option.value}`)}
                      {active ? <Check className="size-3 text-primary" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {t('ui:quick.language')}
              </p>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={t('ui:quick.language')}
              >
                {SUPPORTED_LANGUAGES.map((option) => {
                  const active = language === option.code
                  return (
                    <button
                      key={option.code}
                      type="button"
                      aria-pressed={active}
                      onClick={() => void changeLanguage(option.code)}
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {option.label}
                      {active ? <Check className="size-3 text-primary" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-10 -mx-4 border-b bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <AnchorNav
          orientation="horizontal"
          items={sectionItems}
          ariaLabel={t('ui:sections.nav')}
          offset={112}
          className="-mb-px"
        />
      </div>

      <SectionCard
        icon={Palette}
        id="ui-foundations"
        title={t('ui:sections.foundations.title')}
        description={t('ui:sections.foundations.description')}
      >
        <FoundationsDemo />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          icon={MousePointerClick}
          id="ui-actions"
          title={t('ui:sections.actions.title')}
          description={t('ui:sections.actions.description')}
        >
          <ActionsDemo />
        </SectionCard>

        <SectionCard
          icon={BellRing}
          id="ui-feedback"
          title={t('ui:sections.feedback.title')}
          description={t('ui:sections.feedback.description')}
        >
          <FeedbackDemo />
        </SectionCard>

        <SectionCard
          icon={TextCursorInput}
          id="ui-forms"
          title={t('ui:sections.forms.title')}
          description={t('ui:sections.forms.description')}
          className="xl:col-span-2"
        >
          <FormsDemo />
        </SectionCard>

        <SectionCard
          icon={Layers}
          id="ui-overlays"
          title={t('ui:sections.overlays.title')}
          description={t('ui:sections.overlays.description')}
          className="xl:col-span-2"
        >
          <OverlaysDemo />
        </SectionCard>

        <SectionCard
          icon={Compass}
          id="ui-navigation"
          title={t('ui:sections.navigation.title')}
          description={t('ui:sections.navigation.description')}
        >
          <NavigationDemo />
        </SectionCard>

        <SectionCard
          icon={PanelsTopLeft}
          id="ui-layout"
          title={t('ui:sections.layout.title')}
          description={t('ui:sections.layout.description')}
        >
          <DataDemo />
        </SectionCard>

        <SectionCard
          icon={LifeBuoy}
          id="ui-states"
          title={t('ui:sections.states.title')}
          description={t('ui:sections.states.description')}
          className="xl:col-span-2"
        >
          <StatesDemo />
        </SectionCard>
      </div>
    </div>
  )
}

function FoundationsDemo() {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <DemoBlock label={t('ui:foundations.palette')}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {PALETTE.map((entry) => (
            <div key={entry.token} className="space-y-1.5">
              <div className={cn('h-14 rounded-lg border', entry.className)} />
              <div className="space-y-0.5">
                <p className="text-xs font-medium">{t(`ui:foundations.tokens.${entry.token}`)}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{entry.token}</p>
              </div>
            </div>
          ))}
        </div>
      </DemoBlock>

      <div className="grid gap-8 lg:grid-cols-2">
        <DemoBlock label={t('ui:foundations.typography')}>
          <div className="space-y-3">
            <p className="text-2xl font-semibold tracking-tight">
              {t('ui:foundations.typeDisplay')}
            </p>
            <p className="text-base font-medium">{t('ui:foundations.typeTitle')}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('ui:foundations.typeBody')}
            </p>
            <p className="w-fit rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs">
              {t('ui:foundations.typeMono')}
            </p>
          </div>
        </DemoBlock>

        <div className="grid gap-8 sm:grid-cols-2">
          <DemoBlock label={t('ui:foundations.radius')}>
            <div className="flex items-end gap-3">
              {RADII.map((radius) => (
                <div key={radius.label} className="space-y-1.5 text-center">
                  <div
                    className={cn(
                      'grid size-14 place-items-center border bg-muted/40 font-mono text-[10px] text-muted-foreground',
                      radius.className,
                    )}
                  >
                    {radius.label}
                  </div>
                </div>
              ))}
            </div>
          </DemoBlock>

          <DemoBlock label={t('ui:foundations.elevation')}>
            <div className="flex gap-3">
              <div className="shadow-soft grid h-16 flex-1 place-items-center rounded-lg border bg-card text-xs">
                {t('ui:foundations.elevationSoft')}
              </div>
              <div className="shadow-glow grid h-16 flex-1 place-items-center rounded-lg border bg-card text-xs">
                {t('ui:foundations.elevationGlow')}
              </div>
            </div>
          </DemoBlock>
        </div>
      </div>
    </div>
  )
}

function ActionsDemo() {
  const { t } = useTranslation()
  const [view, setView] = useState('list')
  const [range, setRange] = useState('30d')

  return (
    <div className="space-y-8">
      <DemoBlock label={t('ui:actions.variants')}>
        <div className="flex flex-wrap gap-2">
          <Button>{t('ui:actions.primary')}</Button>
          <Button variant="secondary">{t('ui:actions.secondary')}</Button>
          <Button variant="outline">{t('ui:actions.outline')}</Button>
          <Button variant="ghost">{t('ui:actions.ghost')}</Button>
          <Button variant="destructive">{t('ui:actions.destructive')}</Button>
          <Button variant="link">{t('ui:actions.link')}</Button>
          <Button disabled>
            <Loader2 className="animate-spin" />
            {t('ui:actions.loading')}
          </Button>
        </div>
      </DemoBlock>

      <DemoBlock label={t('ui:actions.sizes')}>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">{t('ui:actions.small')}</Button>
          <Button>{t('ui:actions.default')}</Button>
          <Button size="lg">{t('ui:actions.large')}</Button>
          <Button size="icon" aria-label={t('ui:actions.icon')}>
            <Plus />
          </Button>
        </div>
      </DemoBlock>

      <DemoBlock label={t('ui:actions.badges')}>
        <div className="flex flex-wrap gap-2">
          <Badge>{t('ui:actions.badgeDefault')}</Badge>
          <Badge variant="secondary">{t('ui:actions.badgeSecondary')}</Badge>
          <Badge variant="outline">{t('ui:actions.badgeOutline')}</Badge>
          <Badge variant="destructive">{t('ui:actions.badgeDestructive')}</Badge>
          <Badge className="border-transparent bg-success/10 text-success">
            <CircleCheck />
            {t('ui:actions.badgeSuccess')}
          </Badge>
          <Badge className="border-transparent bg-warning/10 text-warning">
            <TriangleAlert />
            {t('ui:actions.badgeWarning')}
          </Badge>
        </div>
      </DemoBlock>

      <div className="grid gap-8 sm:grid-cols-2">
        <DemoBlock label={t('ui:actions.toggleGroup')} hint={t('ui:actions.toggleGroupHint')}>
          <ToggleGroup
            type="single"
            variant="outline"
            value={view}
            onValueChange={(value) => {
              if (value) setView(value)
            }}
            aria-label={t('ui:actions.toggleGroup')}
          >
            <ToggleGroupItem value="list" aria-label={t('ui:actions.viewList')}>
              <List />
              {t('ui:actions.viewList')}
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label={t('ui:actions.viewGrid')}>
              <LayoutGrid />
              {t('ui:actions.viewGrid')}
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label={t('ui:actions.viewBoard')}>
              <Columns3 />
              {t('ui:actions.viewBoard')}
            </ToggleGroupItem>
          </ToggleGroup>
        </DemoBlock>

        <DemoBlock label={t('ui:actions.avatars')} hint={t('ui:actions.avatarsHint')}>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary/10 font-medium text-accent-foreground">
                AL
              </AvatarFallback>
              <AvatarBadge />
            </Avatar>
            <Avatar>
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarFallback>JQ</AvatarFallback>
            </Avatar>
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>JQ</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+3</AvatarGroupCount>
            </AvatarGroup>
          </div>
        </DemoBlock>
      </div>

      <DemoBlock label={t('ui:actions.segmented')} hint={t('ui:actions.segmentedHint')}>
        <div id="demo-segmented" className="flex scroll-mt-24 flex-wrap items-center gap-4">
          <Segmented
            options={[
              { value: '7d', label: t('ui:actions.range7') },
              { value: '30d', label: t('ui:actions.range30') },
              { value: '90d', label: t('ui:actions.range90') },
            ]}
            value={range}
            onValueChange={setRange}
            aria-label={t('ui:actions.segmented')}
          />
          <Segmented
            size="sm"
            options={[
              { value: 'list', label: t('ui:actions.viewList'), icon: List },
              { value: 'grid', label: t('ui:actions.viewGrid'), icon: LayoutGrid },
              { value: 'board', label: t('ui:actions.viewBoard'), icon: Columns3 },
            ]}
            value={view}
            onValueChange={setView}
            aria-label={t('ui:actions.toggleGroup')}
          />
        </div>
      </DemoBlock>

      <div className="grid gap-8 sm:grid-cols-2">
        <DemoBlock label={t('ui:actions.withIcons')}>
          <div className="flex flex-wrap gap-2">
            <Button>
              <Plus />
              {t('ui:actions.create')}
            </Button>
            <Button variant="outline">
              <Filter />
              {t('ui:actions.filter')}
            </Button>
            <Button variant="ghost">
              <Download />
              {t('ui:actions.export')}
            </Button>
          </div>
        </DemoBlock>

        <DemoBlock label={t('ui:actions.toggle')} hint={t('ui:actions.toggleHint')}>
          <div className="flex gap-2">
            <Toggle aria-label={t('ui:actions.toggleBold')}>
              <Bold />
            </Toggle>
            <Toggle aria-label={t('ui:actions.toggleItalic')}>
              <Italic />
            </Toggle>
            <Toggle aria-label={t('ui:actions.toggleUnderline')}>
              <Underline />
            </Toggle>
          </div>
        </DemoBlock>
      </div>
    </div>
  )
}

function FormsDemo() {
  const { t, i18n } = useTranslation()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('manager')
  const [updates, setUpdates] = useState(true)
  const [mfa, setMfa] = useState(true)
  const [defaultRole, setDefaultRole] = useState('manager')
  const [otp, setOtp] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [quantity, setQuantity] = useState<number | null>(3)
  const [price, setPrice] = useState<number | null>(129.99)
  const [volume, setVolume] = useState(60)
  const calendarLocale = i18n.resolvedLanguage === 'zh-CN' ? zhCN : enUS

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ui-email">{t('ui:forms.email')}</Label>
            <Input
              id="ui-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('ui:forms.emailPlaceholder')}
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">{t('ui:forms.emailHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ui-notes">{t('ui:forms.textarea')}</Label>
            <Textarea
              id="ui-notes"
              rows={3}
              placeholder={t('ui:forms.textareaPlaceholder')}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ui-role">{t('ui:forms.select')}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="ui-role" className="w-full">
                <SelectValue placeholder={t('ui:forms.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t('ui:forms.roleAdmin')}</SelectItem>
                <SelectItem value="manager">{t('ui:forms.roleManager')}</SelectItem>
                <SelectItem value="viewer">{t('ui:forms.roleViewer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ui-disabled">{t('ui:forms.disabled')}</Label>
            <Input id="ui-disabled" disabled placeholder={t('ui:forms.disabledPlaceholder')} />
            <p className="text-xs text-muted-foreground">{t('ui:forms.disabledHint')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <DemoBlock label={t('ui:forms.checkbox')}>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ui-updates"
                checked={updates}
                onCheckedChange={(value) => setUpdates(value === true)}
              />
              <Label htmlFor="ui-updates">{t('ui:forms.checkboxLabel')}</Label>
            </div>
          </DemoBlock>

          <DemoBlock label={t('ui:forms.switch')}>
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="ui-mfa">{t('ui:forms.switchLabel')}</Label>
                <p className="text-xs text-muted-foreground">{t('ui:forms.switchHint')}</p>
              </div>
              <Switch id="ui-mfa" checked={mfa} onCheckedChange={setMfa} />
            </div>
          </DemoBlock>

          <DemoBlock label={t('ui:forms.radio')} hint={t('ui:forms.radioHint')}>
            <RadioGroup value={defaultRole} onValueChange={setDefaultRole}>
              {['admin', 'manager', 'viewer'].map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem value={value} id={`ui-role-${value}`} />
                  <Label htmlFor={`ui-role-${value}`}>
                    {t(`ui:forms.radio${value.charAt(0).toUpperCase()}${value.slice(1)}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </DemoBlock>
        </div>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-2">
        <DemoBlock label={t('ui:forms.inputNumber')} hint={t('ui:forms.inputNumberHint')}>
          <div id="demo-input-number" className="grid scroll-mt-24 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ui-quantity">{t('ui:forms.quantity')}</Label>
              <InputNumber
                id="ui-quantity"
                value={quantity}
                onValueChange={setQuantity}
                min={1}
                max={20}
                aria-label={t('ui:forms.quantity')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ui-price">{t('ui:forms.unitPrice')}</Label>
              <InputNumber
                id="ui-price"
                value={price}
                onValueChange={setPrice}
                min={0}
                step={0.5}
                precision={2}
                aria-label={t('ui:forms.unitPrice')}
              />
            </div>
          </div>
        </DemoBlock>

        <DemoBlock label={t('ui:forms.slider')} hint={t('ui:forms.sliderHint')}>
          <div id="demo-slider" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{t('ui:forms.volume')}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {t('ui:forms.volumeValue', { value: volume })}
              </span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={([next]) => setVolume(next ?? 0)}
              thumbLabels={[t('ui:forms.volume')]}
            />
          </div>
        </DemoBlock>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <DemoBlock label={t('ui:forms.otp')} hint={t('ui:forms.otpHint')}>
            <InputOTP maxLength={6} value={otp} onChange={setOtp} aria-label={t('ui:forms.otp')}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </DemoBlock>

          <DemoBlock label={t('ui:forms.validation')} hint={t('ui:forms.validationHint')}>
            <div className="space-y-2">
              <Label htmlFor="ui-invalid-email">{t('ui:forms.validationLabel')}</Label>
              <Input id="ui-invalid-email" aria-invalid defaultValue="jane@" type="email" />
              <p className="text-xs text-destructive">{t('ui:forms.validationError')}</p>
            </div>
          </DemoBlock>
        </div>

        <DemoBlock label={t('ui:forms.calendar')} hint={t('ui:forms.calendarHint')}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={calendarLocale}
            className="rounded-lg border"
          />
        </DemoBlock>
      </div>
    </div>
  )
}

function FeedbackDemo() {
  const { t } = useTranslation()
  const [overlay, setOverlay] = useState(false)

  return (
    <div className="space-y-8">
      <DemoBlock label={t('ui:feedback.alerts')}>
        <div className="space-y-3">
          <Alert>
            <Info />
            <AlertTitle>{t('ui:feedback.alertInfoTitle')}</AlertTitle>
            <AlertDescription>{t('ui:feedback.alertInfoDescription')}</AlertDescription>
          </Alert>
          <Alert className="border-success/30">
            <CircleCheck className="text-success" />
            <AlertTitle>{t('ui:feedback.alertSuccessTitle')}</AlertTitle>
            <AlertDescription>{t('ui:feedback.alertSuccessDescription')}</AlertDescription>
          </Alert>
          <Alert className="border-warning/40">
            <TriangleAlert className="text-warning" />
            <AlertTitle>{t('ui:feedback.alertWarningTitle')}</AlertTitle>
            <AlertDescription>{t('ui:feedback.alertWarningDescription')}</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <OctagonX />
            <AlertTitle>{t('ui:feedback.alertErrorTitle')}</AlertTitle>
            <AlertDescription>{t('ui:feedback.alertErrorDescription')}</AlertDescription>
          </Alert>
        </div>
      </DemoBlock>

      <div className="grid gap-8 sm:grid-cols-2">
        <DemoBlock label={t('ui:feedback.progress')}>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('ui:feedback.progressLabel')}</span>
              <span className="font-mono">{t('ui:feedback.progressValue')}</span>
            </div>
            <Progress
              value={68}
              role="progressbar"
              aria-label={t('ui:feedback.progressLabel')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={68}
            />
          </div>
        </DemoBlock>

        <DemoBlock label={t('ui:feedback.skeleton')} hint={t('ui:feedback.skeletonHint')}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </DemoBlock>

        <DemoBlock label={t('ui:feedback.toast')} hint={t('ui:feedback.toastHint')}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => toast.success(t('ui:feedback.toastSuccessMessage'))}
            >
              {t('ui:feedback.toastSuccess')}
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error(t('ui:feedback.toastErrorMessage'))}
            >
              {t('ui:feedback.toastError')}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast(t('ui:feedback.toastUndoMessage'), {
                  action: {
                    label: t('ui:feedback.toastUndoAction'),
                    onClick: () => toast.success(t('ui:feedback.toastUndoneMessage')),
                  },
                })
              }
            >
              {t('ui:feedback.toastUndo')}
            </Button>
          </div>
        </DemoBlock>

        <div className="space-y-8">
          <DemoBlock label={t('ui:feedback.tooltip')}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">{t('ui:feedback.tooltipTrigger')}</Button>
                </TooltipTrigger>
                <TooltipContent>{t('ui:feedback.tooltipText')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DemoBlock>

          <DemoBlock label={t('ui:feedback.hoverCard')}>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link" className="px-0">
                  {t('ui:feedback.hoverCardTrigger')}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-72">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 font-medium text-accent-foreground">
                      AL
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{t('ui:feedback.hoverCardName')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('ui:feedback.hoverCardRole')}
                    </p>
                    <p className="text-xs leading-relaxed">{t('ui:feedback.hoverCardBio')}</p>
                    <p className="pt-1 text-[11px] text-muted-foreground">
                      {t('ui:feedback.hoverCardMeta')}
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </DemoBlock>
        </div>
      </div>

      <DemoBlock label={t('ui:feedback.spinner')} hint={t('ui:feedback.spinnerHint')}>
        <div id="demo-spinner" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" label={t('ui:feedback.spinnerSmall')} />
              <span aria-hidden>{t('ui:feedback.spinnerSmall')}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Spinner label={t('ui:feedback.spinnerDefault')} />
              <span aria-hidden>{t('ui:feedback.spinnerDefault')}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Spinner size="lg" label={t('ui:feedback.spinnerLarge')} />
              <span aria-hidden>{t('ui:feedback.spinnerLarge')}</span>
            </span>
          </div>
          <div className="rounded-lg border p-4">
            <LoadingOverlay loading={overlay} label={t('common:states.loading')}>
              <p className="grid min-h-24 place-items-center text-sm text-muted-foreground">
                {t('ui:feedback.overlayContent')}
              </p>
            </LoadingOverlay>
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                aria-pressed={overlay}
                onClick={() => setOverlay((current) => !current)}
              >
                {t('ui:feedback.overlayToggle')}
              </Button>
            </div>
          </div>
        </div>
      </DemoBlock>
    </div>
  )
}

function OverlaysDemo() {
  const { t } = useTranslation()

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/ui`)
      toast.success(t('ui:overlays.copied'))
    } catch {
      toast.error(t('ui:feedback.toastErrorMessage'))
    }
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('ada@fish.dev')
      toast.success(t('ui:overlays.emailCopied'))
    } catch {
      toast.error(t('ui:feedback.toastErrorMessage'))
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="justify-start">
              <Mail />
              {t('ui:overlays.dialogTrigger')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('ui:overlays.dialogTitle')}</DialogTitle>
              <DialogDescription>{t('ui:overlays.dialogDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="ui-invite-email">{t('ui:overlays.dialogEmail')}</Label>
              <Input
                id="ui-invite-email"
                type="email"
                placeholder={t('ui:overlays.dialogEmailPlaceholder')}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t('ui:overlays.dialogCancel')}</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => toast.success(t('ui:feedback.toastSuccessMessage'))}>
                  {t('ui:overlays.dialogSend')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="justify-start">
              <SlidersHorizontal />
              {t('ui:overlays.sheetTrigger')}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('ui:overlays.sheetTitle')}</SheetTitle>
              <SheetDescription>{t('ui:overlays.sheetDescription')}</SheetDescription>
            </SheetHeader>
            <div className="space-y-2 px-4">
              <Label htmlFor="ui-sheet-search">{t('ui:overlays.sheetSearch')}</Label>
              <Input id="ui-sheet-search" placeholder={t('ui:overlays.sheetSearchPlaceholder')} />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button>{t('ui:overlays.sheetApply')}</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="justify-start">
              <PanelBottom />
              {t('ui:overlays.drawerTrigger')}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('ui:overlays.drawerTitle')}</DrawerTitle>
              <DrawerDescription>{t('ui:overlays.drawerDescription')}</DrawerDescription>
            </DrawerHeader>
            <p className="px-4 text-sm text-muted-foreground">{t('ui:overlays.drawerHint')}</p>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button>{t('ui:overlays.drawerDone')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              <Share2 />
              {t('ui:overlays.popoverTrigger')}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <PopoverHeader>
              <PopoverTitle>{t('ui:overlays.popoverTitle')}</PopoverTitle>
              <PopoverDescription className="text-xs">
                {t('ui:overlays.popoverDescription')}
              </PopoverDescription>
            </PopoverHeader>
            <div className="mt-3 flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/ui`}
                className="font-mono text-xs"
                aria-label={t('ui:overlays.copyLink')}
              />
              <Button
                size="icon"
                aria-label={t('ui:overlays.copyLink')}
                onClick={() => void copyLink()}
              >
                <Copy />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="justify-start">
              <EllipsisVertical />
              {t('ui:overlays.dropdownTrigger')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem>
              <UserRound />
              {t('ui:overlays.dropdownProfile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings2 />
              {t('ui:overlays.dropdownSettings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              {t('ui:overlays.dropdownSignOut')}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 />
              {t('ui:overlays.dropdownDelete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="justify-start text-destructive">
              <Trash2 />
              {t('ui:overlays.alertDialogTrigger')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('ui:overlays.alertDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('ui:overlays.alertDialogDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('ui:overlays.alertDialogCancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => toast.success(t('ui:overlays.alertDialogToast'))}
              >
                {t('ui:overlays.alertDialogConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <DemoBlock label={t('ui:overlays.contextMenu')}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-auto w-full justify-start gap-3 border-dashed p-4 text-left whitespace-normal"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <MousePointerClick className="size-4" />
              </span>
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">
                  {t('ui:overlays.contextMenuTrigger')}
                </span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {t('ui:overlays.contextMenuHint')}
                </span>
              </span>
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onSelect={() => void copyEmail()}>
              <Copy />
              {t('ui:overlays.contextCopy')}
            </ContextMenuItem>
            <ContextMenuItem>
              <Pencil />
              {t('ui:overlays.contextRename')}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <Trash2 />
              {t('ui:overlays.contextDelete')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </DemoBlock>
    </div>
  )
}

function NavigationDemo() {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <DemoBlock label={t('ui:navigation.tabs')}>
        <Tabs defaultValue="overview">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">{t('ui:navigation.tabOverview')}</TabsTrigger>
            <TabsTrigger value="activity">{t('ui:navigation.tabActivity')}</TabsTrigger>
            <TabsTrigger value="settings">{t('ui:navigation.tabSettings')}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t('ui:navigation.tabOverviewBody')}
            </div>
          </TabsContent>
          <TabsContent value="activity">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t('ui:navigation.tabActivityBody')}
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t('ui:navigation.tabSettingsBody')}
            </div>
          </TabsContent>
        </Tabs>
      </DemoBlock>

      <DemoBlock label={t('ui:navigation.breadcrumb')}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">{t('ui:navigation.breadcrumbHome')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to="/users"
                  search={{ page: 1, pageSize: 10, sort: 'createdAt', order: 'desc' }}
                >
                  {t('ui:navigation.breadcrumbUsers')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('ui:navigation.breadcrumbDetail')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DemoBlock>

      <DemoBlock label={t('ui:navigation.pagination')}>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(event) => event.preventDefault()} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive onClick={(event) => event.preventDefault()}>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" onClick={(event) => event.preventDefault()}>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" onClick={(event) => event.preventDefault()}>
                3
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" onClick={(event) => event.preventDefault()} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </DemoBlock>

      <DemoBlock label={t('ui:navigation.accordion')}>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="rbac">
            <AccordionTrigger>{t('ui:navigation.accordionQ1')}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t('ui:navigation.accordionA1')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="mock">
            <AccordionTrigger>{t('ui:navigation.accordionQ2')}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t('ui:navigation.accordionA2')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="accent">
            <AccordionTrigger>{t('ui:navigation.accordionQ3')}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {t('ui:navigation.accordionA3')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DemoBlock>
    </div>
  )
}

function DataDemo() {
  const { t } = useTranslation()
  const rows = [
    {
      name: 'Jane Cooper',
      role: t('ui:layout.roleAdmin'),
      status: t('ui:layout.statusActive'),
      active: true,
    },
    {
      name: 'Marcus Kim',
      role: t('ui:layout.roleManager'),
      status: t('ui:layout.statusActive'),
      active: true,
    },
    {
      name: 'Jasmine Quinn',
      role: t('ui:layout.roleViewer'),
      status: t('ui:layout.statusInvited'),
      active: false,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <DemoBlock label={t('ui:layout.resizable')} hint={t('ui:layout.resizableHint')}>
          <div className="h-44 overflow-hidden rounded-lg border">
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel
                defaultSize="40"
                minSize="20"
                className="grid place-items-center bg-muted/40 text-xs font-medium"
              >
                {t('ui:layout.panelLeft')}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize="60"
                minSize="30"
                className="grid place-items-center text-xs text-muted-foreground"
              >
                {t('ui:layout.panelRight')}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </DemoBlock>

        <DemoBlock label={t('ui:layout.scrollArea')} hint={t('ui:layout.scrollAreaHint')}>
          <ScrollArea className="h-44 rounded-lg border">
            <div className="space-y-1 p-3">
              {SCROLL_ROWS.map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm odd:bg-muted/40"
                >
                  <span>{t('ui:layout.scrollItem', { index: row })}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {t('ui:layout.scrollStatus')}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DemoBlock>
      </div>

      <DemoBlock label={t('ui:layout.table')}>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('ui:layout.tableName')}</TableHead>
                <TableHead>{t('ui:layout.tableRole')}</TableHead>
                <TableHead>{t('ui:layout.tableStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          row.active ? 'bg-success' : 'bg-warning',
                        )}
                      />
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DemoBlock>
    </div>
  )
}

function StatesDemo() {
  const { t } = useTranslation()

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <DemoBlock label={t('ui:states.authTitle')} hint={t('ui:states.authNote')}>
        <div className="grid gap-2 sm:grid-cols-2">
          {AUTH_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted/50"
            >
              {t(`ui:states.${link.key}`)}
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </DemoBlock>

      <DemoBlock label={t('ui:states.statusTitle')} hint={t('ui:states.statusNote')}>
        <div className="grid gap-2">
          {STATUS_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-muted/50"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="font-mono text-[11px] text-muted-foreground">{link.code}</span>
                <span className="truncate">{t(`ui:states.${link.key}`)}</span>
              </span>
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </DemoBlock>

      <DemoBlock
        label={t('ui:states.emptyTitle')}
        hint={t('ui:states.emptyNote')}
        className="lg:col-span-2"
      >
        <div id="demo-empty" className="grid scroll-mt-24 gap-4 sm:grid-cols-2">
          <Empty variant="outline">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>{t('ui:states.emptyInboxTitle')}</EmptyTitle>
              <EmptyDescription>{t('ui:states.emptyInboxDescription')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm">
                <Plus className="size-4" />
                {t('ui:states.emptyInboxAction')}
              </Button>
            </EmptyContent>
          </Empty>

          <Empty variant="outline">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>{t('ui:states.emptySearchTitle')}</EmptyTitle>
              <EmptyDescription>{t('ui:states.emptySearchDescription')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="ghost" size="sm">
                {t('common:actions.clearFilters')}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </DemoBlock>
    </div>
  )
}
