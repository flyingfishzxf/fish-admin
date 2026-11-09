import fs from 'node:fs'
import path from 'node:path'

export type ApiMode = 'exact' | 'reference'

export interface ParityTarget {
  name: string
  baseURL: string
  webServer: { command: string; timeout: number }
  api: { mode: ApiMode; deviations: Record<string, string[]> }
}

export const targetId = process.env.PARITY_TARGET ?? 'react'
const file = path.resolve(process.cwd(), 'parity/targets', `${targetId}.json`)

if (!fs.existsSync(file)) {
  throw new Error(`parity target ${targetId} is missing (${file})`)
}

export const target = JSON.parse(fs.readFileSync(file, 'utf8')) as ParityTarget

if (target.name !== targetId) {
  throw new Error(`parity target ${file} declares ${target.name}, expected ${targetId}`)
}
