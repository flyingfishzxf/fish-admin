import { Button, Carousel, type CarouselSlide } from '@fish-admin/react'

const SLIDES: CarouselSlide[] = [
  {
    id: 'migration',
    content: (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          Action required
        </p>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Move your webhooks to the v2 endpoint
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
          The v1 endpoint stops accepting deliveries on November 30. Four workspaces still point at
          it.
        </p>
        <div>
          <Button type="button" size="sm">
            Review endpoints
          </Button>
        </div>
      </div>
    ),
  },
  {
    id: 'maintenance',
    content: (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          Scheduled
        </p>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
          Read-replica maintenance on Sunday
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
          Reporting queries may take up to 30 seconds longer between 02:00 and 03:00 UTC.
        </p>
        <div>
          <Button type="button" size="sm" variant="outline">
            View status page
          </Button>
        </div>
      </div>
    ),
  },
]

export default function CarouselContent() {
  return (
    <div style={{ width: '100%', maxWidth: '28rem' }}>
      <Carousel
        slides={SLIDES}
        ariaLabel="Operations notices"
        previousLabel="Previous notice"
        nextLabel="Next notice"
        goToLabel={(index) => `Go to notice ${index}`}
      />
    </div>
  )
}
