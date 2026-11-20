<script lang="ts">
export default { name: 'ImportWizardBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { ImportWizard, type ImportField, type ImportWizardLabels } from '@fish-admin/vue'

const FIELDS: ImportField[] = [
  { key: 'name', label: 'Member name', required: true, aliases: ['full name'] },
  { key: 'email', label: 'Work email', required: true, type: 'email', aliases: ['e-mail'] },
  { key: 'team', label: 'Team', aliases: ['department'] },
]

const SAMPLE_CSV = `Name,Email,Team
Ada Lovelace,ada@acme.dev,Engineering
Grace Hopper,grace@acme.dev,Research
Katherine Johnson,katherine@acme.dev,Navigation`

const LABELS: ImportWizardLabels = {
  steps: ['Upload', 'Map columns', 'Review', 'Done'],
  dropTitle: 'Drop a CSV here',
  dropHint: 'One file with a header row. Nothing leaves the browser in this demo.',
  browse: 'Choose a file',
  sample: 'Load sample',
  emptyFile: 'That file has no data rows.',
  parseError: 'The file could not be read.',
  mapTitle: 'Match columns to fields',
  mapHint: 'Header names are matched automatically when they are close enough.',
  sourceColumn: 'Source column',
  skipColumn: 'Do not import',
  previewTitle: 'First three rows',
  mapRequired: (names) => `Map these required fields before continuing: ${names}.`,
  reviewTitle: 'Review the parsed rows',
  reviewHint: 'Rows with errors are listed but never imported.',
  validCount: (count) => `${count} row${count === 1 ? '' : 's'} ready`,
  invalidCount: (count) => `${count} row${count === 1 ? '' : 's'} skipped`,
  rowNumber: 'Line',
  status: 'Result',
  statusValid: 'Ready',
  statusInvalid: 'Skipped',
  back: 'Back',
  next: 'Next',
  import: (count) => `Import ${count} row${count === 1 ? '' : 's'}`,
  importing: 'Importing…',
  importFailed: 'The import service rejected the batch.',
  doneTitle: 'Import finished',
  doneHint: (count) => `${count} row${count === 1 ? '' : 's'} were written to the member list.`,
  reset: 'Import another file',
  messages: {
    required: (label) => `${label} is missing`,
    email: (label) => `${label} is not an email address`,
    number: (label) => `${label} must be a number`,
  },
}

const imported = ref<number | null>(null)

async function onImport(rows: Record<string, unknown>[]) {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 500))
  imported.value = rows.length
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
    <ImportWizard
      :fields="FIELDS"
      :labels="LABELS"
      :sample="SAMPLE_CSV"
      sample-name="members.csv"
      aria-label="Member CSV import"
      @import="onImport"
    />
    <p class="fish-demo-muted" role="status" style="margin: 0">
      {{
        imported === null
          ? 'Start with Load sample: the step rail above the panel marks the active step with aria-current="step".'
          : `${imported} rows reached the import handler, then the wizard moved to Done on its own.`
      }}
    </p>
  </div>
</template>
