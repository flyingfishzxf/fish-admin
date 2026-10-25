export const INTEGRATION_PROVIDERS = [
  'Slack',
  'GitHub',
  'Stripe',
  'Linear',
  'Datadog',
  'Custom',
] as const

export const INTEGRATION_EVENTS = [
  'project.created',
  'project.updated',
  'project.status_changed',
  'project.archived',
  'task.created',
  'file.uploaded',
  'invoice.paid',
  'user.invited',
] as const

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number]
export type IntegrationEvent = (typeof INTEGRATION_EVENTS)[number]
