import { Button, PageContainer } from '@fish-admin/react'
import { Download } from 'lucide-react'

export default function PageContainerBasic() {
  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'var(--background)',
      }}
    >
      <PageContainer
        title="Quarterly revenue"
        description="Invoices issued between July 1 and September 30, 2026, across all workspaces."
        actions={
          <Button type="button" size="sm" variant="outline">
            <Download aria-hidden="true" />
            Export CSV
          </Button>
        }
      >
        <div
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))',
          }}
        >
          <div>
            <span className="fish-demo-label">Gross revenue</span>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>$1.28M</p>
          </div>
          <div>
            <span className="fish-demo-label">Invoices paid</span>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>238 of 248</p>
          </div>
          <div>
            <span className="fish-demo-label">Overdue</span>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>$18,400</p>
          </div>
        </div>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          Ten invoices are still open. The oldest one was issued on August 2.
        </p>
      </PageContainer>
    </div>
  )
}
