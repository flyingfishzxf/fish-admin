import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useState } from 'react'

import {
  Combobox,
  EditableTable,
  type EditableTableColumn,
  type EditableTableRow,
  ProForm,
  type ProFormField,
  type ProFormValues,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Label,
} from '@fish-admin/react'

import { INTEGRATION_EVENTS, INTEGRATION_PROVIDERS } from '@/config/integrations'
import type { Integration, IntegrationMode } from '@/types'

import { createIntegration, updateIntegration, type IntegrationInput } from '../api'

export function IntegrationFormDrawer({
  open,
  integration,
  onOpenChange,
}: {
  open: boolean
  integration: Integration | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation('integrations')
  const queryClient = useQueryClient()
  const isEdit = Boolean(integration)

  const [provider, setProvider] = useState(integration?.provider ?? 'Slack')
  const [headers, setHeaders] = useState<EditableTableRow[]>(() =>
    (integration?.headers ?? []).map((header) => ({ ...header })),
  )

  const createMutation = useMutation({ mutationFn: createIntegration })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: IntegrationInput }) =>
      updateIntegration(id, input),
  })
  const pending = createMutation.isPending || updateMutation.isPending

  const fields: ProFormField[] = [
    {
      name: 'name',
      label: t('fields.name'),
      placeholder: t('fields.namePlaceholder'),
      required: true,
      minLength: 2,
      maxLength: 60,
    },
    {
      name: 'endpoint',
      label: t('fields.endpoint'),
      placeholder: 'https://hooks.example.com/fish-admin',
      description: t('fields.endpointHint'),
      required: true,
      minLength: 8,
      maxLength: 300,
      colSpan: 2,
    },
    {
      name: 'event',
      label: t('fields.event'),
      type: 'select',
      required: true,
      options: INTEGRATION_EVENTS.map((event) => ({
        value: event,
        label: t(`events.${event}`),
      })),
    },
    {
      name: 'mode',
      label: t('fields.mode'),
      type: 'select',
      required: true,
      options: [
        { value: 'immediate', label: t('mode.immediate') },
        { value: 'digest', label: t('mode.digest') },
      ],
    },
    {
      name: 'enabled',
      label: t('fields.enabled'),
      type: 'switch',
      description: t('fields.enabledHint'),
      colSpan: 2,
    },
  ]

  const headerColumns: EditableTableColumn[] = [
    {
      key: 'key',
      header: t('headers.columns.key'),
      editor: 'text',
      validate: (value) =>
        typeof value === 'string' && value.trim() ? null : t('headers.errors.key'),
    },
    {
      key: 'value',
      header: t('headers.columns.value'),
      editor: 'text',
    },
  ]

  const handleSubmit = async (values: ProFormValues) => {
    const input: IntegrationInput = {
      name: String(values.name ?? '').trim(),
      provider,
      endpoint: String(values.endpoint ?? '').trim(),
      event: String(values.event ?? ''),
      mode: (values.mode as IntegrationMode) ?? 'immediate',
      enabled: values.enabled === true,
      headers: headers.map((row) => ({
        id: String(row.id),
        key: String(row.key ?? ''),
        value: String(row.value ?? ''),
      })),
    }

    try {
      if (integration) {
        await updateMutation.mutateAsync({ id: integration.id, input })
      } else {
        await createMutation.mutateAsync(input)
      }
      toast.success(t(isEdit ? 'toasts.updated' : 'toasts.created'))
      await queryClient.invalidateQueries({ queryKey: ['integrations'] })
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.save'))
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader className="border-b pr-12">
          <DrawerTitle>{t(isEdit ? 'form.editTitle' : 'form.createTitle')}</DrawerTitle>
          <DrawerDescription>
            {t(isEdit ? 'form.editDescription' : 'form.createDescription')}
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          <div className="space-y-2">
            <Label htmlFor="integration-provider">{t('fields.provider')}</Label>
            <Combobox
              id="integration-provider"
              options={INTEGRATION_PROVIDERS.map((entry) => ({ value: entry, label: entry }))}
              value={provider}
              onChange={setProvider}
              placeholder={t('fields.providerPlaceholder')}
              ariaLabel={t('fields.provider')}
            />
          </div>

          <section className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('headers.title')}</h3>
              <span className="text-xs text-muted-foreground">{t('headers.savedWithForm')}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('headers.description')}</p>
            <EditableTable
              ariaLabel={t('headers.title')}
              columns={headerColumns}
              rows={headers}
              onRowsChange={setHeaders}
              addRow={() => ({ id: `header-${crypto.randomUUID()}`, key: '', value: '' })}
              labels={{
                add: t('headers.add'),
                save: t('headers.save'),
                cancel: t('headers.cancel'),
                edit: t('headers.edit'),
                delete: t('headers.delete'),
                actions: t('headers.actions'),
                empty: t('headers.empty'),
              }}
            />
          </section>

          <ProForm
            fields={fields}
            defaultValues={{
              name: integration?.name,
              endpoint: integration?.endpoint,
              event: integration?.event,
              mode: integration?.mode ?? 'immediate',
              enabled: integration?.enabled ?? false,
            }}
            onSubmit={handleSubmit}
            validateMessage={(rule, label, limit) => t(`validation.${rule}`, { label, limit })}
            submitLabel={t(isEdit ? 'form.save' : 'form.create')}
            resetLabel={t('form.reset')}
            loading={pending}
            ariaLabel={t(isEdit ? 'form.editTitle' : 'form.createTitle')}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
