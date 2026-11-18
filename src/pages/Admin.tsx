import { useEffect, useState } from "react"
import Spinner from "../components/Spinner"
import { errorMessage } from "../service/api"
import { fetchAdminOverview } from "../service/data"
import { fmtMinutes } from "../lib/dates"
import type { AdminOverview } from "../types"

function Admin() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAdminOverview()
      .then(setData)
      .catch((err) => setError(errorMessage(err, "Could not load admin data")))
  }, [])

  if (error) return <p className="py-20 text-center text-crimson-300">{error}</p>
  if (!data) return <Spinner />

  const stats = [
    { label: "Students", value: data.totals.users },
    { label: "Tasks created", value: data.totals.tasks },
    { label: "Tasks completed", value: data.totals.doneTasks },
    { label: "Focus time", value: fmtMinutes(data.totals.focusMinutes) }
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="heading text-3xl font-bold">Admin</h1>
        <p className="text-sm text-ink-300">Platform overview and the XP leaderboard.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="label">{s.label}</p>
            <p className="heading text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-[0.7rem] tracking-wider text-ink-400 uppercase">
              <th className="px-5 py-3">#</th>
              <th className="px-3 py-3">Student</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Level</th>
              <th className="px-3 py-3">XP</th>
              <th className="px-3 py-3">Tasks</th>
              <th className="px-3 py-3">Best streak</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u, i) => (
              <tr key={u.id} className="border-b border-ink-800 last:border-0 hover:bg-ink-800/50">
                <td className="px-5 py-3 text-ink-400">{i + 1}</td>
                <td className="px-3 py-3">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-xs text-ink-400">{u.email}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={`chip ${u.roles.includes("ADMIN") ? "!border-crimson-600 !text-crimson-300" : ""}`}>{u.roles.join(", ")}</span>
                </td>
                <td className="px-3 py-3 font-semibold">{u.level}</td>
                <td className="px-3 py-3">{u.xp}</td>
                <td className="px-3 py-3">
                  {u.done}/{u.tasks}
                </td>
                <td className="px-3 py-3">{u.longestStreak} d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Admin
