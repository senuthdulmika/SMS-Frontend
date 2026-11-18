import { useMemo, useState } from "react"
import Icon from "../components/Icon"
import Spinner from "../components/Spinner"
import { PriorityBadge } from "../components/Badges"
import useData from "../hooks/useData"
import { addDays, sameDay, startOfDay, toDayKey, formatDue } from "../lib/dates"
import type { Task } from "../types"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function CalendarPage() {
  const { tasks, subjects, loading, openEditor } = useData()
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selected, setSelected] = useState(() => startOfDay(new Date()))

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.dueDate) continue
      const key = toDayKey(new Date(t.dueDate))
      map.set(key, [...(map.get(key) ?? []), t])
    }
    return map
  }, [tasks])

  // 6 weeks grid starting on Sunday
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = addDays(first, -first.getDay())
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [cursor])

  if (loading) return <Spinner />

  const today = new Date()
  const selectedTasks = (byDay.get(toDayKey(selected)) ?? []).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
  const subjectColor = (t: Task) => subjects.find((s) => s.id === t.subject)?.color ?? "#6b6b78"

  const addOnSelected = () => {
    const d = new Date(selected)
    d.setHours(18, 0, 0, 0)
    openEditor(null, { dueDate: d.toISOString() })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading text-3xl font-bold">Calendar</h1>
          <p className="text-sm text-ink-300">See every deadline at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-icon" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <Icon name="left" size={16} />
          </button>
          <span className="heading w-40 text-center text-lg font-semibold">{cursor.toLocaleDateString([], { month: "long", year: "numeric" })}</span>
          <button className="btn btn-ghost btn-icon" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <Icon name="right" size={16} />
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
              setSelected(startOfDay(today))
            }}
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-ink-700 bg-ink-900/60">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2.5 text-center text-[0.7rem] font-semibold tracking-wider text-ink-400 uppercase">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day) => {
              const items = byDay.get(toDayKey(day)) ?? []
              const inMonth = day.getMonth() === cursor.getMonth()
              const isToday = sameDay(day, today)
              const isSel = sameDay(day, selected)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(startOfDay(day))}
                  className={`flex min-h-20 flex-col gap-1 border-r border-b border-ink-800 p-1.5 text-left transition hover:bg-ink-800/70 sm:min-h-28 ${inMonth ? "" : "opacity-35"} ${isSel ? "bg-crimson-900/20 !shadow-[inset_0_0_0_1.5px_var(--color-crimson-500)]" : ""}`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-crimson-600 text-white" : "text-ink-200"}`}>{day.getDate()}</span>
                  <div className="flex flex-col gap-1">
                    {items.slice(0, 2).map((t) => (
                      <span
                        key={t.id}
                        className={`hidden truncate rounded border-l-2 bg-ink-800 px-1.5 py-0.5 text-[0.65rem] sm:block ${t.status === "DONE" ? "text-ink-400 line-through" : "text-ink-100"}`}
                        style={{ borderColor: subjectColor(t) }}
                      >
                        {t.title}
                      </span>
                    ))}
                    {items.length > 0 && (
                      <span className="flex gap-0.5 sm:hidden">
                        {items.slice(0, 4).map((t) => (
                          <span key={t.id} className="h-1.5 w-1.5 rounded-full" style={{ background: subjectColor(t) }} />
                        ))}
                      </span>
                    )}
                    {items.length > 2 && <span className="hidden text-[0.65rem] text-ink-400 sm:block">+{items.length - 2} more</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* selected day */}
        <aside className="card h-fit p-5">
          <p className="text-xs tracking-wider text-ink-400 uppercase">{selected.toLocaleDateString([], { weekday: "long" })}</p>
          <h2 className="heading text-2xl font-bold">{selected.toLocaleDateString([], { day: "numeric", month: "long" })}</h2>

          <div className="mt-4 flex flex-col gap-2.5">
            {selectedTasks.length === 0 && <p className="py-6 text-center text-sm text-ink-300">Nothing due this day.</p>}
            {selectedTasks.map((t) => (
              <button key={t.id} onClick={() => openEditor(t)} className="rounded-xl border border-ink-700 bg-ink-900 p-3 text-left transition hover:border-crimson-700">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: subjectColor(t) }} />
                  <p className={`flex-1 truncate text-sm font-semibold ${t.status === "DONE" ? "text-ink-400 line-through" : ""}`}>{t.title}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <PriorityBadge priority={t.priority} />
                  <span className="text-xs text-ink-400">{formatDue(t.dueDate)}</span>
                </div>
              </button>
            ))}
          </div>

          <button className="btn btn-primary mt-4 w-full" onClick={addOnSelected}>
            <Icon name="plus" size={16} /> Add task on this day
          </button>
        </aside>
      </div>
    </div>
  )
}

export default CalendarPage
