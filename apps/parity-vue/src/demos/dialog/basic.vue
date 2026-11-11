<script lang="ts">
export default { name: 'DialogBasic' }
</script>

<script setup lang="ts">
import { UserPlus } from 'lucide-vue-next'
import { ref } from 'vue'

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
} from '@fish-admin/vue'

const ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer',
  member: 'Member',
  admin: 'Admin',
}

const email = ref('')
const role = ref('member')
const sent = ref<{ email: string; role: string } | null>(null)

function sendInvite() {
  sent.value = { email: email.value.trim(), role: role.value }
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Dialog>
        <DialogTrigger as-child>
          <Button variant="outline" size="sm">
            <UserPlus aria-hidden="true" style="width: 1rem; height: 1rem" />
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
          <div class="fish-demo-stack" style="max-width: 100%; gap: 0.85rem">
            <div>
              <Label for="demo-dialog-email">Email address</Label>
              <Input
                id="demo-dialog-email"
                v-model="email"
                type="email"
                placeholder="name@company.com"
                style="margin-top: 0.5rem"
              />
            </div>
            <div>
              <Label for="demo-dialog-role">Role</Label>
              <Select v-model="role">
                <SelectTrigger id="demo-dialog-role" style="margin-top: 0.5rem; width: 100%">
                  <SelectValue :label="ROLE_LABELS[role]" />
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
            <DialogClose as-child>
              <Button variant="ghost" size="sm">Cancel</Button>
            </DialogClose>
            <DialogClose as-child>
              <Button size="sm" :disabled="email.trim() === ''" @click="sendInvite">
                Send invite
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p class="fish-demo-muted" role="status">
        {{ sent ? `Invite sent to ${sent.email} as ${sent.role}.` : 'No invite sent yet.' }}
      </p>
    </div>
    <p class="fish-demo-muted">
      The send button stays disabled until an address is typed; the page keeps the last result.
    </p>
  </div>
</template>
