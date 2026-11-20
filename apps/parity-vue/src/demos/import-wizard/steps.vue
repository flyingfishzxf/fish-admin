<script lang="ts">
export default { name: 'ImportWizardSteps' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { ImportWizard, type ImportField, type ImportWizardLabels } from '@fish-admin/vue'

const FIELDS: ImportField[] = [
  { key: 'name', label: 'Contact name', required: true, aliases: ['full name'] },
  { key: 'email', label: 'Billing email', required: true, type: 'email' },
  { key: 'team', label: 'Owner team', aliases: ['department'] },
]

// No email column, so the required mapping stays unresolved when the file loads.
const SAMPLE_CSV = `Full name,Department,Contractor
Ada Lovelace,Engineering,No
Grace Hopper,Research,Yes`

const LABELS: ImportWizardLabels = {
  steps: ['1. Upload', '2. Map', '3. Review', '4. Done'],
  dropTitle: 'Drop a vendor export here',
  dropHint: 'CSV with a header row, up to 5 MB.',
  browse: 'Choose a CSV',
  sample: 'Load vendor export',
  emptyFile: 'No rows were found in that file.',
  parseError: 'That file could not be parsed.',
  mapTitle: 'Map the vendor columns',
  mapHint: 'Required fields must point at a source column.',
  sourceColumn: 'Column',
  skipColumn: 'Skip this field',
  previewTitle: 'Preview',
  mapRequired: (names) => `Still unmapped: ${names}.`,
  reviewTitle: 'Check the rows before importing',
  reviewHint: 'The first ten rows are listed; invalid ones are excluded from the batch.',
  validCount: (count) => `${count} valid`,
  invalidCount: (count) => `${count} invalid`,
  rowNumber: 'CSV line',
  status: 'Status',
  statusValid: 'Will import',
  statusInvalid: 'Excluded',
  back: 'Back to mapping',
  next: 'Next',
  import: (count) => `Import ${count}`,
  importing: 'Importing…',
  importFailed: 'Import failed — the batch was rejected.',
  doneTitle: 'Vendor contacts imported',
  doneHint: (count) => `${count} contacts added to the vendor directory.`,
  reset: 'Start another import',
  messages: {
    required: (label) => `${label} is empty`,
    email: (label) => `${label} is not a valid address`,
    number: (label) => `${label} must be numeric`,
  },
}

const lastBatch = ref<number | null>(null)

async function onImport(rows: Record<string, unknown>[]) {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 400))
  lastBatch.value = rows.length
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
    <ImportWizard
      :fields="FIELDS"
      :labels="LABELS"
      :sample="SAMPLE_CSV"
      sample-name="vendors.csv"
      aria-label="Vendor contact import"
      @import="onImport"
    />
    <p class="fish-demo-muted" role="status" style="margin: 0">
      {{
        lastBatch === null
          ? 'The export above has no email column, so Next stays disabled until you map Billing email.'
          : `${lastBatch} row${lastBatch === 1 ? '' : 's'} imported — only rows marked “Will import”.`
      }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      Line numbers start at 2 because row 1 is the header, so the review table matches the CSV the
      user opened.
    </p>
  </div>
</template>
