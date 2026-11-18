import { useState, type FormEvent } from "react"
import Modal from "./Modal"
import Icon from "./Icon"
import useData from "../hooks/useData"
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from "../lib/constants"
import { fromLocalInput, toLocalInput } from "../lib/dates"
import { errorMessage } from "../service/api"
import type { Priority, Status, Subtask, Task, TaskInput } from "../types"

type FormState = {
  title: string
  description: string
  subject: string
  priority: Priority
  status: Status
  due: string
  estimate: string
  tags: string
  subtasks: Subtask[]
}

const initialState = (task: Task | null, defaults?: Partial<TaskInput>): FormState => ({
  title: task?.title ?? defaults?.title ?? "",
  description: task?.description ?? defaults?.description ?? "",
  subject: task?.subject ?? defaults?.subject ?? "",
  priority: task?.priority ?? defaults?.priority ?? "MEDIUM",
  status: task?.status ?? defaults?.status ?? "TODO",
  due: toLocalInput(task?.dueDate ?? defaults?.dueDate ?? null),
  estimate: String(task?.estimatedMinutes ?? defaults?.estimatedMinutes ?? ""),
  tags: (task?.tags ?? defaults?.tags ?? []).join(", "),
  subtasks: task?.subtasks ?? defaults?.subtasks ?? []
})

// The form lives in its own component and is remounted (via `key`) for each task,
// so state always starts from the right values.
const TaskForm = () => {
  const { editor, subjects, saveTask, removeTask, closeEditor, notify } = useData()
  const task = editor.task
  const [form, setForm] = useState<FormState>(() => initialState(task, editor.defaults))
  const [newSubtask, setNewSubtask] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const addSubtask = () => {
    const title = newSubtask.trim()
    if (!title) return
    set("subtasks", [...form.subtasks, { title, done: false }])
    setNewSubtask("")
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return setError("Give your task a title")

    setSaving(true)
    setError("")
    try {
      await saveTask(
        {
          title: form.title.trim(),
          description: form.description,
          subject: form.subject || null,
          priority: form.priority,
          status: form.status,
          dueDate: fromLocalInput(form.due),
          estimatedMinutes: Number(form.estimate) || 0,
          tags: form.tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
          subtasks: form.subtasks
        },
        task?.id
      )
      closeEditor()
    } catch (err) {
      setError(errorMessage(err, "Could not save task"))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!task || !confirm("Delete this task?")) return
    try {
      await removeTask(task.id)
      notify("Task deleted")
      closeEditor()
    } catch (err) {
      setError(errorMessage(err, "Could not delete task"))
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">Title</label>
        <input className="input" autoFocus placeholder="e.g. Finish chemistry lab report" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input min-h-20 resize-y" placeholder="Anything you need to remember…" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div>
        <label className="label">Priority</label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => set("priority", p)}
              className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                form.priority === p ? "border-crimson-500 bg-crimson-500/15 text-white shadow-[0_0_0_3px_rgba(239,43,61,0.15)]" : "border-ink-600 bg-ink-900 text-ink-300 hover:border-ink-400"
              }`}
            >
              {PRIORITY_META[p].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Subject</label>
          <select className="input" value={form.subject} onChange={(e) => set("subject", e.target.value)}>
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Deadline</label>
          <input type="datetime-local" className="input" value={form.due} onChange={(e) => set("due", e.target.value)} />
        </div>
        <div>
          <label className="label">Estimate (minutes)</label>
          <input type="number" min={0} className="input" placeholder="60" value={form.estimate} onChange={(e) => set("estimate", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Tags (comma separated)</label>
        <input className="input" placeholder="exam, group-project" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
      </div>

      <div>
        <label className="label">Checklist</label>
        <div className="flex flex-col gap-2">
          {form.subtasks.map((s, i) => (
            <div key={s.id ?? `new-${i}`} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-crimson-500"
                checked={s.done}
                onChange={() => set("subtasks", form.subtasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
              />
              <span className={`flex-1 text-sm ${s.done ? "text-ink-400 line-through" : ""}`}>{s.title}</span>
              <button type="button" className="text-ink-400 hover:text-crimson-400" onClick={() => set("subtasks", form.subtasks.filter((_, j) => j !== i))} aria-label="Remove item">
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Add a step and press Enter"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addSubtask()
                }
              }}
            />
            <button type="button" className="btn btn-ghost" onClick={addSubtask}>
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg border border-crimson-700 bg-crimson-900/40 px-3 py-2 text-sm text-crimson-300">{error}</p>}

      <div className="flex items-center justify-between gap-2 pt-1">
        {task ? (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
            <Icon name="trash" size={15} /> Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" onClick={closeEditor}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : task ? "Save changes" : "Create task"}
          </button>
        </div>
      </div>
    </form>
  )
}

const TaskModal = () => {
  const { editor, closeEditor } = useData()
  if (!editor.open) return null

  return (
    <Modal title={editor.task ? "Edit task" : "New task"} onClose={closeEditor} wide>
      <TaskForm key={editor.task?.id ?? "new"} />
    </Modal>
  )
}

export default TaskModal
