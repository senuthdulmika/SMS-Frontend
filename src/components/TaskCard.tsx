import type { DragEvent } from "react"
import Icon from "./Icon"
import { PriorityBadge, SubjectTag } from "./Badges"
import useData from "../hooks/useData"
import { NEXT_STATUS } from "../lib/constants"
import { dueState, formatDue, fmtMinutes } from "../lib/dates"
import type { Task } from "../types"

type TaskCardProps = {
  task: Task
  draggable?: boolean
  compact?: boolean
  showAdvance?: boolean
}

const dueColor = {
  none: "text-ink-300",
  overdue: "text-crimson-400",
  today: "text-crimson-300",
  soon: "text-rose-200",
  later: "text-ink-300"
} as const

const TaskCard = ({ task, draggable = false, compact = false, showAdvance = false }: TaskCardProps) => {
  const { subjects, moveTask, openEditor } = useData()
  const subject = subjects.find((s) => s.id === task.subject)
  const done = task.status === "DONE"
  const state = dueState(task)
  const subtasksDone = task.subtasks.filter((s) => s.done).length

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", task.id)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onClick={() => openEditor(task)}
      className={`card card-hover group relative flex cursor-pointer gap-3 p-3.5 ${draggable ? "active:cursor-grabbing" : ""} ${
        done ? "opacity-60" : ""
      }`}
    >
      {/* priority edge */}
      <span
        className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${
          task.priority === "URGENT" ? "bg-crimson-500" : task.priority === "HIGH" ? "bg-crimson-700" : "bg-transparent"
        }`}
      />

      <button
        aria-label={done ? "Mark as to do" : "Mark as done"}
        onClick={(e) => {
          e.stopPropagation()
          moveTask(task.id, done ? "TODO" : "DONE")
        }}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          done
            ? "border-crimson-500 bg-crimson-500 text-white"
            : "border-ink-500 text-transparent hover:border-crimson-400 hover:text-crimson-400"
        }`}
      >
        <Icon name="check" size={13} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-snug ${done ? "line-through decoration-ink-400" : ""}`}>{task.title}</p>
          {showAdvance && !done && (
            <button
              aria-label="Advance status"
              title="Move to next column"
              onClick={(e) => {
                e.stopPropagation()
                moveTask(task.id, NEXT_STATUS[task.status])
              }}
              className="rounded-md p-1 text-ink-300 transition hover:bg-ink-700 hover:text-white"
            >
              <Icon name="arrow" size={14} />
            </button>
          )}
        </div>

        {!compact && task.description && <p className="mt-1 line-clamp-2 text-xs text-ink-300">{task.description}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <PriorityBadge priority={task.priority} />
          <SubjectTag subject={subject} />
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${dueColor[state]}`}>
              <Icon name={state === "overdue" ? "alert" : "clock"} size={12} />
              {formatDue(task.dueDate)}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <span className="text-xs text-ink-300">
              ☑ {subtasksDone}/{task.subtasks.length}
            </span>
          )}
          {task.spentMinutes > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-300">
              <Icon name="timer" size={12} />
              {fmtMinutes(task.spentMinutes)}
            </span>
          )}
        </div>

        {!compact && task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {task.tags.map((t) => (
              <span key={t} className="text-[0.7rem] text-ink-400">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard
