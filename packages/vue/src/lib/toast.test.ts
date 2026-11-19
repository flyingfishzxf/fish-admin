import { describe, expect, it, vi } from 'vitest'

import { observeToaster, toast } from './toast'

describe('toast store', () => {
  it('routes success/error/info/warning/loading to the default toaster', () => {
    const store = observeToaster('test-default')
    store.records.splice(0)
    toast.success('Saved', { toasterId: 'test-default', duration: 0 })
    toast.error('Failed', { toasterId: 'test-default', duration: 0 })

    expect(store.records.map((record) => record.tone)).toEqual(['success', 'error'])
    expect(store.records[0]!.message).toBe('Saved')
    toast.dismiss(undefined, 'test-default')
    expect(store.records).toHaveLength(0)
  })

  it('supports description, action and dedicated toaster ids', () => {
    const store = observeToaster('test-actions')
    store.records.splice(0)
    const onClick = vi.fn(() => {})
    toast('Archived', {
      toasterId: 'test-actions',
      description: 'Hidden from members',
      duration: 0,
      action: { label: 'Undo', onClick },
    })

    const record = store.records[0]!
    expect(record.description).toBe('Hidden from members')
    record.action?.onClick()
    expect(onClick).toHaveBeenCalledTimes(1)
    toast.dismiss(undefined, 'test-actions')
  })
})
