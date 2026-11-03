import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form'
import { Input } from './input'

type WorkspaceValues = { name: string }

function FormHarness({ onValidSubmit }: { onValidSubmit?: (values: WorkspaceValues) => void }) {
  const form = useForm<WorkspaceValues>({ defaultValues: { name: '' } })

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit((values) => onValidSubmit?.(values))}>
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
        <button type="submit">Create workspace</button>
      </form>
    </Form>
  )
}

describe('Form', () => {
  it('shows the validation error and wires it through aria-describedby', async () => {
    const user = userEvent.setup()
    render(<FormHarness />)
    const input = screen.getByRole('textbox', { name: 'Workspace name' })

    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText('Enter a workspace name.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create workspace' }))

    const message = await screen.findByText('Enter a workspace name.')
    const description = screen.getByText('Shown in the workspace switcher.')
    const label = screen.getByText('Workspace name')

    expect(message).toHaveAttribute('data-slot', 'form-message')
    expect(label).toHaveAttribute('for', input.id)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', `${description.id} ${message.id}`)
  })

  it('clears the error and submits once the field is valid', async () => {
    const user = userEvent.setup()
    const onValidSubmit = vi.fn()
    render(<FormHarness onValidSubmit={onValidSubmit} />)
    const input = screen.getByRole('textbox', { name: 'Workspace name' })
    const submit = screen.getByRole('button', { name: 'Create workspace' })
    const description = screen.getByText('Shown in the workspace switcher.')

    await user.click(submit)
    expect(await screen.findByText('Enter a workspace name.')).toBeInTheDocument()

    await user.type(input, 'Acme Operations')
    await waitFor(() => {
      expect(screen.queryByText('Enter a workspace name.')).not.toBeInTheDocument()
    })

    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).toHaveAttribute('aria-describedby', description.id)

    await user.click(submit)

    await waitFor(() => {
      expect(onValidSubmit).toHaveBeenCalledWith({ name: 'Acme Operations' })
    })
  })
})
