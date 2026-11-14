<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@fish-admin/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import Dropzone from '../../components/ui/Dropzone.vue'
import { parseCsvTable, type CsvTable } from '../../lib/csv'
import { useT } from '../../lib/i18n'
import { importUsers, type UserImportRow } from './api'
import {
  autoMapFields,
  buildImportRows,
  createImportFields,
  createImportMessages,
  IMPORT_SAMPLE,
  missingRequiredFields,
  toImportPayload,
  type ImportRowResult,
} from './import'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  finished: [{ created: number; skipped: number }]
}>()

const t = useT()
const queryClient = useQueryClient()

const fields = computed(() => createImportFields(t))
const messages = computed(() => createImportMessages(t))
const steps = computed(() => [
  t('users:import.steps.upload'),
  t('users:import.steps.map'),
  t('users:import.steps.review'),
  t('users:import.steps.done'),
])

const step = ref(1)
const fileName = ref('')
const table = ref<CsvTable | null>(null)
const mapping = ref<Record<string, number>>({})
const parseError = ref('')
const importError = ref('')
const importing = ref(false)
const resultCount = ref(0)

function reset() {
  step.value = 1
  fileName.value = ''
  table.value = null
  mapping.value = {}
  parseError.value = ''
  importError.value = ''
  resultCount.value = 0
}

// Closing and reopening starts a new file: keeping the last table would offer
// to import rows the user has already left behind.
watch(
  () => props.open,
  (open) => {
    if (!open) reset()
  },
)

const mappedFields = computed(() =>
  fields.value.filter((field) => (mapping.value[field.key] ?? -1) >= 0),
)
const missing = computed(() =>
  table.value ? missingRequiredFields(fields.value, mapping.value) : [],
)
const results = computed<ImportRowResult[]>(() =>
  table.value ? buildImportRows(fields.value, mapping.value, table.value.rows, messages.value) : [],
)
const validCount = computed(() => results.value.filter((row) => row.valid).length)
const invalidCount = computed(() => results.value.length - validCount.value)

function loadText(text: string, name: string) {
  const parsed = parseCsvTable(text)
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    parseError.value = t('users:import.emptyFile')
    return
  }
  parseError.value = ''
  importError.value = ''
  fileName.value = name
  table.value = parsed
  mapping.value = autoMapFields(fields.value, parsed.headers)
  step.value = 2
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
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
    parseError.value = t('users:import.parseError')
  }
}

async function submit() {
  importing.value = true
  importError.value = ''
  try {
    // Same narrowing React does in its onImport: the wizard's rows are a
    // generic record, while the endpoint wants four named string fields.
    const payload: UserImportRow[] = toImportPayload(fields.value, results.value).map((row) => ({
      name: String(row.name ?? ''),
      email: String(row.email ?? ''),
      role: row.role ? String(row.role) : undefined,
      department: row.department ? String(row.department) : undefined,
    }))
    const result = await importUsers(payload)
    await queryClient.invalidateQueries({ queryKey: ['users'] })
    emit('finished', { created: result.created.length, skipped: result.skipped.length })

    if (result.created.length === 0) throw new Error('No users could be imported')
    resultCount.value = result.created.length
    step.value = 4
  } catch {
    importError.value = t('users:import.importFailed')
  } finally {
    importing.value = false
  }
}

// Vue template expressions cannot cast, so the event target is narrowed here.
function onMappingChange(key: string, event: Event) {
  mapping.value = { ...mapping.value, [key]: Number((event.target as HTMLSelectElement).value) }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-3xl" data-import-dialog>
      <DialogHeader>
        <DialogTitle>{{ t('users:import.title') }}</DialogTitle>
        <DialogDescription>{{ t('users:import.description') }}</DialogDescription>
      </DialogHeader>

      <section
        class="space-y-4 rounded-lg border bg-background p-4"
        data-slot="import-wizard"
        :aria-label="t('users:import.ariaLabel')"
      >
        <ol class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" data-slot="import-steps">
          <li
            v-for="(label, index) in steps"
            :key="label"
            :aria-current="step === index + 1 ? 'step' : undefined"
            :class="step === index + 1 ? 'font-medium text-foreground' : 'text-muted-foreground'"
            class="flex items-center gap-1.5"
          >
            <span
              class="flex size-5 items-center justify-center rounded-full border text-[10px]"
              :class="[
                step === index + 1 && 'border-primary bg-primary text-primary-foreground',
                step > index + 1 && 'border-primary/40 bg-primary/10 text-primary',
              ]"
            >
              <CheckCircle2 v-if="step > index + 1" class="size-3" aria-hidden="true" />
              <template v-else>{{ index + 1 }}</template>
            </span>
            {{ label }}
          </li>
        </ol>

        <!-- Step 1: upload -->
        <div v-if="step === 1" class="space-y-2">
          <Dropzone
            :label="t('users:import.dropTitle')"
            :hint="t('users:import.dropHint')"
            :browse-label="t('users:import.browse')"
            :error="parseError || undefined"
            accept=".csv,text/csv"
            :disabled="importing"
            @file="loadFile"
          />
          <!-- React puts this next to Browse inside the drop area; the shared
               Dropzone has one action slot, so centre it underneath instead. -->
          <div class="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-action="use-sample"
              @click="loadText(IMPORT_SAMPLE, 'users.csv')"
            >
              {{ t('users:import.sample') }}
            </Button>
          </div>
        </div>

        <!-- Step 2: map columns -->
        <div v-else-if="step === 2 && table" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-sm font-semibold">{{ t('users:import.mapTitle') }}</h3>
              <p class="text-xs text-muted-foreground">{{ t('users:import.mapHint') }}</p>
            </div>
            <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileSpreadsheet class="size-3.5" aria-hidden="true" />
              {{ fileName }} · {{ table.rows.length }}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <label v-for="field in fields" :key="field.key" class="space-y-1 text-sm">
              <span class="font-medium">
                {{ field.label }}
                <span v-if="field.required" class="text-destructive" aria-hidden="true">*</span>
              </span>
              <select
                :aria-label="field.label"
                :value="mapping[field.key] ?? -1"
                class="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                :data-mapping="field.key"
                @change="onMappingChange(field.key, $event)"
              >
                <option :value="-1">{{ t('users:import.skipColumn') }}</option>
                <option
                  v-for="(header, index) in table.headers"
                  :key="`${header}-${index}`"
                  :value="index"
                >
                  {{ header || `${t('users:import.sourceColumn')} ${index + 1}` }}
                </option>
              </select>
            </label>
          </div>

          <p
            v-if="missing.length > 0"
            role="status"
            class="text-xs text-destructive"
            data-mapping-error
          >
            {{
              t('users:import.mapRequired', {
                fields: missing.map((field) => field.label).join(', '),
              })
            }}
          </p>

          <div v-if="mappedFields.length > 0" class="space-y-1">
            <p class="text-xs font-medium">{{ t('users:import.previewTitle') }}</p>
            <div class="overflow-x-auto rounded-md border">
              <table class="w-full text-xs">
                <thead class="bg-muted/40 text-start text-muted-foreground">
                  <tr>
                    <th
                      v-for="field in mappedFields"
                      :key="field.key"
                      class="px-2 py-1.5 font-medium"
                    >
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
                      {{ row[mapping[field.key] ?? -1] || '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-action="back-upload"
              @click="step = 1"
            >
              <ArrowLeft class="size-4" aria-hidden="true" />
              {{ t('users:import.back') }}
            </Button>
            <Button
              type="button"
              size="sm"
              data-action="to-review"
              :disabled="missing.length > 0"
              @click="step = 3"
            >
              {{ t('users:import.next') }}
              <ArrowRight class="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <!-- Step 3: review -->
        <div v-else-if="step === 3" class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold">{{ t('users:import.reviewTitle') }}</h3>
            <p class="text-xs text-muted-foreground">{{ t('users:import.reviewHint') }}</p>
          </div>

          <div class="flex flex-wrap gap-3 text-xs">
            <span
              class="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 class="size-3.5" aria-hidden="true" />
              {{ t('users:import.validCount', { count: validCount }) }}
            </span>
            <span
              v-if="invalidCount > 0"
              class="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-destructive"
            >
              <AlertCircle class="size-3.5" aria-hidden="true" />
              {{ t('users:import.invalidCount', { count: invalidCount }) }}
            </span>
          </div>

          <div class="max-h-64 overflow-auto rounded-md border">
            <table class="w-full text-xs" data-import-review>
              <thead class="sticky top-0 bg-muted text-start text-muted-foreground">
                <tr>
                  <th class="px-2 py-1.5 font-medium">{{ t('users:import.rowNumber') }}</th>
                  <th v-for="field in fields" :key="field.key" class="px-2 py-1.5 font-medium">
                    {{ field.label }}
                  </th>
                  <th class="px-2 py-1.5 font-medium">{{ t('users:import.status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="result in results.slice(0, 10)" :key="result.line" class="border-t">
                  <td class="px-2 py-1.5 text-muted-foreground">{{ result.line }}</td>
                  <td
                    v-for="field in fields"
                    :key="field.key"
                    class="max-w-40 truncate px-2 py-1.5"
                    :class="
                      result.errors.some((error) => error.key === field.key) && 'text-destructive'
                    "
                  >
                    {{ result.values[field.key] || '—' }}
                  </td>
                  <td class="px-2 py-1.5">
                    <span v-if="result.valid" class="text-emerald-700 dark:text-emerald-400">
                      {{ t('users:import.statusValid') }}
                    </span>
                    <span v-else class="text-destructive">
                      {{ result.errors.map((error) => error.message).join('; ') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="importError" role="alert" class="text-xs text-destructive" data-import-error>
            {{ importError }}
          </p>

          <div class="flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-action="back-map"
              @click="step = 2"
            >
              <ArrowLeft class="size-4" aria-hidden="true" />
              {{ t('users:import.back') }}
            </Button>
            <Button
              type="button"
              size="sm"
              data-action="submit-import"
              :disabled="validCount === 0 || importing"
              @click="submit"
            >
              {{
                importing
                  ? t('users:import.importing')
                  : t('users:import.import', { count: validCount })
              }}
            </Button>
          </div>
        </div>

        <!-- Step 4: done -->
        <div v-else class="space-y-3 py-6 text-center" data-import-done>
          <CheckCircle2 class="mx-auto size-9 text-emerald-600" aria-hidden="true" />
          <div>
            <h3 class="text-sm font-semibold">{{ t('users:import.doneTitle') }}</h3>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ t('users:import.doneHint', { count: resultCount }) }}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-action="reset-import"
            @click="reset"
          >
            {{ t('users:import.reset') }}
          </Button>
        </div>
      </section>
    </DialogContent>
  </Dialog>
</template>
