import { useMemo, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import Icon, { type IconName } from "../components/Icon"
import Ring from "../components/Ring"
import Spinner from "../components/Spinner"
import { PriorityBadge, SubjectTag } from "../components/Badges"
import useAuth from "../hooks/useAuth"
import useData from "../hooks/useData"
import { fmtMinutes, formatDue, shortDay, timeLeft } from "../lib/dates"
import { smartScore, scoreReason } from "../lib/score"

const StatCard = ({ icon, label, value, hint, accent = false }: { icon: IconName; label: string; value: ReactNode; hint?: string; accent?: boolean }) => (
  <div className={`card p-4 ${accent ? "border-crimson-700/70 shadow-[0_10px_40px_-20px_rgba(239,43,61,0.6)]" : ""}`}>
    <div className="flex items-center justify-between">
      <span className="label !mb-0">{label}</span>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? "bg-crimson-500/20 text-crimson-400" : "bg-ink-800 text-ink-300"}`}>
        <Icon name={icon} size={16} />
      </span>
    </div>
    <p className="heading mt-3 text-3xl font-bold">{value}</p>
    {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
  </div>
)

const MiniBars = ({ title, data, format }: { title: string; data: { key: string; value: number }[]; format?: (n: number) => string }) => {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div>
      <p className="label">{title}</p>
      <div className="flex h-32 items-end gap-2">
        {data.map((d, i) => {
          const last = i === data.length - 1
          return (
            <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[0.65rem] text-ink-300">{d.value > 0 ? (format ? format(d.value) : d.value) : ""}</span>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${last ? "bg-linear-to-t from-crimson-700 to-crimson-400 shadow-[0_0_16px_rgba(239,43,61,0.5)]" : "bg-ink-600"}`}
                style={{ height: `${Math.max(d.value > 0 ? 8 : 3, (d.value / max) * 80)}%` }}
              />
              <span className={`text-[0.65rem] ${last ? "font-semibold text-white" : "text-ink-400"}`}>{shortDay(d.key)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const greeting = () => {
  const h = new Date().getHours()
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
}

function Dashboard() {
  const { user } = useAuth()
  const { tasks, subjects, overview, loading, openEditor } = useData()
  const navigate = useNavigate()

  const focusNow = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "DONE")
        .map((t) => ({ task: t, score: smartScore(t) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    [tasks]
  )

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "DONE" && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5),
    [tasks]
  )

  if (loading || !overview || !user) return <Spinner />

  const c = overview.counts
  const todayFocus = overview.week[overview.week.length - 1]?.focusMinutes ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink-300">{new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="heading text-3xl font-bold sm:text-4xl">
            {greeting()}, <span className="text-gradient">{user.name.split(" ")[0]}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip !border-crimson-700/60 !text-crimson-300">
            <Icon name="flame" size={13} /> {user.streak} day streak
          </span>
          <span className="chip">
            <Icon name="zap" size={13} className="text-crimson-400" /> {user.xp} XP
          </span>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="clock" label="Due today" value={c.dueToday} hint={`${c.dueThisWeek} due this week`} accent={c.dueToday > 0} />
        <StatCard icon="alert" label="Overdue" value={c.overdue} hint={c.overdue ? "Needs attention" : "All caught up"} accent={c.overdue > 0} />
        <StatCard icon="timer" label="Focus today" value={fmtMinutes(todayFocus)} hint={`${fmtMinutes(overview.totalFocusMinutes)} all time`} />
        <div className="card flex items-center gap-4 p-4">
          <Ring value={c.completionRate / 100} size={74} stroke={7}>
            <span className="heading text-lg font-bold">{c.completionRate}%</span>
          </Ring>
          <div>
            <p className="label !mb-1">Completed</p>
            <p className="text-sm text-ink-200">
              {c.done} of {c.total} tasks
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Focus Now */}
        <section className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="heading text-lg font-semibold">Focus Now</h2>
              <p className="text-xs text-ink-400">Smart-ranked by deadline and priority</p>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-crimson-400 hover:underline">
              All tasks →
            </Link>
          </div>

          {focusNow.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-600 py-10 text-center">
              <p className="font-semibold">Nothing pending 🎉</p>
              <p className="mt-1 text-sm text-ink-300">Add a task to get a personalised plan.</p>
              <button className="btn btn-primary mt-4" onClick={() => openEditor()}>
                <Icon name="plus" size={15} /> New task
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {focusNow.map(({ task, score }, i) => (
                <div key={task.id} className={`flex items-center gap-4 rounded-xl border p-3.5 ${i === 0 ? "border-crimson-700/70 bg-crimson-900/15" : "border-ink-700 bg-ink-900"}`}>
                  <div className={`heading flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${i === 0 ? "bg-crimson-600 text-white" : "bg-ink-700 text-ink-200"}`}>{i + 1}</div>
                  <button className="min-w-0 flex-1 text-left" onClick={() => openEditor(task)}>
                    <p className="truncate text-sm font-semibold">{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <PriorityBadge priority={task.priority} />
                      <SubjectTag subject={subjects.find((s) => s.id === task.subject)} />
                      <span className="text-xs text-ink-300">{task.dueDate ? timeLeft(task.dueDate) : scoreReason(task)}</span>
                    </div>
                  </button>
                  <div className="hidden text-right sm:block">
                    <p className="text-[0.65rem] uppercase tracking-wide text-ink-400">{scoreReason(task)}</p>
                    <p className="text-xs text-ink-300">score {score}</p>
                  </div>
                  <button className="btn btn-primary btn-icon" title="Start a focus session" onClick={() => navigate(`/focus?task=${task.id}`)}>
                    <Icon name="play" size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming */}
        <section className="card p-5">
          <h2 className="heading mb-4 text-lg font-semibold">Upcoming deadlines</h2>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-300">No deadlines on the horizon.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((t) => {
                const s = subjects.find((x) => x.id === t.subject)
                return (
                  <li key={t.id}>
                    <button onClick={() => openEditor(t)} className="flex w-full items-center gap-3 text-left">
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: s?.color ?? "var(--color-ink-500)" }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-ink-400">{formatDue(t.dueDate)}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly */}
        <section className="card p-5 lg:col-span-2">
          <h2 className="heading mb-4 text-lg font-semibold">Your week</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <MiniBars title="Tasks completed" data={overview.week.map((d) => ({ key: d.day, value: d.completed }))} />
            <MiniBars title="Focus minutes" data={overview.week.map((d) => ({ key: d.day, value: d.focusMinutes }))} format={(n) => `${n}m`} />
          </div>
        </section>

        {/* Subjects */}
        <section className="card p-5">
          <h2 className="heading mb-4 text-lg font-semibold">By subject</h2>
          {overview.bySubject.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-300">Create subjects to see progress.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {overview.bySubject.map((row) => {
                const s = subjects.find((x) => x.id === row.subject)
                const pct = row.total ? Math.round((row.done / row.total) * 100) : 0
                return (
                  <div key={row.subject ?? "none"}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="h-2 w-2 rounded-full" style={{ background: s?.color ?? "var(--color-ink-400)" }} />
                        {s?.name ?? "No subject"}
                      </span>
                      <span className="text-ink-300">
                        {row.done}/{row.total}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s?.color ?? "var(--color-ink-400)" }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Badges */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading text-lg font-semibold">Achievements</h2>
          <span className="text-xs text-ink-400">
            {overview.badges.filter((b) => b.earned).length} / {overview.badges.length} unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {overview.badges.map((b) => (
            <div key={b.id} title={b.desc} className={`rounded-xl border p-3 text-center transition ${b.earned ? "border-crimson-600/70 bg-crimson-900/20 shadow-[0_8px_30px_-14px_rgba(239,43,61,0.7)]" : "border-ink-700 bg-ink-900 opacity-50"}`}>
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${b.earned ? "bg-crimson-600 text-white" : "bg-ink-700 text-ink-400"}`}>
                <Icon name={b.earned ? "trophy" : "lock"} size={18} />
              </div>
              <p className="mt-2 text-sm font-semibold">{b.name}</p>
              <p className="mt-0.5 text-[0.7rem] leading-tight text-ink-300">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
