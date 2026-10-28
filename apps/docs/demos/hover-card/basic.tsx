import {
  Avatar,
  AvatarFallback,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@fish-admin/react'

export default function HoverCardBasic() {
  return (
    <div className="fish-demo-stack" style={{ maxWidth: 420 }}>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0.875rem 1rem',
          background: 'var(--card)',
        }}
      >
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          Grace Hopper · 2 hours ago
        </p>
        <p style={{ margin: '0.375rem 0 0', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Reviewed the migration plan with{' '}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link" size="sm" style={{ height: 'auto', padding: 0 }}>
                @ada
              </Button>
            </HoverCardTrigger>
            <HoverCardContent align="start">
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Avatar>
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Ada Lovelace</span>
                  <span className="fish-demo-muted">@ada · Engineering</span>
                  <span className="fish-demo-muted">GMT · replies within an hour</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>{' '}
          — the rollout window still needs a second approver.
        </p>
      </div>
      <p className="fish-demo-muted">
        Hover @ada, or focus it with Tab, to open the preview; it closes when the pointer or focus
        leaves.
      </p>
    </div>
  )
}
