import type { Priority, Status } from "../types"

export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"]
export const STATUSES: Status[] = ["TODO", "IN_PROGRESS", "DONE"]

export const PRIORITY_META: Record<
  Priority,
  { label: string; cls: string; dot: string; weight: number }
> = {
  LOW: {
    label: "Low",
    cls: "text-ink-200 bg-ink-700/60 border-ink-600",
    dot: "bg-ink-300",
    weight: 1
  },
  MEDIUM: {
    label: "Medium",
    cls: "text-rose-200 bg-rose-400/10 border-rose-300/25",
    dot: "bg-rose-300",
    weight: 2
  },
  HIGH: {
    label: "High",
    cls: "text-crimson-300 bg-crimson-500/15 border-crimson-500/40",
    dot: "bg-crimson-400",
    weight: 3
  },
  URGENT: {
    label: "Urgent",
    cls: "text-white bg-crimson-600 border-crimson-400",
    dot: "bg-white",
    weight: 4
  }
}

export const STATUS_META: Record<Status, { label: string }> = {
  TODO: { label: "To Do" },
  IN_PROGRESS: { label: "In Progress" },
  DONE: { label: "Done" }
}

export const NEXT_STATUS: Record<Status, Status> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO"
}

export const SUBJECT_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#e11d48",
  "#ec4899",
  "#a855f7",
  "#3b82f6",
  "#14b8a6",
  "#22c55e",
  "#e5e5e5"
]
