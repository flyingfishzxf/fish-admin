import {
  CircleHelp,
  Columns3,
  Download,
  Eye,
  FileSpreadsheet,
  LayoutDashboard,
  List,
  Pencil,
  Rows3,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Badge,
  Button,
  Checkbox,
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
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Segmented,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
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

function DemoSurface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border bg-muted/20 p-4', className)}>{children}</div>
}

export function PaginationDemo() {
  const { t } = useTranslation()
  const [page, setPage] = useState(2)

  return (
    <div className="space-y-2">
      <Pagination className="mx-0 justify-start">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setPage((current) => Math.max(1, current - 1))
              }}
            />
          </PaginationItem>
          {[1, 2, 3].map((item) => (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                isActive={page === item}
                onClick={(event) => {
                  event.preventDefault()
                  setPage(item)
                }}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setPage((current) => Math.min(4, current + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-xs text-muted-foreground">
        {t('catalog:demos.pagination.summary', { page, total: 128 })}
      </p>
    </div>
  )
}

export function PopoverDemo() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState<string[]>(['team'])

  const toggle = (plan: string) =>
    setPlans((current) =>
      current.includes(plan) ? current.filter((item) => item !== plan) : [...current, plan],
    )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          {t('catalog:demos.popover.trigger')}
          {plans.length > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {plans.length}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 space-y-3">
        <p className="text-xs font-medium">{t('catalog:demos.popover.title')}</p>
        <div className="space-y-2">
          {(['starter', 'team', 'enterprise'] as const).map((plan) => (
            <div key={plan} className="flex items-center gap-2">
              <Checkbox
                id={`demo-plan-${plan}`}
                checked={plans.includes(plan)}
                onCheckedChange={() => toggle(plan)}
              />
              <Label htmlFor={`demo-plan-${plan}`} className="font-normal">
                {t(`catalog:demos.popover.${plan}`)}
              </Label>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-0" onClick={() => setPlans([])}>
          {t('catalog:demos.popover.clear')}
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export function ProgressDemo() {
  const { t } = useTranslation()
  const [done, setDone] = useState(2)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{t('catalog:demos.progress.title')}</span>
        <span className="text-muted-foreground">
          {t('catalog:demos.progress.value', { value: done * 25 })}
        </span>
      </div>
      <Progress value={done * 25} aria-label={t('catalog:demos.progress.title')} />
      <div className="flex flex-wrap gap-2">
        {[
          { id: 1, label: t('catalog:demos.progress.step1') },
          { id: 2, label: t('catalog:demos.progress.step2') },
          { id: 3, label: t('catalog:demos.progress.step3') },
          { id: 4, label: t('catalog:demos.progress.step4') },
        ].map((step) => (
          <Button
            key={step.id}
            variant={done >= step.id ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setDone(step.id)}
          >
            {step.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function RadioGroupDemo() {
  const { t } = useTranslation()
  const [plan, setPlan] = useState('team')

  return (
    <RadioGroup
      value={plan}
      onValueChange={setPlan}
      aria-label={t('catalog:demos.radioGroup.label')}
      className="gap-2"
    >
      {(['starter', 'team', 'enterprise'] as const).map((option) => (
        <label
          key={option}
          htmlFor={`demo-plan-radio-${option}`}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
            plan === option && 'border-primary bg-primary/5',
          )}
        >
          <RadioGroupItem id={`demo-plan-radio-${option}`} value={option} className="mt-0.5" />
          <span className="min-w-0 space-y-0.5">
            <span className="block text-sm font-medium">
              {t(`catalog:demos.radioGroup.${option}`)}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t(`catalog:demos.radioGroup.${option}Hint`)}
            </span>
          </span>
        </label>
      ))}
    </RadioGroup>
  )
}

export function ResizableDemo() {
  const { t } = useTranslation()

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-44 gap-2 rounded-lg border bg-muted/20 p-2"
    >
      <ResizablePanel defaultSize={40} minSize={25}>
        <div className="h-full space-y-1 overflow-y-auto pr-1">
          <p className="px-1 text-xs font-medium">{t('catalog:demos.resizable.queue')}</p>
          {[
            t('catalog:demos.resizable.t1'),
            t('catalog:demos.resizable.t2'),
            t('catalog:demos.resizable.t3'),
          ].map((ticket, index) => (
            <div
              key={ticket}
              className={cn(
                'rounded-md border bg-background px-2 py-1.5 text-xs',
                index === 0 && 'border-primary bg-primary/5',
              )}
            >
              {ticket}
            </div>
          ))}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60}>
        <div className="h-full space-y-2 overflow-y-auto pl-1">
          <p className="text-xs font-medium">{t('catalog:demos.resizable.details')}</p>
          <p className="text-sm">{t('catalog:demos.resizable.ticketTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('catalog:demos.resizable.ticketBody')}</p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function ScrollAreaDemo() {
  const { t } = useTranslation()

  const events = [
    { id: 'a', label: t('catalog:demos.scrollArea.e1') },
    { id: 'b', label: t('catalog:demos.scrollArea.e2') },
    { id: 'c', label: t('catalog:demos.scrollArea.e3') },
    { id: 'd', label: t('catalog:demos.scrollArea.e4') },
    { id: 'e', label: t('catalog:demos.scrollArea.e5') },
    { id: 'f', label: t('catalog:demos.scrollArea.e6') },
    { id: 'g', label: t('catalog:demos.scrollArea.e7') },
  ]

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">{t('catalog:demos.scrollArea.title')}</p>
      <ScrollArea className="h-40 rounded-lg border bg-muted/20">
        <ul className="divide-y">
          {events.map((event) => (
            <li key={event.id} className="px-3 py-2 text-xs text-muted-foreground">
              {event.label}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}

export function SegmentedDemo() {
  const { t } = useTranslation()
  const [view, setView] = useState('members')

  return (
    <div className="space-y-3">
      <Segmented
        aria-label={t('catalog:demos.segmented.label')}
        size="sm"
        value={view}
        onValueChange={setView}
        options={[
          { value: 'members', label: t('catalog:demos.segmented.members'), icon: Users },
          {
            value: 'invoices',
            label: t('catalog:demos.segmented.invoices'),
            icon: FileSpreadsheet,
          },
        ]}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {view === 'members'
          ? t('catalog:demos.segmented.membersHint')
          : t('catalog:demos.segmented.invoicesHint')}
      </p>
    </div>
  )
}

export function SelectDemo() {
  const { t } = useTranslation()
  const [role, setRole] = useState('admin')

  return (
    <div className="space-y-2">
      <Label htmlFor="demo-role-select">{t('catalog:demos.select.label')}</Label>
      <Select value={role} onValueChange={setRole}>
        <SelectTrigger id="demo-role-select" className="w-full">
          <SelectValue placeholder={t('catalog:demos.select.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="owner">{t('catalog:demos.select.owner')}</SelectItem>
          <SelectItem value="admin">{t('catalog:demos.select.admin')}</SelectItem>
          <SelectItem value="member">{t('catalog:demos.select.member')}</SelectItem>
          <SelectItem value="viewer">{t('catalog:demos.select.viewer')}</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {t('catalog:demos.select.hint', { role: t(`catalog:demos.select.${role}`) })}
      </p>
    </div>
  )
}

export function SeparatorDemo() {
  const { t } = useTranslation()

  return (
    <DemoSurface className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('catalog:demos.separator.invoice')}</span>
        <span>INV-1042</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('catalog:demos.separator.subtotal')}</span>
        <span className="tabular-nums">$1,240.00</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('catalog:demos.separator.tax')}</span>
        <span className="tabular-nums">$99.20</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{t('catalog:demos.separator.total')}</span>
        <span className="tabular-nums">$1,339.20</span>
      </div>
    </DemoSurface>
  )
}

export function SheetDemo() {
  const { t } = useTranslation()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="size-4" />
          {t('catalog:demos.sheet.trigger')}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader className="text-left">
          <SheetTitle>Katherine Johnson</SheetTitle>
          <SheetDescription>{t('catalog:demos.sheet.description')}</SheetDescription>
        </SheetHeader>
        <dl className="grid gap-3 py-6 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t('catalog:demos.sheet.email')}</dt>
            <dd className="truncate">katherine@example.com</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t('catalog:demos.sheet.team')}</dt>
            <dd>{t('catalog:demos.sheet.teamValue')}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t('catalog:demos.sheet.lastActive')}</dt>
            <dd>{t('catalog:demos.sheet.lastActiveValue')}</dd>
          </div>
        </dl>
        <SheetFooter>
          <SheetClose asChild>
            <Button size="sm" onClick={() => toast(t('catalog:demos.sheet.manage'))}>
              {t('catalog:demos.sheet.manage')}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function SidebarDemo() {
  const { t } = useTranslation()
  const [active, setActive] = useState('members')

  const items = [
    { id: 'overview', label: t('catalog:demos.sidebar.overview'), icon: LayoutDashboard },
    { id: 'members', label: t('catalog:demos.sidebar.members'), icon: Users },
    { id: 'billing', label: t('catalog:demos.sidebar.billing'), icon: Columns3 },
    { id: 'settings', label: t('catalog:demos.sidebar.settings'), icon: Settings },
  ]

  return (
    <div className="h-60 overflow-hidden rounded-lg border">
      <SidebarProvider
        embedded
        className="h-full min-h-0"
        style={{ '--sidebar-width': '13rem' } as CSSProperties}
      >
        <Sidebar collapsible="none" className="h-full border-none">
          <SidebarHeader className="border-b">
            <p className="text-sm font-semibold">{t('catalog:demos.sidebar.workspace')}</p>
            <p className="text-xs text-muted-foreground">{t('catalog:demos.sidebar.plan')}</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t('catalog:demos.sidebar.group')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={active === item.id}
                        tooltip={item.label}
                        onClick={() => setActive(item.id)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-muted-foreground" />
              <span className="text-xs">{t('catalog:demos.sidebar.footer')}</span>
            </div>
          </SidebarFooter>
        </Sidebar>
      </SidebarProvider>
    </div>
  )
}

export function SkeletonDemo() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">{t('catalog:demos.skeleton.title')}</p>
        <Button variant="outline" size="sm" onClick={() => setLoading((current) => !current)}>
          {loading ? t('catalog:demos.skeleton.hide') : t('catalog:demos.skeleton.show')}
        </Button>
      </div>
      <LoadingOverlay
        loading={loading}
        label={t('catalog:demos.skeleton.loading')}
        className="space-y-2"
        delay={0}
      >
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center gap-3 rounded-lg border bg-background p-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </LoadingOverlay>
    </div>
  )
}

export function SliderDemo() {
  const { t } = useTranslation()
  const [budget, setBudget] = useState<number[]>([1800])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('catalog:demos.slider.label')}</span>
        <span className="font-medium tabular-nums">${budget[0] ?? 0}</span>
      </div>
      <Slider
        value={budget}
        onValueChange={setBudget}
        min={200}
        max={5000}
        step={100}
        thumbLabels={[t('catalog:demos.slider.label')]}
      />
      <p className="text-xs text-muted-foreground">{t('catalog:demos.slider.hint')}</p>
    </div>
  )
}

export function SonnerDemo() {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <DemoSurface className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => toast.success(t('catalog:demos.sonner.success'))}>
          <Save className="size-4" />
          {t('catalog:demos.sonner.save')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.warning(t('catalog:demos.sonner.warn'))}
        >
          <ShieldCheck className="size-4" />
          {t('catalog:demos.sonner.warn')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.error(t('catalog:demos.sonner.error'))}
        >
          <Trash2 className="size-4" />
          {t('catalog:demos.sonner.error')}
        </Button>
      </DemoSurface>
      <p className="text-xs text-muted-foreground">{t('catalog:demos.sonner.hint')}</p>
    </div>
  )
}

export function SpinnerDemo() {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <DemoSurface className="flex flex-wrap items-center gap-4">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </DemoSurface>
      <div className="flex items-center gap-2">
        <Button size="sm" disabled>
          <Spinner label={t('catalog:demos.spinner.label')} className="mr-2" />
          {t('catalog:demos.spinner.export')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('catalog:demos.spinner.hint')}</p>
      </div>
    </div>
  )
}

export function SwitchDemo() {
  const { t } = useTranslation()
  const [enforced, setEnforced] = useState(true)

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 p-3">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor="demo-2fa" className="text-sm">
          {t('catalog:demos.switch.title')}
        </Label>
        <p className="text-xs text-muted-foreground">{t('catalog:demos.switch.description')}</p>
        <p className="text-xs font-medium text-primary">
          {enforced ? t('catalog:demos.switch.on') : t('catalog:demos.switch.off')}
        </p>
      </div>
      <Switch
        id="demo-2fa"
        checked={enforced}
        onCheckedChange={(checked) => setEnforced(checked)}
      />
    </div>
  )
}

export function TableDemo() {
  const { t } = useTranslation()

  const rows = [
    { id: 'INV-1042', date: '2026-10-01', amount: '$1,339.20', status: 'paid' },
    { id: 'INV-1041', date: '2026-09-01', amount: '$1,339.20', status: 'open' },
    { id: 'INV-1040', date: '2026-08-01', amount: '$1,240.00', status: 'overdue' },
  ]

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('catalog:demos.table.invoice')}</TableHead>
            <TableHead>{t('catalog:demos.table.date')}</TableHead>
            <TableHead className="text-right">{t('catalog:demos.table.amount')}</TableHead>
            <TableHead className="text-right">{t('catalog:demos.table.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.id}</TableCell>
              <TableCell className="text-muted-foreground">{row.date}</TableCell>
              <TableCell className="text-right tabular-nums">{row.amount}</TableCell>
              <TableCell className="text-right">
                <Badge variant={row.status === 'overdue' ? 'destructive' : 'secondary'}>
                  {t(`catalog:demos.table.${row.status}`)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function TabsDemo() {
  const { t } = useTranslation()

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">{t('catalog:demos.tabs.overview')}</TabsTrigger>
        <TabsTrigger value="activity">{t('catalog:demos.tabs.activity')}</TabsTrigger>
        <TabsTrigger value="settings">{t('catalog:demos.tabs.settings')}</TabsTrigger>
      </TabsList>
      <TabsContent
        value="overview"
        className="mt-3 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground"
      >
        {t('catalog:demos.tabs.overviewBody')}
      </TabsContent>
      <TabsContent
        value="activity"
        className="mt-3 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground"
      >
        {t('catalog:demos.tabs.activityBody')}
      </TabsContent>
      <TabsContent
        value="settings"
        className="mt-3 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground"
      >
        {t('catalog:demos.tabs.settingsBody')}
      </TabsContent>
    </Tabs>
  )
}

export function TextareaDemo() {
  const { t } = useTranslation()
  const [note, setNote] = useState(t('catalog:demos.textarea.seed'))

  return (
    <div className="space-y-2">
      <Label htmlFor="demo-review-note">{t('catalog:demos.textarea.label')}</Label>
      <Textarea
        id="demo-review-note"
        rows={3}
        maxLength={280}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={t('catalog:demos.textarea.placeholder')}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('catalog:demos.textarea.hint')}</span>
        <span className="tabular-nums">{note.length} / 280</span>
      </div>
    </div>
  )
}

export function ToggleDemo() {
  const { t } = useTranslation()
  const [bold, setBold] = useState(true)

  return (
    <DemoSurface className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        <Toggle
          pressed={bold}
          onPressedChange={setBold}
          aria-label={t('catalog:demos.toggle.bold')}
        >
          <Pencil className="size-4" />
        </Toggle>
        <Toggle aria-label={t('catalog:demos.toggle.italic')} className="italic">
          <List className="size-4" />
        </Toggle>
        <Toggle aria-label={t('catalog:demos.toggle.comment')} variant="outline">
          <CircleHelp className="size-4" />
        </Toggle>
      </div>
      <p className="text-xs text-muted-foreground">
        {bold ? t('catalog:demos.toggle.on') : t('catalog:demos.toggle.off')}
      </p>
    </DemoSurface>
  )
}

export function ToggleGroupDemo() {
  const { t } = useTranslation()
  const [layout, setLayout] = useState('rows')

  return (
    <div className="space-y-3">
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={2}
        value={layout}
        onValueChange={(value) => value && setLayout(value)}
        aria-label={t('catalog:demos.toggleGroup.label')}
      >
        <ToggleGroupItem value="rows" aria-label={t('catalog:demos.toggleGroup.rows')}>
          <Rows3 className="size-4" />
          {t('catalog:demos.toggleGroup.rows')}
        </ToggleGroupItem>
        <ToggleGroupItem value="columns" aria-label={t('catalog:demos.toggleGroup.columns')}>
          <Columns3 className="size-4" />
          {t('catalog:demos.toggleGroup.columns')}
        </ToggleGroupItem>
        <ToggleGroupItem value="export" aria-label={t('catalog:demos.toggleGroup.export')}>
          <Download className="size-4" />
          {t('catalog:demos.toggleGroup.export')}
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        {t('catalog:demos.toggleGroup.hint', { layout: t(`catalog:demos.toggleGroup.${layout}`) })}
      </p>
    </div>
  )
}

export function TooltipDemo() {
  const { t } = useTranslation()

  return (
    <TooltipProvider>
      <DemoSurface className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={t('catalog:demos.tooltip.view')}>
              <Eye className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('catalog:demos.tooltip.view')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={t('catalog:demos.tooltip.edit')}>
              <Pencil className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('catalog:demos.tooltip.edit')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={t('catalog:demos.tooltip.remove')}>
              <Trash2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('catalog:demos.tooltip.remove')}</TooltipContent>
        </Tooltip>
        <p className="text-xs text-muted-foreground">{t('catalog:demos.tooltip.hint')}</p>
      </DemoSurface>
    </TooltipProvider>
  )
}
