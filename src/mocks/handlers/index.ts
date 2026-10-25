import { auditHandlers } from './audit'
import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { departmentHandlers } from './departments'
import { fileHandlers } from './files'
import { integrationHandlers } from './integrations'
import { notificationHandlers } from './notifications'
import { projectHandlers } from './projects'
import { reportHandlers } from './reports'
import { roleHandlers } from './roles'
import { userHandlers } from './users'

export const handlers = [
  ...authHandlers,
  ...roleHandlers,
  ...userHandlers,
  ...departmentHandlers,
  ...projectHandlers,
  ...reportHandlers,
  ...fileHandlers,
  ...notificationHandlers,
  ...integrationHandlers,
  ...auditHandlers,
  ...dashboardHandlers,
]
