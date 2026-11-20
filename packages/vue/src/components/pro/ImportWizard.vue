<script setup lang="ts">
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  UploadCloud,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { parseCsvTable, type CsvTable } from '../../lib/csv'
import {
  autoMapFields,
  buildImportRows,
  missingRequiredFields,
  toImportPayload,
  type ImportField,
  type ImportMessages,
} from '../../lib/import-wizard-utils'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

/** Every visible string of the wizard, including the step names and row messages. */
export interface ImportWizardLabels {
  steps: string[]
  dropTitle: string
  dropHint: string
  browse: string
  sample: string
  emptyFile: string
  parseError: string
  mapTitle: string
  mapHint: string
  sourceColumn: string
  skipColumn: string
  previewTitle: string
  mapRequired: (labels: string) => string
  reviewTitle: string
  reviewHint: string
  validCount: (count: number) => string
  invalidCount: (count: number) => string
  rowNumber: string
  status: string
  statusValid: string
  statusInvalid: string
  back: string
  next: string
  import: (count: number) => string
  importing: string
  importFailed: string
  doneTitle: string
  doneHint: (count: number) => string
  reset: string
  messages: ImportMessages
}

const props = withDefaults(
  defineProps<{
    /** Target fields; `aliases` feed the automatic column matching. */
    fields: ImportField[]
    /** Every visible string, including the step names and row messages. */
    labels: ImportWizardLabels
    /** CSV text for the "load sample" button; omit the button when undefined. */
    sample?: string
    /** File name shown for the sample once it is loaded. */
    sampleName?: string
    /** `accept` attribute for the hidden file input. */
    accept?: string
    /** Accessible name for the wizard region. */
    ariaLabel?: string
    class?: string
  }>(),
  { sampleName: 'sample.csv', accept: '.csv,text/csv' },
)

// The handler is optional: an absent listener simply leaves the wizard at the
// import step, while a present one runs and advances on success.
defineSlots<{ fallback?(): unknown }>()

const emit = defineEmits<{ import: [rows: Record<string, unknown>[]] }>()

const step = ref(1)
const fileName = ref('')
const table = ref<CsvTable | null>(null)
const mapping = ref<Record<string, number>>({})
const parseError = ref('')
const importError = ref('')
const importing = ref(false)
const resultCount = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)

function loadText(text: string, name: string) {
  const parsed = parseCsvTable(text)
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    parseError.value = props.labels.emptyFile
    return
  }
  parseError.value = ''
  importError.value = ''
  fileName.value = name
  table.value = parsed
  mapping.value = autoMapFields(props.fields, parsed.headers)
  step.value = 2
}

function readFileText(file: File) {
  if (typeof file.text === 'function') return file.text()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

async function loadFile(file: File) {
  try {
    loadText(await readFileText(file), file.name)
  } catch {
    parseError.value = props.labels.parseError
  }
}

function reset() {
  step.value = 1
  fileName.value = ''
  table.value = null
  mapping.value = {}
  parseError.value = ''
  importError.value = ''
  resultCount.value = 0
}

const missing = computed(() =>
  table.value ? missingRequiredFields(props.fields, mapping.value) : [],
)
const mappedFields = computed(() =>
  props.fields.filter((field) => (mapping.value[field.key] ?? -1) >= 0),
)
const results = computed(() =>
  table.value
    ? buildImportRows(props.fields, mapping.value, table.value.rows, props.labels.messages)
    : [],
)
const validCount = computed(() => results.value.filter((result) => result.valid).length)
const invalidCount = computed(() => results.value.length - validCount.value)

async function importRows() {
  importing.value = true
  importError.value = ''
  try {
    const payload = toImportPayload(props.fields, results.value)
    emit('import', payload)
    resultCount.value = validCount.value
    step.value = 4
  } catch {
    importError.value = props.labels.importFailed
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <section
    data-slot="import-wizard"
    :aria-label="props.ariaLabel"
    :class="cn('space-y-4 rounded-lg border bg-background p-4', props.class)"
  >
    <ol class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      <li
        v-for="(label, index) in props.labels.steps"
        :key="label"
        :aria-current="step === index + 1 ? 'step' : undefined"
        :class="
          cn(
            'flex items-center gap-1.5',
            step === index + 1 ? 'font-medium text-foreground' : 'text-muted-foreground',
          )
        "
      >
        <span
          :class="
            cn(
              'flex size-5 items-center justify-center rounded-full border text-[10px]',
              step === index + 1 && 'border-primary bg-primary text-primary-foreground',
              step > index + 1 && 'border-primary/40 bg-primary/10 text-primary',
            )
          "
        >
          <CheckCircle2 v-if="step > index + 1" aria-hidden="true" class="size-3" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        {{ label }}
      </li>
    </ol>

    <div v-if="step === 1" class="space-y-3">
      <div
        class="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center"
        @dragover.prevent
        @drop.prevent="
          (event) => {
            const file = (event.dataTransfer as DataTransfer | null)?.files?.[0]
            if (file) void loadFile(file)
          }
        "
      >
        <UploadCloud aria-hidden="true" class="mx-auto size-7 text-muted-foreground" />
        <p class="mt-2 text-sm font-medium">{{ props.labels.dropTitle }}</p>
        <p class="mt-1 text-xs text-muted-foreground">{{ props.labels.dropHint }}</p>
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" @click="fileInput?.click()">
            {{ props.labels.browse }}
          </Button>
          <Button
            v-if="props.sample"
            type="button"
            variant="ghost"
            size="sm"
            @click="loadText(props.sample!, props.sampleName!)"
          >
            {{ props.labels.sample }}
          </Button>
        </div>
        <input
          ref="fileInput"
          type="file"
          :accept="props.accept"
          :aria-label="props.labels.browse"
          class="sr-only"
          @change="
            (event) => {
              const input = event.target as HTMLInputElement
              const file = input.files?.[0]
              if (file) void loadFile(file)
              input.value = ''
            }
          "
        />
      </div>
      <p v-if="parseError" role="alert" class="flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle aria-hidden="true" class="size-3.5" />
        {{ parseError }}
      </p>
    </div>

    <div v-if="step === 2 && table" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold">{{ props.labels.mapTitle }}</h3>
          <p class="text-xs text-muted-foreground">{{ props.labels.mapHint }}</p>
        </div>
        <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileSpreadsheet aria-hidden="true" class="size-3.5" />
          {{ fileName }} · {{ table.rows.length }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label v-for="field in props.fields" :key="field.key" class="space-y-1 text-sm">
          <span class="font-medium">
            {{ field.label }}
            <span v-if="field.required" aria-hidden="true" class="text-destructive"> *</span>
          </span>
          <select
            :aria-label="field.label"
            :value="mapping[field.key] ?? -1"
            class="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            @change="
              (event) => {
                mapping = {
                  ...mapping,
                  [field.key]: Number((event.target as HTMLSelectElement).value),
                }
              }
            "
          >
            <option :value="-1">{{ props.labels.skipColumn }}</option>
            <option
              v-for="(header, index) in table.headers"
              :key="`${header}-${index}`"
              :value="index"
            >
              {{ header || `${props.labels.sourceColumn} ${index + 1}` }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="missing.length > 0" role="status" class="text-xs text-destructive">
        {{ props.labels.mapRequired(missing.map((field) => field.label).join(', ')) }}
      </p>

      <div v-if="mappedFields.length > 0" class="space-y-1">
        <p class="text-xs font-medium">{{ props.labels.previewTitle }}</p>
        <div class="overflow-x-auto rounded-md border">
          <table class="w-full text-xs">
            <thead class="bg-muted/40 text-start text-muted-foreground">
              <tr>
                <th v-for="field in mappedFields" :key="field.key" class="px-2 py-1.5 font-medium">
                  {{ field.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in table.rows.slice(0, 3)"
                :key="rowIndex"
                class="border-t"
              >
                <td
                  v-for="field in mappedFields"
                  :key="field.key"
                  class="max-w-40 truncate px-2 py-1.5"
                >
                  {{ row[mapping[field.key]!] || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" @click="step = 1">
          <ArrowLeft aria-hidden="true" class="size-4" />
          {{ props.labels.back }}
        </Button>
        <Button type="button" size="sm" :disabled="missing.length > 0" @click="step = 3">
          {{ props.labels.next }}
          <ArrowRight aria-hidden="true" class="size-4" />
        </Button>
      </div>
    </div>

    <div v-if="step === 3 && table" class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold">{{ props.labels.reviewTitle }}</h3>
        <p class="text-xs text-muted-foreground">{{ props.labels.reviewHint }}</p>
      </div>

      <div class="flex flex-wrap gap-3 text-xs">
        <span
          class="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700"
        >
          <CheckCircle2 aria-hidden="true" class="size-3.5" />
          {{ props.labels.validCount(validCount) }}
        </span>
        <span
          v-if="invalidCount > 0"
          class="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-destructive"
        >
          <AlertCircle aria-hidden="true" class="size-3.5" />
          {{ props.labels.invalidCount(invalidCount) }}
        </span>
      </div>

      <div class="max-h-64 overflow-auto rounded-md border">
        <table class="w-full text-xs">
          <thead class="sticky top-0 bg-muted text-start text-muted-foreground">
            <tr>
              <th class="px-2 py-1.5 font-medium">{{ props.labels.rowNumber }}</th>
              <th v-for="field in props.fields" :key="field.key" class="px-2 py-1.5 font-medium">
                {{ field.label }}
              </th>
              <th class="px-2 py-1.5 font-medium">{{ props.labels.status }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in results.slice(0, 10)" :key="result.line" class="border-t">
              <td class="px-2 py-1.5 text-muted-foreground">{{ result.line }}</td>
              <template v-for="field in props.fields" :key="field.key">
                <td
                  v-for="error in result.errors.filter((entry) => entry.key === field.key)"
                  :key="error.message"
                  class="max-w-40 truncate px-2 py-1.5 text-destructive"
                  :title="error.message"
                >
                  {{ result.values[field.key] || '—' }}
                </td>
                <td
                  v-if="!result.errors.some((entry) => entry.key === field.key)"
                  class="max-w-40 truncate px-2 py-1.5"
                >
                  {{ result.values[field.key] || '—' }}
                </td>
              </template>
              <td class="px-2 py-1.5">
                <span v-if="result.valid" class="text-emerald-700">{{
                  props.labels.statusValid
                }}</span>
                <span v-else class="text-destructive">
                  {{ result.errors.map((error) => error.message).join('; ') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="importError" role="alert" class="text-xs text-destructive">{{ importError }}</p>

      <div class="flex justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" @click="step = 2">
          <ArrowLeft aria-hidden="true" class="size-4" />
          {{ props.labels.back }}
        </Button>
        <Button
          type="button"
          size="sm"
          :disabled="validCount === 0 || importing"
          @click="importRows"
        >
          {{ importing ? props.labels.importing : props.labels.import(validCount) }}
        </Button>
      </div>
    </div>

    <div v-if="step === 4" class="space-y-3 py-6 text-center">
      <CheckCircle2 aria-hidden="true" class="mx-auto size-9 text-emerald-600" />
      <div>
        <h3 class="text-sm font-semibold">{{ props.labels.doneTitle }}</h3>
        <p class="mt-1 text-xs text-muted-foreground">{{ props.labels.doneHint(resultCount) }}</p>
      </div>
      <Button type="button" variant="outline" size="sm" @click="reset">
        {{ props.labels.reset }}
      </Button>
    </div>
  </section>
</template>
