import { expect, test, type Locator, type Page } from '@playwright/test'

import { DEMO_PASSWORDS, signInAs, signOut } from './helpers'

async function typeOtp(page: Page, code: string, scope?: Locator) {
  const container = scope ?? page
  await container.locator('input[inputmode="numeric"]').first().click()
  await page.keyboard.type(code, { delay: 40 })
}

test.describe('authentication lifecycle', () => {
  test('registers, verifies the email and signs in', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

    await page.getByLabel('Full name').fill('Playwright Visitor')
    await page.getByLabel('Email').fill('visitor@fish.dev')
    await page.getByLabel('Password', { exact: true }).fill('Visitor123!')
    await page.getByLabel('Confirm password').fill('Visitor123!')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
    await page.getByRole('link', { name: 'Verify email now' }).click()

    await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible()
    await page.getByRole('button', { name: 'Verify email' }).click()

    await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible()

    await page.goto('/login')
    await page.getByLabel('Email').fill('visitor@fish.dev')
    await page.getByLabel('Password', { exact: true }).fill('Visitor123!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
  })

  test('rejects a weak password before calling the API', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Full name').fill('Playwright Visitor')
    await page.getByLabel('Email').fill('weak@fish.dev')
    await page.getByLabel('Password', { exact: true }).fill('abcdefgh')
    await page.getByLabel('Confirm password').fill('abcdefgh')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByText('Include at least one number.')).toBeVisible()
    await expect(page).toHaveURL(/\/register/)
  })

  test('locks the account after repeated failures', async ({ page }) => {
    await page.goto('/login')

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.getByLabel('Email').fill('viewer@fish.dev')
      await page.getByLabel('Password', { exact: true }).fill(`wrong-password-${attempt}`)
      await page.getByRole('button', { name: 'Sign in' }).click()
      await expect(page.getByText('Incorrect email or password.')).toBeVisible()
    }

    await page.getByLabel('Password', { exact: true }).fill('wrong-password-5')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Too many failed attempts.')).toBeVisible()

    await page.getByLabel('Password', { exact: true }).fill(DEMO_PASSWORDS.viewer)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Too many failed attempts.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('resets the password through the demo link', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible()

    await page.getByLabel('Email').fill('manager@fish.dev')
    await page.getByRole('button', { name: 'Send reset link' }).click()

    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible()
    await page.getByRole('link', { name: 'Open reset link' }).click()

    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible()
    await page.getByLabel('New password').fill('Manager456!')
    await page.getByLabel('Confirm password').fill('Manager456!')
    await page.getByRole('button', { name: 'Reset password' }).click()

    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible()

    await page.goto('/login')
    await page.getByLabel('Email').fill('manager@fish.dev')
    await page.getByLabel('Password', { exact: true }).fill(DEMO_PASSWORDS.manager)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Incorrect email or password.')).toBeVisible()

    await page.getByLabel('Password', { exact: true }).fill('Manager456!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('requires a one-time code once 2FA is enabled', async ({ page }) => {
    await signInAs(page, 'admin')

    await page.goto('/security')
    await page.getByRole('button', { name: 'Enable 2FA' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Set up two-factor authentication')).toBeVisible()
    await expect(dialog.getByText('JBSWY3DPEHPK3PXP')).toBeVisible()

    await typeOtp(page, '246810', dialog)
    await dialog.getByRole('button', { name: 'Verify and enable' }).click()

    await expect(
      page.getByText('Sign-in now requires a six-digit verification code.'),
    ).toBeVisible()

    await signOut(page)
    await page.getByRole('button', { name: /admin@fish\.dev/ }).click()
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('heading', { name: 'Two-step verification' })).toBeVisible()
    await expect(page).toHaveURL(/\/otp/)

    await typeOtp(page, '000000')
    await expect(page.getByText('The verification code is incorrect.')).toBeVisible()

    await typeOtp(page, '246810')
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
  })

  test('accepts a demo invitation once and then reports it as used', async ({ page }) => {
    await page.goto('/accept-invite?token=fish-demo-invite')
    await expect(page.getByRole('heading', { name: 'Accept your invitation' })).toBeVisible()
    await expect(page.getByText('Invited by Avery Chen')).toBeVisible()
    await expect(page.getByText('jamie.rivera@fish.dev')).toBeVisible()

    await page.getByLabel('Password', { exact: true }).fill('Invitee123!')
    await page.getByLabel('Confirm password').fill('Invitee123!')
    await page.getByRole('button', { name: 'Join workspace' }).click()

    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
    await expect(page).toHaveURL(/\/$/)

    await signOut(page)
    await page.goto('/accept-invite?token=fish-demo-invite')
    await expect(page.getByRole('heading', { name: 'Invitation unavailable' })).toBeVisible()
  })

  test('explains an unknown invite token', async ({ page }) => {
    await page.goto('/accept-invite?token=not-a-real-invite')
    await expect(page.getByRole('heading', { name: 'Invitation unavailable' })).toBeVisible()
    await expect(page.getByText('Ask an administrator for a new invitation.')).toBeVisible()
  })
})
