import reactRegistry from '../../../docs/generated/registry.json'
import vueRegistry from '../../../../packages/vue/registry.json'

import type { ComponentEntry } from './types'

type RawComponent = {
  id: string
  name: string
  category: 'primitive' | 'enterprise' | 'pro'
  status: 'stable' | 'beta'
  since: string
  usedIn: string
  isNew?: boolean
}

const reactComponents = (reactRegistry as { components: RawComponent[] }).components
const vueComponents = (vueRegistry as { components: RawComponent[] }).components

const reactIds = new Set(reactComponents.map((component) => component.id))

/** React-generated entries first, then the Vue-only extras in registry order. */
export const COMPONENTS: ComponentEntry[] = [
  ...reactComponents.map((component) => ({ ...component, isNew: component.isNew ?? false })),
  ...vueComponents
    .filter((component) => !reactIds.has(component.id))
    .map((component) => ({ ...component, isNew: true, vueOnly: true })),
]
