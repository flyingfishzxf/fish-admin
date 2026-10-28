import { Loader2 } from 'lucide-react'
import { useRef } from 'react'
import { useForm, type Control, type FieldValues, type RegisterOptions } from 'react-hook-form'

import { Button } from '../../ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form'
import { Input } from '../../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Switch } from '../../ui/switch'
import { Textarea } from '../../ui/textarea'
import { cn } from '../../../lib/utils'

export type ProFormFieldType =
  'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'switch' | 'date'

export type ProFormOption = {
  value: string
  label: string
}

export type ProFormField = {
  name: string
  label: string
  type?: ProFormFieldType
  placeholder?: string
  description?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  options?: ProFormOption[]
  defaultValue?: string | number | boolean
  colSpan?: 1 | 2
}

export type ProFormRule =
  'required' | 'email' | 'number' | 'min' | 'max' | 'minLength' | 'maxLength'

export type ProFormValues = Record<string, unknown>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildInitialValues(
  fields: ProFormField[],
  defaultValues?: Partial<ProFormValues>,
): ProFormValues {
  const values: ProFormValues = {}

  for (const field of fields) {
    if (field.type === 'switch') {
      values[field.name] = field.defaultValue === true
    } else if (field.type === 'number') {
      values[field.name] = typeof field.defaultValue === 'number' ? field.defaultValue : ''
    } else {
      values[field.name] = field.defaultValue ?? ''
    }
  }

  return { ...values, ...defaultValues }
}

export function ProForm({
  fields,
  defaultValues,
  onSubmit,
  validateMessage,
  submitLabel,
  resetLabel,
  loading = false,
  ariaLabel,
  className,
}: {
  /** Field definitions rendered in order on a two-column grid. */
  fields: ProFormField[]
  /** Overrides for the values built from each field's `defaultValue`. */
  defaultValues?: Partial<ProFormValues>
  /** Called with the form values only after every rule passes. */
  onSubmit: (values: ProFormValues) => void | Promise<void>
  /** Message builder for a failed rule; receives the rule name, field label and limit. */
  validateMessage: (rule: ProFormRule, label: string, limit?: number) => string
  /** Submit button label. */
  submitLabel: string
  /** When set, renders an outline button that resets to the initial values. */
  resetLabel?: string
  /** External pending flag; combined with `isSubmitting` for the busy state. */
  loading?: boolean
  /** Accessible name for the `<form>` element. */
  ariaLabel?: string
  /** Extra classes for the `<form>` element. */
  className?: string
}) {
  const initialValues = useRef<ProFormValues | null>(null)
  if (initialValues.current === null) {
    initialValues.current = buildInitialValues(fields, defaultValues)
  }

  const form = useForm<ProFormValues>({ defaultValues: initialValues.current })
  const busy = loading || form.formState.isSubmitting

  return (
    <Form {...form}>
      <form
        noValidate
        aria-label={ariaLabel}
        aria-busy={busy || undefined}
        data-slot="pro-form"
        className={cn('space-y-5', className)}
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values)
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <ProFormFieldItem
              key={field.name}
              field={field}
              control={form.control}
              validateMessage={validateMessage}
            />
          ))}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          {resetLabel ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => form.reset(initialValues.current ?? {})}
            >
              {resetLabel}
            </Button>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 aria-hidden className="animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}

function ProFormFieldItem({
  field,
  control,
  validateMessage,
}: {
  field: ProFormField
  control: Control<ProFormValues>
  validateMessage: (rule: ProFormRule, label: string, limit?: number) => string
}) {
  const type = field.type ?? 'text'
  const rules: RegisterOptions<FieldValues, string> = {}

  if (field.required) {
    rules.required = validateMessage('required', field.label)
  }
  if (type === 'email') {
    rules.pattern = {
      value: EMAIL_PATTERN,
      message: validateMessage('email', field.label),
    }
  }
  rules.validate = (raw: unknown) => {
    if (raw === '' || raw === undefined || raw === null) return true

    if (type === 'number') {
      const parsed = typeof raw === 'number' ? raw : Number(raw)
      if (!Number.isFinite(parsed)) return validateMessage('number', field.label)
      if (field.min !== undefined && parsed < field.min) {
        return validateMessage('min', field.label, field.min)
      }
      if (field.max !== undefined && parsed > field.max) {
        return validateMessage('max', field.label, field.max)
      }
      return true
    }

    if (type === 'text' || type === 'email' || type === 'password' || type === 'textarea') {
      const length = String(raw).length
      if (field.minLength !== undefined && length < field.minLength) {
        return validateMessage('minLength', field.label, field.minLength)
      }
      if (field.maxLength !== undefined && length > field.maxLength) {
        return validateMessage('maxLength', field.label, field.maxLength)
      }
    }

    return true
  }

  return (
    <FormField
      control={control}
      name={field.name}
      rules={rules}
      render={({ field: controlled }) => (
        <FormItem className={cn(field.colSpan === 2 && 'sm:col-span-2')}>
          <FormLabel>{field.label}</FormLabel>

          {type === 'select' ? (
            <Select
              value={typeof controlled.value === 'string' ? controlled.value : ''}
              onValueChange={controlled.onChange}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(field.options ?? []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : type === 'switch' ? (
            <div className="flex h-9 items-center">
              <FormControl>
                <Switch
                  checked={controlled.value === true}
                  onCheckedChange={(checked) => controlled.onChange(checked)}
                />
              </FormControl>
            </div>
          ) : type === 'textarea' ? (
            <FormControl>
              <Textarea
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                {...controlled}
                value={typeof controlled.value === 'string' ? controlled.value : ''}
              />
            </FormControl>
          ) : (
            <FormControl>
              <Input
                type={type}
                placeholder={field.placeholder}
                autoComplete={type === 'password' ? 'new-password' : undefined}
                min={type === 'number' ? field.min : undefined}
                max={type === 'number' ? field.max : undefined}
                maxLength={field.maxLength}
                {...controlled}
                value={
                  controlled.value === undefined || controlled.value === null
                    ? ''
                    : String(controlled.value)
                }
                onChange={(event) => {
                  if (type === 'number') {
                    controlled.onChange(event.target.value === '' ? '' : event.target.valueAsNumber)
                    return
                  }
                  controlled.onChange(event.target.value)
                }}
              />
            </FormControl>
          )}

          {field.description ? <FormDescription>{field.description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
