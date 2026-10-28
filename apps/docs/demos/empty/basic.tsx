import { useState } from 'react'

import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@fish-admin/react'
import { FolderPlus, Inbox, Upload } from 'lucide-react'

export default function EmptyBasic() {
  const [status, setStatus] = useState('No action yet')

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 460 }}>
      <Empty variant="outline">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Projects keep boards, documents and reports for one team in one place.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="fish-demo-row" style={{ justifyContent: 'center' }}>
            <Button
              size="sm"
              onClick={() => setStatus('Create project — open your new-project dialog.')}
            >
              <FolderPlus />
              Create project
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus('Import — accept a CSV to seed the workspace.')}
            >
              <Upload />
              Import CSV
            </Button>
          </div>
          <p className="fish-demo-muted" style={{ margin: 0 }}>
            Last action: {status}
          </p>
        </EmptyContent>
      </Empty>
      <p className="fish-demo-muted">
        The actions are your own buttons inside <code>EmptyContent</code>; the empty state only
        renders the layout.
      </p>
    </div>
  )
}
