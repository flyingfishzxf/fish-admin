import { zodResolver } from '@hookform/resolvers/zod'
import { enUS, zhCN } from 'date-fns/locale'
import {
  AlertTriangle,
  Archive,
  CreditCard,
  Download,
  KeyRound,
  Mail,
  MoreHorizontal,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { InputNumber } from '@/components/ui/input-number'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

function DemoSurface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border bg-muted/20 p-4', className)}>{children}</div>
}

export function AccordionDemo() {
  const { t } = useTranslation()

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="billing"
      className="w-full rounded-lg border bg-muted/20 px-4"
    >
      <AccordionItem value="billing">
        <AccordionTrigger>{t('catalog:demos.accordion.billing')}</AccordionTrigger>
        <AccordionContent>{t('catalog:demos.accordion.billingAnswer')}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger>{t('catalog:demos.accordion.security')}</AccordionTrigger>
        <AccordionContent>{t('catalog:demos.accordion.securityAnswer')}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="sso">
        <AccordionTrigger>{t('catalog:demos.accordion.sso')}</AccordionTrigger>
        <AccordionContent>{t('catalog:demos.accordion.ssoAnswer')}</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function AlertDemo() {
  const { t } = useTranslation()

  return (
    <Alert>
      <ShieldCheck className="size-4" />
      <AlertTitle>{t('catalog:demos.alert.title')}</AlertTitle>
      <AlertDescription>{t('catalog:demos.alert.description')}</AlertDescription>
    </Alert>
  )
}

export function AlertDialogDemo() {
  const { t } = useTranslation()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <KeyRound className="size-4" />
          {t('catalog:demos.alertDialog.trigger')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('catalog:demos.alertDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('catalog:demos.alertDialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('catalog:demos.alertDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => toast.success(t('catalog:demos.alertDialog.done'))}>
            {t('catalog:demos.alertDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AvatarDemo() {
  const { t } = useTranslation()

  return (
    <DemoSurface className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs font-medium">{t('catalog:demos.avatar.title')}</p>
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>KJ</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </div>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>LT</AvatarFallback>
          <AvatarBadge aria-label={t('catalog:demos.avatar.online')} className="bg-chart-3" />
        </Avatar>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Linus Torvalds</p>
          <p className="text-xs text-muted-foreground">{t('catalog:demos.avatar.onCall')}</p>
        </div>
      </div>
    </DemoSurface>
  )
}

export function BadgeDemo() {
  const { t } = useTranslation()

  return (
    <DemoSurface className="flex flex-wrap items-center gap-2">
      <Badge>{t('catalog:demos.badge.active')}</Badge>
      <Badge variant="secondary">{t('catalog:demos.badge.trial')}</Badge>
      <Badge variant="outline">{t('catalog:demos.badge.invited')}</Badge>
      <Badge variant="destructive">{t('catalog:demos.badge.pastDue')}</Badge>
    </DemoSurface>
  )
}

export function BreadcrumbDemo() {
  const { t } = useTranslation()

  return (
    <DemoSurface>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/users" onClick={(event) => event.preventDefault()}>
              {t('catalog:demos.breadcrumb.workspace')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/users" onClick={(event) => event.preventDefault()}>
              {t('catalog:demos.breadcrumb.members')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ada Lovelace</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </DemoSurface>
  )
}

export function ButtonDemo() {
  const { t } = useTranslation()

  return (
    <DemoSurface className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={() => toast.success(t('catalog:demos.button.invited'))}>
        <UserPlus className="size-4" />
        {t('catalog:demos.button.invite')}
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast(t('catalog:demos.button.exported'))}>
        <Download className="size-4" />
        {t('catalog:demos.button.export')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => toast.error(t('catalog:demos.button.revoked'))}
      >
        <Trash2 className="size-4" />
        {t('catalog:demos.button.revoke')}
      </Button>
    </DemoSurface>
  )
}

export function CalendarDemo() {
  const { t, i18n } = useTranslation()
  const [date, setDate] = useState<Date | undefined>(() => new Date())
  const locale = i18n.resolvedLanguage === 'zh-CN' ? zhCN : enUS

  return (
    <div className="space-y-2">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        locale={locale}
        className="rounded-lg border"
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {date
          ? t('catalog:demos.calendar.selected', {
              date: date.toLocaleDateString(i18n.language, { dateStyle: 'medium' }),
            })
          : t('catalog:demos.calendar.empty')}
      </p>
    </div>
  )
}

export function CardDemo() {
  const { t } = useTranslation()

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-sm">{t('catalog:demos.card.title')}</CardTitle>
        <CardDescription>{t('catalog:demos.card.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-semibold tabular-nums">$48,290</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <CreditCard className="size-3" />
            {t('catalog:demos.card.plan')}
          </Badge>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => toast(t('catalog:demos.card.opened'))}
          >
            {t('catalog:demos.card.action')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ChartDemo() {
  const { t } = useTranslation()

  const config = {
    revenue: { label: t('catalog:demos.chart.series'), color: 'var(--chart-1)' },
  } satisfies ChartConfig

  const data = [
    { month: t('catalog:demos.chart.may'), revenue: 32400 },
    { month: t('catalog:demos.chart.june'), revenue: 36100 },
    { month: t('catalog:demos.chart.july'), revenue: 34800 },
    { month: t('catalog:demos.chart.august'), revenue: 41200 },
    { month: t('catalog:demos.chart.september'), revenue: 44700 },
    { month: t('catalog:demos.chart.october'), revenue: 48290 },
  ]

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium">{t('catalog:demos.chart.title')}</p>
      <ChartContainer config={config} className="aspect-auto h-40 w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

export function CheckboxDemo() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState(true)
  const [digest, setDigest] = useState(false)

  return (
    <DemoSurface className="space-y-3">
      <p className="text-xs font-medium">{t('catalog:demos.checkbox.title')}</p>
      <div className="flex items-start gap-2">
        <Checkbox
          id="demo-notify-requests"
          checked={requests}
          onCheckedChange={(checked) => setRequests(checked === true)}
        />
        <Label htmlFor="demo-notify-requests" className="font-normal">
          {t('catalog:demos.checkbox.requests')}
        </Label>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="demo-notify-digest"
          checked={digest}
          onCheckedChange={(checked) => setDigest(checked === true)}
        />
        <Label htmlFor="demo-notify-digest" className="font-normal">
          {t('catalog:demos.checkbox.digest')}
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('catalog:demos.checkbox.summary', {
          count: Number(requests) + Number(digest),
        })}
      </p>
    </DemoSurface>
  )
}

export function CollapsibleDemo() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          {t('catalog:demos.collapsible.trigger')}
          <span className="text-xs text-muted-foreground">
            {open ? t('catalog:demos.collapsible.collapse') : t('catalog:demos.collapsible.expand')}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 rounded-lg border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">{t('catalog:demos.collapsible.hint')}</p>
        <div className="flex items-center gap-2">
          <Checkbox id="demo-retention-exports" defaultChecked />
          <Label htmlFor="demo-retention-exports" className="font-normal">
            {t('catalog:demos.collapsible.exports')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="demo-retention-audit" defaultChecked />
          <Label htmlFor="demo-retention-audit" className="font-normal">
            {t('catalog:demos.collapsible.audit')}
          </Label>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function CommandDemo() {
  const { t } = useTranslation()

  return (
    <Command className="rounded-lg border shadow-none">
      <CommandInput placeholder={t('catalog:demos.command.placeholder')} />
      <CommandList>
        <CommandEmpty>{t('catalog:demos.command.empty')}</CommandEmpty>
        <CommandGroup heading={t('catalog:demos.command.group')}>
          <CommandItem onSelect={() => toast(t('catalog:demos.command.invite'))}>
            <UserPlus className="size-4" />
            {t('catalog:demos.command.invite')}
          </CommandItem>
          <CommandItem onSelect={() => toast(t('catalog:demos.command.key'))}>
            <KeyRound className="size-4" />
            {t('catalog:demos.command.key')}
          </CommandItem>
          <CommandItem onSelect={() => toast(t('catalog:demos.command.export'))}>
            <Download className="size-4" />
            {t('catalog:demos.command.export')}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export function ContextMenuDemo() {
  const { t } = useTranslation()
  const rows = ['Ada Lovelace', 'Grace Hopper']

  return (
    <DemoSurface className="space-y-2">
      <p className="text-xs text-muted-foreground">{t('catalog:demos.contextMenu.hint')}</p>
      <ul className="space-y-1">
        {rows.map((name) => (
          <li key={name}>
            <ContextMenu>
              <ContextMenuTrigger className="flex cursor-context-menu items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                <UserRound className="size-4 text-muted-foreground" />
                {name}
              </ContextMenuTrigger>
              <ContextMenuContent className="w-52">
                <ContextMenuItem
                  onSelect={() => toast(t('catalog:demos.contextMenu.profile', { name }))}
                >
                  {t('catalog:demos.contextMenu.profileAction')}
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => toast(t('catalog:demos.contextMenu.resend', { name }))}
                >
                  <Mail className="size-4" />
                  {t('catalog:demos.contextMenu.resendAction')}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  variant="destructive"
                  onSelect={() => toast.error(t('catalog:demos.contextMenu.archive', { name }))}
                >
                  <Archive className="size-4" />
                  {t('catalog:demos.contextMenu.archiveAction')}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </li>
        ))}
      </ul>
    </DemoSurface>
  )
}

export function DialogDemo() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-4" />
          {t('catalog:demos.dialog.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('catalog:demos.dialog.title')}</DialogTitle>
          <DialogDescription>{t('catalog:demos.dialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demo-invite-email">{t('catalog:demos.dialog.email')}</Label>
            <Input
              id="demo-invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-invite-role">{t('catalog:demos.dialog.role')}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="demo-invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">{t('catalog:demos.dialog.roleMember')}</SelectItem>
                <SelectItem value="admin">{t('catalog:demos.dialog.roleAdmin')}</SelectItem>
                <SelectItem value="viewer">{t('catalog:demos.dialog.roleViewer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              {t('catalog:demos.dialog.cancel')}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              size="sm"
              onClick={() => toast.success(t('catalog:demos.dialog.sent', { email }))}
            >
              {t('catalog:demos.dialog.send')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DrawerDemo() {
  const { t } = useTranslation()
  const [logins, setLogins] = useState(true)

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="size-4" />
          {t('catalog:demos.drawer.trigger')}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg space-y-4 px-6">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle>{t('catalog:demos.drawer.title')}</DrawerTitle>
            <DrawerDescription>{t('catalog:demos.drawer.description')}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="demo-drawer-logins"
                checked={logins}
                onCheckedChange={(checked) => setLogins(checked === true)}
              />
              <Label htmlFor="demo-drawer-logins" className="font-normal">
                {t('catalog:demos.drawer.logins')}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="demo-drawer-billing" />
              <Label htmlFor="demo-drawer-billing" className="font-normal">
                {t('catalog:demos.drawer.billing')}
              </Label>
            </div>
          </div>
          <DrawerFooter className="px-0">
            <DrawerClose asChild>
              <Button onClick={() => toast(t('catalog:demos.drawer.applied', { logins }))}>
                {t('catalog:demos.drawer.apply')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function DropdownMenuDemo() {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="size-4" />
          {t('catalog:demos.dropdown.trigger')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{t('catalog:demos.dropdown.label')}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => toast(t('catalog:demos.dropdown.profile'))}>
          <UserRound className="size-4" />
          {t('catalog:demos.dropdown.profileAction')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast(t('catalog:demos.dropdown.reset'))}>
          <RotateCcw className="size-4" />
          {t('catalog:demos.dropdown.resetAction')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => toast.error(t('catalog:demos.dropdown.suspend'))}
        >
          <AlertTriangle className="size-4" />
          {t('catalog:demos.dropdown.suspendAction')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function EmptyDemo() {
  const { t } = useTranslation()

  return (
    <Empty variant="outline">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Mail />
        </EmptyMedia>
        <EmptyTitle>{t('catalog:demos.empty.title')}</EmptyTitle>
        <EmptyDescription>{t('catalog:demos.empty.description')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={() => toast(t('catalog:demos.empty.action'))}>
          <UserPlus className="size-4" />
          {t('catalog:demos.empty.action')}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

type WorkspaceFormValues = { name: string; slug: string }

export function FormDemo() {
  const { t } = useTranslation()

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('catalog:demos.form.nameRequired')),
        slug: z
          .string()
          .trim()
          .regex(/^[a-z0-9-]+$/, t('catalog:demos.form.slugInvalid')),
      }),
    [t],
  )

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: 'Acme Operations', slug: 'acme-ops' },
  })

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          toast.success(t('catalog:demos.form.saved', { name: values.name })),
        )}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('catalog:demos.form.name')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('catalog:demos.form.slug')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm">
          {t('catalog:demos.form.submit')}
        </Button>
      </form>
    </Form>
  )
}

export function HoverCardDemo() {
  const { t } = useTranslation()

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" size="sm" className="h-auto p-0">
          @ada
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm font-medium">Ada Lovelace</p>
            <p className="text-xs text-muted-foreground">{t('catalog:demos.hoverCard.role')}</p>
            <p className="text-xs text-muted-foreground">{t('catalog:demos.hoverCard.timezone')}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export function InputDemo() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')

  return (
    <div className="space-y-2">
      <Label htmlFor="demo-work-email">{t('catalog:demos.input.label')}</Label>
      <Input
        id="demo-work-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@company.com"
      />
      <p className="text-xs text-muted-foreground">
        {email.includes('@')
          ? t('catalog:demos.input.valid', { email })
          : t('catalog:demos.input.hint')}
      </p>
    </div>
  )
}

export function InputNumberDemo() {
  const { t } = useTranslation()
  const [seats, setSeats] = useState<number | null>(12)
  const count = seats ?? 0

  return (
    <div className="space-y-2">
      <Label htmlFor="demo-seats">{t('catalog:demos.inputNumber.label')}</Label>
      <InputNumber
        id="demo-seats"
        aria-label={t('catalog:demos.inputNumber.label')}
        value={seats}
        onValueChange={setSeats}
        min={1}
        max={50}
        className="w-32"
      />
      <p className="text-xs text-muted-foreground">
        {t('catalog:demos.inputNumber.hint', { count, total: count * 12 })}
      </p>
    </div>
  )
}

export function InputOtpDemo() {
  const { t } = useTranslation()
  const [code, setCode] = useState('')

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{t('catalog:demos.inputOtp.label')}</Label>
        <p className="text-xs text-muted-foreground">{t('catalog:demos.inputOtp.description')}</p>
      </div>
      <InputOTP
        maxLength={6}
        value={code}
        onChange={setCode}
        aria-label={t('catalog:demos.inputOtp.label')}
      >
        <InputOTPGroup>
          {Array.from({ length: 6 }, (_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {code.length === 6
          ? t('catalog:demos.inputOtp.verified')
          : t('catalog:demos.inputOtp.progress', { count: code.length })}
      </p>
    </div>
  )
}

export function LabelDemo() {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <Label htmlFor="demo-webhook">
        {t('catalog:demos.label.title')}
        <span className="ml-1 text-destructive">*</span>
      </Label>
      <Input id="demo-webhook" defaultValue="https://hooks.acme.dev/audit" />
      <p className="text-xs text-muted-foreground">{t('catalog:demos.label.hint')}</p>
    </div>
  )
}
