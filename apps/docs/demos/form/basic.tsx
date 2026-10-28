import { useState } from 'react'
import { useForm } from 'react-hook-form'

import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@fish-admin/react'

type WorkspaceValues = { name: string; slug: string }

export default function FormBasic() {
  const [saved, setSaved] = useState('')
  const form = useForm<WorkspaceValues>({ defaultValues: { name: '', slug: '' } })

  return (
    <Form {...form}>
      <form
        className="fish-demo-stack"
        noValidate
        onSubmit={form.handleSubmit((values) => {
          setSaved(`Saved ${values.name} with the slug "${values.slug}".`)
        })}
      >
        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Enter a workspace name.' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Operations" {...field} />
              </FormControl>
              <FormDescription>Shown in the workspace switcher.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          rules={{
            required: 'Enter a URL slug.',
            pattern: {
              value: /^[a-z0-9-]+$/,
              message: 'Use lowercase letters, numbers and hyphens only.',
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL slug</FormLabel>
              <FormControl>
                <Input placeholder="acme-ops" {...field} />
              </FormControl>
              <FormDescription>Used in acme.dev/{field.value || 'your-slug'}.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="fish-demo-row">
          <Button type="submit" size="sm">
            Create workspace
          </Button>
          <p className="fish-demo-muted" role="status">
            {saved || 'Submit with empty fields to see the validation messages.'}
          </p>
        </div>
      </form>
    </Form>
  )
}
