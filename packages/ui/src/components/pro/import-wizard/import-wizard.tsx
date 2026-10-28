import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  UploadCloud,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { Button } from '../../ui/button'
import { type CsvTable, parseCsvTable } from '../../../lib/csv'
import { cn } from '../../../lib/utils'

import {
  autoMapFields,
  buildImportRows,
  missingRequiredFields,
  toImportPayload,
  type ImportField,
  type ImportMessages,
} from './import-wizard-utils'

export type ImportWizardLabels = {
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

function readFileText(file: File) {
  if (typeof file.text === 'function') return file.text()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function ImportWizard({
  fields,
  onImport,
  labels,
  sample,
  sampleName = 'sample.csv',
  accept = '.csv,text/csv',
  ariaLabel,
  className,
}: {
  /** Target fields; `aliases` feed the automatic column matching. */
  fields: ImportField[]
  /** Called with the valid rows only; rejected or thrown errors show `labels.importFailed`. */
  onImport: (rows: Record<string, unknown>[]) => void | Promise<void>
  /** Every visible string, including the four step names and the row messages. */
  labels: ImportWizardLabels
  /** CSV text for the "load sample" button; omit the button when undefined. */
  sample?: string
  /** File name shown for the sample once it is loaded. */
  sampleName?: string
  /** `accept` attribute for the hidden file input. */
  accept?: string
  /** Accessible name for the wizard region. */
  ariaLabel?: string
  /** Extra classes for the outer panel. */
  className?: string
}) {
  const [step, setStep] = useState(1)
  const [fileName, setFileName] = useState('')
  const [table, setTable] = useState<CsvTable | null>(null)
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [parseError, setParseError] = useState('')
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [resultCount, setResultCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function loadText(text: string, name: string) {
    const parsed = parseCsvTable(text)
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setParseError(labels.emptyFile)
      return
    }
    setParseError('')
    setImportError('')
    setFileName(name)
    setTable(parsed)
    setMapping(autoMapFields(fields, parsed.headers))
    setStep(2)
  }

  async function loadFile(file: File) {
    try {
      loadText(await readFileText(file), file.name)
    } catch {
      setParseError(labels.parseError)
    }
  }

  function reset() {
    setStep(1)
    setFileName('')
    setTable(null)
    setMapping({})
    setParseError('')
    setImportError('')
    setResultCount(0)
  }

  const missing = useMemo(
    () => (table ? missingRequiredFields(fields, mapping) : []),
    [fields, mapping, table],
  )
  const mappedFields = useMemo(
    () => fields.filter((field) => (mapping[field.key] ?? -1) >= 0),
    [fields, mapping],
  )
  const results = useMemo(
    () => (table ? buildImportRows(fields, mapping, table.rows, labels.messages) : []),
    [fields, labels.messages, mapping, table],
  )
  const validCount = results.filter((result) => result.valid).length
  const invalidCount = results.length - validCount

  async function importRows() {
    setImporting(true)
    setImportError('')
    try {
      await onImport(toImportPayload(fields, results))
      setResultCount(validCount)
      setStep(4)
    } catch {
      setImportError(labels.importFailed)
    } finally {
      setImporting(false)
    }
  }

  return (
    <section
      data-slot="import-wizard"
      aria-label={ariaLabel}
      className={cn('space-y-4 rounded-lg border bg-background p-4', className)}
    >
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {labels.steps.map((label, index) => {
          const value = index + 1
          const current = step === value
          const complete = step > value
          return (
            <li
              key={label}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'flex items-center gap-1.5',
                current ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border text-[10px]',
                  current && 'border-primary bg-primary text-primary-foreground',
                  complete && 'border-primary/40 bg-primary/10 text-primary',
                )}
              >
                {complete ? <CheckCircle2 aria-hidden className="size-3" /> : value}
              </span>
              {label}
            </li>
          )
        })}
      </ol>

      {step === 1 ? (
        <div className="space-y-3">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const file = event.dataTransfer.files?.[0]
              if (file) void loadFile(file)
            }}
            className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center"
          >
            <UploadCloud aria-hidden className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">{labels.dropTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{labels.dropHint}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {labels.browse}
              </Button>
              {sample ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => loadText(sample, sampleName)}
                >
                  {labels.sample}
                </Button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              aria-label={labels.browse}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void loadFile(file)
                event.target.value = ''
              }}
            />
          </div>
          {parseError ? (
            <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle aria-hidden className="size-3.5" />
              {parseError}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 2 && table ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{labels.mapTitle}</h3>
              <p className="text-xs text-muted-foreground">{labels.mapHint}</p>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileSpreadsheet aria-hidden className="size-3.5" />
              {fileName} · {table.rows.length}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="space-y-1 text-sm">
                <span className="font-medium">
                  {field.label}
                  {field.required ? (
                    <span aria-hidden className="text-destructive">
                      {' '}
                      *
                    </span>
                  ) : null}
                </span>
                <select
                  aria-label={field.label}
                  value={mapping[field.key] ?? -1}
                  onChange={(event) =>
                    setMapping((current) => ({
                      ...current,
                      [field.key]: Number(event.target.value),
                    }))
                  }
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value={-1}>{labels.skipColumn}</option>
                  {table.headers.map((header, index) => (
                    <option key={`${header}-${index}`} value={index}>
                      {header || `${labels.sourceColumn} ${index + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {missing.length > 0 ? (
            <p role="status" className="text-xs text-destructive">
              {labels.mapRequired(missing.map((field) => field.label).join(', '))}
            </p>
          ) : null}

          {mappedFields.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium">{labels.previewTitle}</p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      {mappedFields.map((field) => (
                        <th key={field.key} className="px-2 py-1.5 font-medium">
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.slice(0, 3).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {mappedFields.map((field) => (
                          <td key={field.key} className="max-w-40 truncate px-2 py-1.5">
                            {row[mapping[field.key]] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="flex justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden className="size-4" />
              {labels.back}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={missing.length > 0}
              onClick={() => setStep(3)}
            >
              {labels.next}
              <ArrowRight aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && table ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">{labels.reviewTitle}</h3>
            <p className="text-xs text-muted-foreground">{labels.reviewHint}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 aria-hidden className="size-3.5" />
              {labels.validCount(validCount)}
            </span>
            {invalidCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-destructive">
                <AlertCircle aria-hidden className="size-3.5" />
                {labels.invalidCount(invalidCount)}
              </span>
            ) : null}
          </div>

          <div className="max-h-64 overflow-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 font-medium">{labels.rowNumber}</th>
                  {fields.map((field) => (
                    <th key={field.key} className="px-2 py-1.5 font-medium">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-2 py-1.5 font-medium">{labels.status}</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((result) => (
                  <tr key={result.line} className="border-t">
                    <td className="px-2 py-1.5 text-muted-foreground">{result.line}</td>
                    {fields.map((field) => {
                      const error = result.errors.find((entry) => entry.key === field.key)
                      return (
                        <td
                          key={field.key}
                          className={cn(
                            'max-w-40 truncate px-2 py-1.5',
                            error && 'text-destructive',
                          )}
                          title={error?.message}
                        >
                          {result.values[field.key] || '—'}
                        </td>
                      )
                    })}
                    <td className="px-2 py-1.5">
                      {result.valid ? (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {labels.statusValid}
                        </span>
                      ) : (
                        <span className="text-destructive">
                          {result.errors.map((error) => error.message).join('; ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importError ? (
            <p role="alert" className="text-xs text-destructive">
              {importError}
            </p>
          ) : null}

          <div className="flex justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(2)}>
              <ArrowLeft aria-hidden className="size-4" />
              {labels.back}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={validCount === 0 || importing}
              onClick={() => void importRows()}
            >
              {importing ? labels.importing : labels.import(validCount)}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-3 py-6 text-center">
          <CheckCircle2 aria-hidden className="mx-auto size-9 text-emerald-600" />
          <div>
            <h3 className="text-sm font-semibold">{labels.doneTitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{labels.doneHint(resultCount)}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            {labels.reset}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
