import { useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/react'

type InviteValues = { role: string; notify: boolean }

export default function FormFields() {
  const [result, setResult] = useState('')
  const form = useForm<InviteValues>({ defaultValues: { role: '', notify: true } })

  return (
    <Form {...form}>
      <form
        className="fish-demo-stack"
        noValidate
        onSubmit={form.handleSubmit((values) => {
          setResult(
            `Invite ready: ${values.role} role, setup email ${
              values.notify ? 'included' : 'skipped'
            }.`,
          )
        })}
      >
        <FormField
          control={form.control}
          name="role"
          rules={{ required: 'Pick an access role.' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access role</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger style={{ width: '100%' }}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Admins can manage members and billing.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notify"
          render={({ field }) => (
            <FormItem>
              <div className="fish-demo-row" style={{ alignItems: 'center' }}>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel>Email the invitee a setup link</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="fish-demo-row">
          <Button type="submit" size="sm">
            Send invite
          </Button>
          <p className="fish-demo-muted" role="status">
            {result || 'Submit without a role to see the select validation.'}
          </p>
        </div>
      </form>
    </Form>
  )
}
