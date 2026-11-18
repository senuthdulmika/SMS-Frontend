import { useMemo, useState, type FormEvent } from "react"
import Icon from "../components/Icon"
import Spinner from "../components/Spinner"
import TaskCard from "../components/TaskCard"
import useData from "../hooks/useData"
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from "../lib/constants"
import { parseQuickAdd } from "../lib/quickAdd"
import { smartScore } from "../lib/score"
import { errorMessage } from "../service/api"
import type { Priority, Status, Task } from "../types"

type SortKey = "smart" | "due" | "priority" | "newest"

const SORTERS: Record<SortKey, (a: Task, b: Task) => number> = {
  smart: (a, b) => smartScore(b) - smartScore(a),
  due: (a, b) => (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity),
  priority: (a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight,
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

function Tasks() {
  const { tasks, subjects, loading, saveTask, notify } = useData()

  const [quick, setQuick] = useState("")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<Status | "ALL" | "OPEN">("OPEN")
  const [subject, setSubject] = useState("")
  const [priority, setPriority] = useState<Priority | "">("")
  const [sort, setSort] = useState<SortKey>("smart")

  const parsed = useMemo(() => parseQuickAdd(quick, subjects), [quick, subjects])

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return tasks
      .filter((t) => (status === "ALL" ? true : status === "OPEN" ? t.status !== "DONE" : t.status === status))
      .filter((t) => (subject ? t.subject === subject : true))
      .filter((t) => (priority ? t.priority === priority : true))
      .filter((t) => (needle ? t.title.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle) || t.tags.some((tag) => tag.includes(needle)) : true))
      .sort((a, b) => (a.status === "DONE" ? 1 : 0) - (b.status === "DONE" ? 1 : 0) || SORTERS[sort](a, b))
  }, [tasks, status, subject, priority, q, sort])

  const counts = useMemo(
    () => ({
      ALL: tasks.length,
      OPEN: tasks.filter((t) => t.status !== "DONE").length,
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      DONE: tasks.filter((t) => t.status === "DONE").length
    }),
    [tasks]
  )

  const handleQuickAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!parsed.title) return notify("Add a title first", "error")
    try {
      await saveTask({
        title: parsed.title,
        priority: parsed.priority ?? "MEDIUM",
        subject: parsed.subjectId ?? null,
        dueDate: parsed.dueDate ?? null,
        tags: parsed.tags
      })
      setQuick("")
      notify("Task added")
    } catch (err) {
      notify(errorMessage(err, "Could not add task"), "error")
    }
  }

  if (loading) return <Spinner />

  const tabs: { key: Status | "ALL" | "OPEN"; label: string }[] = [
    { key: "OPEN", label: "Open" },
    ...STATUSES.map((s) => ({ key: s, label: STATUS_META[s].label })),
    { key: "ALL", label: "All" }
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="heading text-3xl font-bold">Tasks</h1>
        <p className="text-sm text-ink-300">Everything on your plate, ranked by what matters most.</p>
      </div>

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} className="card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon name="sparkles" size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-crimson-400" />
            <input className="input !pl-10" placeholder='Quick add — try "Lab report fri 5pm !high #lab @cs"' value={quick} onChange={(e) => setQuick(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">
            <Icon name="plus" size={16} /> Add
          </button>
        </div>
        {quick && parsed.chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-400">Detected:</span>
            {parsed.chips.map((c) => (
              <span key={c} className="chip !border-crimson-700/60 !text-crimson-300">
                {c}
              </span>
            ))}
          </div>
        )}
        {!quick && <p className="mt-2 text-xs text-ink-400">Shortcuts: <b className="text-ink-300">!high</b> priority · <b className="text-ink-300">#tag</b> · <b className="text-ink-300">@subject</b> · <b className="text-ink-300">today / tomorrow / mon / 3d / 5pm</b></p>}
      </form>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-ink-700 bg-ink-900 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${status === t.key ? "bg-crimson-600 text-white shadow-[0_4px_16px_-6px_rgba(239,43,61,0.8)]" : "text-ink-300 hover:text-white"}`}
            >
              {t.label}
              <span className={`text-xs ${status === t.key ? "text-white/80" : "text-ink-400"}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Icon name="search" size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-400" />
            <input className="input !w-44 !py-2 !pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input !w-auto !py-2" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select className="input !w-auto !py-2" value={priority} onChange={(e) => setPriority(e.target.value as Priority | "")}>
            <option value="">Any priority</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
          <select className="input !w-auto !py-2" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="smart">Sort: Smart</option>
            <option value="due">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson-900/40 text-crimson-400">
            <Icon name="tasks" size={26} />
          </div>
          <p className="heading mt-4 text-lg font-semibold">No tasks here</p>
          <p className="mt-1 text-sm text-ink-300">{tasks.length === 0 ? "Use quick add above to create your first task." : "Try changing your filters."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Tasks
