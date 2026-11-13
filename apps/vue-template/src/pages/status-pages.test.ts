import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import MaintenancePage from './MaintenancePage.vue'
import ServerErrorPage from './ServerErrorPage.vue'
import ServiceUnavailablePage from './ServiceUnavailablePage.vue'
import UnauthorizedPage from './UnauthorizedPage.vue'
import { i18nReady, setLanguage } from '../lib/i18n'

const CASES = [
  {
    name: 'UnauthorizedPage',
    component: UnauthorizedPage,
    code: '401',
    copy: 'Your session has expired',
  },
  {
    name: 'ServerErrorPage',
    component: ServerErrorPage,
    code: '500',
    copy: 'Something went wrong on our side',
  },
  {
    name: 'ServiceUnavailablePage',
    component: ServiceUnavailablePage,
    code: '503',
    copy: 'Service temporarily unavailable',
  },
  {
    name: 'MaintenancePage',
    component: MaintenancePage,
    code: '503',
    copy: "We'll be back shortly",
  },
] as const

function mountPage(component: (typeof CASES)[number]['component']) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/login', component: { template: '<div>login</div>' } },
    ],
  })
  return mount(component, { global: { plugins: [router] } })
}

describe('status pages', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
  })

  for (const { name, component, code, copy } of CASES) {
    it(`${name} renders its code, title and action`, () => {
      const page = mountPage(component)
      expect(page.text()).toContain(code)
      expect(page.text()).toContain(copy)
      expect(page.find('[data-action="status-primary"]').exists()).toBe(true)
    })
  }

  it('sends the expired session back to the login page', () => {
    const page = mountPage(UnauthorizedPage)
    expect(page.get('[data-action="status-primary"]').attributes('href')).toBe('/login')
    expect(page.get('[data-action="status-primary"]').text()).toBe('Sign in again')
  })
})
