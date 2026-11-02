import { useId, useState } from 'react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Progress,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@fish-admin/react'
import { ShieldCheck, UserPlus } from 'lucide-react'

import { editorText } from './copy'

export default function EditorGallery({ lang }: { lang: 'en' | 'zh' }) {
  const text = editorText(lang)
  const id = useId()
  const [tab, setTab] = useState('profile')
  const [name, setName] = useState(text.ownerName)
  const [notifications, setNotifications] = useState(true)
  const [moved, setMoved] = useState(false)

  return (
    <section className="fish-gallery" aria-labelledby={`${id}-title`}>
      <div className="fish-gallery__head">
        <h2 id={`${id}-title`}>{text.galleryHeading}</h2>
        <p>{text.galleryHint}</p>
      </div>
      <div className="fish-gallery__grid">
        <Card className="fish-gallery__card">
          <CardHeader>
            <div className="fish-gallery__between">
              <div>
                <CardTitle>{text.cardTitle}</CardTitle>
                <CardDescription>{text.cardDescription}</CardDescription>
              </div>
              <Badge>{text.badgeLive}</Badge>
            </div>
          </CardHeader>
          <CardContent className="fish-gallery__stack">
            <div className="fish-gallery__owner">
              <Avatar role="img" aria-label={text.ownerName}>
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <span className="fish-gallery__owner-text">
                <span className="fish-gallery__name">{text.ownerName}</span>
                <span className="fish-gallery__meta">{text.ownerRole}</span>
              </span>
            </div>
            <div className="fish-gallery__metric-block">
              <div className="fish-gallery__between">
                <span className="fish-gallery__label">{text.metricLabel}</span>
                <span className="fish-gallery__meta">{text.metricProgress}</span>
              </div>
              <strong className="fish-gallery__metric">{text.metricValue}</strong>
              <Progress value={68} aria-label={text.metricProgress} />
            </div>
          </CardContent>
          <CardFooter className="fish-gallery__actions">
            <Button size="sm">
              <UserPlus aria-hidden="true" />
              {text.invite}
            </Button>
            <Button size="sm" variant="ghost">
              {text.dismiss}
            </Button>
          </CardFooter>
        </Card>

        <div className="fish-gallery__panel">
          <h3 className="fish-gallery__panel-title">{text.preferences}</h3>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="profile">{text.tabsProfile}</TabsTrigger>
              <TabsTrigger value="security">{text.tabsSecurity}</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <div className="fish-gallery__stack fish-gallery__tab-panel">
                <div className="fish-gallery__field">
                  <Label htmlFor={`${id}-name`}>{text.displayName}</Label>
                  <Input
                    id={`${id}-name`}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="fish-gallery__between">
                  <Label htmlFor={`${id}-notifications`}>{text.notifications}</Label>
                  <Switch
                    id={`${id}-notifications`}
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
                <div>
                  <Button size="sm">{text.save}</Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="security">
              <div className="fish-gallery__stack fish-gallery__tab-panel">
                <div className="fish-gallery__between">
                  <div>
                    <Label htmlFor={`${id}-security`}>{text.tabsSecurity}</Label>
                    <p className="fish-gallery__meta">{text.securityHint}</p>
                  </div>
                  <Switch id={`${id}-security`} defaultChecked />
                </div>
                <div>
                  <Button size="sm">{text.save}</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="fish-gallery__panel fish-gallery__panel--plain">
          <Alert>
            <ShieldCheck aria-hidden="true" />
            <AlertTitle>{text.accessTitle}</AlertTitle>
            <AlertDescription>
              <p>{text.accessBody}</p>
              <Button size="sm" variant="outline">
                {text.accessAction}
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        <div className="fish-gallery__panel">
          <h3 className="fish-gallery__panel-title">{text.dialogTitle}</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus aria-hidden="true" />
                {text.dialogTrigger}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{text.dialogTitle}</DialogTitle>
                <DialogDescription>{text.dialogDescription}</DialogDescription>
              </DialogHeader>
              <div className="fish-gallery__field">
                <Label htmlFor={`${id}-invite`}>{text.displayName}</Label>
                <Input id={`${id}-invite`} placeholder={text.ownerName} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button size="sm" variant="ghost">
                    {text.dialogCancel}
                  </Button>
                </DialogClose>
                <Button size="sm">{text.dialogConfirm}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="fish-gallery__panel fish-gallery__motion">
          <h3 className="fish-gallery__panel-title">{text.motionTitle}</h3>
          <p className="fish-gallery__meta">{text.motionBody}</p>
          <div className="fish-motion__track" aria-hidden="true">
            <span className="fish-motion__dot" data-moved={moved || undefined} />
          </div>
          <div className="fish-gallery__between">
            <Button size="sm" variant="outline" onClick={() => setMoved((value) => !value)}>
              {text.motionPlay}
            </Button>
            <code className="fish-motion__meta">{text.motionMeta}</code>
          </div>
        </div>
      </div>
    </section>
  )
}
