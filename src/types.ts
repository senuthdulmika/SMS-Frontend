export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type Status = "TODO" | "IN_PROGRESS" | "DONE"

export type Subtask = { id?: string; title: string; done: boolean }

export type Task = {
  id: string
  title: string
  description: string
  subject: string | null
  priority: Priority
  status: Status
  dueDate: string | null
  subtasks: Subtask[]
  tags: string[]
  estimatedMinutes: number
  spentMinutes: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TaskInput = {
  title: string
  description: string
  subject: string | null
  priority: Priority
  status: Status
  dueDate: string | null
  estimatedMinutes: number
  tags: string[]
  subtasks: Subtask[]
}

export type Subject = {
  id: string
  name: string
  code: string
  color: string
}

export type User = {
  id: string
  name: string
  email: string
  roles: string[]
  xp: number
  level: number
  levelStartXp: number
  nextLevelXp: number
  streak: number
  longestStreak: number
}

export type Badge = { id: string; name: string; desc: string; earned: boolean }

export type Overview = {
  counts: {
    total: number
    todo: number
    inProgress: number
    done: number
    overdue: number
    dueToday: number
    dueThisWeek: number
    completionRate: number
  }
  week: { day: string; completed: number; focusMinutes: number }[]
  bySubject: { subject: string | null; total: number; done: number; minutes: number }[]
  totalFocusMinutes: number
  focusSessions: number
  badges: Badge[]
}

export type TaskResponse = { data: Task; user: User | null; xpGained: number }
export type SessionResponse = { user: User | null; xpGained: number }

export type AdminOverview = {
  totals: { users: number; tasks: number; doneTasks: number; focusMinutes: number }
  users: {
    id: string
    name: string
    email: string
    roles: string[]
    xp: number
    level: number
    longestStreak: number
    tasks: number
    done: number
    createdAt: string
  }[]
}
