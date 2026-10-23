import { auditHandlers } from './audit'
import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { departmentHandlers } from './departments'
import { roleHandlers } from './roles'
import { userHandlers } from './users'

export const handlers = [
  ...authHandlers,
  ...roleHandlers,
  ...userHandlers,
  ...departmentHandlers,
  ...auditHandlers,
  ...dashboardHandlers,
]
