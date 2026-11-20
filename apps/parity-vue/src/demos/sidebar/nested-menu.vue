<script lang="ts">
export default { name: 'SidebarNested' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from '@fish-admin/vue'
import { BarChart3, ChevronDown, ChevronRight, FolderKanban, Inbox, Settings, Users } from 'lucide-vue-next'

const navOpen = ref(true)
const projectsOpen = ref(true)
const active = ref('website')
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 30rem">
    <div
      style="
        position: relative;
        width: 100%;
        max-width: 30rem;
        height: 320px;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--background);
      "
    >
      <SidebarProvider embedded class="h-full min-h-0">
        <Sidebar collapsible="none" style="border-right: 1px solid var(--border); height: 320px">
          <SidebarHeader>
            <div style="padding: 0.25rem 0.5rem">
              <p style="margin: 0; font-size: 0.85rem; font-weight: 600">Acme Design</p>
              <p style="margin: 0; font-size: 0.7rem; color: var(--muted-foreground)">5 members</p>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupAction
                :aria-label="navOpen ? 'Collapse workspace links' : 'Expand workspace links'"
                :aria-expanded="navOpen"
                :title="navOpen ? 'Collapse group' : 'Expand group'"
                @click="navOpen = !navOpen"
              >
                <ChevronDown v-if="navOpen" />
                <ChevronRight v-else />
              </SidebarGroupAction>
              <SidebarGroupContent v-if="navOpen">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton :is-active="active === 'inbox'" @click="active = 'inbox'">
                      <Inbox />
                      <span>Inbox</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>3</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      :is-active="active === 'website' || active === 'mobile'"
                      @click="projectsOpen = !projectsOpen"
                    >
                      <FolderKanban />
                      <span>Projects</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      :aria-label="projectsOpen ? 'Hide projects' : 'Show projects'"
                      :aria-expanded="projectsOpen"
                      show-on-hover
                      @click="projectsOpen = !projectsOpen"
                    >
                      <ChevronRight
                        :style="{
                          transform: projectsOpen ? 'rotate(90deg)' : 'none',
                          transition: 'transform 150ms ease',
                        }"
                      />
                    </SidebarMenuAction>
                    <SidebarMenuSub v-if="projectsOpen">
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton as-child :is-active="active === 'website'">
                          <button type="button" @click="active = 'website'">
                            <span>Website redesign</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton as-child :is-active="active === 'mobile'">
                          <button type="button" @click="active = 'mobile'">
                            <span>Mobile app</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton :is-active="active === 'reports'" @click="active = 'reports'">
                      <BarChart3 />
                      <span>Reports</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton :is-active="active === 'members'" @click="active = 'members'">
                      <Users />
                      <span>Members</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton :is-active="active === 'settings'" @click="active = 'settings'">
                      <Settings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <p
              style="
                margin: 0;
                padding: 0 0.5rem;
                font-size: 0.7rem;
                color: var(--muted-foreground);
              "
            >
              Static rail · collapsible="none"
            </p>
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
          <p style="margin: 0; font-size: 0.8rem; font-weight: 600">Active page: {{ active }}</p>
          <p class="fish-demo-muted" style="margin: 0">
            Collapse the Workspace group with the chevron in the group header, and the Projects
            submenu with the menu action.
          </p>
        </div>
      </SidebarProvider>
    </div>
  </div>
</template>
