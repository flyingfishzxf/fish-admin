import { Button } from '@fish-admin/react'
import { ArrowUpRight, Download, Save, Trash2 } from 'lucide-react'

export default function ButtonIcons() {
  return (
    <div className="fish-demo-row">
      <Button>
        <Save aria-hidden="true" />
        Save changes
      </Button>
      <Button variant="outline">
        <Download aria-hidden="true" />
        Export
      </Button>
      <Button variant="destructive" size="icon" aria-label="Delete project">
        <Trash2 aria-hidden="true" />
      </Button>
      <Button asChild variant="link">
        <a href="https://fish-admin.vercel.app/" target="_blank" rel="noreferrer">
          Open the template
          <ArrowUpRight aria-hidden="true" />
        </a>
      </Button>
    </div>
  )
}
