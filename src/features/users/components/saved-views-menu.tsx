import { Bookmark, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Badge, Button, Input, Popover, PopoverContent, PopoverTrigger } from '@fish-admin/react'

import type { UsersSearch } from '../search'

export interface SavedView {
  id: string
  name: string
  search: Pick<UsersSearch, 'q' | 'roleId' | 'status' | 'sort' | 'order' | 'pageSize'>
  createdAt: string
}

const MAX_VIEWS = 10

function storageKey(userId: string) {
  return `fish-admin:users-views:${userId}`
}

function loadViews(userId: string): SavedView[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (view): view is SavedView =>
        typeof view === 'object' &&
        view !== null &&
        typeof (view as SavedView).id === 'string' &&
        typeof (view as SavedView).name === 'string' &&
        typeof (view as SavedView).search === 'object',
    )
  } catch {
    return []
  }
}

function persistViews(userId: string, views: SavedView[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(views))
  } catch {
    // Storage can be blocked; saved views remain in memory for this session.
  }
}

export function SavedViewsMenu({
  userId,
  search,
  onApply,
}: {
  userId: string
  search: UsersSearch
  onApply: (view: SavedView) => void
}) {
  const { t } = useTranslation()
  const [views, setViews] = useState<SavedView[]>(() => loadViews(userId))
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  function saveView() {
    const trimmed = name.trim()
    if (!trimmed) return

    const view: SavedView = {
      id: crypto.randomUUID(),
      name: trimmed.slice(0, 40),
      search: {
        q: search.q,
        roleId: search.roleId,
        status: search.status,
        sort: search.sort,
        order: search.order,
        pageSize: search.pageSize,
      },
      createdAt: new Date().toISOString(),
    }
    const next = [view, ...views].slice(0, MAX_VIEWS)
    setViews(next)
    persistViews(userId, next)
    setName('')
    toast.success(t('users:views.saved'))
  }

  function deleteView(id: string) {
    const next = views.filter((view) => view.id !== id)
    setViews(next)
    persistViews(userId, next)
    toast.success(t('users:views.deleted'))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Bookmark className="size-4" />
          <span className="hidden sm:inline">{t('users:views.title')}</span>
          {views.length > 0 ? (
            <Badge variant="secondary" className="px-1.5 font-normal">
              {views.length}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="space-y-2 border-b p-3">
          <p className="text-xs font-medium text-muted-foreground">{t('users:views.saveHint')}</p>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  saveView()
                }
              }}
              placeholder={t('users:views.namePlaceholder')}
              aria-label={t('users:views.namePlaceholder')}
              className="h-8"
              maxLength={40}
            />
            <Button size="sm" className="h-8" disabled={!name.trim()} onClick={saveView}>
              {t('users:views.save')}
            </Button>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {views.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              {t('users:views.empty')}
            </p>
          ) : (
            views.map((view) => (
              <div
                key={view.id}
                className="flex items-center gap-1 rounded-md pr-1 hover:bg-muted/60"
              >
                <button
                  type="button"
                  className="flex-1 truncate px-2 py-2 text-left text-sm"
                  onClick={() => {
                    onApply(view)
                    setOpen(false)
                  }}
                >
                  {view.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t('users:views.delete')}
                  onClick={() => deleteView(view.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
