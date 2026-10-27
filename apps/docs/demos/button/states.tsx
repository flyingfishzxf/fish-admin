import { Button, Spinner } from '@fish-admin/react'

export default function ButtonStates() {
  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="fish-demo-row">
        <Button disabled>Disabled</Button>
        <Button>
          <Spinner className="size-4" />
          Loading
        </Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  )
}
