import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import Icon from "../components/Icon"
import Ring from "../components/Ring"
import Spinner from "../components/Spinner"
import useData from "../hooks/useData"
import { fmtMinutes } from "../lib/dates"
import { errorMessage } from "../service/api"

type Mode = "focus" | "short" | "long"

const MODES: { key: Mode; label: string }[] = [
  { key: "focus", label: "Focus" },
  { key: "short", label: "Short break" },
  { key: "long", label: "Long break" }
]

// soft "ding" using the Web Audio API (no audio file needed)
const beep = () => {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8)
    osc.start()
    osc.stop(ctx.currentTime + 0.85)
  } catch {
    // audio is optional
  }
}

const mmss = (ms: number) => {
  const total = Math.ceil(ms / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function Focus() {
  const { tasks, subjects, overview, loading, logSession, moveTask, notify } = useData()
  const [params] = useSearchParams()

  const [durations, setDurations] = useState<Record<Mode, number>>({ focus: 25, short: 5, long: 15 })
  const [mode, setMode] = useState<Mode>("focus")
  const [remaining, setRemaining] = useState(25 * 60_000)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles] = useState(0)
  const [taskId, setTaskId] = useState(() => params.get("task") ?? "")
  const endAt = useRef(0)

  const openTasks = tasks.filter((t) => t.status !== "DONE")
  const task = tasks.find((t) => t.id === taskId)
  const total = durations[mode] * 60_000
  const progress = 1 - remaining / total

  const switchMode = useCallback(
    (m: Mode, d: Record<Mode, number> = durations) => {
      setMode(m)
      setRunning(false)
      setRemaining(d[m] * 60_000)
    },
    [durations]
  )

  const record = useCallback(
    (minutes: number) => {
      logSession(minutes, taskId || null).catch((err) => notify(errorMessage(err, "Could not save session"), "error"))
    },
    [logSession, taskId, notify]
  )

  const complete = useCallback(() => {
    setRunning(false)
    beep()
    if (mode === "focus") {
      record(durations.focus)
      const next = cycles + 1
      setCycles(next)
      notify(`Focus session complete — ${durations.focus} min logged`, "info")
      switchMode(next % 4 === 0 ? "long" : "short")
    } else {
      notify("Break over — ready for another round?", "info")
      switchMode("focus")
    }
  }, [mode, durations, cycles, record, notify, switchMode])

  // wall-clock based so it stays accurate even when the tab is in the background
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const left = Math.max(0, endAt.current - Date.now())
      setRemaining(left)
      if (left <= 0) {
        clearInterval(id)
        complete()
      }
    }, 250)
    return () => clearInterval(id)
  }, [running, complete])

  useEffect(() => {
    if (running) document.title = `${mmss(remaining)} · ${mode === "focus" ? "Focus" : "Break"}`
    return () => {
      document.title = "Crimson — Student Task Manager"
    }
  }, [running, remaining, mode])

  const start = () => {
    if (mode === "focus" && task && task.status === "TODO") moveTask(task.id, "IN_PROGRESS")
    endAt.current = Date.now() + remaining
    setRunning(true)
  }
  const pause = () => {
    setRemaining(Math.max(0, endAt.current - Date.now()))
    setRunning(false)
  }
  const reset = () => {
    setRunning(false)
    setRemaining(total)
  }

  const finishEarly = () => {
    const elapsed = Math.floor((total - remaining) / 60_000)
    if (elapsed < 1) return notify("Focus for at least a minute to log a session", "error")
    record(elapsed)
    notify(`Logged ${elapsed} min`, "info")
    setRunning(false)
    setRemaining(total)
  }

  const adjust = (delta: number) => {
    const next = Math.max(1, Math.min(120, durations[mode] + delta))
    const d = { ...durations, [mode]: next }
    setDurations(d)
    switchMode(mode, d)
  }

  if (loading) return <Spinner />

  const todayMinutes = overview?.week[overview.week.length - 1]?.focusMinutes ?? 0
  const subject = subjects.find((s) => s.id === task?.subject)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="heading text-3xl font-bold">Focus Timer</h1>
        <p className="text-sm text-ink-300">Deep work in short sprints. Every 5 focused minutes earns 1 XP.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="card flex flex-col items-center gap-6 p-6 sm:p-10">
          {/* mode tabs */}
          <div className="flex gap-1 rounded-xl border border-ink-700 bg-ink-900 p-1">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => switchMode(m.key)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${mode === m.key ? "bg-crimson-600 text-white shadow-[0_4px_16px_-6px_rgba(239,43,61,0.8)]" : "text-ink-300 hover:text-white"}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <Ring value={progress} size={280} stroke={12}>
            <span className="heading text-6xl font-bold tabular-nums">{mmss(remaining)}</span>
            <span className="mt-1 text-xs tracking-[0.2em] text-ink-400 uppercase">{running ? (mode === "focus" ? "Stay locked in" : "Breathe") : "Ready"}</span>
          </Ring>

          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-icon" onClick={() => adjust(-5)} disabled={running} aria-label="Less time" title="−5 min">
              <span className="px-1 text-xs font-bold">−5</span>
            </button>
            {running ? (
              <button className="btn btn-primary px-8 py-3 text-base" onClick={pause}>
                <Icon name="pause" size={18} /> Pause
              </button>
            ) : (
              <button className="btn btn-primary px-8 py-3 text-base" onClick={start}>
                <Icon name="play" size={18} /> {remaining < total ? "Resume" : "Start"}
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={() => adjust(5)} disabled={running} aria-label="More time" title="+5 min">
              <span className="px-1 text-xs font-bold">+5</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={reset}>
              <Icon name="reset" size={15} /> Reset
            </button>
            {mode === "focus" && (
              <button className="btn btn-ghost" onClick={finishEarly}>
                <Icon name="check" size={15} /> Finish early & log
              </button>
            )}
          </div>

          <div className="flex items-center gap-2" title="4 focus sessions earn a long break">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < cycles % 4 ? "bg-crimson-500 shadow-[0_0_10px_rgba(239,43,61,0.9)]" : "bg-ink-600"}`} />
            ))}
            <span className="ml-1 text-xs text-ink-400">{cycles} session{cycles === 1 ? "" : "s"} today</span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="card p-5">
            <label className="label">Working on</label>
            <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)} disabled={running}>
              <option value="">General study (no task)</option>
              {openTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {task && (
              <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900 p-3.5">
                <p className="text-sm font-semibold">{task.title}</p>
                {subject && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-300">
                    <span className="h-2 w-2 rounded-full" style={{ background: subject.color }} />
                    {subject.name}
                  </p>
                )}
                <div className="mt-3 flex justify-between text-xs text-ink-300">
                  <span>Spent {fmtMinutes(task.spentMinutes)}</span>
                  {task.estimatedMinutes > 0 && <span>Est. {fmtMinutes(task.estimatedMinutes)}</span>}
                </div>
                {task.estimatedMinutes > 0 && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700">
                    <div className="h-full rounded-full bg-linear-to-r from-crimson-600 to-crimson-400" style={{ width: `${Math.min(100, (task.spentMinutes / task.estimatedMinutes) * 100)}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card grid grid-cols-2 gap-4 p-5">
            <div>
              <p className="label">Today</p>
              <p className="heading text-2xl font-bold">{fmtMinutes(todayMinutes)}</p>
            </div>
            <div>
              <p className="label">All time</p>
              <p className="heading text-2xl font-bold">{fmtMinutes(overview?.totalFocusMinutes ?? 0)}</p>
            </div>
            <div className="col-span-2">
              <p className="label">Sessions logged</p>
              <p className="heading text-2xl font-bold">{overview?.focusSessions ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Focus
