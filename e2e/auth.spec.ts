import { expect, test } from '@playwright/test'

import { signInAs, signOut } from './helpers'

test.describe('authentication', () => {
  test('redirects a deep link to login and returns afterwards', async ({ page }) => {
    await page.goto('/users?status=active')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    await page.getByRole('button', { name: /admin@fish\.dev/ }).click()
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/users\?status=active/)
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Search' })).toBeVisible()
  })

  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('admin@fish.dev')
    await page.getByLabel('Password', { exact: true }).fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Incorrect email or password.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('signs out and protects private routes', async ({ page }) => {
    await signInAs(page, 'admin')
    await signOut(page)

    await page.goto('/users')
    await expect(page).toHaveURL(/\/login/)
  })

  test('keeps the session across a reload', async ({ page }) => {
    await signInAs(page, 'manager')
    await page.reload()

    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
    await expect(page).toHaveURL('/')
  })
})
