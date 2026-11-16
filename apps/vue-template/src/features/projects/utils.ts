import type {
  Department,
  Project,
  ProjectBudgetItem,
  ProjectMilestone,
  ProjectTask,
  ProjectTaskStatus,
} from '@fish-admin/contracts'

export interface PortfolioSummary {
  active: number
  budget: number
  spent: number
  completion: number
  utilization: number
}

/** KPI figures come from the unfiltered overview, never from the current page. */
export function portfolioOf(projects: Project[]): PortfolioSummary {
  const budget = projects.reduce((sum, project) => sum + project.budget, 0)
  const spent = projects.reduce((sum, project) => sum + project.spent, 0)
  const completion = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0

  return {
    active: projects.filter((project) => project.status === 'active').length,
    budget,
    spent,
    completion,
    utilization: budget > 0 ? Math.round((spent / budget) * 100) : 0,
  }
}

/** Depth-first department paths, e.g. `Technology / Frontend`. */
export function flattenDepartments(departments: Department[]) {
  const options: Array<{ value: string; label: string }> = []
  const walk = (parentId: string | null, trail: string[]) => {
    for (const department of departments
      .filter((entry) => entry.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)) {
      const path = [...trail, department.name]
      options.push({ value: department.id, label: path.join(' / ') })
      walk(department.id, path)
    }
  }
  walk(null, [])
  return options
}

export interface MilestoneGroup {
  date: string
  milestones: ProjectMilestone[]
  completed: boolean
}

/**
 * Groups milestones by calendar day, earliest first. The whole day is one
 * toggle, which is what the React calendar's day cell does.
 */
export function groupMilestones(milestones: ProjectMilestone[]): MilestoneGroup[] {
  const groups = new Map<string, ProjectMilestone[]>()
  for (const milestone of milestones) {
    const key = milestone.date.slice(0, 10)
    const list = groups.get(key) ?? []
    list.push(milestone)
    groups.set(key, list)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      date,
      milestones: items,
      completed: items.every((milestone) => milestone.completed),
    }))
}

export const TASK_STATUSES: ProjectTaskStatus[] = ['todo', 'doing', 'review', 'done']

export function groupTasks(tasks: ProjectTask[]) {
  return TASK_STATUSES.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }))
}

export function taskCompletion(tasks: ProjectTask[]) {
  const done = tasks.filter((task) => task.status === 'done').length
  return {
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  }
}

export interface BudgetTotals {
  spent: number
  remaining: number
  utilization: number
}

/** Totals follow the draft rows, so editing an amount updates the cards live. */
export function budgetTotals(items: ProjectBudgetItem[], budget: number): BudgetTotals {
  const spent = items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
  return {
    spent,
    remaining: budget - spent,
    utilization: budget > 0 ? Math.round((spent / budget) * 100) : 0,
  }
}
