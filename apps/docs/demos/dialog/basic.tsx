import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/react'
import { UserPlus } from 'lucide-react'

export default function DialogBasic() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [sent, setSent] = useState<{ email: string; role: string } | null>(null)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus aria-hidden="true" style={{ width: '1rem', height: '1rem' }} />
              Invite member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a member</DialogTitle>
              <DialogDescription>
                They receive an email with a link to join the Acme Operations workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="fish-demo-stack" style={{ maxWidth: '100%', gap: '0.85rem' }}>
              <div>
                <Label htmlFor="demo-dialog-email">Email address</Label>
                <Input
                  id="demo-dialog-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  style={{ marginTop: '0.5rem' }}
                />
              </div>
              <div>
                <Label htmlFor="demo-dialog-role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger
                    id="demo-dialog-role"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  size="sm"
                  disabled={email.trim() === ''}
                  onClick={() => setSent({ email: email.trim(), role })}
                >
                  Send invite
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <p className="fish-demo-muted" role="status">
          {sent ? `Invite sent to ${sent.email} as ${sent.role}.` : 'No invite sent yet.'}
        </p>
      </div>
      <p className="fish-demo-muted">
        The send button stays disabled until an address is typed; the page keeps the last result.
      </p>
    </div>
  )
}
