import type { ReactNode } from "react"
import Icon, { type IconName } from "./Icon"

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "zap", title: "Smart priority", text: "Deadlines + importance tell you what to do next." },
  { icon: "timer", title: "Focus timer", text: "Pomodoro sessions logged against each task." },
  { icon: "flame", title: "Streaks & XP", text: "Level up and keep your streak alive." }
]

const AuthShell = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <div className="grid min-h-full lg:grid-cols-2">
    {/* brand panel */}
    <div className="relative hidden overflow-hidden border-r border-ink-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-crimson-600/30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-crimson-800/40 blur-[110px]" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-crimson-500 to-crimson-800 shadow-[0_6px_24px_-6px_rgba(239,43,61,0.8)]">
          <Icon name="check" size={24} strokeWidth={3} />
        </div>
        <span className="heading text-2xl font-bold">Crimson</span>
      </div>

      <div className="relative">
        <h1 className="heading text-5xl leading-[1.05] font-bold">
          Own your <span className="text-gradient">deadlines.</span>
          <br />
          Ace your semester.
        </h1>
        <p className="mt-5 max-w-md text-ink-300">The task manager built for students — plan assignments, focus deeply, and turn studying into a streak you don't want to break.</p>

        <div className="mt-10 grid gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-crimson-700/60 bg-crimson-900/30 text-crimson-400">
                <Icon name={f.icon} size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-sm text-ink-300">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-ink-400">© {new Date().getFullYear()} Crimson Student Task Manager</p>
    </div>

    {/* form */}
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-crimson-500 to-crimson-800">
            <Icon name="check" size={22} strokeWidth={3} />
          </div>
          <span className="heading text-2xl font-bold">Crimson</span>
        </div>
        <h2 className="heading text-3xl font-bold">{title}</h2>
        <p className="mt-1.5 mb-7 text-sm text-ink-300">{subtitle}</p>
        {children}
      </div>
    </div>
  </div>
)

export default AuthShell
