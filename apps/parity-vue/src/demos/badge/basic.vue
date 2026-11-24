<script lang="ts">
export default { name: 'BadgeBasic' }
</script>

<script setup lang="ts">
import { Badge } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Badge>Active</Badge>
      <Badge variant="secondary">Trial</Badge>
      <Badge variant="outline">Invited</Badge>
      <Badge variant="destructive">Past due</Badge>
      <Badge variant="ghost">Draft</Badge>
      <Badge variant="link" as-child>
        <a href="https://fish-admin-react-demo.vercel.app/" target="_blank" rel="noreferrer"
          >Changelog</a
        >
      </Badge>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      default, secondary, outline, destructive, ghost and link. The last badge is rendered as an
      anchor through <code>asChild</code>.
    </p>
  </div>
</template>
