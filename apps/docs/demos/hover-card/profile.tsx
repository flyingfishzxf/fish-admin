import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@fish-admin/react'
import { Building2, Clock, MapPin } from 'lucide-react'

export default function HoverCardProfile() {
  return (
    <div className="fish-demo-stack" style={{ maxWidth: 420 }}>
      <div className="fish-demo-row">
        <span className="fish-demo-muted">Assigned reviewer</span>
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              style={{ height: 'auto', padding: '0.25rem 0.5rem', gap: '0.5rem' }}
            >
              <Avatar size="sm">
                <AvatarFallback>GH</AvatarFallback>
              </Avatar>
              Grace Hopper
            </Button>
          </HoverCardTrigger>
          <HoverCardContent align="start" style={{ width: 288 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Avatar>
                <AvatarFallback>GH</AvatarFallback>
              </Avatar>
              <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Grace Hopper</span>
                <span className="fish-demo-muted">@grace · Platform engineering</span>
              </div>
              <Badge variant="secondary" style={{ marginLeft: 'auto' }}>
                Active
              </Badge>
            </div>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Maintains the release pipeline and reviews every migration plan before it reaches
              production.
            </p>
            <div style={{ display: 'grid', gap: '0.35rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2
                  aria-hidden
                  style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }}
                />
                <span className="fish-demo-muted">Platform engineering</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin
                  aria-hidden
                  style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }}
                />
                <span className="fish-demo-muted">Berlin · CET</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock
                  aria-hidden
                  style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }}
                />
                <span className="fish-demo-muted">Joined November 2024</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
      <p className="fish-demo-muted">
        openDelay is set to 200 ms; Radix defaults to 700 ms. The card is a read-only preview, so
        real actions belong on the destination page.
      </p>
    </div>
  )
}
