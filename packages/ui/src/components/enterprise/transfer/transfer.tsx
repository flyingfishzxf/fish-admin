import { Check } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useUITranslation } from '../../../i18n'

import { Checkbox } from '../../ui/checkbox'
import { Input } from '../../ui/input'
import { cn } from '../../../lib/utils'

import {
  filterTransferItems,
  groupTransferItems,
  splitTransferItems,
  toggleTransferKeys,
  toggleTransferValue,
  transferKeysState,
  type TransferLike,
} from './transfer-utils'

export type TransferItem = TransferLike

export function Transfer({
  items,
  value,
  onChange,
  sourceTitle,
  targetTitle,
  searchPlaceholder,
  emptySourceLabel,
  emptyTargetLabel,
  disabled = false,
  className,
}: {
  items: TransferItem[]
  value: string[]
  onChange: (value: string[]) => void
  sourceTitle: string
  targetTitle: string
  searchPlaceholder?: string
  emptySourceLabel?: string
  emptyTargetLabel?: string
  disabled?: boolean
  className?: string
}) {
  const [sourceSearch, setSourceSearch] = useState('')
  const [targetSearch, setTargetSearch] = useState('')

  const { source, target } = useMemo(() => splitTransferItems(items, value), [items, value])
  const visibleSource = useMemo(
    () => filterTransferItems(source, sourceSearch),
    [source, sourceSearch],
  )
  const visibleTarget = useMemo(
    () => filterTransferItems(target, targetSearch),
    [target, targetSearch],
  )

  return (
    <div className={cn('grid gap-3 md:grid-cols-2', className)}>
      <TransferPanel
        title={sourceTitle}
        emptyLabel={emptySourceLabel}
        searchPlaceholder={searchPlaceholder}
        search={sourceSearch}
        onSearchChange={setSourceSearch}
        visibleItems={visibleSource}
        totalCount={source.length}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
      <TransferPanel
        title={targetTitle}
        emptyLabel={emptyTargetLabel}
        searchPlaceholder={searchPlaceholder}
        search={targetSearch}
        onSearchChange={setTargetSearch}
        visibleItems={visibleTarget}
        totalCount={target.length}
        value={value}
        disabled={disabled}
        onChange={onChange}
        target
      />
    </div>
  )
}

function TransferPanel({
  title,
  emptyLabel,
  searchPlaceholder,
  search,
  onSearchChange,
  visibleItems,
  totalCount,
  value,
  onChange,
  disabled,
  target = false,
}: {
  title: string
  emptyLabel?: string
  searchPlaceholder?: string
  search: string
  onSearchChange: (value: string) => void
  visibleItems: TransferItem[]
  totalCount: number
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
  target?: boolean
}) {
  const { t } = useUITranslation()
  const headingId = useId()
  const allId = useId()

  const selectableKeys = visibleItems.filter((item) => !item.disabled).map((item) => item.key)
  const selectionState = transferKeysState(value, selectableKeys)
  const groups = groupTransferItems(visibleItems)

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-medium">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </div>

      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder ?? t('enterprise.search')}
        aria-label={`${title} — ${t('enterprise.search')}`}
        className="h-8"
        disabled={disabled}
      />

      <div className="flex items-center gap-2">
        <Checkbox
          id={allId}
          checked={
            selectionState === 'all' ? true : selectionState === 'some' ? 'indeterminate' : false
          }
          disabled={disabled || selectableKeys.length === 0}
          onCheckedChange={() => onChange(toggleTransferKeys(value, selectableKeys))}
        />
        <label htmlFor={allId} className="text-xs text-muted-foreground">
          {t('enterprise.selectAll')}
        </label>
      </div>

      <ul
        role="listbox"
        aria-label={title}
        aria-multiselectable="true"
        className="max-h-64 space-y-1 overflow-y-auto pr-1"
      >
        {groups.map((group) => (
          <li key={group.key || '__ungrouped'} role="presentation">
            {group.key ? (
              <p className="px-2 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground">
                {group.key}
              </p>
            ) : null}
            <ul role="presentation" className="space-y-1">
              {group.items.map((item) => (
                <li key={item.key} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={target}
                    disabled={disabled || item.disabled}
                    onClick={() => onChange(toggleTransferValue(value, item.key))}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
                      target && 'bg-primary/5',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input',
                        target && 'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {target ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{item.label}</span>
                      {item.description ? (
                        <span className="block text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
        {visibleItems.length === 0 ? (
          <li role="presentation" className="px-2 py-6 text-center text-xs text-muted-foreground">
            {emptyLabel ?? t('enterprise.noMatches')}
          </li>
        ) : null}
      </ul>
    </section>
  )
}
