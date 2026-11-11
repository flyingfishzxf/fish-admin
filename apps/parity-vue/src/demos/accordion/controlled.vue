<script lang="ts">
export default { name: 'AccordionControlled' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from '@fish-admin/vue'

const PANEL_STYLE = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  padding: '0 1rem',
}

const QUESTIONS = {
  notifications: 'Which notifications can members mute?',
  audit: 'How long are audit entries retained?',
  scim: 'Does SCIM provisioning remove deprovisioned members?',
}

const openItems = ref<string[]>(['notifications', 'audit'])
</script>

<template>
  <div class="fish-demo-stack fish-demo-stack--wide">
    <Accordion v-model="openItems" type="multiple" :style="PANEL_STYLE">
      <AccordionItem value="notifications">
        <AccordionTrigger>{{ QUESTIONS.notifications }}</AccordionTrigger>
        <AccordionContent>
          Members can mute release, comment and mention notifications per workspace; billing and
          security notices always stay on.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="audit">
        <AccordionTrigger>{{ QUESTIONS.audit }}</AccordionTrigger>
        <AccordionContent>
          Audit entries are kept for 18 months on Team and 36 months on Enterprise; exports use the
          same window.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="scim">
        <AccordionTrigger>{{ QUESTIONS.scim }}</AccordionTrigger>
        <AccordionContent>
          Yes. Once a member is deprovisioned in the identity provider, the next SCIM sync suspends
          the account and transfers owned projects to the workspace.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    <div class="fish-demo-row">
      <span class="fish-demo-muted" aria-live="polite">
        {{
          openItems.length === 0
            ? 'All panels are closed.'
            : `${openItems.length} of 3 panels open.`
        }}
      </span>
      <Button
        variant="outline"
        size="sm"
        :disabled="openItems.length === 0"
        @click="openItems = []"
      >
        Collapse all
      </Button>
    </div>
  </div>
</template>
