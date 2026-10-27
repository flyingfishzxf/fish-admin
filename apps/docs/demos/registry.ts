import raw from './registry.json'

export interface DemoMeta {
  id: string
  component: string
  file: string
  title: { en: string; zh: string }
  description: { en: string; zh: string }
}

export const DEMOS = raw as DemoMeta[]

export function demoFor(filename: string): DemoMeta | undefined {
  return DEMOS.find((demo) => demo.file === filename)
}
