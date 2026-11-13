import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Administrator' | 'Manager' | 'Viewer') {
  await page.getByRole('button', { name: new RegExp(role) }).click()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

async function signIn(page: Page, email: string, password: string) {
  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

test('registers, verifies the email and signs in with the new account', async ({ page }) => {
  const email = `qa.${Date.now()}@fish.dev`

  await page.goto('/register')
  await page.locator('#register-name').fill('QA Tester')
  await page.locator('#register-email').fill(email)
  await page.locator('#register-password').fill('Explore123')
  await page.locator('#register-confirm').fill('Explore123')
  await page.getByRole('button', { name: 'Create account' }).click()

  // The mock returns the verification token instead of sending mail, so the
  // demo path is the same one a real user would follow from the inbox.
  await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
  await page.getByRole('button', { name: 'Verify email now' }).click()
  await expect(page).toHaveURL(/\/verify-email\?token=/)

  await page.locator('[data-action="verify-email"]').click()
  await expect(page.getByText(`${email} is now verified. You can sign in.`)).toBeVisible()

  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/login/)
  await signIn(page, email, 'Explore123')

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})

test('resets a forgotten password and signs in with the new one', async ({ page }) => {
  await page.goto('/forgot-password')
  await page.locator('#forgot-email').fill('admin@fish.dev')
  await page.getByRole('button', { name: 'Send reset link' }).click()

  await page.locator('[data-action="open-demo-link"]').click()
  await expect(page).toHaveURL(/\/reset-password\?token=/)

  await page.locator('#reset-password').fill('Rebuilt123')
  await page.locator('#reset-confirm').fill('Rebuilt123')
  await page.getByRole('button', { name: 'Reset password' }).click()

  await page.locator('[data-action="go-to-login"]').click()
  await expect(page).toHaveURL(/\/login/)
  await signIn(page, 'admin@fish.dev', 'Rebuilt123')

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('article')).toHaveCount(4)
})

test('accepts the demo invitation and lands on the dashboard', async ({ page }) => {
  await page.goto('/accept-invite?token=fish-demo-invite')
  await expect(page.locator('#invite-email')).toHaveValue('jamie.rivera@fish.dev')

  await page.locator('#invite-name').fill('Jamie Rivera')
  await page.locator('#invite-password').fill('Welcome123')
  await page.locator('#invite-confirm').fill('Welcome123')
  await page.locator('[data-action="accept-invite"]').click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('article')).toHaveCount(4)
})

test('keeps the chosen accent across a reload', async ({ page }) => {
  await page.goto('/login')
  await loginAs(page, 'Administrator')

  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(page).toHaveURL(/\/settings$/)

  await page.getByRole('button', { name: 'Emerald' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'emerald')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'emerald')
})
