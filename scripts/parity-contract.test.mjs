import { describe, expect, it } from 'vitest'

import { buildContracts, serialize } from './parity-contract.mjs'

function fixtures(overrides = {}) {
  return {
    pilot: { version: 1, components: ['button'] },
    registry: {
      components: [
        { id: 'button', name: 'Button', category: 'primitive', status: 'stable', since: '0.1.0' },
        { id: 'alert', name: 'Alert', category: 'primitive', status: 'stable', since: '0.1.0' },
      ],
    },
    documented: { components: ['button', 'alert'] },
    api: {
      components: {
        button: {
          exportName: 'Button',
          source: 'packages/ui/src/components/ui/button.tsx',
          props: [
            {
              name: 'variant',
              type: 'string',
              required: false,
              defaultValue: 'default',
              description: '',
            },
          ],
          events: [],
        },
        alert: {
          exportName: 'Alert',
          source: 'packages/ui/src/components/ui/alert.tsx',
          props: [],
          events: [],
        },
      },
    },
    demos: [
      { id: 'button/basic', component: 'button' },
      { id: 'alert/basic', component: 'alert' },
    ],
    baselines: new Set([
      'alert-dark-linux.png',
      'alert-light-linux.png',
      'button-dark-linux.png',
      'button-light-linux.png',
    ]),
    ...overrides,
  }
}

describe('parity contract', () => {
  it('sorts components and freezes the documented surface', () => {
    const { components, surface } = buildContracts(fixtures())

    expect(components.pilot).toEqual(['button'])
    expect(components.components.map((item) => item.id)).toEqual(['alert', 'button'])
    expect(surface.routes.map((route) => route.id)).toEqual(['alert', 'button'])

    const button = components.components[1]
    expect(button.api.props[0]).toEqual({
      name: 'variant',
      type: 'string',
      required: false,
      defaultValue: 'default',
    })
    expect(button.demos).toEqual(['button/basic'])

    const route = surface.routes[1]
    expect(route.paths).toEqual({ en: '/components/button', zh: '/zh/components/button' })
    expect(route.demos).toEqual([
      { id: 'button/basic', anchor: 'section[data-demo="button/basic"]' },
    ])
    expect(route.apiRows).toBe(1)
  })

  it('rejects a pilot that is not documented', () => {
    const input = fixtures()
    input.pilot = { version: 1, components: ['missing'] }

    expect(() => buildContracts(input)).toThrow(/missing is not documented/)
  })

  it('rejects a component without demos', () => {
    const input = fixtures()
    input.demos = input.demos.filter((demo) => demo.component !== 'button')

    expect(() => buildContracts(input)).toThrow(/button has no demos/)
  })

  it('rejects duplicate demo ids', () => {
    const input = fixtures()
    input.demos = [...input.demos, { id: 'button/basic', component: 'button' }]

    expect(() => buildContracts(input)).toThrow(/duplicate demo ids/)
  })

  it('rejects a missing visual baseline', () => {
    const input = fixtures()
    input.baselines.delete('button-dark-linux.png')

    expect(() => buildContracts(input)).toThrow(/button-dark-linux\.png is missing/)
  })

  it('serialises with a trailing newline', () => {
    expect(serialize({ version: 1 }).endsWith('\n')).toBe(true)
  })
})
