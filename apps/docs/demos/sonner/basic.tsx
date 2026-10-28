import { Button, Toaster } from '@fish-admin/react'
import { toast } from 'sonner'

const TOASTER_ID = 'docs-sonner-basic'

export default function SonnerBasic() {
  function handleCopy() {
    void navigator.clipboard?.writeText('https://acme.dev/invite/8f2c')
    toast('Invite link copied', { toasterId: TOASTER_ID, description: 'It expires in 7 days.' })
  }

  return (
    <>
      <div className="fish-demo-stack">
        <div className="fish-demo-row">
          <Button
            size="sm"
            onClick={() =>
              toast.success('Changes saved', {
                toasterId: TOASTER_ID,
                description: 'Draft v4 is now the published version.',
              })
            }
          >
            Save changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.error('Could not publish', {
                toasterId: TOASTER_ID,
                description: 'The build step failed. Nothing was released.',
              })
            }
          >
            Publish release
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            Copy invite link
          </Button>
        </div>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          Success, error and a neutral message. Each toast keeps sonner&apos;s 4 s default and
          stacks at the bottom right of the viewport, outside the preview panel.
        </p>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          <code>Toaster</code> is mounted once at the end of this demo with an id; every toast
          passes the same <code>toasterId</code> so two demos on one page do not repeat each other.
        </p>
      </div>
      <Toaster id={TOASTER_ID} customAriaLabel="Saved and publish notifications" />
    </>
  )
}
