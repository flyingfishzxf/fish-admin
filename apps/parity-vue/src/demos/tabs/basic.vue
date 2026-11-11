<script lang="ts">
export default { name: 'TabsBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import {
  Button,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@fish-admin/vue'

const PANEL_STYLE = { paddingTop: '0.75rem', minHeight: '8.5rem' }

const tab = ref('profile')
const name = ref('Katherine Johnson')
const savedName = ref('Katherine Johnson')
const productUpdates = ref(true)
const twoFactor = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <Tabs v-model="tab">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" :style="PANEL_STYLE">
        <div style="display: grid; gap: 0.75rem">
          <div style="display: grid; gap: 0.375rem">
            <Label for="demo-tabs-display-name">Display name</Label>
            <Input id="demo-tabs-display-name" v-model="name" />
          </div>
          <div class="fish-demo-row">
            <Button size="sm" :disabled="!name.trim()" @click="savedName = name.trim()">
              Save profile
            </Button>
            <span class="fish-demo-muted" aria-live="polite">Shown as {{ savedName }}</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="notifications" :style="PANEL_STYLE">
        <div style="display: grid; gap: 0.75rem">
          <div
            style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem"
          >
            <div>
              <Label for="demo-tabs-product-updates">Product updates</Label>
              <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
                Release notes about once a month.
              </p>
            </div>
            <Switch id="demo-tabs-product-updates" v-model="productUpdates" />
          </div>
          <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
            {{
              productUpdates ? 'Product update emails are on.' : 'Product update emails are off.'
            }}
          </p>
        </div>
      </TabsContent>
      <TabsContent value="security" :style="PANEL_STYLE">
        <div style="display: grid; gap: 0.75rem">
          <div
            style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem"
          >
            <div>
              <Label for="demo-tabs-two-factor">Two-factor authentication</Label>
              <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
                Required for workspace owners.
              </p>
            </div>
            <Switch id="demo-tabs-two-factor" v-model="twoFactor" />
          </div>
          <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
            {{
              twoFactor ? 'Two-factor authentication is on.' : 'Two-factor authentication is off.'
            }}
          </p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
