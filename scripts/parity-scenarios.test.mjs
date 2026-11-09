import { describe, expect, it } from 'vitest'

import { validateScenario, validateScenarioSet } from './parity-scenarios.mjs'

const component = {
  id: 'button',
  demos: ['button/basic', 'button/disabled'],
}

function scenario(steps) {
  return {
    version: 1,
    component: 'button',
    demo: 'basic',
    appearance: 'light',
    steps,
  }
}

describe('parity scenarios', () => {
  it('accepts a scenario built from accessible names and states', () => {
    expect(
      validateScenario(
        scenario([
          { action: 'click', target: { role: 'button', name: 'Save' } },
          {
            action: 'expectState',
            target: { role: 'button', name: 'Save' },
            state: 'disabled',
            value: true,
          },
          { action: 'expectText', text: 'Saved' },
        ]),
        component,
      ),
    ).toEqual([])
  })

  it('rejects an unknown demo', () => {
    expect(validateScenario({ ...scenario([]), demo: 'missing' }, component)).toContain(
      'missing is not a demo of button',
    )
  })

  it('rejects an unknown action', () => {
    expect(validateScenario(scenario([{ action: 'hover' }]), component)).toContain(
      'steps[0]: unknown action hover',
    )
  })

  it('rejects a click without a target', () => {
    expect(validateScenario(scenario([{ action: 'click' }]), component)).toContain(
      'steps[0]: click needs a target',
    )
  })

  it('rejects a fill without a value', () => {
    expect(
      validateScenario(
        scenario([{ action: 'fill', target: { role: 'textbox', name: 'Email' } }]),
        component,
      ),
    ).toContain('steps[0]: fill needs a value')
  })

  it('rejects an unknown state', () => {
    expect(
      validateScenario(
        scenario([
          {
            action: 'expectState',
            target: { role: 'button', name: 'Save' },
            state: 'open',
            value: true,
          },
        ]),
        component,
      ),
    ).toContain('steps[0]: unknown state open')
  })

  it('rejects a css target outside expectCount', () => {
    expect(
      validateScenario(scenario([{ action: 'click', target: { css: '#save' } }]), component),
    ).toContain('steps[0]: css targets are only allowed for expectCount')
  })

  it('requires exactly one scenario per pilot', () => {
    const pilot = { version: 1, components: ['button', 'alert'] }
    const components = [
      { id: 'button', demos: ['button/basic'] },
      { id: 'alert', demos: ['alert/basic'] },
    ]

    expect(
      validateScenarioSet(pilot, components, [scenario([{ action: 'expectText', text: 'Saved' }])]),
    ).toContain('alert: expected one scenario, found 0')
  })

  it('rejects a scenario for a component outside the pilot list', () => {
    const pilot = { version: 1, components: ['button'] }
    const components = [{ id: 'button', demos: ['button/basic'] }]

    expect(
      validateScenarioSet(pilot, components, [
        scenario([{ action: 'expectText', text: 'Saved' }]),
        { ...scenario([{ action: 'expectText', text: 'Alert' }]), component: 'alert' },
      ]),
    ).toContain('alert: not a pilot component')
  })
})
