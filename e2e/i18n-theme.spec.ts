import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('theme and language', () => {
  test('persists dark mode and Chinese across reloads', async ({ page }) => {
    await signInAs(page, 'admin')

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByRole('button', { name: 'Change language' }).click()
    await page.getByRole('menuitem', { name: '简体中文' }).click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(page.getByRole('link', { name: '用户' })).toBeVisible()

    await page.reload()

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(page.getByRole('link', { name: '用户' })).toBeVisible()
    await expect(page.getByRole('button', { name: '账号菜单' })).toBeVisible()
  })

  test('keeps the theme and language on the login page', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.getByRole('menuitem', { name: 'Dark' }).click()
    await page.getByRole('button', { name: 'Change language' }).click()
    await page.getByRole('menuitem', { name: '简体中文' }).click()

    await page.reload()

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
  })
})
