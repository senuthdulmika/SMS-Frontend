import { useEffect, useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import Icon, { type IconName } from "./Icon"
import TaskModal from "./TaskModal"
import Toasts from "./Toasts"
import useAuth from "../hooks/useAuth"
import useData from "../hooks/useData"

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/tasks", label: "Tasks", icon: "tasks" },
  { to: "/board", label: "Board", icon: "board" },
  { to: "/calendar", label: "Calendar", icon: "calendar" },
  { to: "/focus", label: "Focus Timer", icon: "timer" },
  { to: "/subjects", label: "Subjects", icon: "book" }
]

const Layout = () => {
  const { user, logout } = useAuth()
  const { openEditor } = useData()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // Press "N" anywhere (outside inputs) to create a task
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT"
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault()
        openEditor()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openEditor])

  if (!user) return null

  const span = Math.max(1, user.nextLevelXp - user.levelStartXp)
  const progress = Math.max(0, Math.min(1, (user.xp - user.levelStartXp) / span))
  const isAdmin = user.roles.includes("ADMIN")

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-3 px-2 pt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-crimson-500 to-crimson-800 shadow-[0_6px_24px_-6px_rgba(239,43,61,0.8)]">
          <Icon name="check" size={22} strokeWidth={3} className="text-white" />
        </div>
        <div>
          <p className="heading text-xl font-bold leading-none">Crimson</p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-ink-400">Student Tasks</p>
        </div>
      </div>

      <button className="btn btn-primary w-full" onClick={() => { setOpen(false); openEditor() }}>
        <Icon name="plus" size={16} /> New Task
        <kbd className="ml-1 rounded bg-black/25 px-1.5 py-0.5 text-[0.65rem] font-medium">N</kbd>
      </button>

      <nav className="flex flex-col gap-1">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon name={n.icon} size={18} /> {n.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon name="shield" size={18} /> Admin
          </NavLink>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        {/* Level / XP / streak */}
        <div className="card p-3.5">
          <div className="flex items-center justify-between">
            <span className="heading text-sm font-semibold">Level {user.level}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-crimson-300">
              <Icon name="flame" size={14} /> {user.streak} day{user.streak === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink-700">
            <div className="h-full rounded-full bg-linear-to-r from-crimson-600 to-crimson-400 shadow-[0_0_12px_rgba(239,43,61,0.8)] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[0.7rem] text-ink-300">
            <Icon name="zap" size={11} className="text-crimson-400" />
            {user.xp} / {user.nextLevelXp} XP
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 p-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-crimson-700 text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-[0.7rem] text-ink-400">{user.email}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} aria-label="Log out" title="Log out">
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full">
      {/* desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-ink-700/70 bg-ink-950/80 backdrop-blur lg:block">{sidebar}</aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-pop border-r border-ink-700 bg-ink-950">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-700/70 px-4 py-3 lg:hidden">
          <button className="btn btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={18} />
          </button>
          <p className="heading text-lg font-bold">Crimson</p>
          <button className="btn btn-primary btn-icon" onClick={() => openEditor()} aria-label="New task">
            <Icon name="plus" size={18} />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>

      <TaskModal />
      <Toasts />
    </div>
  )
}

export default Layout
