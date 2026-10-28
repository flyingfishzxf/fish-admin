import { useState, type CSSProperties } from 'react'

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
} from '@fish-admin/react'
import {
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Inbox,
  Settings,
  Users,
  BarChart3,
} from 'lucide-react'

const FRAME: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '30rem',
  height: 320,
  overflow: 'hidden',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  background: 'var(--background)',
}

export default function SidebarNested() {
  const [navOpen, setNavOpen] = useState(true)
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [active, setActive] = useState('website')

  return (
    <div className="fish-demo-stack" style={{ maxWidth: '30rem' }}>
      <div style={FRAME}>
        <SidebarProvider
          embedded
          className="h-full min-h-0"
          style={{ '--sidebar-width': '14rem', minHeight: 0 } as CSSProperties}
        >
          <Sidebar
            collapsible="none"
            style={{ borderRight: '1px solid var(--border)', height: 320 }}
          >
            <SidebarHeader>
              <div style={{ padding: '0.25rem 0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Acme Design</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                  5 members
                </p>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                <SidebarGroupAction
                  aria-label={navOpen ? 'Collapse workspace links' : 'Expand workspace links'}
                  aria-expanded={navOpen}
                  title={navOpen ? 'Collapse group' : 'Expand group'}
                  onClick={() => setNavOpen((open) => !open)}
                >
                  {navOpen ? <ChevronDown /> : <ChevronRight />}
                </SidebarGroupAction>
                {navOpen ? (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={active === 'inbox'}
                          onClick={() => setActive('inbox')}
                        >
                          <Inbox />
                          <span>Inbox</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>3</SidebarMenuBadge>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={active === 'website' || active === 'mobile'}
                          onClick={() => setProjectsOpen((open) => !open)}
                        >
                          <FolderKanban />
                          <span>Projects</span>
                        </SidebarMenuButton>
                        <SidebarMenuAction
                          aria-label={projectsOpen ? 'Hide projects' : 'Show projects'}
                          aria-expanded={projectsOpen}
                          showOnHover
                          onClick={() => setProjectsOpen((open) => !open)}
                        >
                          <ChevronRight
                            style={{
                              transform: projectsOpen ? 'rotate(90deg)' : 'none',
                              transition: 'transform 150ms ease',
                            }}
                          />
                        </SidebarMenuAction>
                        {projectsOpen ? (
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={active === 'website'}>
                                <button type="button" onClick={() => setActive('website')}>
                                  <span>Website redesign</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild isActive={active === 'mobile'}>
                                <button type="button" onClick={() => setActive('mobile')}>
                                  <span>Mobile app</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        ) : null}
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          isActive={active === 'reports'}
                          onClick={() => setActive('reports')}
                        >
                          <BarChart3 />
                          <span>Reports</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                ) : null}
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={active === 'members'}
                        onClick={() => setActive('members')}
                      >
                        <Users />
                        <span>Members</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={active === 'settings'}
                        onClick={() => setActive('settings')}
                      >
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
                style={{
                  margin: 0,
                  padding: '0 0.5rem',
                  fontSize: '0.7rem',
                  color: 'var(--muted-foreground)',
                }}
              >
                Static rail · collapsible=&quot;none&quot;
              </p>
            </SidebarFooter>
          </Sidebar>
          <div
            style={{
              display: 'flex',
              flex: 1,
              minWidth: 0,
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.875rem',
              background: 'var(--background)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Active page: {active}</p>
            <p className="fish-demo-muted" style={{ margin: 0 }}>
              Collapse the Workspace group with the chevron in the group header, and the Projects
              submenu with the menu action.
            </p>
          </div>
        </SidebarProvider>
      </div>
    </div>
  )
}
