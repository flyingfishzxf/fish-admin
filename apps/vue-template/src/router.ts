import { defineComponent, h } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'

import AppShell from './components/layout/AppShell.vue'
import LoginPage from './features/auth/LoginPage.vue'
import DashboardPage from './features/dashboard/DashboardPage.vue'
import UsersPage from './features/users/UsersPage.vue'
import { sanitizeRedirect } from './lib/auth-redirect'
import { hasPermission } from './lib/permissions'
import ForbiddenPage from './pages/ForbiddenPage.vue'
import NotFoundPage from './pages/NotFoundPage.vue'
import { useAuthStore } from './stores/auth'

// `AppShell` renders its default slot, so the layout route feeds the matched
// child into the chrome instead of nesting another wrapper component.
const ShellLayout = defineComponent({
  name: 'ShellLayout',
  setup: () => () => h(AppShell, null, { default: () => h(RouterView) }),
})

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    {
      path: '/',
      component: ShellLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardPage,
          meta: { permission: 'dashboard:read' },
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('./features/reports/ReportsPage.vue'),
          meta: { permission: 'report:read' },
        },
        {
          path: 'departments',
          name: 'departments',
          component: () => import('./features/departments/DepartmentsPage.vue'),
          meta: { permission: 'department:read' },
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('./features/roles/RolesPage.vue'),
          meta: { permission: 'role:read' },
        },
        {
          path: 'roles/matrix',
          name: 'roles-matrix',
          component: () => import('./features/roles/RoleMatrixPage.vue'),
          meta: { permission: 'role:read' },
        },
        {
          path: 'permissions',
          name: 'permissions',
          component: () => import('./features/permissions/PermissionsPage.vue'),
          meta: { permission: 'permission:read' },
        },
        {
          path: 'dictionaries',
          name: 'dictionaries',
          component: () => import('./features/dictionaries/DictionariesPage.vue'),
          meta: { permission: 'dictionary:read' },
        },
        {
          // The nav contract names this path `/audit-logs`, so the route has to
          // match it or the sidebar entry would never resolve.
          path: 'audit-logs',
          name: 'audit-logs',
          component: () => import('./features/audit/AuditLogsPage.vue'),
          meta: { permission: 'audit:read' },
        },
        {
          path: 'integrations',
          name: 'integrations',
          component: () => import('./features/integrations/IntegrationsPage.vue'),
          meta: { permission: 'integration:read' },
        },
        { path: 'users', name: 'users', component: UsersPage, meta: { permission: 'user:read' } },
        { path: '403', name: 'forbidden', component: ForbiddenPage },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.status === 'idle') await auth.bootstrap()

  if (to.meta.public !== true && auth.status !== 'authenticated') {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.status === 'authenticated') {
    return { path: sanitizeRedirect(to.query.redirect) ?? '/' }
  }
  const permission = to.meta.permission as string | undefined
  if (permission && !hasPermission(auth.user?.permissions, permission)) {
    return { name: 'forbidden' }
  }
  return true
})
