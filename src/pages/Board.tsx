import { useMemo, useState, type DragEvent } from "react"
import Icon from "../components/Icon"
import Spinner from "../components/Spinner"
import TaskCard from "../components/TaskCard"
import useData from "../hooks/useData"
import { STATUSES, STATUS_META } from "../lib/constants"
import { smartScore } from "../lib/score"
import type { Status } from "../types"

function Board() {
  const { tasks, loading, moveTask, openEditor } = useData()
  const [over, setOver] = useState<Status | null>(null)

  const columns = useMemo(
    () =>
      STATUSES.map((status) => ({
        status,
        items: tasks
          .filter((t) => t.status === status)
          .sort((a, b) => (status === "DONE" ? new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime() : smartScore(b) - smartScore(a)))
      })),
    [tasks]
  )

  if (loading) return <Spinner />

  const onDrop = (e: DragEvent<HTMLDivElement>, status: Status) => {
    e.preventDefault()
    setOver(null)
    const id = e.dataTransfer.getData("text/plain")
    const task = tasks.find((t) => t.id === id)
    if (task && task.status !== status) moveTask(id, status)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="heading text-3xl font-bold">Board</h1>
        <p className="text-sm text-ink-300">Drag cards between columns (or tap the arrow on a card). Finishing a task earns XP.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map(({ status, items }) => (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(status)
            }}
            onDragLeave={() => setOver((cur) => (cur === status ? null : cur))}
            onDrop={(e) => onDrop(e, status)}
            className={`flex min-h-64 flex-col rounded-2xl border bg-ink-900/60 p-3 transition ${over === status ? "border-crimson-500 bg-crimson-900/10 shadow-[0_0_0_3px_rgba(239,43,61,0.15)]" : "border-ink-700"}`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${status === "TODO" ? "bg-ink-300" : status === "IN_PROGRESS" ? "bg-crimson-400 shadow-[0_0_10px_rgba(255,77,94,0.9)]" : "bg-crimson-700"}`} />
                <h2 className="heading font-semibold">{STATUS_META[status].label}</h2>
                <span className="chip">{items.length}</span>
              </div>
              {status !== "DONE" && (
                <button className="btn btn-ghost btn-icon !p-1.5" aria-label={`Add task to ${STATUS_META[status].label}`} onClick={() => openEditor(null, { status })}>
                  <Icon name="plus" size={15} />
                </button>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2.5">
              {items.map((t) => (
                <TaskCard key={t.id} task={t} draggable compact showAdvance />
              ))}
              {items.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-ink-700 py-10 text-xs text-ink-400">Drop tasks here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Board
