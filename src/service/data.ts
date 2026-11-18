import api from "./api"
import type {
  AdminOverview,
  Overview,
  SessionResponse,
  Status,
  Subject,
  Task,
  TaskInput,
  TaskResponse
} from "../types"

// tasks
export const fetchTasks = async (): Promise<Task[]> => (await api.get("/tasks")).data.data
export const createTaskApi = async (input: Partial<TaskInput>): Promise<TaskResponse> =>
  (await api.post("/tasks", input)).data
export const updateTaskApi = async (id: string, input: Partial<TaskInput> & { status?: Status }): Promise<TaskResponse> =>
  (await api.put(`/tasks/${id}`, input)).data
export const deleteTaskApi = async (id: string) => (await api.delete(`/tasks/${id}`)).data

// subjects
export type SubjectInput = { name: string; code: string; color: string }
export const fetchSubjects = async (): Promise<Subject[]> => (await api.get("/subjects")).data.data
export const createSubjectApi = async (input: SubjectInput): Promise<Subject> =>
  (await api.post("/subjects", input)).data.data
export const updateSubjectApi = async (id: string, input: SubjectInput): Promise<Subject> =>
  (await api.put(`/subjects/${id}`, input)).data.data
export const deleteSubjectApi = async (id: string) => (await api.delete(`/subjects/${id}`)).data

// focus sessions + stats
export const createSessionApi = async (minutes: number, taskId: string | null): Promise<SessionResponse> =>
  (await api.post("/sessions", { minutes, taskId })).data
export const fetchOverview = async (): Promise<Overview> => (await api.get("/stats/overview")).data.data

// admin
export const fetchAdminOverview = async (): Promise<AdminOverview> =>
  (await api.get("/admin/overview")).data.data
