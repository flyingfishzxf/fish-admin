import { expect, type Locator, type Page } from '@playwright/test'

export type Target = {
  role?: string
  name?: string
  exact?: boolean
  css?: string
  scope?: 'demo' | 'page'
}

export type Step =
  | { action: 'click'; target: Target }
  | { action: 'fill'; target: Target; value: string }
  | { action: 'press'; target: Target; key: string }
  | { action: 'pressKey'; key: string }
  | { action: 'expectText'; text: string }
  | { action: 'expectNotText'; text: string }
  | { action: 'expectTargetText'; target: Target; text: string }
  | { action: 'expectVisible'; target: Target }
  | { action: 'expectHidden'; target: Target }
  | { action: 'expectCount'; target: Target; count: number }
  | {
      action: 'expectState'
      target: Target
      state: 'expanded' | 'selected' | 'checked' | 'disabled'
      value: boolean
    }

export interface Scenario {
  version: number
  component: string
  demo: string
  appearance: 'light' | 'dark'
  steps: Step[]
}

function resolve(page: Page, section: Locator, target: Target): Locator {
  const root = target.scope === 'page' ? page : section
  // css wins when a target carries both css and role: scenarios use css only for expectCount.
  if (target.css) return root.locator(target.css)
  if (!target.role) throw new Error('parity step target needs role or css')

  const role = target.role as Parameters<Page['getByRole']>[0]
  const options =
    target.name === undefined ? {} : { name: target.name, exact: target.exact ?? true }
  return root.getByRole(role, options)
}

export async function runScenario(page: Page, section: Locator, scenario: Scenario) {
  for (const step of scenario.steps) {
    switch (step.action) {
      case 'click':
        await resolve(page, section, step.target).click()
        break
      case 'fill':
        await resolve(page, section, step.target).fill(step.value)
        break
      case 'press':
        await resolve(page, section, step.target).press(step.key)
        break
      case 'pressKey':
        await page.keyboard.press(step.key)
        break
      case 'expectText':
        await expect(page.getByText(step.text).filter({ visible: true }).first()).toBeVisible()
        break
      case 'expectNotText':
        await expect(page.getByText(step.text).filter({ visible: true })).toHaveCount(0)
        break
      case 'expectTargetText':
        await expect(resolve(page, section, step.target)).toContainText(step.text)
        break
      case 'expectVisible':
        await expect(resolve(page, section, step.target)).toBeVisible()
        break
      case 'expectHidden':
        await expect(resolve(page, section, step.target)).toBeHidden()
        break
      case 'expectCount':
        await expect(resolve(page, section, step.target)).toHaveCount(step.count)
        break
      case 'expectState': {
        const locator = resolve(page, section, step.target)
        const value = String(step.value)

        if (step.state === 'expanded') {
          await expect(locator).toHaveAttribute('aria-expanded', value)
        } else if (step.state === 'selected') {
          await expect(locator).toHaveAttribute('aria-selected', value)
        } else if (step.state === 'checked') {
          await expect(locator).toHaveAttribute('aria-checked', value)
        } else if (step.value) {
          await expect(locator).toBeDisabled()
        } else {
          await expect(locator).toBeEnabled()
        }
        break
      }
    }
  }
}
