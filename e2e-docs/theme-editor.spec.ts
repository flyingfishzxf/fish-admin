import { expect, test, type Page } from '@playwright/test'

const EDITOR = '.fish-editor'
const PRIMARY = 'input[aria-label="--primary"]'
const GREEN = 'oklch(0.62 0.19 150)'

function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function openEditor(page: Page, appearance: 'light' | 'dark' = 'light') {
  await page.addInitScript((theme) => {
    window.localStorage.setItem('rspress-visited', '1')
    window.localStorage.setItem('rspress-theme-appearance', theme)
  }, appearance)
  await page.goto('/guide/theme-editor')
  await expect(page.locator(EDITOR)).toBeVisible()
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains('dark')))
    .toBe(appearance === 'dark')
}

function rootToken(page: Page, token: string): Promise<string> {
  return page.evaluate(
    (name) => document.documentElement.style.getPropertyValue(name).trim(),
    token,
  )
}

test('editing a token reaches the preview, the dialog and the export', async ({ page }) => {
  const errors = watchConsole(page)
  await openEditor(page)

  await page.locator(PRIMARY).fill(GREEN)
  await expect.poll(() => rootToken(page, '--primary')).toBe(GREEN)

  const invite = page.locator('.fish-gallery__actions button').first()
  await expect
    .poll(() => invite.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(GREEN)

  await page.getByRole('button', { name: 'Open dialog' }).click()
  const dialog = page.locator('[data-slot="dialog-content"]')
  await expect(dialog).toBeVisible()
  const confirm = dialog.getByRole('button', { name: 'Send invite' })
  await expect
    .poll(() => confirm.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe(GREEN)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await expect(page.locator('.fish-export__code')).toContainText(`--primary: ${GREEN};`)
  expect(new URL(page.url()).searchParams.get('theme')).toBeTruthy()
  expect(errors).toEqual([])
})

test('the share URL restores the edited theme', async ({ page }) => {
  await openEditor(page)
  await page.locator(PRIMARY).fill(GREEN)
  await page.getByRole('tab', { name: 'Share URL' }).click()
  const shareUrl = (await page.locator('.fish-export__code').textContent())?.trim() ?? ''
  expect(shareUrl).toContain('?theme=')

  await page.goto(shareUrl)
  await expect(page.locator(EDITOR)).toBeVisible()
  await expect(page.locator(PRIMARY)).toHaveValue(GREEN)
  await expect.poll(() => rootToken(page, '--primary')).toBe(GREEN)
})

test('malformed and hostile links fall back to defaults without injecting CSS', async ({
  page,
}) => {
  await openEditor(page)
  const fallback = await page.locator(PRIMARY).inputValue()

  await page.goto('/guide/theme-editor?theme=garbage')
  await expect(page.locator(EDITOR)).toBeVisible()
  await expect(page.locator(PRIMARY)).toHaveValue(fallback)
  expect(await rootToken(page, '--primary')).toBe('')
  expect(new URL(page.url()).searchParams.get('theme')).toBeNull()

  const payload = Buffer.from(
    JSON.stringify({
      accent: 'violet',
      highContrast: false,
      light: {
        '--primary': 'red; } body { display: none } .x {',
        '--evil': 'oklch(0 0 0)',
      },
      dark: { '--background': 'url(https://example.com/x)' },
    }),
  ).toString('base64url')

  await page.goto(`/guide/theme-editor?theme=${payload}`)
  await expect(page.locator(EDITOR)).toBeVisible()
  await expect(page.locator('body')).toBeVisible()
  expect(await rootToken(page, '--primary')).toBe('')
  expect(await rootToken(page, '--evil')).toBe('')
  expect(await rootToken(page, '--background')).toBe('')
  expect(new URL(page.url()).searchParams.get('theme')).toBeNull()
  await expect(page.locator(PRIMARY)).toHaveValue(fallback)
})

test('reset clears the edits and leaving the page restores the document', async ({ page }) => {
  await openEditor(page)
  await page.locator(PRIMARY).fill(GREEN)
  await expect.poll(() => rootToken(page, '--primary')).toBe(GREEN)

  await page.getByRole('button', { name: 'Reset' }).click()
  expect(await rootToken(page, '--primary')).toBe('')
  expect(new URL(page.url()).searchParams.get('theme')).toBeNull()
  await expect(page.locator('.fish-editor-accent[aria-pressed="true"]')).toHaveText('Violet')

  await page.getByRole('button', { name: 'High contrast' }).click()
  expect(await rootToken(page, '--background')).toBe('oklch(1 0 0)')
  await page.locator('.rp-sidebar-item', { hasText: 'Design tokens' }).click()
  await page.waitForURL(/\/guide\/tokens(\.html)?$/)
  await expect.poll(() => rootToken(page, '--primary')).toBe('')
  await expect.poll(() => rootToken(page, '--background')).toBe('')
})
