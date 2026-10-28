import { expect, test, type Page } from '@playwright/test'

import { securityHeaders } from '../src/config/security-headers'
import { signInAs } from './helpers'

declare global {
  interface Window {
    __cspViolations?: string[]
  }
}

// A reload re-runs the init script, so the list is drained after every
// navigation instead of read once at the end.
const drain = () => {
  const found = window.__cspViolations ?? []
  window.__cspViolations = []
  return found
}

async function readViolations(page: Page) {
  return page.evaluate(drain)
}

test.describe('response header policy', () => {
  test('sends the identical policy on every entry point', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const asset = html.match(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"/)?.[1]
    expect(asset, 'the built shell must reference a hashed module chunk').toBeTruthy()

    // `add_header` is not inherited into a location that declares its own, so a
    // regression normally means one of these paths quietly lost the policy.
    for (const path of ['/', '/index.html', asset as string, '/boot.css', '/theme-bootstrap.js']) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(200)
      for (const [key, value] of Object.entries(securityHeaders)) {
        // Two matching rules would read back as "value, value" here.
        expect(response.headers()[key.toLowerCase()], `${path} ${key}`).toBe(value)
      }
    }
  })

  test('walks the main flows without a single CSP violation', async ({ page }) => {
    // The listener has to exist before the first script is parsed, which is what
    // an init script buys; a page.on('console') probe would miss the shell.
    await page.addInitScript(() => {
      window.__cspViolations = window.__cspViolations ?? []
      window.addEventListener('securitypolicyviolation', (event) => {
        window.__cspViolations?.push(
          `${event.effectiveDirective} blocked ${event.blockedURI || event.sample} ` +
            `in ${event.sourceFile}:${event.lineNumber}:${event.columnNumber}`,
        )
      })
    })

    const found: string[] = []

    await signInAs(page, 'admin')
    found.push(...(await readViolations(page)))

    for (const path of ['/', '/users', '/reports', '/files', '/projects', '/settings']) {
      await page.goto(path)
      // Several demo pages nest their own <main>, so the shell's account menu is
      // the unambiguous "the app rendered" signal.
      await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
      found.push(...(await readViolations(page)))
    }

    // The shell bootstrap is the reason this policy needs a script-src at all, so
    // load it once more with a stored preference.
    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
    found.push(...(await readViolations(page)))

    expect(found).toEqual([])
  })
})
