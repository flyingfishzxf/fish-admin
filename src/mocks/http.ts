import { delay, HttpResponse, type JsonBodyType } from 'msw'

import { env } from '@/config/env'

export class HttpError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return HttpResponse.json({ code: error.code, message: error.message }, { status: error.status })
  }

  console.error('[mock] Unhandled resolver error', error)
  return HttpResponse.json(
    { code: 'MOCK_ERROR', message: 'Unexpected mock server error.' },
    { status: 500 },
  )
}

async function wait() {
  if (env.mockLatency > 0) await delay(env.mockLatency)
}

export async function run<T>(resolver: () => T | Promise<T>): Promise<Response> {
  await wait()
  try {
    return HttpResponse.json((await resolver()) as unknown as JsonBodyType)
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function runNoContent(resolver: () => void | Promise<void>): Promise<Response> {
  await wait()
  try {
    await resolver()
    return new HttpResponse(null, { status: 204 })
  } catch (error) {
    return toErrorResponse(error)
  }
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}
