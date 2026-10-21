import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { roleHandlers } from './roles'
import { userHandlers } from './users'

export const handlers = [...authHandlers, ...roleHandlers, ...userHandlers, ...dashboardHandlers]
