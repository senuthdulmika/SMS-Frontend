import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import useAuth from "../hooks/useAuth"
import { errorMessage } from "../service/api"
import {
  createSessionApi,
  createSubjectApi,
  createTaskApi,
  deleteSubjectApi,
  deleteTaskApi,
  fetchOverview,
  fetchSubjects,
  fetchTasks,
  updateSubjectApi,
  updateTaskApi,
  type SubjectInput
} from "../service/data"
import type { Overview, Status, Subject, Task, TaskInput, User } from "../types"

export type ToastKind = "xp" | "level" | "info" | "error"
export type Toast = { id: number; text: string; kind: ToastKind }
export type EditorState = { open: boolean; task: Task | null; defaults?: Partial<TaskInput> }

type DataContextTypes = {
  tasks: Task[]
  subjects: Subject[]
  overview: Overview | null
  loading: boolean
  reload: () => Promise<void>
  saveTask: (input: Partial<TaskInput>, id?: string) => Promise<Task>
  moveTask: (id: string, status: Status) => Promise<void>
  removeTask: (id: string) => Promise<void>
  saveSubject: (input: SubjectInput, id?: string) => Promise<void>
  removeSubject: (id: string) => Promise<void>
  logSession: (minutes: number, taskId: string | null) => Promise<void>
  editor: EditorState
  openEditor: (task?: Task | null, defaults?: Partial<TaskInput>) => void
  closeEditor: () => void
  toasts: Toast[]
  notify: (text: string, kind?: ToastKind) => void
  dismissToast: (id: number) => void
}

export const DataContext = createContext<DataContextTypes | null>(null)

const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, setUser } = useAuth()

  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<EditorState>({ open: false, task: null })
  const [toasts, setToasts] = useState<Toast[]>([])

  const toastId = useRef(0)
  const userRef = useRef<User | null>(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (text: string, kind: ToastKind = "info") => {
      const id = ++toastId.current
      setToasts((prev) => [...prev, { id, text, kind }])
      setTimeout(() => dismissToast(id), kind === "level" ? 5000 : 3200)
    },
    [dismissToast]
  )

  const refreshOverview = useCallback(async () => {
    try {
      setOverview(await fetchOverview())
    } catch (err) {
      console.error(err)
    }
  }, [])

  const reload = useCallback(async () => {
    const [t, s, o] = await Promise.all([fetchTasks(), fetchSubjects(), fetchOverview()])
    setTasks(t)
    setSubjects(s)
    setOverview(o)
  }, [])

  useEffect(() => {
    reload()
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [reload])

  // Apply XP / level / streak info the server sends back after a mutation
  const applyReward = useCallback(
    (res: { user: User | null; xpGained: number }) => {
      if (!res.user) return
      const prevLevel = userRef.current?.level ?? res.user.level
      setUser(res.user)
      if (res.xpGained > 0) notify(`+${res.xpGained} XP`, "xp")
      if (res.user.level > prevLevel) notify(`LEVEL UP! You reached level ${res.user.level}`, "level")
    },
    [setUser, notify]
  )

  const saveTask = useCallback(
    async (input: Partial<TaskInput>, id?: string) => {
      const res = id ? await updateTaskApi(id, input) : await createTaskApi(input)
      setTasks((prev) => (id ? prev.map((t) => (t.id === id ? res.data : t)) : [res.data, ...prev]))
      applyReward(res)
      void refreshOverview()
      return res.data
    },
    [applyReward, refreshOverview]
  )

  // Optimistic: the card jumps immediately, the server confirms (or we roll back)
  const moveTask = useCallback(
    async (id: string, status: Status) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      try {
        const res = await updateTaskApi(id, { status })
        setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)))
        applyReward(res)
        void refreshOverview()
      } catch (err) {
        notify(errorMessage(err, "Could not move task"), "error")
        await reload()
      }
    },
    [applyReward, refreshOverview, notify, reload]
  )

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTaskApi(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      void refreshOverview()
    },
    [refreshOverview]
  )

  const saveSubject = useCallback(async (input: SubjectInput, id?: string) => {
    const subject = id ? await updateSubjectApi(id, input) : await createSubjectApi(input)
    setSubjects((prev) =>
      (id ? prev.map((s) => (s.id === id ? subject : s)) : [...prev, subject]).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    )
  }, [])

  const removeSubject = useCallback(
    async (id: string) => {
      await deleteSubjectApi(id)
      setSubjects((prev) => prev.filter((s) => s.id !== id))
      setTasks((prev) => prev.map((t) => (t.subject === id ? { ...t, subject: null } : t)))
      void refreshOverview()
    },
    [refreshOverview]
  )

  const logSession = useCallback(
    async (minutes: number, taskId: string | null) => {
      const res = await createSessionApi(minutes, taskId)
      if (taskId) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, spentMinutes: t.spentMinutes + minutes } : t)))
      }
      applyReward(res)
      void refreshOverview()
    },
    [applyReward, refreshOverview]
  )

  const openEditor = useCallback((task: Task | null = null, defaults?: Partial<TaskInput>) => {
    setEditor({ open: true, task, defaults })
  }, [])
  const closeEditor = useCallback(() => setEditor({ open: false, task: null }), [])

  return (
    <DataContext.Provider
      value={{
        tasks,
        subjects,
        overview,
        loading,
        reload,
        saveTask,
        moveTask,
        removeTask,
        saveSubject,
        removeSubject,
        logSession,
        editor,
        openEditor,
        closeEditor,
        toasts,
        notify,
        dismissToast
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export default DataProvider
