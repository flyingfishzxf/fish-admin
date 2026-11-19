<script setup lang="ts">
import Command from './Command.vue'
import type { CommandEntry, CommandGroupDef } from './Command.vue'
import Dialog from './dialog/Dialog.vue'
import DialogContent from './dialog/DialogContent.vue'
import DialogDescription from './dialog/DialogDescription.vue'
import DialogTitle from './dialog/DialogTitle.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    groups: CommandGroupDef[]
    /** Title rendered for screen readers only. */
    title?: string
    /** Description rendered for screen readers only. */
    description?: string
    placeholder?: string
    emptyLabel?: string
    showCloseButton?: boolean
  }>(),
  {
    title: 'Command Palette',
    description: 'Search for a command to run...',
    showCloseButton: true,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [entry: CommandEntry]
}>()
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogTitle class="sr-only">{{ props.title }}</DialogTitle>
    <DialogDescription class="sr-only">{{ props.description }}</DialogDescription>
    <DialogContent :show-close-button="props.showCloseButton" class="overflow-hidden p-0">
      <Command
        :groups="props.groups"
        :placeholder="props.placeholder"
        :empty-label="props.emptyLabel"
        class="**:data-[slot=command-input-wrapper]:h-12"
        @select="emit('select', $event)"
      />
    </DialogContent>
  </Dialog>
</template>
