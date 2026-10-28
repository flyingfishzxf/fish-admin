import { useState, type CSSProperties } from 'react'

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
} from '@fish-admin/react'
import { BarChart3, Boxes, LayoutDashboard, Settings, Users } from 'lucide-react'

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

const FRAME: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '34rem',
  height: 320,
  overflow: 'hidden',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  background: 'var(--background)',
  transform: 'translateZ(0)',
}

const BRAND_TEXT: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
}

export default function SidebarBasic() {
  const [active, setActive] = useState('overview')
  const current = NAV.find((item) => item.id === active) ?? NAV[0]

  return (
    <div className="fish-demo-stack" style={{ maxWidth: '34rem' }}>
      <div style={FRAME}>
        <SidebarProvider
          embedded
          defaultOpen
          className="h-full min-h-0"
          style={{ '--sidebar-width': '13rem', minHeight: 0 } as CSSProperties}
        >
          <Sidebar collapsible="icon" style={{ height: 320 }}>
            <SidebarHeader>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0 0.25rem',
                  overflow: 'hidden',
                }}
              >
                <Boxes size={18} style={{ flexShrink: 0 }} />
                <div style={BRAND_TEXT}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Acme Ops</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
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
                    {NAV.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={active === item.id}
                          tooltip={item.label}
                          onClick={() => setActive(item.id)}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0 0.25rem',
                  overflow: 'hidden',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 24,
                    height: 24,
                    flexShrink: 0,
                    borderRadius: '999px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    background: 'var(--muted)',
                  }}
                >
                  KJ
                </span>
                <span style={{ ...BRAND_TEXT, fontSize: '0.7rem' }}>katherine@acme.dev</span>
              </div>
            </SidebarFooter>
          </Sidebar>
          <div
            style={{
              display: 'flex',
              flex: 1,
              minWidth: 0,
              flexDirection: 'column',
              background: 'var(--background)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <SidebarTrigger />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{current.label}</span>
              <span className="fish-demo-muted" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                Acme Ops
              </span>
            </div>
            <div style={{ padding: '0.875rem', display: 'grid', gap: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>{current.hint}</p>
              <p className="fish-demo-muted" style={{ margin: 0 }}>
                Press the trigger to collapse the rail to 3 rem. Hover an icon to read its tooltip.
              </p>
            </div>
          </div>
        </SidebarProvider>
      </div>
      <p className="fish-demo-muted">
        The frame is 320 px tall so the fixed sidebar container stays inside the preview.
      </p>
    </div>
  )
}
