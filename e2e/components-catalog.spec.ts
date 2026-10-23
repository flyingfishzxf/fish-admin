import { expect, test } from '@playwright/test'

import { signInAs } from './helpers'

test.describe('component catalog', () => {
  test('searches, filters and links every component', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/components')

    await expect(
      page.getByRole('heading', { name: '83 components, one system', level: 1 }),
    ).toBeVisible()
    await expect(page.getByText('83 of 83 components')).toBeVisible()
    await expect(page.getByText('New', { exact: true })).toHaveCount(33)

    const search = page.getByRole('textbox', { name: 'Search components' })

    await page.getByRole('radio', { name: /^Enterprise/ }).click()
    await expect(page.getByText('30 of 83 components')).toBeVisible()

    await search.fill('popconfirm')
    await expect(page.getByText('1 of 83 components')).toBeVisible()
    await expect(page.locator('#demo-popconfirm')).toBeVisible()
    await expect(page.locator('#demo-pro-table')).toHaveCount(0)

    await page.getByRole('button', { name: 'Clear search' }).click()
    await page.getByRole('radio', { name: /^Pro patterns/ }).click()
    await expect(page.getByText('6 of 83 components')).toBeVisible()
    await expect(page.locator('#demo-pro-table')).toBeVisible()
    await expect(page.locator('#demo-query-filter')).toBeVisible()
    await expect(page.locator('#demo-pro-form')).toBeVisible()
    await expect(page.locator('#demo-import-wizard')).toBeVisible()

    await page.getByRole('radio', { name: /^All/ }).click()
    await search.fill('zzzz-not-a-component')
    await expect(page.getByText('No components match')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByText('83 of 83 components')).toBeVisible()

    await expect(page.locator('#demo-timeline').getByText('Used in /users/$id')).toBeVisible()
    await expect(
      page.locator('#demo-collapsible').getByText('No standalone demo yet'),
    ).toBeVisible()

    await page.locator('#demo-input-number').getByRole('link', { name: 'Open in UI kit' }).click()
    await expect(page).toHaveURL(/\/ui#demo-input-number$/)
    await expect(page.locator('#demo-input-number')).toBeVisible()
  })

  test('runs the embedded enterprise and Pro demos', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/components#demo-pro-table')

    const proTable = page.locator('#demo-pro-table')
    await expect(proTable.getByText('Ada Lovelace')).toBeVisible()
    await expect(proTable.getByText('Showing 1–5 of 8')).toBeVisible()

    const search = proTable.getByRole('textbox', { name: 'Search members' })
    await search.fill('Ada')
    await expect(proTable.getByText('Ada Lovelace')).toBeVisible()
    await expect(proTable.getByText('Grace Hopper')).toHaveCount(0)
    await expect(proTable.getByText('Showing 1–1 of 1')).toBeVisible()

    await proTable.getByRole('checkbox', { name: 'Ada Lovelace' }).check()
    const bulkBar = page.getByRole('region', { name: '1 selected' })
    await expect(bulkBar).toBeVisible()
    await bulkBar.getByRole('button', { name: 'Mark active' }).click()
    await expect(page.getByText('1 members marked active (demo).')).toBeVisible()
    await expect(bulkBar).toHaveCount(0)

    await search.fill('')
    await proTable.getByRole('combobox', { name: 'Team' }).click()
    await page.getByRole('option', { name: 'Design', exact: true }).click()
    await expect(proTable.getByText('Katherine Johnson')).toBeVisible()
    await expect(proTable.getByText('Ada Lovelace')).toHaveCount(0)
    await expect(proTable.getByText('Showing 1–2 of 2')).toBeVisible()

    const popconfirm = page.locator('#demo-popconfirm')
    await popconfirm.getByRole('button', { name: 'Delete API key' }).click()
    await expect(page.getByText('Delete this API key?')).toBeVisible()
    await page.getByRole('button', { name: 'Delete key' }).click()
    await expect(page.getByText('API key deleted (demo).')).toBeVisible()

    const filter = page.locator('#demo-query-filter')
    await filter.getByLabel('Name').fill('Ada')
    await expect(filter.getByText('1 filters active')).toBeVisible()
    await filter.getByRole('button', { name: 'Reset filters' }).click()
    await expect(filter.getByText('0 filters active')).toBeVisible()

    const statistic = page.locator('#demo-statistic')
    await expect(statistic.getByText('Monthly revenue')).toBeVisible()
    await expect(statistic.getByText('Active members')).toBeVisible()

    const pageContainer = page.locator('#demo-page-container')
    await pageContainer.getByRole('tab', { name: 'Invoices' }).click()
    await expect(pageContainer.getByRole('tab', { name: 'Invoices' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('runs the Wave 2 data, feedback, form and navigation demos', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/components')

    const trend = page.locator('#demo-trend')
    await expect(trend.getByText('+12.4%')).toBeVisible()

    const rate = page.locator('#demo-rate')
    await rate.getByRole('radio', { name: '4 of 5 stars' }).click()
    await expect(rate.getByText('4 of 5 stars')).toBeVisible()

    const jsonViewer = page.locator('#demo-json-viewer')
    await expect(jsonViewer.getByText('"usr_1042"')).toBeVisible()
    await jsonViewer.getByRole('button', { name: 'Collapse Session payload' }).click()
    await expect(jsonViewer.getByText('"usr_1042"')).toHaveCount(0)

    await expect(page.locator('#demo-watermark canvas')).toBeVisible()

    const combobox = page.locator('#demo-combobox')
    await combobox.getByRole('combobox', { name: 'Demo combobox' }).click()
    await page.getByPlaceholder('Search teams…').fill('des')
    await page.getByRole('option', { name: /Design/ }).click()
    await expect(combobox.getByRole('combobox', { name: 'Demo combobox' })).toContainText('Design')

    const cascader = page.locator('#demo-cascader')
    await cascader.getByRole('button', { name: 'Demo cascader' }).click()
    await page.getByRole('button', { name: 'Europe', exact: true }).click()
    await page.getByRole('button', { name: 'Germany', exact: true }).click()
    await page.getByRole('button', { name: 'Berlin', exact: true }).click()
    await expect(cascader.getByRole('button', { name: 'Demo cascader' })).toContainText(
      'Europe / Germany / Berlin',
    )

    const treeSelect = page.locator('#demo-tree-select')
    await treeSelect.getByRole('button', { name: 'Demo tree select' }).click()
    await page.getByRole('treeitem', { name: 'Design' }).click()
    await expect(treeSelect.getByRole('button', { name: 'Demo tree select' })).toContainText(
      'Design',
    )

    const notifications = page.locator('#demo-notification-center')
    await notifications.getByRole('button', { name: 'Notifications (3)' }).click()
    await page.getByRole('button', { name: 'Mark all as read' }).click()
    await expect(notifications.getByRole('button', { name: 'Notifications' })).toBeVisible()
    await page.keyboard.press('Escape')

    const imagePreview = page.locator('#demo-image-preview')
    await imagePreview
      .getByRole('button', { name: 'Product screenshots: Teal gradient artwork' })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('1 / 3')).toBeVisible()
    await dialog.getByRole('button', { name: 'Next' }).click()
    await expect(dialog.getByText('2 / 3')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)

    const upload = page.locator('#demo-upload')
    await upload.locator('input[type="file"]').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    })
    await expect(upload.getByText('notes.txt')).toBeVisible()
    await upload.getByRole('button', { name: 'Remove notes.txt' }).click()
    await expect(upload.getByText('notes.txt')).toHaveCount(0)

    const backTop = page.locator('#demo-back-top')
    await backTop.locator('.overflow-y-auto').evaluate((element) => {
      element.scrollTop = 200
      element.dispatchEvent(new Event('scroll'))
    })
    await backTop.getByRole('button', { name: 'Back to top' }).click()
    await expect(backTop.getByRole('button', { name: 'Back to top' })).toHaveCount(0)

    const anchorNav = page.locator('#demo-anchor-nav')
    await anchorNav.getByRole('button', { name: 'Security', exact: true }).click()
    await expect(anchorNav.getByRole('button', { name: 'Security', exact: true })).toHaveAttribute(
      'aria-current',
      'location',
    )

    const proForm = page.locator('#demo-pro-form')
    await proForm.getByRole('button', { name: 'Create member' }).click()
    await expect(proForm.getByText('Full name is required.')).toBeVisible()
    await expect(proForm.getByText('Work email is required.')).toBeVisible()
    await proForm.getByLabel('Full name').fill('Ada Lovelace')
    await proForm.getByLabel('Work email').fill('ada@example.com')
    await proForm.getByRole('combobox', { name: 'Team' }).click()
    await page.getByRole('option', { name: 'Design', exact: true }).click()
    await proForm.getByRole('button', { name: 'Create member' }).click()
    await expect(proForm.getByText('Submitted values')).toBeVisible()
    await expect(proForm.locator('pre')).toContainText('"fullName": "Ada Lovelace"')
    await expect(proForm.locator('pre')).toContainText('"team": "design"')
    await expect(proForm.locator('pre')).toContainText('"alerts": true')
  })

  test('runs the Wave 3 long-tail and Pro workflow demos', async ({ page }) => {
    await signInAs(page, 'admin')
    await page.goto('/components')

    const autoComplete = page.locator('#demo-auto-complete')
    await autoComplete.getByRole('combobox', { name: 'Demo auto complete' }).fill('gra')
    await page.getByRole('option', { name: 'Grace Hopper' }).click()
    await expect(autoComplete.getByText('Selected Grace Hopper')).toBeVisible()

    const list = page.locator('#demo-list')
    await list.getByRole('button', { name: /Grace Hopper Design systems lead/ }).click()
    await expect(list.getByText('Selected Grace Hopper')).toBeVisible()
    await list.getByRole('button', { name: 'More actions for Grace Hopper' }).click()
    await expect(page.getByText('Row action for Grace Hopper (demo).')).toBeVisible()
    await expect(
      list.getByRole('button', { name: /Katherine Johnson Data engineer/ }),
    ).toBeDisabled()

    const tour = page.locator('#demo-tour')
    await tour.getByRole('button', { name: 'Start tour' }).click()
    const tourDialog = page.getByRole('dialog')
    await expect(tourDialog.getByRole('heading', { name: 'Name your workspace' })).toBeVisible()
    await tourDialog.getByRole('button', { name: 'Next' }).click()
    await expect(tourDialog.getByRole('heading', { name: 'Pick a plan' })).toBeVisible()
    await tourDialog.getByRole('button', { name: 'Next' }).click()
    await tourDialog.getByRole('button', { name: 'Finish' }).click()
    await expect(tour.getByText('Tour finished — nice work.')).toBeVisible()

    const carousel = page.locator('#demo-carousel')
    await expect(carousel.locator('[role="group"][aria-hidden="false"]')).toContainText(
      'Onboard in minutes',
    )
    await carousel.getByRole('button', { name: 'Next slide' }).click()
    await expect(carousel.locator('[role="group"][aria-hidden="false"]')).toContainText(
      'Roles that scale',
    )
    await carousel.locator('[role="region"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(carousel.locator('[role="group"][aria-hidden="false"]')).toContainText(
      'Audit every change',
    )

    const colorPicker = page.locator('#demo-color-picker')
    await colorPicker.getByRole('button', { name: 'Accent color' }).click()
    const hexInput = page.getByRole('textbox', { name: 'Hex value' })
    await hexInput.fill('#0ea5e9')
    await hexInput.press('Enter')
    await expect(colorPicker.getByText('Accent set to #0EA5E9')).toBeVisible()
    await page.keyboard.press('Escape')

    const detailPage = page.locator('#demo-detail-page')
    await expect(detailPage.getByRole('heading', { name: 'Ada Lovelace', level: 1 })).toBeVisible()
    await detailPage.getByRole('tab', { name: 'Activity' }).click()
    await expect(detailPage.getByText('Approved the Q3 access review')).toBeVisible()

    const editableTable = page.locator('#demo-editable-table')
    await editableTable.getByRole('button', { name: 'Edit Ada Lovelace' }).click()
    const nameInput = editableTable.getByRole('textbox', { name: 'Name' })
    await nameInput.fill('')
    await editableTable.getByRole('button', { name: 'Save' }).click()
    await expect(editableTable.getByText('Name is required.')).toBeVisible()
    await nameInput.fill('Ada King')
    await editableTable.getByRole('button', { name: 'Save' }).click()
    await expect(editableTable.getByRole('button', { name: 'Edit Ada King' })).toBeVisible()

    const importWizard = page.locator('#demo-import-wizard')
    await importWizard.getByRole('button', { name: 'Load sample' }).click()
    await expect(importWizard.getByText('members.csv · 3')).toBeVisible()
    await importWizard.getByRole('button', { name: 'Continue' }).click()
    await expect(importWizard.getByText('2 ready to import')).toBeVisible()
    await expect(importWizard.getByText('1 need attention')).toBeVisible()
    await importWizard.getByRole('button', { name: 'Import 2 rows' }).click()
    await expect(importWizard.getByText('Import complete')).toBeVisible()
    await expect(page.getByText('Imported 2 rows (demo).')).toBeVisible()
  })
})
