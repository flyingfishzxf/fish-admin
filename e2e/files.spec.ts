import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

const UPLOAD_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">',
  '<rect width="120" height="80" rx="8" fill="#e0f2fe"/>',
  '<text x="60" y="46" font-family="sans-serif" font-size="14" text-anchor="middle">E2E</text>',
  '</svg>',
].join('')

test.describe('file asset library', () => {
  test('uploads, previews and manages a file through the preview panel', async ({ page }) => {
    const suffix = Date.now().toString(36)
    const name = `e2e-artwork-${suffix}.svg`
    const renamed = `e2e-artwork-final-${suffix}.svg`

    await signInAs(page, 'admin')
    await page.getByRole('link', { name: 'Files' }).click()
    await expect(page.getByRole('heading', { name: 'Files', level: 1 })).toBeVisible()

    await page.getByRole('button', { name: 'Upload files' }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByRole('heading', { name: 'Upload files' })).toBeVisible()

    const uploadInput = drawer.locator('input[type="file"]')
    await expect(uploadInput).toBeEnabled()
    await uploadInput.setInputFiles({
      name,
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(UPLOAD_SVG),
    })

    await expect(page.getByText('File uploaded.')).toBeVisible()
    await expect(drawer.getByText('1 uploaded')).toBeVisible()
    await expect(drawer.getByRole('img', { name }).first()).toBeVisible()

    await drawer.getByRole('button', { name: 'Close' }).click()

    const search = page.getByRole('combobox', { name: 'Search files' })
    await search.fill(name)
    await expect(page.getByRole('button', { name: `Open ${name}` })).toBeVisible()
    await page.getByRole('button', { name: `Open ${name}` }).click()

    await expect(page.getByRole('img', { name }).first()).toBeVisible()
    await expect(page.getByText('File metadata').first()).toBeVisible()
    await expect(page.getByRole('img', { name }).first()).toHaveAttribute(
      'src',
      /data:image\/svg\+xml/,
    )

    const move = page.getByRole('button', { name: /^Move file to folder:/ })
    await move.click()
    await page
      .getByRole('list', { name: 'Move file to folder 1' })
      .getByRole('button', { name: 'Engineering' })
      .click()
    await page
      .getByRole('list', { name: 'Move file to folder 2' })
      .getByRole('button', { name: 'Specs' })
      .click()
    await expect(page.getByText('File moved.')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Move file to folder: Engineering / Specs' }),
    ).toBeVisible()

    const visibility = page.getByRole('switch', { name: 'Team visibility' })
    await expect(visibility).toBeChecked()
    await visibility.click()
    await expect(page.getByText('File updated.')).toBeVisible()
    await expect(visibility).not.toBeChecked()

    await page.getByRole('button', { name: 'Rename file' }).click()
    const renameDialog = page.getByRole('dialog')
    await renameDialog.getByLabel('File name').fill(renamed)
    await renameDialog.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('File updated.')).toBeVisible()

    await search.fill(renamed)
    await expect(page.getByRole('button', { name: `Open ${renamed}` })).toBeVisible()
    await page.getByRole('button', { name: `Open ${renamed}` }).click()

    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog.getByText('Delete file?')).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByText('File deleted.')).toBeVisible()
    await expect(page.getByText('No files here')).toBeVisible()
  })

  test('filters by folder and bulk-deletes the selected files', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/files?folderId=folder-design-mockups')

    await expect(page.getByRole('heading', { name: 'Files', level: 1 })).toBeVisible()
    await expect(page.getByRole('treeitem', { name: /^Mockups/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('button', { name: /^Open dashboard-light\.svg/ })).toBeVisible()

    await page.getByRole('radio', { name: 'List' }).click()
    await page.getByRole('checkbox', { name: 'Select dashboard-light.svg' }).click()
    await page.getByRole('checkbox', { name: 'Select dashboard-dark.svg' }).click()

    await expect(page.getByText('2 selected')).toBeVisible()
    await page.getByRole('button', { name: 'Delete selected (2)' }).click()

    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog.getByText('Delete selected files?')).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByText('Deleted 2 files.')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Select dashboard-light.svg' })).toHaveCount(0)
    await expect(page.getByRole('checkbox', { name: 'Select dashboard-dark.svg' })).toHaveCount(0)
  })
})
