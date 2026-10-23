import type { DashboardData, DashboardRange } from '@/types'

import { recentActivity } from './db/store'
import type { MockDb } from './db/types'

const CHANNEL_KEYS = ['direct', 'organic', 'referral', 'social', 'email'] as const

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function changeFor(random: () => number, base: number) {
  return Math.round((base + (random() - 0.5) * 6) * 10) / 10
}

export function buildDashboard(db: MockDb, range: DashboardRange): DashboardData {
  const random = createRandom(2026 + range)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Array.from({ length: range }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (range - 1 - index))
    return toIsoDate(date)
  })

  const revenue = days.map((date, index) => ({
    date,
    value: Math.round(3800 + index * 55 + Math.sin(index / 2.4) * 520 + random() * 480),
  }))

  const traffic = days.map((date, index) => ({
    date,
    visits: Math.round(1200 + index * 18 + Math.sin(index / 3) * 180 + random() * 140),
    signups: Math.round(60 + index * 0.8 + Math.cos(index / 2.6) * 18 + random() * 14),
  }))

  const weights = [38, 26, 17, 12, 7].map((weight) => weight + random() * 4)
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)

  const totalRevenue = revenue.reduce((sum, point) => sum + point.value, 0)
  const totalVisits = traffic.reduce((sum, point) => sum + point.visits, 0)
  const totalSignups = traffic.reduce((sum, point) => sum + point.signups, 0)

  return {
    range,
    kpis: [
      { id: 'revenue', value: totalRevenue, change: changeFor(random, 12.4) },
      {
        id: 'activeUsers',
        value: Math.round(1320 + random() * 320),
        change: changeFor(random, 8.1),
      },
      { id: 'signups', value: totalSignups, change: changeFor(random, -3.2) },
      {
        id: 'conversion',
        value: Math.round((totalSignups / totalVisits) * 1000) / 10,
        change: changeFor(random, 0.8),
      },
    ],
    revenue,
    traffic,
    channels: CHANNEL_KEYS.map((name, index) => ({
      name,
      value: Math.round((weights[index] / weightTotal) * 1000) / 10,
    })),
    activity: recentActivity(db, 8),
  }
}
