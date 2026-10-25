import { http } from 'msw'

import { env } from '@/config/env'
import { INTEGRATION_EVENTS, INTEGRATION_PROVIDERS } from '@/config/integrations'
import { PERMISSION_CODES } from '@/config/permissions'
import type { IntegrationDelivery, IntegrationMode } from '@/types'

import { authorize } from '../auth'
import { logAuditEvent, readDb, writeDb } from '../db/store'
import type { MockDb, MockIntegrationRecord } from '../db/types'
import { HttpError, readJson, run, runNoContent } from '../http'

const API = env.apiBaseUrl
const MODES: IntegrationMode[] = ['immediate', 'digest']
const HEADER_KEY = /^[A-Za-z0-9-]{1,40}$/
const MAX_HEADERS = 10
const MAX_HEADER_VALUE = 200

interface IntegrationBody {
  name?: string
  provider?: string
  endpoint?: string
  event?: string
  mode?: IntegrationMode
  enabled?: boolean
  headers?: Array<{ id?: string; key?: string; value?: string }>
}

function findIntegration(db: MockDb, id: string) {
  const integration = db.integrations.find((entry) => entry.id === id)
  if (!integration) {
    throw new HttpError(404, 'INTEGRATION_NOT_FOUND', 'Integration not found.')
  }
  return integration
}

function readString(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} is required.`)
  }
  const trimmed = value.trim()
  if (trimmed.length < min || trimmed.length > max) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be ${min}-${max} characters.`)
  }
  return trimmed
}

function readProvider(value: unknown) {
  if (typeof value !== 'string' || !INTEGRATION_PROVIDERS.includes(value as never)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid provider.')
  }
  return value
}

function readEvent(value: unknown) {
  if (typeof value !== 'string' || !INTEGRATION_EVENTS.includes(value as never)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid event.')
  }
  return value
}

function readEndpoint(value: unknown) {
  const endpoint = readString(value, 'Endpoint', 8, 300)
  let parsed: URL
  try {
    parsed = new URL(endpoint)
  } catch {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Endpoint must be a valid URL.')
  }
  if (parsed.protocol !== 'https:') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Endpoint must use HTTPS.')
  }
  return endpoint
}

function readMode(value: unknown) {
  if (typeof value !== 'string' || !MODES.includes(value as never)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid delivery mode.')
  }
  return value as IntegrationMode
}

function readHeaders(value: unknown) {
  if (!Array.isArray(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Headers must be a list.')
  }
  if (value.length > MAX_HEADERS) {
    throw new HttpError(400, 'VALIDATION_ERROR', `Use ${MAX_HEADERS} headers or fewer.`)
  }

  const seen = new Set<string>()
  return value.map((entry) => {
    const header = entry as { id?: string; key?: string; value?: string }
    const key = typeof header.key === 'string' ? header.key.trim() : ''
    if (!HEADER_KEY.test(key)) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        'Header names allow letters, numbers and dashes.',
      )
    }
    const normalized = key.toLowerCase()
    if (seen.has(normalized)) {
      throw new HttpError(400, 'VALIDATION_ERROR', `Duplicate header "${key}".`)
    }
    seen.add(normalized)

    const headerValue = typeof header.value === 'string' ? header.value.trim() : ''
    if (headerValue.length > MAX_HEADER_VALUE) {
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `Header values are limited to ${MAX_HEADER_VALUE}.`,
      )
    }

    return {
      id: header.id || `header-${crypto.randomUUID()}`,
      key,
      value: headerValue,
    }
  })
}

function previewSecret(provider: string) {
  const suffix = Math.random().toString(16).slice(2, 6)
  const prefix =
    provider === 'Stripe'
      ? 'whsec'
      : provider === 'Slack'
        ? 'xoxb'
        : provider === 'GitHub'
          ? 'ghp'
          : provider === 'Linear'
            ? 'lin'
            : provider === 'Datadog'
              ? 'dd'
              : 'hook'
  return `${prefix}_••••${suffix}`
}

function listDeliveries(db: MockDb, integrationId: string) {
  return db.deliveries
    .filter((delivery) => delivery.integrationId === integrationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const integrationHandlers = [
  http.get(`${API}/integrations`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.integrationRead)
      const url = new URL(request.url)
      const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
      const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 4), 1), 24)
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const provider = url.searchParams.get('provider')
      const enabled = url.searchParams.get('enabled')

      const filtered = db.integrations.filter((integration) => {
        if (provider && integration.provider !== provider) return false
        if (enabled === '1' && !integration.enabled) return false
        if (enabled === '0' && integration.enabled) return false
        if (!q) return true
        return [integration.name, integration.provider, integration.endpoint, integration.event]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })

      const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const total = sorted.length
      const pageCount = Math.max(1, Math.ceil(total / pageSize))
      const currentPage = Math.min(page, pageCount)
      const start = (currentPage - 1) * pageSize

      return {
        items: sorted.slice(start, start + pageSize),
        total,
        page: currentPage,
        pageSize,
        pageCount,
      }
    }),
  ),

  http.get(`${API}/integrations/deliveries`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.integrationRead)
      const url = new URL(request.url)
      const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 8), 1), 40)

      const names = new Map(
        db.integrations.map((integration) => [integration.id, integration.name]),
      )
      const items = [...db.deliveries]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
        .map((delivery) => ({
          ...delivery,
          integrationName: names.get(delivery.integrationId) ?? '—',
        }))

      return { items, total: db.deliveries.length }
    }),
  ),

  http.get(`${API}/integrations/:id/deliveries`, ({ request, params }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.integrationRead)
      const integration = findIntegration(db, String(params.id))

      return {
        integrationId: integration.id,
        items: listDeliveries(db, integration.id),
      }
    }),
  ),

  http.post(`${API}/integrations`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.integrationManage)
      const body = (await readJson<IntegrationBody>(request)) ?? {}

      const name = readString(body.name, 'Name', 2, 60)
      const provider = readProvider(body.provider)
      const endpoint = readEndpoint(body.endpoint)
      const event = readEvent(body.event)
      const mode = readMode(body.mode ?? 'immediate')
      const headers = readHeaders(body.headers ?? [])
      if (db.integrations.some((entry) => entry.endpoint === endpoint && entry.event === event)) {
        throw new HttpError(409, 'ENDPOINT_TAKEN', 'This endpoint already receives that event.')
      }

      const record: MockIntegrationRecord = {
        id: `integration-${crypto.randomUUID()}`,
        name,
        provider,
        endpoint,
        event,
        mode,
        enabled: body.enabled === true,
        headers,
        secretPreview: previewSecret(provider),
        createdAt: new Date().toISOString(),
      }

      db.integrations.unshift(record)
      logAuditEvent(db, {
        action: 'integration.created',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'integration',
        entityId: record.id,
        entityLabel: record.name,
        metadata: { provider, event, mode },
      })
      writeDb(db)
      return record
    }),
  ),

  http.patch(`${API}/integrations/:id`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.integrationManage)
      const integration = findIntegration(db, String(params.id))
      const body = (await readJson<IntegrationBody>(request)) ?? {}
      const changed: string[] = []

      if (body.name !== undefined) {
        integration.name = readString(body.name, 'Name', 2, 60)
        changed.push('name')
      }
      if (body.provider !== undefined) {
        integration.provider = readProvider(body.provider)
        changed.push('provider')
      }
      if (body.endpoint !== undefined) {
        integration.endpoint = readEndpoint(body.endpoint)
        changed.push('endpoint')
      }
      if (body.event !== undefined) {
        integration.event = readEvent(body.event)
        changed.push('event')
      }
      if (body.mode !== undefined) {
        integration.mode = readMode(body.mode)
        changed.push('mode')
      }
      if (body.enabled !== undefined) {
        integration.enabled = body.enabled === true
        changed.push('enabled')
      }
      if (body.headers !== undefined) {
        integration.headers = readHeaders(body.headers)
        changed.push('headers')
      }

      if (changed.length === 0) return { ...integration }

      logAuditEvent(db, {
        action: 'integration.updated',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'integration',
        entityId: integration.id,
        entityLabel: integration.name,
        metadata: { fields: changed.join(', ') },
      })
      writeDb(db)
      return { ...integration }
    }),
  ),

  http.post(`${API}/integrations/:id/deliveries/:deliveryId/retry`, ({ request, params }) =>
    run(() => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.integrationManage)
      const integration = findIntegration(db, String(params.id))
      const delivery = db.deliveries.find(
        (entry) => entry.id === String(params.deliveryId) && entry.integrationId === integration.id,
      )
      if (!delivery) {
        throw new HttpError(404, 'DELIVERY_NOT_FOUND', 'Delivery not found.')
      }

      const now = new Date().toISOString()
      const attempt = Number((delivery.payload.data as { attempt?: number } | undefined)?.attempt)
      const record: IntegrationDelivery = {
        id: `delivery-${crypto.randomUUID()}`,
        integrationId: integration.id,
        event: delivery.event,
        status: 'success',
        statusCode: 200,
        durationMs: 90 + Math.round(Math.random() * 180),
        payload: {
          ...delivery.payload,
          id: `evt_${crypto.randomUUID().slice(0, 8)}`,
          createdAt: now,
          data: {
            ...(delivery.payload.data as Record<string, unknown> | undefined),
            replayOf: delivery.id,
            attempt: Number.isFinite(attempt) ? attempt + 1 : 1,
          },
        },
        createdAt: now,
      }

      db.deliveries.unshift(record)
      integration.lastDeliveryAt = now
      logAuditEvent(db, {
        action: 'integration.updated',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'integration',
        entityId: integration.id,
        entityLabel: integration.name,
        metadata: { replay: delivery.id, status: 'success' },
      })
      writeDb(db)
      return record
    }),
  ),

  http.delete(`${API}/integrations/:id`, ({ request, params }) =>
    runNoContent(() => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.integrationManage)
      const integration = findIntegration(db, String(params.id))

      db.integrations = db.integrations.filter((entry) => entry.id !== integration.id)
      db.deliveries = db.deliveries.filter((entry) => entry.integrationId !== integration.id)
      logAuditEvent(db, {
        action: 'integration.deleted',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'integration',
        entityId: integration.id,
        entityLabel: integration.name,
        metadata: { provider: integration.provider, event: integration.event },
      })
      writeDb(db)
    }),
  ),
]
