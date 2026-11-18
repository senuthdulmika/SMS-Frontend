import { useState, type FormEvent } from "react"
import Icon from "../components/Icon"
import Modal from "../components/Modal"
import Spinner from "../components/Spinner"
import useData from "../hooks/useData"
import { SUBJECT_COLORS } from "../lib/constants"
import { fmtMinutes } from "../lib/dates"
import { errorMessage } from "../service/api"
import type { Subject } from "../types"

type Draft = { id?: string; name: string; code: string; color: string }

function Subjects() {
  const { subjects, overview, loading, saveSubject, removeSubject, notify } = useData()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) return <Spinner />

  const open = (s?: Subject) => setDraft(s ? { id: s.id, name: s.name, code: s.code, color: s.color } : { name: "", code: "", color: SUBJECT_COLORS[0] })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft || !draft.name.trim()) return notify("Subject name is required", "error")
    setSaving(true)
    try {
      await saveSubject({ name: draft.name.trim(), code: draft.code.trim(), color: draft.color }, draft.id)
      setDraft(null)
    } catch (err) {
      notify(errorMessage(err, "Could not save subject"), "error")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (s: Subject) => {
    if (!confirm(`Delete "${s.name}"? Its tasks will be kept without a subject.`)) return
    try {
      await removeSubject(s.id)
    } catch (err) {
      notify(errorMessage(err, "Could not delete subject"), "error")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading text-3xl font-bold">Subjects</h1>
          <p className="text-sm text-ink-300">Organise tasks by course and track progress for each one.</p>
        </div>
        <button className="btn btn-primary" onClick={() => open()}>
          <Icon name="plus" size={16} /> New subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson-900/40 text-crimson-400">
            <Icon name="book" size={26} />
          </div>
          <p className="heading mt-4 text-lg font-semibold">No subjects yet</p>
          <p className="mt-1 text-sm text-ink-300">Add your courses to colour-code your tasks.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => {
            const row = overview?.bySubject.find((r) => r.subject === s.id)
            const pct = row && row.total ? Math.round((row.done / row.total) * 100) : 0
            return (
              <div key={s.id} className="card card-hover relative overflow-hidden p-5">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: s.color }} />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="heading truncate text-lg font-semibold">{s.name}</h3>
                    {s.code && <span className="chip mt-1">{s.code}</span>}
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-icon" onClick={() => open(s)} aria-label="Edit subject">
                      <Icon name="edit" size={14} />
                    </button>
                    <button className="btn btn-danger btn-icon" onClick={() => remove(s)} aria-label="Delete subject">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <p className="heading text-3xl font-bold">
                    {pct}
                    <span className="text-lg text-ink-400">%</span>
                  </p>
                  <p className="text-xs text-ink-300">
                    {row?.done ?? 0}/{row?.total ?? 0} tasks · {fmtMinutes(row?.minutes ?? 0)} focused
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: s.color }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {draft && (
        <Modal title={draft.id ? "Edit subject" : "New subject"} onClose={() => setDraft(null)}>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" autoFocus placeholder="e.g. Organic Chemistry" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Course code (optional)</label>
              <input className="input" placeholder="CH210" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            </div>
            <div>
              <label className="label">Colour</label>
              <div className="flex flex-wrap gap-2.5">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    aria-label={`Colour ${c}`}
                    onClick={() => setDraft({ ...draft, color: c })}
                    className={`h-8 w-8 rounded-full transition ${draft.color === c ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-ink-900" : "hover:scale-105"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Subjects
