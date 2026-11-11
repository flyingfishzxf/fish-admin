import api from '../../../docs/generated/api.json'

export type ApiProp = {
  name: string
  type: string
  required?: boolean
  defaultValue?: string | null
  description: string
}

export type ApiComponent = {
  name: string
  exportName: string
  props: ApiProp[]
  events: ApiProp[]
  slots: string[]
  unresolved: string[]
}

export const API = api as { components: Record<string, ApiComponent> }
