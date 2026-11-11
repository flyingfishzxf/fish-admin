import registry from '../../../docs/generated/registry.json'

import type { ComponentEntry } from './types'

export const COMPONENTS = registry.components as ComponentEntry[]
