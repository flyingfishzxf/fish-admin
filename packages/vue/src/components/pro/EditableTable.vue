<script setup lang="ts">
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { ref, type ComponentPublicInstance } from 'vue'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import Input from '../ui/input/Input.vue'

export type EditableTableRow = { id: string } & Record<string, unknown>

export interface EditableTableColumn {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  editor?: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]
  validate?: (value: unknown, row: EditableTableRow) => string | null
  parse?: (raw: string) => unknown
}

export interface EditableTableLabels {
  add: string
  save: string
  cancel: string
  edit: string
  delete: string
  actions: string
  empty: string
}

const props = defineProps<{
  /** Column definitions: editor type, options, alignment, `parse` and `validate`. */
  columns: EditableTableColumn[]
  /** Committed rows; the component never mutates them. */
  rows: EditableTableRow[]
  /** Every visible string: add, save, cancel, edit, delete, actions and empty. */
  labels: EditableTableLabels
  /** Accessible name for the underlying table. */
  ariaLabel: string
  /** When provided, renders the Add button and seeds the draft row it opens. */
  addRow?: () => EditableTableRow
  /** Short human name for a row, used in the Edit and Delete button labels. */
  rowLabel?: (row: EditableTableRow) => string
  class?: string
}>()

const emit = defineEmits<{ 'update:rows': [rows: EditableTableRow[]] }>()

defineSlots<{
  cell?(props: { column: EditableTableColumn; row: EditableTableRow }): unknown
}>()

const NEW_KEY = '__new__'
const editingId = ref<string | null>(null)
const draft = ref<EditableTableRow | null>(null)
const isNew = ref(false)
const errors = ref<Record<string, string>>({})

function resetEditing() {
  editingId.value = null
  draft.value = null
  isNew.value = false
  errors.value = {}
}

function startEdit(row: EditableTableRow) {
  editingId.value = row.id
  draft.value = { ...row }
  isNew.value = false
  errors.value = {}
}

function startAdd() {
  if (!props.addRow) return
  editingId.value = NEW_KEY
  draft.value = props.addRow()
  isNew.value = true
  errors.value = {}
}

function updateDraft(key: string, value: unknown) {
  if (!draft.value) return
  draft.value = { ...draft.value, [key]: value }
  if (errors.value[key]) {
    const next = { ...errors.value }
    delete next[key]
    errors.value = next
  }
}

function save() {
  if (!draft.value) return

  const candidate: EditableTableRow = { ...draft.value }
  for (const column of props.columns) {
    if (column.parse) candidate[column.key] = column.parse(String(draft.value[column.key] ?? ''))
  }

  const nextErrors: Record<string, string> = {}
  for (const column of props.columns) {
    const message = column.validate?.(candidate[column.key], candidate)
    if (message) nextErrors[column.key] = message
  }
  if (Object.keys(nextErrors).length > 0) {
    errors.value = nextErrors
    return
  }

  emit(
    'update:rows',
    isNew.value
      ? [...props.rows, candidate]
      : props.rows.map((row) => (row.id === candidate.id ? candidate : row)),
  )
  resetEditing()
}

function removeRow(row: EditableTableRow) {
  if (editingId.value === row.id) resetEditing()
  emit(
    'update:rows',
    props.rows.filter((entry) => entry.id !== row.id),
  )
}

function onKeydown(event: globalThis.KeyboardEvent) {
  if (event.key === 'Escape' && editingId.value) {
    event.preventDefault()
    resetEditing()
  }
}

function labelOf(row: EditableTableRow) {
  return props.rowLabel?.(row) ?? row.id
}

function isEditing(row: EditableTableRow, force = false) {
  return force || editingId.value === row.id
}

function setRef(id: string, el: Element | ComponentPublicInstance | null) {
  void id
  void el
}
</script>

<template>
  <div role="presentation" :class="cn('space-y-3', props.class)" @keydown="onKeydown">
    <div v-if="props.addRow" class="flex justify-end">
      <Button type="button" variant="outline" size="sm" @click="startAdd">
        <Plus aria-hidden="true" class="size-4" />
        {{ props.labels.add }}
      </Button>
    </div>

    <div tabindex="0" class="overflow-x-auto rounded-lg border">
      <table :aria-label="props.ariaLabel" class="w-full min-w-[40rem] text-sm">
        <thead class="bg-muted/40 text-start text-xs text-muted-foreground">
          <tr>
            <th
              v-for="column in props.columns"
              :key="column.key"
              scope="col"
              class="px-3 py-2 font-medium"
            >
              {{ column.header }}
            </th>
            <th scope="col" class="px-3 py-2 text-end font-medium">{{ props.labels.actions }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in props.rows"
            :key="row.id"
            :ref="(el) => setRef(row.id, el)"
            :class="cn('border-b last:border-b-0', isEditing(row) && 'bg-muted/30')"
          >
            <template v-for="column in props.columns" :key="column.key">
              <td
                v-if="isEditing(row)"
                class="px-3 py-2 align-top"
                :style="{ width: column.width }"
              >
                <div class="space-y-1">
                  <select
                    v-if="column.editor === 'select'"
                    :aria-label="column.header"
                    :value="String(draft?.[column.key] ?? '')"
                    class="h-8 w-full min-w-28 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    :class="errors[column.key] && 'border-destructive'"
                    @change="updateDraft(column.key, ($event.target as HTMLSelectElement).value)"
                  >
                    <option
                      v-for="option in column.options ?? []"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <Input
                    v-else
                    :aria-label="column.header"
                    :aria-invalid="errors[column.key] ? true : undefined"
                    :type="column.editor === 'number' ? 'number' : 'text'"
                    :value="String(draft?.[column.key] ?? '')"
                    class="h-8 min-w-32"
                    :class="errors[column.key] && 'border-destructive'"
                    @input="updateDraft(column.key, ($event.target as HTMLInputElement).value)"
                  />
                  <p v-if="errors[column.key]" class="text-xs text-destructive">
                    {{ errors[column.key] }}
                  </p>
                </div>
              </td>
              <td
                v-else
                class="px-3 py-2 align-top"
                :class="[
                  column.align === 'right' && 'text-end',
                  column.align === 'center' && 'text-center',
                ]"
                :style="{ width: column.width }"
              >
                <span class="flex min-h-8 items-center gap-2">
                  <slot name="cell" :column="column" :row="row">
                    <span
                      v-if="row[column.key] === '' || row[column.key] === undefined"
                      class="text-muted-foreground"
                    >
                      —
                    </span>
                    <span v-else>{{ String(row[column.key]) }}</span>
                  </slot>
                </span>
              </td>
            </template>
            <td class="px-3 py-2 text-end align-top whitespace-nowrap">
              <span v-if="isEditing(row)" class="flex min-h-8 items-center justify-end gap-1">
                <Button type="button" size="sm" @click="save">{{ props.labels.save }}</Button>
                <Button type="button" variant="ghost" size="sm" @click="resetEditing">
                  {{ props.labels.cancel }}
                </Button>
              </span>
              <span v-else class="flex min-h-8 items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  :aria-label="`${props.labels.edit} ${labelOf(row)}`"
                  @click="startEdit(row)"
                >
                  <Pencil aria-hidden="true" class="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  :aria-label="`${props.labels.delete} ${labelOf(row)}`"
                  @click="removeRow(row)"
                >
                  <Trash2 aria-hidden="true" class="size-3.5" />
                </Button>
              </span>
            </td>
          </tr>
          <tr v-if="editingId === NEW_KEY && draft">
            <td
              v-for="column in props.columns"
              :key="column.key"
              class="px-3 py-2 align-top"
              :style="{ width: column.width }"
            >
              <div class="space-y-1">
                <select
                  v-if="column.editor === 'select'"
                  :aria-label="column.header"
                  :value="String(draft[column.key] ?? '')"
                  class="h-8 w-full min-w-28 rounded-md border bg-background px-2 text-sm outline-none"
                  :class="errors[column.key] && 'border-destructive'"
                  @change="updateDraft(column.key, ($event.target as HTMLSelectElement).value)"
                >
                  <option
                    v-for="option in column.options ?? []"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <Input
                  v-else
                  :aria-label="column.header"
                  :type="column.editor === 'number' ? 'number' : 'text'"
                  :value="String(draft[column.key] ?? '')"
                  class="h-8 min-w-32"
                  :class="errors[column.key] && 'border-destructive'"
                  @input="updateDraft(column.key, ($event.target as HTMLInputElement).value)"
                />
                <p v-if="errors[column.key]" class="text-xs text-destructive">
                  {{ errors[column.key] }}
                </p>
              </div>
            </td>
            <td class="px-3 py-2 text-end align-top whitespace-nowrap">
              <span class="flex min-h-8 items-center justify-end gap-1">
                <Button type="button" size="sm" @click="save">{{ props.labels.save }}</Button>
                <Button type="button" variant="ghost" size="sm" @click="resetEditing">
                  {{ props.labels.cancel }}
                </Button>
              </span>
            </td>
          </tr>
          <tr v-if="props.rows.length === 0 && editingId !== NEW_KEY">
            <td
              :colspan="props.columns.length + 1"
              class="px-3 py-10 text-center text-sm text-muted-foreground"
            >
              {{ props.labels.empty }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
