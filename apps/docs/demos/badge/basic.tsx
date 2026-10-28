import { Badge } from '@fish-admin/react'

export default function BadgeBasic() {
  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Badge>Active</Badge>
        <Badge variant="secondary">Trial</Badge>
        <Badge variant="outline">Invited</Badge>
        <Badge variant="destructive">Past due</Badge>
        <Badge variant="ghost">Draft</Badge>
        <Badge variant="link" asChild>
          <a href="https://fish-admin.vercel.app/" target="_blank" rel="noreferrer">
            Changelog
          </a>
        </Badge>
      </div>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        default, secondary, outline, destructive, ghost and link. The last badge is rendered as an
        anchor through <code>asChild</code>.
      </p>
    </div>
  )
}
