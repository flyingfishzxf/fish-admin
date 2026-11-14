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
      path: '/register',
      name: 'register',
      component: () => import('./features/auth/RegisterPage.vue'),
      meta: { public: true, authEntry: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('./features/auth/VerifyEmailPage.vue'),
      meta: { public: true, authEntry: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('./features/auth/ForgotPasswordPage.vue'),
      meta: { public: true, authEntry: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('./features/auth/ResetPasswordPage.vue'),
      meta: { public: true, authEntry: true },
    },
    {
      path: '/accept-invite',
      name: 'accept-invite',
      component: () => import('./features/auth/AcceptInvitePage.vue'),
      meta: { public: true, authEntry: true },
    },
    {
      path: '/otp',
      name: 'otp',
      component: () => import('./features/auth/OtpPage.vue'),
      meta: { public: true, authEntry: true },
    },
    // Full-page status states sit outside the shell: they are reached from a
    // failed navigation and must render even when the workspace chrome cannot.
    {
      path: '/401',
      name: 'unauthorized',
      component: () => import('./pages/UnauthorizedPage.vue'),
      meta: { public: true },
    },
    {
      path: '/500',
      name: 'server-error',
      component: () => import('./pages/ServerErrorPage.vue'),
      meta: { public: true },
    },
    {
      path: '/503',
      name: 'service-unavailable',
      component: () => import('./pages/ServiceUnavailablePage.vue'),
      meta: { public: true },
    },
    {
      path: '/maintenance',
      name: 'maintenance',
      component: () => import('./pages/MaintenancePage.vue'),
      meta: { public: true },
    },
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
        {
          // Account pages need a session but no permission: every signed-in role
          // can read and edit its own profile.
          path: 'profile',
          name: 'profile',
          component: () => import('./features/profile/ProfilePage.vue'),
        },
        {
          path: 'security',
          name: 'security',
          component: () => import('./features/security/SecurityPage.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('./features/settings/SettingsPage.vue'),
        },
        {
          // The inbox is personal, not administrative: every signed-in role has
          // notifications, so this route deliberately carries no permission.
          path: 'notifications',
          name: 'notifications',
          component: () => import('./features/notifications/NotificationsPage.vue'),
        },
        { path: 'users', name: 'users', component: UsersPage, meta: { permission: 'user:read' } },
        {
          // A detail is a drill-down, not a nav item: it sits under the same
          // permission as the list and does not join the sidebar contract.
          path: 'users/:id',
          name: 'user-detail',
          component: () => import('./features/users/UserDetailPage.vue'),
          meta: { permission: 'user:read' },
        },
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
  // Registration, password reset and the OTP step have nothing to offer a
  // signed-in user, so an old bookmark must not strand them there.
  if (to.meta.authEntry === true && auth.status === 'authenticated') {
    return { path: '/' }
  }
  const permission = to.meta.permission as string | undefined
  if (permission && !hasPermission(auth.user?.permissions, permission)) {
    return { name: 'forbidden' }
  }
  return true
})
