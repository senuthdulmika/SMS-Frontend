import type { Task } from "../types"
import { PRIORITY_META } from "./constants"

// SMART PRIORITY: combines how important a task is with how close its deadline is.
// Higher score = do it sooner. Powers the "Focus Now" picks and the "Smart" sort.
export const smartScore = (task: Task, now = new Date()): number => {
  if (task.status === "DONE") return -1

  const importance = PRIORITY_META[task.priority].weight * 12

  let urgency = 0
  if (task.dueDate) {
    const hours = (new Date(task.dueDate).getTime() - now.getTime()) / 3_600_000
    if (hours < 0) urgency = 60 + Math.min(40, Math.abs(hours) / 6)
    else if (hours < 24) urgency = 50
    else if (hours < 72) urgency = 35
    else if (hours < 168) urgency = 20
    else urgency = 8
  }

  const momentum = task.status === "IN_PROGRESS" ? 6 : 0
  return Math.round(importance + urgency + momentum)
}

export const scoreReason = (task: Task, now = new Date()): string => {
  if (task.dueDate) {
    const hours = (new Date(task.dueDate).getTime() - now.getTime()) / 3_600_000
    if (hours < 0) return "Overdue"
    if (hours < 24) return "Due within 24h"
    if (hours < 72) return "Due soon"
  }
  if (task.priority === "URGENT" || task.priority === "HIGH") return `${PRIORITY_META[task.priority].label} priority`
  if (task.status === "IN_PROGRESS") return "Already in progress"
  return "Up next"
}
