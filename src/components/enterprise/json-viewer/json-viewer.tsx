import { Check, ChevronRight, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

const PRIMITIVE_STYLES: Record<string, string> = {
  string: 'text-success',
  number: 'text-primary',
  boolean: 'text-warning',
  null: 'text-muted-foreground',
}

function formatPrimitive(value: JsonValue) {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  return String(value)
}

function JsonNode({
  name,
  value,
  depth,
  expandedDepth,
  rootLabel,
}: {
  name: string
  value: JsonValue
  depth: number
  expandedDepth: number
  rootLabel?: string
}) {
  const { t } = useTranslation('common')
  const isContainer = value !== null && typeof value === 'object'
  const entries = isContainer ? Object.entries(value) : []
  const [expanded, setExpanded] = useState(depth < expandedDepth)

  if (!isContainer) {
    return (
      <div className="flex gap-2 py-0.5">
        {name ? <span className="shrink-0 text-muted-foreground">{name}:</span> : null}
        <span className={cn('break-all', PRIMITIVE_STYLES[value === null ? 'null' : typeof value])}>
          {formatPrimitive(value)}
        </span>
      </div>
    )
  }

  const summary = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`
  const label = name || rootLabel || t('enterprise.noData')

  if (entries.length === 0) {
    return (
      <div className="flex gap-2 py-0.5">
        {name ? <span className="shrink-0 text-muted-foreground">{name}:</span> : null}
        <span className="text-muted-foreground">{summary}</span>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex items-center gap-1 rounded-sm py-0.5 text-left outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ChevronRight
          aria-hidden
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
        {name ? (
          <span className="text-foreground">{name}:</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
        <span className="text-muted-foreground">{summary}</span>
      </button>
      {expanded ? (
        <div className="ml-1.5 border-l pl-3">
          {entries.map(([key, entry]) => (
            <JsonNode
              key={key}
              name={key}
              value={entry}
              depth={depth + 1}
              expandedDepth={expandedDepth}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function JsonViewer({
  value,
  ariaLabel,
  defaultExpandedDepth = 2,
  className,
}: {
  value: JsonValue | undefined
  ariaLabel: string
  defaultExpandedDepth?: number
  className?: string
}) {
  const { t } = useTranslation('common')
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = () => {
    if (value === undefined) return
    void navigator.clipboard
      ?.writeText(JSON.stringify(value, null, 2))
      .then(() => {
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => undefined)
  }

  return (
    <div
      data-slot="json-viewer"
      className={cn('overflow-hidden rounded-lg border bg-muted/20 font-mono text-xs', className)}
    >
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
        <span className="truncate font-sans text-xs font-medium text-muted-foreground">
          {ariaLabel}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={value === undefined}
          onClick={copy}
          aria-label={copied ? t('actions.copied') : t('actions.copy')}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          <span aria-hidden>{copied ? t('actions.copied') : t('actions.copy')}</span>
        </Button>
      </div>
      <div className="max-h-72 overflow-auto p-3">
        {value === undefined ? (
          <p className="font-sans text-muted-foreground">{t('enterprise.noData')}</p>
        ) : (
          <JsonNode
            name=""
            value={value}
            depth={0}
            expandedDepth={defaultExpandedDepth}
            rootLabel={ariaLabel}
          />
        )}
      </div>
    </div>
  )
}
