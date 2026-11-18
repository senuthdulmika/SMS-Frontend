import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from "../lib/storage"

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

const api = axios.create({ baseURL: API_URL })

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh"]
const isPublicUrl = (url?: string) => PUBLIC_ENDPOINTS.some((p) => url?.includes(p))

api.interceptors.request.use((config) => {
  // the server uses this to compute the student's local "today", streaks and weekly charts
  config.headers["x-tz-offset"] = String(new Date().getTimezoneOffset())

  const accessToken = getAccessToken()
  if (!isPublicUrl(config.url) && accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// one refresh at a time, even if several requests fail together
let refreshing: Promise<string> | null = null

const refreshAccessToken = (): Promise<string> => {
  if (refreshing) return refreshing

  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.reject(new Error("No refresh token available"))

  const request: Promise<string> = axios
    .post(`${API_URL}/auth/refresh`, { refreshToken })
    .then((res) => {
      const token = res.data.data.accessToken as string
      setAccessToken(token)
      return token
    })
    .finally(() => {
      refreshing = null
    })

  refreshing = request
  return request
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && original && !original._retry && !isPublicUrl(original.url)) {
      original._retry = true
      try {
        const newToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        clearTokens()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export const errorMessage = (err: unknown, fallback = "Something went wrong") => {
  if (axios.isAxiosError(err)) return err.response?.data?.message || fallback
  return fallback
}

export default api
