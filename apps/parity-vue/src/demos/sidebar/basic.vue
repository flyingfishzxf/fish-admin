<script lang="ts">
export default { name: 'SidebarBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@fish-admin/vue'
import { BarChart3, Boxes, LayoutDashboard, Settings, Users } from 'lucide-vue-next'

const NAV = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    hint: 'Workspace health, open tickets and the weekly digest.',
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    hint: '12 members · 2 invitations pending · 3 admins.',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    hint: 'Q3 revenue, churn and activation reports are ready.',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    hint: 'Billing, security and webhook endpoints.',
  },
]

const BRAND_TEXT = {
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
}

const active = ref('overview')
const current = computed(() => NAV.find((item) => item.id === active.value) ?? NAV[0])
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 34rem">
    <div
      style="
        position: relative;
        width: 100%;
        max-width: 34rem;
        height: 320px;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--background);
        transform: translateZ(0);
      "
    >
      <SidebarProvider embedded :default-open="true" class="h-full min-h-0">
        <Sidebar collapsible="icon" style="height: 320px">
          <SidebarHeader>
            <div
              style="
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0 0.25rem;
                overflow: hidden;
              "
            >
              <Boxes :size="18" style="flex-shrink: 0" />
              <div :style="BRAND_TEXT">
                <p style="margin: 0; font-size: 0.85rem; font-weight: 600">Acme Ops</p>
                <p style="margin: 0; font-size: 0.7rem; color: var(--muted-foreground)">
                  Team plan
                </p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="item in NAV" :key="item.id">
                    <SidebarMenuButton
                      :is-active="active === item.id"
                      :tooltip="item.label"
                      @click="active = item.id"
                    >
                      <component :is="item.icon" />
                      <span>{{ item.label }}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div
              style="
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0 0.25rem;
                overflow: hidden;
              "
            >
              <span
                aria-hidden="true"
                style="
                  display: grid;
                  place-items: center;
                  width: 24px;
                  height: 24px;
                  flex-shrink: 0;
                  border-radius: 999px;
                  font-size: 0.65rem;
                  font-weight: 600;
                  background: var(--muted);
                "
              >
                KJ
              </span>
              <span :style="{ ...BRAND_TEXT, fontSize: '0.7rem' }">katherine@acme.dev</span>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          style="
            display: flex;
            flex: 1;
            min-width: 0;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.875rem;
            background: var(--background);
          "
        >
          <div style="display: flex; align-items: center; gap: 0.5rem">
            <SidebarTrigger />
            <p style="margin: 0; font-size: 0.8rem; font-weight: 600">Active page: {{ active }}</p>
          </div>
          <p class="fish-demo-muted" style="margin: 0; font-size: 0.8rem">{{ current.hint }}</p>
          <p class="fish-demo-muted" style="margin: 0; font-size: 0.8rem">
            Collapse the rail to icon mode with the trigger; tooltips keep every item reachable.
          </p>
        </div>
      </SidebarProvider>
    </div>
  </div>
</template>
