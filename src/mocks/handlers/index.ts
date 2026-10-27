import { auditHandlers } from './audit'
import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { departmentHandlers } from './departments'
import { dictionaryHandlers } from './dictionaries'
import { fileHandlers } from './files'
import { integrationHandlers } from './integrations'
import { navigationHandlers } from './navigation'
import { notificationHandlers } from './notifications'
import { projectHandlers } from './projects'
import { reportHandlers } from './reports'
import { roleHandlers } from './roles'
import { userHandlers } from './users'
import { workflowHandlers } from './workflows'

export const handlers = [
  ...authHandlers,
  ...navigationHandlers,
  ...roleHandlers,
  ...userHandlers,
  ...departmentHandlers,
  ...dictionaryHandlers,
  ...projectHandlers,
  ...workflowHandlers,
  ...reportHandlers,
  ...fileHandlers,
  ...notificationHandlers,
  ...integrationHandlers,
  ...auditHandlers,
  ...dashboardHandlers,
]
