import type { MockDictionaryItemRecord, MockDictionaryTypeRecord } from './db/types'

const SEEDED_AT = '2026-01-05T09:00:00.000Z'

interface SeedItem {
  label: string
  value: string
  description?: string
}

interface SeedDictionary {
  code: string
  name: string
  description: string
  items: SeedItem[]
}

const DICTIONARIES: SeedDictionary[] = [
  {
    code: 'user_tag',
    name: 'User tags',
    description: 'Labels offered as suggestions on the user profile.',
    items: [
      { label: 'Owner', value: 'owner' },
      { label: 'On-call', value: 'on-call' },
      { label: 'Remote', value: 'remote' },
      { label: 'Contractor', value: 'contractor' },
      { label: 'Mentor', value: 'mentor' },
      { label: 'New hire', value: 'new-hire' },
      { label: 'Key account', value: 'key-account' },
    ],
  },
  {
    code: 'expense_category',
    name: 'Expense categories',
    description: 'Categories for reimbursement and purchase requests.',
    items: [
      { label: 'Travel', value: 'travel' },
      { label: 'Meals', value: 'meals' },
      { label: 'Software', value: 'software' },
      { label: 'Hardware', value: 'hardware' },
      { label: 'Training', value: 'training' },
    ],
  },
  {
    code: 'approval_priority',
    name: 'Approval priority',
    description: 'Priority levels shown alongside an approval request.',
    items: [
      { label: 'Low', value: 'low' },
      { label: 'Normal', value: 'normal' },
      { label: 'High', value: 'high' },
      { label: 'Urgent', value: 'urgent' },
    ],
  },
]

export function createDictionarySeed(): {
  types: MockDictionaryTypeRecord[]
  items: MockDictionaryItemRecord[]
} {
  const types: MockDictionaryTypeRecord[] = []
  const items: MockDictionaryItemRecord[] = []

  for (const [index, dictionary] of DICTIONARIES.entries()) {
    const id = `dict-${dictionary.code.replace(/_/g, '-')}`
    const createdAt = new Date(Date.parse(SEEDED_AT) + index * 60_000).toISOString()
    types.push({
      id,
      code: dictionary.code,
      name: dictionary.name,
      description: dictionary.description,
      isSystem: true,
      createdAt,
      updatedAt: createdAt,
    })

    dictionary.items.forEach((item, itemIndex) => {
      items.push({
        id: `${id}-${item.value}`,
        dictionaryId: id,
        label: item.label,
        value: item.value,
        description: item.description ?? '',
        sortOrder: itemIndex,
        enabled: true,
        isSystem: true,
        createdAt,
        updatedAt: createdAt,
      })
    })
  }

  return { types, items }
}
