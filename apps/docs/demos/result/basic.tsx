import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button, Result } from '@fish-admin/react'

export default function ResultBasic() {
  return (
    <Result
      status="success"
      title="Invitations sent"
      description="Three teammates were invited to the Platform workspace. They appear in the member list once they accept."
      extra={
        <>
          <Button size="sm" onClick={() => toast.success('Invitations re-sent')}>
            <UserPlus className="size-4" />
            Invite more
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast('Members are listed in the template.')}
          >
            View members
          </Button>
        </>
      }
    />
  )
}
