import { expect, type Page } from '@playwright/test'

export const DEMO_PASSWORDS = {
  admin: 'Admin123!',
  manager: 'Manager123!',
  viewer: 'Viewer123!',
} as const

export type DemoRole = keyof typeof DEMO_PASSWORDS

export async function signInAs(page: Page, role: DemoRole) {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  await page.getByRole('button', { name: new RegExp(`${role}@fish\\.dev`) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
}
