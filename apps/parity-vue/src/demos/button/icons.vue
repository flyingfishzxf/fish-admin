<script lang="ts">
export default { name: 'ButtonIcons' }
</script>

<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import { ArrowUpRight, Download, Save, Trash2 } from 'lucide-vue-next'
</script>

<template>
  <div class="fish-demo-row">
    <Button>
      <Save aria-hidden="true" />
      Save changes
    </Button>
    <Button variant="outline">
      <Download aria-hidden="true" />
      Export
    </Button>
    <Button variant="destructive" size="icon" aria-label="Delete project">
      <Trash2 aria-hidden="true" />
    </Button>
    <Button as-child variant="link">
      <a href="https://fish-admin-react-demo.vercel.app/" target="_blank" rel="noreferrer">
        Open the template
        <ArrowUpRight aria-hidden="true" />
      </a>
    </Button>
  </div>
</template>
