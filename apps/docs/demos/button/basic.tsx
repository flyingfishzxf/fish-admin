import { Button } from '@fish-admin/react'

export default function ButtonBasic() {
  return (
    <div className="fish-demo-row">
      <Button>Create project</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="outline">Export</Button>
      <Button variant="ghost">Cancel</Button>
    </div>
  )
}
