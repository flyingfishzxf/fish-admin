export type UserStatus = 'active' | 'invited' | 'inactive'

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
  userCount: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  roleId: string
  roleName: string
  status: UserStatus
  department: string
  bio?: string
  emailVerified: boolean
  createdAt: string
  lastActiveAt: string
  deletedAt?: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  roleId: string
  roleName: string
  permissions: string[]
  emailVerified: boolean
  twoFactorEnabled: boolean
}

export interface AuthSession {
  id: string
  browser: string
  os: string
  ip: string
  createdAt: string
  lastActiveAt: string
  expiresAt: string
  current: boolean
}

export interface InvitePreview {
  email: string
  name?: string
  roleName: string
  invitedByName: string
  expiresAt: string
}

export interface RoleOption {
  id: string
  name: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export interface UserInput {
  name: string
  email: string
  roleId: string
  status: UserStatus
  department: string
}

export interface ProfileInput {
  name: string
  bio?: string
  avatar?: string | null
}

export type DashboardRange = 7 | 30

export interface DashboardKpi {
  id: 'revenue' | 'activeUsers' | 'signups' | 'conversion'
  value: number
  change: number
}

export interface RevenuePoint {
  date: string
  value: number
}

export interface TrafficPoint {
  date: string
  visits: number
  signups: number
}

export interface ChannelPoint {
  name: string
  value: number
}

export type ActivityAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.restored'
  | 'role.updated'
  | 'auth.login'
  | 'profile.updated'

export interface ActivityItem {
  id: string
  action: ActivityAction
  actorName: string
  target: string
  createdAt: string
}

export interface DashboardData {
  range: DashboardRange
  kpis: DashboardKpi[]
  revenue: RevenuePoint[]
  traffic: TrafficPoint[]
  channels: ChannelPoint[]
  activity: ActivityItem[]
}
