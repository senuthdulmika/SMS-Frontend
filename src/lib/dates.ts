import type { Task } from "../types"

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const pad = (n: number) => String(n).padStart(2, "0")

// Local yyyy-mm-dd
export const toDayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const toLocalInput = (iso: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  return `${toDayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null)

export type DueState = "none" | "overdue" | "today" | "soon" | "later"

export const dueState = (task: Pick<Task, "dueDate" | "status">, now = new Date()): DueState => {
  if (!task.dueDate || task.status === "DONE") return "none"
  const due = new Date(task.dueDate)
  if (due.getTime() < now.getTime()) return "overdue"
  if (sameDay(due, now)) return "today"
  if (due.getTime() < addDays(now, 3).getTime()) return "soon"
  return "later"
}

const time = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

export const formatDue = (iso: string | null, now = new Date()) => {
  if (!iso) return "No deadline"
  const d = new Date(iso)
  const diffDays = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (diffDays === 0) return `Today, ${time(d)}`
  if (diffDays === 1) return `Tomorrow, ${time(d)}`
  if (diffDays === -1) return `Yesterday, ${time(d)}`
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })
}

export const timeLeft = (iso: string | null, now = new Date()) => {
  if (!iso) return ""
  const ms = new Date(iso).getTime() - now.getTime()
  const abs = Math.abs(ms)
  const h = Math.floor(abs / 3_600_000)
  const label = h < 1 ? `${Math.max(1, Math.round(abs / 60_000))}m` : h < 48 ? `${h}h` : `${Math.floor(h / 24)}d`
  return ms < 0 ? `${label} overdue` : `${label} left`
}

export const fmtMinutes = (m: number) => {
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}

export const shortDay = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString([], { weekday: "short" })
